import { DurableObject } from "cloudflare:workers";

export class ClickCounter extends DurableObject {
  async fetch(request) {
    const url = new URL(request.url);
    const seed = Math.max(0, Number(url.searchParams.get("seed") || 0) || 0);
    let count = await this.ctx.storage.get("count");
    let lastClickAt = await this.ctx.storage.get("lastClickAt");

    if (count == null) {
      count = seed;
      await this.ctx.storage.put("count", count);
    }

    if (url.pathname === "/increment" && request.method === "POST") {
      count = Number(count || 0) + 1;
      lastClickAt = new Date().toISOString();
      await this.ctx.storage.put({ count, lastClickAt });
      return Response.json({ count, lastClickAt });
    }

    if (url.pathname === "/set" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      count = Math.max(seed, Number(body.count || 0) || 0);
      lastClickAt = body.lastClickAt || lastClickAt || null;
      await this.ctx.storage.put({ count, lastClickAt });
      return Response.json({ count, lastClickAt });
    }

    if (url.pathname === "/reset" && request.method === "POST") {
      await this.ctx.storage.deleteAll();
      return Response.json({ ok: true });
    }

    if (url.pathname === "/stats" && request.method === "GET") {
      return Response.json({ count: Number(count || 0), lastClickAt: lastClickAt || null });
    }

    return new Response("Not found", { status: 404 });
  }
}

const RESERVED = new Set(["admin", "api", "favicon.ico", "favicon.svg", "robots.txt", "sitemap.xml"]);
const SLUG_RE = /^[A-Za-z0-9_-]{1,64}$/;
const enc = new TextEncoder();

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (path === "/favicon.ico" || path === "/favicon.svg") return favicon();
      if (path === "/robots.txt") return text("User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n", 200);

      if (path === "/") return html(homePage(url.origin));
      if (path === "/admin") return html(adminPage(), 200, { "X-Robots-Tag": "noindex, nofollow" });

      if (path.startsWith("/api/")) return handleApi(request, env);

      if (request.method !== "GET" && request.method !== "HEAD") return json({ error: "Method not allowed" }, 405);
      const slug = decodeURIComponent(path.slice(1));
      if (!slug || RESERVED.has(slug) || !SLUG_RE.test(slug)) return html(notFoundPage(), 404);

      const record = await getLink(env, slug);
      if (!record || record.active === false) return html(notFoundPage(), 404);

      if (request.method === "GET") {
        // Statistik dipisahkan dari KV agar redirect tidak melakukan write ke key link yang sama.
        // waitUntil membuat pencatatan klik berjalan setelah respons redirect siap dikirim.
        ctx.waitUntil(incrementClick(env, slug, record.clicks || 0));
      }

      return Response.redirect(record.url, record.permanent ? 301 : 302);
    } catch (err) {
      console.error(err);
      return html(errorPage(), 500);
    }
  }
};

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/login" && request.method === "POST") {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    
    const attemptRow = await env.DB.prepare("SELECT attempts FROM login_attempts WHERE ip = ? AND expires_at > ?").bind(ip, Date.now()).first();
    const attempts = Number(attemptRow?.attempts || 0);
    if (attempts >= 10) return json({ error: "Terlalu banyak percobaan. Coba lagi dalam 10 menit." }, 429);

    const body = await readJson(request);
    if (!body || typeof body.password !== "string") return json({ error: "Password wajib diisi." }, 400);
    if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({ error: "Secret admin belum dikonfigurasi." }, 500);

    const ok = await timingSafeEqual(body.password, env.ADMIN_PASSWORD);
    if (!ok) {
      await env.DB.prepare("INSERT INTO login_attempts (ip, attempts, expires_at) VALUES (?, ?, ?) ON CONFLICT(ip) DO UPDATE SET attempts = excluded.attempts, expires_at = excluded.expires_at").bind(ip, attempts + 1, Date.now() + 600000).run();
      return json({ error: "Password salah." }, 401);
    }

    await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
    const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 12;
    const payload = `${expires}`;
    const sig = await hmac(payload, env.SESSION_SECRET);
    return json({ ok: true }, 200, {
      "Set-Cookie": `kucir_session=${payload}.${sig}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`
    });
  }

  if (path === "/api/logout" && request.method === "POST") {
    if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
    return json({ ok: true }, 200, {
      "Set-Cookie": "kucir_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
    });
  }

  const authed = await isAuthed(request, env);
  if (!authed) return json({ error: "Unauthorized" }, 401);

  if (path === "/api/session" && request.method === "GET") return json({ authenticated: true });

  if (!sameOrigin(request) && request.method !== "GET") return json({ error: "Forbidden" }, 403);

  if (path === "/api/links" && request.method === "GET") {
    const links = await listLinks(env);
    return json({ links });
  }

  if (path === "/api/links" && request.method === "POST") {
    const body = await readJson(request);
    const target = normalizeTarget(body?.url);
    if (!target) return json({ error: "URL tujuan tidak valid. Gunakan http:// atau https://" }, 400);

    let slug = String(body?.slug || "").trim();
    if (!slug) slug = await randomSlug(env, 8);
    const validation = validateSlug(slug);
    if (validation) return json({ error: validation }, 400);
    if (await getLink(env, slug)) return json({ error: "Slug sudah digunakan." }, 409);

    const now = new Date().toISOString();
    const record = {
      slug,
      url: target,
      title: String(body?.title || "").trim().slice(0, 120),
      active: body?.active !== false,
      permanent: body?.permanent === true,
      clicks: 0,
      createdAt: now,
      updatedAt: now,
      lastClickAt: null
    };
    await putLink(env, slug, record);
    await resetClickStats(env, slug);
    return json({ link: record }, 201);
  }

  if (path === "/api/links/bulk" && request.method === "PUT") {
    const body = await readJson(request);
    const slugs = Array.isArray(body?.slugs) ? [...new Set(body.slugs.map(v => String(v).trim()))] : [];
    if (!slugs.length) return json({ error: "Pilih minimal satu shortlink." }, 400);
    if (slugs.length > 500) return json({ error: "Maksimal 500 shortlink dalam sekali perubahan." }, 400);
    if (slugs.some(slug => !SLUG_RE.test(slug))) return json({ error: "Ada slug yang tidak valid." }, 400);
    const target = normalizeTarget(body?.url);
    if (!target) return json({ error: "URL tujuan tidak valid. Gunakan http:// atau https://" }, 400);
    const now = new Date().toISOString();
    const current = await Promise.all(slugs.map(slug => getLink(env, slug)));
    const missing = slugs.filter((slug, i) => !current[i]);
    if (missing.length) return json({ error: `Shortlink tidak ditemukan: ${missing.slice(0,5).join(", ")}${missing.length > 5 ? "…" : ""}` }, 404);
    await Promise.all(current.map((record, i) => putLink(env, slugs[i], { ...record, url: target, updatedAt: now })));
    return json({ ok: true, updated: slugs.length, url: target });
  }

  if (path === "/api/links/bulk" && request.method === "DELETE") {
    const body = await readJson(request);
    const slugs = Array.isArray(body?.slugs) ? [...new Set(body.slugs.map(v => String(v).trim()))] : [];
    if (!slugs.length) return json({ error: "Pilih minimal satu shortlink." }, 400);
    if (slugs.length > 500) return json({ error: "Maksimal 500 shortlink dalam sekali penghapusan." }, 400);
    if (slugs.some(slug => !SLUG_RE.test(slug))) return json({ error: "Ada slug yang tidak valid." }, 400);
    const current = await Promise.all(slugs.map(slug => getLink(env, slug)));
    const existing = slugs.filter((slug, i) => current[i]);
    await env.DB.batch(existing.map(slug => env.DB.prepare("DELETE FROM links WHERE slug = ?").bind(slug)));
    await Promise.all(existing.map(slug => resetClickStats(env, slug)));
    return json({ ok: true, deleted: existing.length });
  }

  const match = path.match(/^\/api\/links\/([^/]+)$/);
  if (match) {
    const oldSlug = decodeURIComponent(match[1]);
    if (!SLUG_RE.test(oldSlug)) return json({ error: "Slug tidak valid." }, 400);
    const current = await getLink(env, oldSlug);
    if (!current) return json({ error: "Shortlink tidak ditemukan." }, 404);

    if (request.method === "PUT") {
      const body = await readJson(request);
      const nextSlug = String(body?.slug ?? oldSlug).trim();
      const validation = validateSlug(nextSlug);
      if (validation) return json({ error: validation }, 400);
      const target = normalizeTarget(body?.url ?? current.url);
      if (!target) return json({ error: "URL tujuan tidak valid." }, 400);
      if (nextSlug !== oldSlug && await getLink(env, nextSlug)) return json({ error: "Slug baru sudah digunakan." }, 409);

      const updated = {
        ...current,
        slug: nextSlug,
        url: target,
        title: String(body?.title ?? current.title ?? "").trim().slice(0, 120),
        active: body?.active !== false,
        permanent: body?.permanent === true,
        updatedAt: new Date().toISOString()
      };
      await putLink(env, nextSlug, updated);
      if (nextSlug !== oldSlug) {
        await copyClickStats(env, oldSlug, nextSlug, current.clicks || 0);
        await resetClickStats(env, oldSlug);
        await env.DB.prepare("DELETE FROM links WHERE slug = ?").bind(oldSlug).run();
      }
      const stat = await getClickStats(env, nextSlug, updated.clicks || 0);
      updated.clicks = stat.count;
      updated.lastClickAt = stat.lastClickAt;
      return json({ link: updated });
    }

    if (request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM links WHERE slug = ?").bind(oldSlug).run();
      await resetClickStats(env, oldSlug);
      return json({ ok: true });
    }
  }

  return json({ error: "Not found" }, 404);
}

function validateSlug(slug) {
  if (!SLUG_RE.test(slug)) return "Slug hanya boleh 1–64 karakter: huruf, angka, _ dan -.";
  if (RESERVED.has(slug.toLowerCase())) return "Slug tersebut dicadangkan sistem.";
  return null;
}

function normalizeTarget(value) {
  try {
    const u = new URL(String(value || "").trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch { return null; }
}

function fromRow(row) {
  if (!row) return null;
  return { slug: row.slug, url: row.url, title: row.title || "", active: !!row.active, permanent: !!row.permanent, clicks: Number(row.clicks || 0), createdAt: row.created_at, updatedAt: row.updated_at, lastClickAt: row.last_click_at };
}
async function getLink(env, slug) {
  return fromRow(await env.DB.prepare("SELECT * FROM links WHERE slug = ?").bind(slug).first());
}
async function putLink(env, slug, record) {
  return env.DB.prepare(`INSERT INTO links (slug,url,title,active,permanent,clicks,created_at,updated_at,last_click_at)
    VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET url=excluded.url,title=excluded.title,active=excluded.active,permanent=excluded.permanent,clicks=excluded.clicks,updated_at=excluded.updated_at,last_click_at=excluded.last_click_at`)
    .bind(slug,record.url,record.title || "",record.active !== false ? 1 : 0,record.permanent ? 1 : 0,Number(record.clicks || 0),record.createdAt,record.updatedAt,record.lastClickAt || null).run();
}
async function listLinks(env) {
  const result = await env.DB.prepare("SELECT * FROM links ORDER BY created_at DESC LIMIT 5000").all();
  const out = result.results.map(fromRow);
  for (let i = 0; i < out.length; i += 25) {
    const batch = out.slice(i, i + 25);
    const stats = await Promise.all(batch.map(link => getClickStats(env, link.slug, link.clicks || 0)));
    stats.forEach((stat,j) => { batch[j].clicks = stat.count; batch[j].lastClickAt = stat.lastClickAt; });
  }
  return out;
}
function counterStub(env, slug) {
  const id = env.CLICK_COUNTER.idFromName(slug);
  return env.CLICK_COUNTER.get(id);
}

async function incrementClick(env, slug, seed = 0) {
  const stub = counterStub(env, slug);
  const res = await stub.fetch(`https://counter/increment?seed=${encodeURIComponent(seed)}`, { method: "POST" });
  if (!res.ok) throw new Error(`Counter increment gagal untuk ${slug}: ${res.status}`);
}

async function getClickStats(env, slug, seed = 0) {
  const stub = counterStub(env, slug);
  const res = await stub.fetch(`https://counter/stats?seed=${encodeURIComponent(seed)}`);
  if (!res.ok) return { count: Number(seed || 0), lastClickAt: null };
  return res.json();
}

async function resetClickStats(env, slug) {
  const stub = counterStub(env, slug);
  const res = await stub.fetch("https://counter/reset", { method: "POST" });
  if (!res.ok) throw new Error(`Counter reset gagal untuk ${slug}: ${res.status}`);
}

async function copyClickStats(env, fromSlug, toSlug, legacySeed = 0) {
  const current = await getClickStats(env, fromSlug, legacySeed);
  const stub = counterStub(env, toSlug);
  await stub.fetch(`https://counter/set?seed=${encodeURIComponent(current.count || 0)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: current.count || 0, lastClickAt: current.lastClickAt || null })
  });
}

async function randomSlug(env, length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  for (let tries = 0; tries < 20; tries++) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    let slug = "";
    for (const b of bytes) slug += chars[b % chars.length];
    if (!await getLink(env, slug)) return slug;
  }
  throw new Error("Tidak bisa membuat slug unik");
}

async function isAuthed(request, env) {
  if (!env.SESSION_SECRET) return false;
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/(?:^|;\s*)kucir_session=([^;]+)/);
  if (!m) return false;
  const [expires, sig] = m[1].split(".");
  if (!expires || !sig || Number(expires) < Math.floor(Date.now()/1000)) return false;
  const expected = await hmac(expires, env.SESSION_SECRET);
  return timingSafeEqual(sig, expected);
}
async function hmac(value, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,"0")).join("");
}
async function timingSafeEqual(a, b) {
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i=0;i<x.length;i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}
async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

function baseHeaders(extra={}) {
  return {
    "Content-Security-Policy": "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    ...extra
  };
}
function html(body, status=200, extra={}) { return new Response(body, { status, headers: baseHeaders({"Content-Type":"text/html; charset=utf-8", ...extra}) }); }
function json(data, status=200, extra={}) { return new Response(JSON.stringify(data), { status, headers: baseHeaders({"Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", ...extra}) }); }
function text(body, status=200) { return new Response(body, { status, headers: baseHeaders({"Content-Type":"text/plain; charset=utf-8"}) }); }
function brandMarkSvg() { return `<svg class="brand-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="kg" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse"><stop stop-color="#36C8FF"/><stop offset="1" stop-color="#126BFF"/></linearGradient></defs><rect x="3" y="3" width="58" height="58" rx="16" fill="#07192E"/><path d="M12 16h25c7 0 12 4 15 10L37 32H17c-5 0-8-3-8-8 0-3 1-6 3-8Z" fill="url(#kg)"/><path d="M52 26 39 32l13 6c3-3 4-7 4-11 0-1-2-1-4-1Z" fill="#EAF7FF"/><path d="M12 48h25c7 0 12-4 15-10L37 32H17c-5 0-8 3-8 8 0 3 1 6 3 8Z" fill="#EAF7FF"/><path d="M52 38 39 32l13-6c3 3 4 7 4 11 0 1-2 1-4 1Z" fill="#1F8CFF"/><circle cx="39" cy="32" r="3.2" fill="#BFEAFF"/></svg>`; }
function favicon(){ return new Response(brandMarkSvg().replace(' class="brand-svg"',''),{status:200,headers:{"Content-Type":"image/svg+xml; charset=utf-8","Cache-Control":"public, max-age=86400"}}); }

function shell(title, body, extraHead="") {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#071426"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><title>${title}</title>${extraHead}<style>${styles()}</style></head><body>${body}</body></html>`;
}
function homePage(origin) {
  return shell("KUCIRLINK — Shortlink Cepat & Ringkas", `
  <main class="landing">
    <nav><a class="brand" href="/"><span class="mark">K</span><span>KUCIR<span class="accent">LINK</span></span></a><a class="navbtn" href="/admin">Admin</a></nav>
    <section class="hero">
      <div class="eyebrow">SHORT URL • FAST REDIRECT</div>
      <h1>Link panjang,<br><span>dibuat lebih ringkas.</span></h1>
      <p>KUCIRLINK membantu mengelola tautan pendek di domain sendiri dengan redirect cepat melalui jaringan Cloudflare.</p>
      <div class="demo"><span>${escapeHtml(origin.replace(/^https?:\/\//,''))}/</span><b>namalink</b><button onclick="location.href='/admin'">Buat Shortlink</button></div>
      <div class="trust"><div><b>⚡</b><span><strong>Edge Redirect</strong>Respons cepat</span></div><div><b>🔒</b><span><strong>Admin Aman</strong>Akses terlindungi</span></div><div><b>📊</b><span><strong>Click Stats</strong>Pantau performa</span></div></div>
    </section>
    <footer>© ${new Date().getFullYear()} KUCIRLINK · Powered by Cloudflare Workers</footer>
  </main>`);
}
function adminPage() {
  return shell("Admin — KUCIRLINK", `
  <div id="toast" class="toast"></div>
  <section id="loginView" class="login-wrap">
    <div class="login-card"><a class="brand center" href="/">${brandMarkSvg()}<span class="brand-copy"><b>KUCIR<span class="accent">LINK</span></b><small>Shorten Today, Go Further</small></span></a><div class="login-badge">ADMIN CONSOLE</div><h1>Selamat datang</h1><p>Masuk untuk mengelola seluruh shortlink KUCIRLINK.</p><form id="loginForm"><label>Password</label><input id="password" type="password" autocomplete="current-password" placeholder="Masukkan password admin" required><button class="primary wide">Masuk ke Dashboard</button></form></div>
  </section>
  <section id="appView" class="app hidden">
    <aside>
      <a class="brand sidebrand" href="/">${brandMarkSvg()}<span class="brand-copy"><b>KUCIR<span class="accent">LINK</span></b><small>Shorten Today, Go Further</small></span></a>
      <nav class="sidenav">
        <button class="navitem active" data-go="top"><span class="navico">⌂</span><span>Dashboard</span></button>
        <button id="sideNewBtn" class="navitem"><span class="navico">↗</span><span>Buat Shortlink</span></button>
        <button class="navitem" data-go="links"><span class="navico">☷</span><span>Daftar Link</span></button>
        <button class="navitem" data-go="stats"><span class="navico">▥</span><span>Statistik</span></button>
      </nav>
      <div class="edge-card"><div class="edge-icon">ϟ</div><div><strong>Fast &amp; Reliable</strong><p>Redirect di Cloudflare Edge, statistik dipisahkan agar tetap ringan saat trafik tinggi.</p></div><span class="edge-glow"></span></div>
      <div class="adminbox"><div class="adminrow"><span class="avatar">A</span><div><strong>Admin</strong><small>Kelola shortlink Anda</small></div></div><button id="logout" class="logout"><span>↪</span> Keluar</button></div>
    </aside>
    <main class="dashboard" id="dashboardTop">
      <header class="dashhead"><div><p class="muted">DASHBOARD</p><h1>Selamat datang, <span>Admin!</span></h1><p class="subhead">Kelola, pantau, dan perbarui shortlink dari satu dashboard.</p></div><div class="headbadges"><div class="headbadge"><span class="hbicon">▣</span><div><strong id="todayLabel">Hari ini</strong><small id="clockLabel">--:--</small></div></div><div class="headbadge online"><i></i><div><strong>Sistem Online</strong><small>Semua layanan berjalan normal</small></div></div></div></header>
      <div class="stats" id="statsSection">
        <article class="stat blue"><div class="stat-icon">↗</div><div><span>Total Shortlink</span><strong id="totalLinks">0</strong><small>Semua link tersimpan</small></div></article>
        <article class="stat green"><div class="stat-icon">⌁</div><div><span>Total Klik</span><strong id="totalClicks">0</strong><small>Akumulasi seluruh klik</small></div></article>
        <article class="stat violet"><div class="stat-icon">✓</div><div><span>Link Aktif</span><strong id="activeLinks">0</strong><small>Siap menerima trafik</small></div></article>
        <article class="stat amber"><div class="stat-icon">–</div><div><span>Nonaktif</span><strong id="inactiveLinks">0</strong><small>Link yang dijeda</small></div></article>
      </div>
      <section class="panel" id="linksPanel">
        <div class="panel-title"><div><h2>Daftar Shortlink</h2><p>Kelola semua shortlink Anda. Pilih beberapa link untuk melakukan aksi massal.</p></div><button id="newBtn" class="primary">＋ Buat Shortlink Baru</button></div>
        <div id="bulkBar" class="bulkbar hidden"><label class="selectall-label"><input id="selectAll" type="checkbox" aria-label="Pilih semua"><span>Pilih Semua</span></label><div class="bulkinfo"><strong id="selectedCount">0</strong><span>link dipilih</span></div><div class="bulk-url"><span>↗</span><input id="bulkTarget" type="url" placeholder="Masukkan URL tujuan baru..."></div><button id="bulkUpdate" class="primary smallbtn">Ganti Tujuan</button><button id="bulkDelete" class="dangerbtn">⌫ Hapus Terpilih</button><button id="clearSelection" class="secondary smallbtn">× Batal Pilihan</button></div>
        <div class="toolbar"><div class="searchbox"><span>⌕</span><input id="search" placeholder="Cari shortlink, judul, atau URL tujuan..."></div><div class="toolbar-note"><span class="pulse"></span><span id="shownCount">0 link</span></div><button id="refreshBtn" class="secondary refreshbtn">↻ Refresh</button></div>
        <div class="table-wrap"><table><thead><tr><th class="checkcol"><span class="mobile-select">Pilih</span></th><th>SHORTLINK</th><th>URL TUJUAN</th><th>TOTAL KLIK</th><th>DIBUAT PADA</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody id="rows"></tbody></table></div><div id="empty" class="empty hidden"><div>⌁</div><strong>Belum ada shortlink</strong><span>Klik “Buat Shortlink Baru” untuk menambahkan link pertama.</span></div>
        <div class="panel-foot"><span id="footerCount">Menampilkan 0 shortlink</span><div class="pager"><button disabled>‹</button><b>1</b><button disabled>›</button><span>Semua / halaman</span></div></div>
      </section>
      <footer class="dashfooter"><a class="mini-brand" href="/">${brandMarkSvg()}<span><b>KUCIR<span class="accent">LINK</span></b><small>Shorten Today, Go Further</small></span></a><span>© ${new Date().getFullYear()} KUCIRLINK. All rights reserved.</span><span>Sederhana&nbsp;&nbsp;•&nbsp;&nbsp;Cepat&nbsp;&nbsp;•&nbsp;&nbsp;Aman&nbsp;&nbsp;•&nbsp;&nbsp;Global</span></footer>
    </main>
  </section>
  <div id="modal" class="modal hidden"><div class="modal-card"><div class="modal-head"><div><span class="modal-kicker">SHORTLINK MANAGER</span><h2 id="modalTitle">Buat Shortlink</h2><p>Masukkan URL tujuan dan slug pilihanmu.</p></div><button id="closeModal" class="iconbtn">×</button></div><form id="linkForm"><input id="editingSlug" type="hidden"><label>Judul <small>opsional</small></label><input id="title" maxlength="120" placeholder="Contoh: Website Utama"><label>URL Tujuan</label><input id="target" type="url" placeholder="https://example.com/halaman-panjang" required><label>Custom Slug <small>kosongkan untuk otomatis</small></label><div class="slugfield"><span id="originLabel"></span><input id="slug" maxlength="64" placeholder="namalink"></div><div class="checks"><label><input id="active" type="checkbox" checked> Aktif</label><label><input id="permanent" type="checkbox"> Redirect permanen (301)</label></div><div class="actions"><button type="button" id="cancelModal" class="secondary">Batal</button><button class="primary">Simpan Shortlink</button></div></form></div></div>
  <script>${adminScript()}</script>`, `<meta name="robots" content="noindex,nofollow">`);
}
function notFoundPage(){ return shell("404 — KUCIRLINK", `<main class="centerpage"><a class="brand center" href="/"><span class="mark">K</span><span>KUCIR<span class="accent">LINK</span></span></a><div class="code">404</div><h1>Shortlink tidak ditemukan</h1><p>Tautan mungkin salah, sudah dihapus, atau sedang dinonaktifkan.</p><a class="primary linkbtn" href="/">Kembali ke Beranda</a></main>`); }
function errorPage(){ return shell("Error — KUCIRLINK", `<main class="centerpage"><div class="code">500</div><h1>Terjadi kesalahan</h1><p>Silakan coba kembali beberapa saat lagi.</p></main>`); }

function adminScript(){ return `
const $=s=>document.querySelector(s); let links=[]; const selected=new Set();
const api=async(url,opt={})=>{const r=await fetch(url,{headers:{'Content-Type':'application/json',...(opt.headers||{})},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Terjadi kesalahan');return d};
const toast=(m,bad=false)=>{const t=$('#toast');t.textContent=m;t.className='toast show '+(bad?'bad':'');setTimeout(()=>t.className='toast',2800)};
async function boot(){try{await api('/api/session');showApp();load()}catch{showLogin()}}
function showLogin(){$('#loginView').classList.remove('hidden');$('#appView').classList.add('hidden')}
function showApp(){$('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#originLabel').textContent=location.host+'/';updateClock()}
$('#loginForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/login',{method:'POST',body:JSON.stringify({password:$('#password').value})});$('#password').value='';showApp();load();toast('Login berhasil')}catch(x){toast(x.message,true)}};
$('#logout').onclick=async()=>{await api('/api/logout',{method:'POST'}).catch(()=>{});showLogin()};
async function load(){try{links=(await api('/api/links')).links;for(const slug of [...selected])if(!links.some(x=>x.slug===slug))selected.delete(slug);render()}catch(x){if(x.message==='Unauthorized')showLogin();else toast(x.message,true)}}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmt(d){if(!d)return'—';return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(d))}
function shortTarget(u){try{const x=new URL(u);return x.hostname+(x.pathname==='/'?'':x.pathname)}catch{return u}}
function render(){const q=$('#search').value.toLowerCase();const arr=links.filter(x=>(x.slug+' '+(x.title||'')+' '+x.url).toLowerCase().includes(q));const totalClicks=links.reduce((a,b)=>a+(+b.clicks||0),0);const active=links.filter(x=>x.active!==false).length;$('#totalLinks').textContent=links.length.toLocaleString('id-ID');$('#totalClicks').textContent=totalClicks.toLocaleString('id-ID');$('#activeLinks').textContent=active.toLocaleString('id-ID');$('#inactiveLinks').textContent=(links.length-active).toLocaleString('id-ID');$('#shownCount').textContent=arr.length+' link';$('#footerCount').textContent='Menampilkan '+arr.length+' dari '+links.length+' shortlink';$('#empty').classList.toggle('hidden',arr.length>0);$('#rows').innerHTML=arr.map((x,i)=>\`<tr class="\${selected.has(x.slug)?'selectedrow':''}"><td class="checkcol"><input class="rowcheck" type="checkbox" data-slug="\${esc(x.slug)}" \${selected.has(x.slug)?'checked':''} aria-label="Pilih \${esc(x.slug)}"></td><td><div class="short"><a href="/\${encodeURIComponent(x.slug)}" target="_blank" rel="noreferrer">\${esc(location.host+'/'+x.slug)}</a><span>\${esc(x.title||'Tanpa judul')}</span></div></td><td><a class="target" href="\${esc(x.url)}" target="_blank" rel="noreferrer"><span class="site-dot">↗</span><span>\${esc(shortTarget(x.url))}</span></a></td><td class="clickcell"><b>\${(+x.clicks||0).toLocaleString('id-ID')}</b></td><td>\${fmt(x.createdAt)}</td><td><span class="status \${x.active!==false?'on':'off'}">\${x.active!==false?'Aktif':'Nonaktif'}</span></td><td><div class="rowacts"><button onclick="copyLink('\${esc(x.slug)}')" title="Salin">⧉</button><button class="edit" onclick="editLink('\${esc(x.slug)}')" title="Edit">✎</button><button class="danger" onclick="delLink('\${esc(x.slug)}')" title="Hapus">⌫</button></div></td></tr>\`).join('');document.querySelectorAll('.rowcheck').forEach(cb=>cb.onchange=()=>{cb.checked?selected.add(cb.dataset.slug):selected.delete(cb.dataset.slug);render()});updateBulk(arr)}
function updateBulk(arr){const n=selected.size;$('#selectedCount').textContent=n;$('#bulkBar').classList.toggle('hidden',n===0);const visible=arr.map(x=>x.slug);const checked=visible.filter(x=>selected.has(x)).length;$('#selectAll').checked=visible.length>0&&checked===visible.length;$('#selectAll').indeterminate=checked>0&&checked<visible.length}
$('#search').oninput=render;
$('#selectAll').onchange=e=>{const q=$('#search').value.toLowerCase();const arr=links.filter(x=>(x.slug+' '+(x.title||'')+' '+x.url).toLowerCase().includes(q));arr.forEach(x=>e.target.checked?selected.add(x.slug):selected.delete(x.slug));render()};
$('#clearSelection').onclick=()=>{selected.clear();$('#bulkTarget').value='';render()};
$('#bulkUpdate').onclick=async()=>{const slugs=[...selected];const url=$('#bulkTarget').value.trim();if(!slugs.length)return toast('Pilih minimal satu shortlink',true);if(!url)return toast('Masukkan URL tujuan baru',true);if(!confirm('Ganti tujuan '+slugs.length+' shortlink terpilih ke URL yang sama?'))return;const btn=$('#bulkUpdate');btn.disabled=true;try{const r=await api('/api/links/bulk',{method:'PUT',body:JSON.stringify({slugs,url})});selected.clear();$('#bulkTarget').value='';toast(r.updated+' shortlink berhasil diperbarui');await load()}catch(x){toast(x.message,true)}finally{btn.disabled=false}};
$('#bulkDelete').onclick=async()=>{const slugs=[...selected];if(!slugs.length)return toast('Pilih minimal satu shortlink',true);if(!confirm('Hapus permanen '+slugs.length+' shortlink terpilih? Tindakan ini tidak dapat dibatalkan.'))return;const btn=$('#bulkDelete');btn.disabled=true;try{const r=await api('/api/links/bulk',{method:'DELETE',body:JSON.stringify({slugs})});selected.clear();$('#bulkTarget').value='';toast(r.deleted+' shortlink berhasil dihapus');await load()}catch(x){toast(x.message,true)}finally{btn.disabled=false}};
$('#refreshBtn').onclick=()=>load();
window.copyLink=async slug=>{await navigator.clipboard.writeText(location.origin+'/'+slug);toast('Shortlink disalin')};
function openModal(x=null){$('#modal').classList.remove('hidden');$('#modalTitle').textContent=x?'Edit Shortlink':'Buat Shortlink';$('#editingSlug').value=x?.slug||'';$('#title').value=x?.title||'';$('#target').value=x?.url||'';$('#slug').value=x?.slug||'';$('#active').checked=x?x.active!==false:true;$('#permanent').checked=x?.permanent===true;setTimeout(()=>$('#target').focus(),50)}
function closeModal(){$('#modal').classList.add('hidden');$('#linkForm').reset();$('#active').checked=true;$('#editingSlug').value=''}
$('#newBtn').onclick=()=>openModal();$('#sideNewBtn').onclick=()=>openModal();$('#closeModal').onclick=closeModal;$('#cancelModal').onclick=closeModal;$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const id=b.dataset.go==='links'?'linksPanel':b.dataset.go==='stats'?'statsSection':'dashboardTop';document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'})});
window.editLink=slug=>openModal(links.find(x=>x.slug===slug));
window.delLink=async slug=>{if(!confirm('Hapus shortlink /'+slug+'?'))return;try{await api('/api/links/'+encodeURIComponent(slug),{method:'DELETE'});selected.delete(slug);toast('Shortlink dihapus');load()}catch(x){toast(x.message,true)}};
$('#linkForm').onsubmit=async e=>{e.preventDefault();const old=$('#editingSlug').value;const body={title:$('#title').value,url:$('#target').value,slug:$('#slug').value,active:$('#active').checked,permanent:$('#permanent').checked};try{if(old)await api('/api/links/'+encodeURIComponent(old),{method:'PUT',body:JSON.stringify(body)});else await api('/api/links',{method:'POST',body:JSON.stringify(body)});closeModal();toast(old?'Shortlink diperbarui':'Shortlink dibuat');load()}catch(x){toast(x.message,true)}};
function updateClock(){const d=new Date();$('#todayLabel').textContent=new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d);$('#clockLabel').textContent=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(d)+' WIB'}
setInterval(updateClock,60000);boot();` }

function escapeHtml(v=""){return String(v).replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function styles(){return `
:root{--bg:#06101f;--bg2:#08172b;--card:#0a1a30;--card2:#0d213c;--line:#16385d;--line2:#21558a;--text:#f4f8ff;--muted:#8ba5c5;--blue:#1487ff;--cyan:#39c8ff;--blue2:#075ce9;--red:#ff4f65;--green:#28e0a0;--violet:#805cff;--amber:#ffb72d;--shadow:0 24px 70px rgba(0,7,18,.42);--soft:0 12px 35px rgba(3,24,50,.32)}
*{box-sizing:border-box}html{color-scheme:dark;scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 72% -12%,rgba(15,126,255,.24),transparent 35%),radial-gradient(circle at 8% 100%,rgba(30,113,235,.13),transparent 30%),linear-gradient(150deg,#050d19,#071426 55%,#06101d);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input{font:inherit}.hidden{display:none!important}button{transition:.18s ease}button:hover{transform:translateY(-1px)}
.brand-svg{width:46px;height:46px;filter:drop-shadow(0 9px 20px rgba(16,126,255,.28));flex:0 0 auto}.brand{display:inline-flex;gap:11px;align-items:center;color:#fff;text-decoration:none}.brand-copy{display:flex;flex-direction:column;line-height:1}.brand-copy b{font-size:20px;font-weight:900;letter-spacing:.25px}.brand-copy small{color:#87a5c9;font-size:10px;margin-top:6px;font-weight:500}.accent{color:var(--cyan)}.brand.center{justify-content:center}.mini-brand{display:flex;align-items:center;gap:8px;color:white;text-decoration:none}.mini-brand .brand-svg{width:34px;height:34px}.mini-brand>span{display:flex;flex-direction:column}.mini-brand b{font-size:15px}.mini-brand small{font-size:9px;color:#7794b6}
/* landing */.landing{max-width:1180px;margin:auto;min-height:100vh;padding:0 28px;display:flex;flex-direction:column}.landing nav{height:88px;display:flex;align-items:center;justify-content:space-between}.navbtn,.secondary,.iconbtn{border:1px solid var(--line);background:linear-gradient(180deg,#0c213a,#091a2e);color:#dcecff;border-radius:11px;padding:10px 16px;text-decoration:none;cursor:pointer}.hero{flex:1;display:flex;flex-direction:column;justify-content:center;max-width:850px;padding:80px 0 120px}.eyebrow{color:var(--cyan);font-size:12px;letter-spacing:2.2px;font-weight:800}.hero h1{font-size:clamp(48px,7vw,88px);line-height:.98;letter-spacing:-4px;margin:18px 0 24px}.hero h1 span{color:#a8bfd9}.hero>p{font-size:19px;line-height:1.7;color:var(--muted);max-width:650px}.demo{margin-top:34px;display:flex;align-items:center;background:#09182a;border:1px solid var(--line);border-radius:17px;padding:8px 8px 8px 20px;max-width:680px;box-shadow:var(--shadow)}.demo span{color:#7898bd}.demo b{color:var(--cyan);flex:1}.demo button,.primary{border:1px solid rgba(71,180,255,.5);background:linear-gradient(135deg,#17b7ff,#126af5);color:#fff;border-radius:11px;padding:12px 18px;font-weight:800;cursor:pointer;box-shadow:0 8px 26px rgba(10,110,255,.23)}.trust{display:flex;gap:30px;margin-top:46px;flex-wrap:wrap}.trust>div{display:flex;align-items:center;gap:10px}.trust b{font-size:22px}.trust span{display:flex;flex-direction:column;color:var(--muted);font-size:12px}.trust strong{color:#e4f0ff;font-size:14px}.landing footer{padding:26px 0;color:#607f9f;border-top:1px solid #122d4a;font-size:13px}
/* login */.login-wrap{min-height:100vh;display:grid;place-items:center;padding:25px}.login-card{width:min(445px,100%);background:linear-gradient(160deg,rgba(14,35,61,.98),rgba(6,18,34,.98));border:1px solid #1b4773;border-radius:28px;padding:40px;box-shadow:0 34px 90px rgba(0,5,16,.55);position:relative;overflow:hidden}.login-card:after{content:"";position:absolute;width:220px;height:220px;border-radius:50%;background:rgba(30,139,255,.12);filter:blur(10px);right:-100px;top:-120px;pointer-events:none}.login-badge{width:max-content;margin:28px auto 0;padding:6px 10px;border-radius:999px;background:rgba(31,144,255,.12);border:1px solid rgba(58,170,255,.25);color:#72cbff;font-size:10px;font-weight:800;letter-spacing:1.5px}.login-card h1{text-align:center;margin:12px 0 5px;font-size:30px}.login-card p{text-align:center;color:var(--muted);margin:0 0 28px}.login-card label,#linkForm>label{display:block;color:#c7d8ec;font-size:13px;font-weight:700;margin:14px 0 8px}input{width:100%;background:#061425;border:1px solid #21466d;color:#f2f8ff;border-radius:11px;padding:13px 14px;outline:none}input::placeholder{color:#6380a1}input:focus{border-color:#39baff;box-shadow:0 0 0 3px rgba(38,154,255,.11)}.wide{width:100%;margin-top:18px;padding:14px}
/* dashboard */.app{display:grid;grid-template-columns:258px minmax(0,1fr);min-height:100vh}aside{border-right:1px solid #12375c;background:linear-gradient(180deg,#07152a,#061121);padding:22px 16px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;box-shadow:12px 0 40px rgba(0,5,14,.2);z-index:3}.sidebrand{padding:0 4px 20px}.sidenav{display:flex;flex-direction:column;gap:7px;margin-top:14px}.navitem{width:100%;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:11px;border:1px solid transparent;background:transparent;color:#adc4df;text-align:left;cursor:pointer;font-weight:650}.navitem:hover{background:#0b2440;color:#fff;border-color:#163b61}.navitem.active{background:linear-gradient(90deg,#0964e7,#0b7eff);color:#fff;border-color:#2d9cff;box-shadow:0 8px 28px rgba(0,100,255,.25),inset 0 0 28px rgba(42,181,255,.12)}.navico{width:22px;text-align:center;font-size:18px;color:#6ccaff}.navitem.active .navico{color:#dff6ff}.edge-card{position:relative;margin-top:28px;border:1px solid #174773;background:linear-gradient(165deg,#08233d,#07182c);border-radius:14px;padding:16px;overflow:hidden;min-height:150px}.edge-card>div:not(.edge-icon){position:relative;z-index:2}.edge-icon{position:relative;z-index:2;color:#2ed5ff;font-size:28px}.edge-card strong{display:block;color:#45d8ff;margin:7px 0 5px}.edge-card p{margin:0;color:#9bb4d0;font-size:12px;line-height:1.55}.edge-glow{position:absolute;width:150px;height:70px;border-radius:50%;background:rgba(18,120,255,.35);filter:blur(18px);right:-55px;bottom:-30px}.adminbox{margin-top:auto;border:1px solid #173b60;background:#081b31;border-radius:13px;padding:12px}.adminrow{display:flex;align-items:center;gap:10px;padding:4px 4px 12px;border-bottom:1px solid #123251}.avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#36c8ff,#126bff);font-weight:900}.adminrow div{display:flex;flex-direction:column}.adminrow small{color:#7f9bbd;margin-top:3px;font-size:10px}.logout{width:100%;border:0;background:transparent;color:#a8c1dd;text-align:left;padding:12px 5px 2px;cursor:pointer}.dashboard{padding:28px 30px 0;min-width:0;overflow:hidden}.dashhead{display:flex;align-items:center;justify-content:space-between;gap:25px;margin-bottom:20px}.dashboard h1{margin:2px 0 0;font-size:32px;letter-spacing:-.8px}.dashboard h1 span{color:#29aaff}.subhead{margin:4px 0 0;color:#9db5d0;font-size:13px}.muted{margin:0;color:#3dc4ff;font-size:11px;text-transform:uppercase;letter-spacing:1.7px;font-weight:800}.headbadges{display:flex;gap:12px;flex-shrink:0}.headbadge{display:flex;align-items:center;gap:11px;min-width:205px;border:1px solid #17466f;background:linear-gradient(180deg,#0a2039,#08192e);border-radius:12px;padding:11px 14px;box-shadow:var(--soft)}.hbicon{font-size:20px;color:#29a8ff}.headbadge div{display:flex;flex-direction:column}.headbadge strong{font-size:12px}.headbadge small{color:#86a3c2;font-size:10px;margin-top:3px}.headbadge.online{min-width:230px}.headbadge.online i,.pulse{width:12px;height:12px;border-radius:50%;background:var(--green);box-shadow:0 0 14px rgba(40,224,160,.75)}.headbadge.online strong{color:#39e5ae}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:17px}.stat{min-width:0;display:flex;align-items:center;gap:15px;padding:18px;border:1px solid var(--line);border-radius:15px;background:linear-gradient(145deg,#0a213b,#07182b);box-shadow:var(--soft);position:relative;overflow:hidden}.stat:after{content:"";position:absolute;left:70px;right:-20px;bottom:-35px;height:60px;border-radius:50%;filter:blur(18px);opacity:.22}.stat.blue:after{background:#1289ff}.stat.green:after{background:#1be19d}.stat.violet:after{background:#825cff}.stat.amber:after{background:#ffae23}.stat-icon{width:54px;height:54px;border-radius:13px;display:grid;place-items:center;font-size:25px;font-weight:900;flex:0 0 auto}.stat.blue .stat-icon{color:#4ac6ff;background:linear-gradient(145deg,#083f86,#0b65d6);border:1px solid #147ddd}.stat.green .stat-icon{color:#53ffc3;background:linear-gradient(145deg,#075e4a,#078661);border:1px solid #0ca77a}.stat.violet .stat-icon{color:#cfbdff;background:linear-gradient(145deg,#3a2489,#6141dc);border:1px solid #7758f5}.stat.amber .stat-icon{color:#ffd56c;background:linear-gradient(145deg,#6e4304,#a86400);border:1px solid #c27a06}.stat span{display:block;color:#a5bad2;font-size:12px}.stat strong{display:block;margin-top:3px;font-size:26px}.stat small{display:block;margin-top:4px;color:#6f8eaf;font-size:9px}.panel{background:linear-gradient(180deg,rgba(9,28,50,.98),rgba(6,20,37,.98));border:1px solid #17466f;border-radius:15px;overflow:hidden;box-shadow:var(--soft)}.panel-title{padding:16px 17px;display:flex;justify-content:space-between;gap:18px;align-items:center}.panel-title h2{margin:0;font-size:18px}.panel-title p{margin:4px 0 0;color:#8fa8c5;font-size:12px}.bulkbar{display:grid;grid-template-columns:auto auto minmax(250px,1fr) auto auto auto;gap:9px;align-items:center;margin:0 12px 10px;padding:10px;border:1px solid #1567a9;border-radius:11px;background:linear-gradient(90deg,rgba(7,81,151,.45),rgba(7,37,70,.78))}.selectall-label{display:flex;align-items:center;gap:7px;color:#cbe4ff;font-size:12px;font-weight:700;white-space:nowrap}.selectall-label input,.checkcol input,.rowcheck{width:16px;height:16px;accent-color:#21b9ff;cursor:pointer}.bulkinfo{display:flex;align-items:center;gap:5px;white-space:nowrap;background:#0b64c2;border-radius:999px;padding:7px 10px}.bulkinfo strong{font-size:13px}.bulkinfo span{font-size:10px;color:#d8efff}.bulk-url{display:flex;align-items:center;border:1px solid #24537e;background:#06182b;border-radius:9px;overflow:hidden}.bulk-url>span{padding:0 10px;color:#4fc5ff}.bulk-url input{border:0;border-radius:0;background:transparent;min-width:0}.smallbtn{padding:11px 14px;white-space:nowrap}.dangerbtn{border:1px solid #ff4059;background:linear-gradient(180deg,#e51b38,#a8071c);color:#fff;border-radius:10px;padding:11px 14px;font-weight:800;cursor:pointer;white-space:nowrap;box-shadow:0 8px 20px rgba(228,23,53,.18)}.bulkbar button:disabled{opacity:.5;cursor:not-allowed}.toolbar{display:flex;gap:12px;align-items:center;padding:0 12px 10px}.searchbox{display:flex;align-items:center;flex:1;border:1px solid #1b446c;background:#061426;border-radius:10px;overflow:hidden}.searchbox>span{font-size:21px;color:#91afd0;padding-left:13px}.searchbox input{border:0;background:transparent;border-radius:0}.toolbar-note{display:flex;align-items:center;gap:8px;color:#86a5c6;font-size:11px;white-space:nowrap}.toolbar-note .pulse{width:8px;height:8px}.refreshbtn{padding:11px 14px;white-space:nowrap}.table-wrap{overflow:auto;margin:0 10px;border:1px solid #123c63;border-radius:10px}table{width:100%;border-collapse:collapse;min-width:1000px}th,td{text-align:left;padding:11px 12px;border-bottom:1px solid #123351;font-size:11px}th{background:#0c2643;color:#a6bfdc;font-size:9px;letter-spacing:.4px;font-weight:800;white-space:nowrap}tbody tr{background:rgba(6,21,38,.4);transition:.15s}tbody tr:nth-child(even){background:rgba(12,38,65,.45)}tbody tr:hover{background:#0c3156}.selectedrow{background:linear-gradient(90deg,rgba(10,96,180,.42),rgba(9,45,80,.58))!important}.checkcol{width:42px;text-align:center}.mobile-select{display:none}.short{display:flex;flex-direction:column;gap:3px}.short a{width:max-content;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#34c9ff;background:#073e76;border:1px solid #0c5aa3;border-radius:8px;padding:5px 8px;text-decoration:none;font-weight:700}.short span{color:#6589ad;font-size:9px;padding-left:2px}.target{display:flex;align-items:center;gap:8px;max-width:330px;overflow:hidden;color:#c0d4e8;text-decoration:none}.target>span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.site-dot{width:27px;height:27px;border-radius:7px;display:grid;place-items:center;background:linear-gradient(135deg,#0c70dc,#21a9ff);color:#fff;flex:0 0 auto}.clickcell b{color:#f4f8ff}.status{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:800}.status.on{background:rgba(23,196,137,.17);color:#35e5aa;border:1px solid rgba(45,216,159,.2)}.status.off{background:rgba(116,144,175,.13);color:#aac0d8;border:1px solid rgba(128,158,190,.18)}.rowacts{display:flex;gap:5px}.rowacts button{width:30px;height:30px;border:1px solid #224e78;border-radius:7px;background:#0a2745;color:#b9d4ef;cursor:pointer}.rowacts .edit{color:#c8e6ff;background:#0b52a1;border-color:#116dcb}.rowacts .danger{color:#fff;background:#8f1325;border-color:#c22a40}.rowacts button:hover{filter:brightness(1.18)}.empty{text-align:center;padding:55px;color:#7193b7;display:flex;flex-direction:column;align-items:center;gap:6px}.empty div{font-size:38px;color:#28baff}.empty strong{color:#d8e9fb;font-size:15px}.empty span{font-size:11px}.panel-foot{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;color:#8eacca;font-size:10px}.pager{display:flex;align-items:center;gap:6px}.pager button,.pager b,.pager span{border:1px solid #173d63;background:#0a1e35;border-radius:8px;padding:8px 10px;color:#96b3d1}.pager b{background:#0d72ed;color:#fff;border-color:#2697ff}.dashfooter{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:15px;padding:17px 0;color:#6f91b5;font-size:9px}.dashfooter>span:last-child{text-align:right}
/* modal */.modal{position:fixed;inset:0;background:rgba(1,7,15,.82);backdrop-filter:blur(10px);display:grid;place-items:center;padding:18px;z-index:10}.modal-card{width:min(570px,100%);background:linear-gradient(160deg,#0c2440,#07182b);border:1px solid #245984;border-radius:20px;padding:25px;box-shadow:0 35px 90px rgba(0,5,16,.62)}.modal-head{display:flex;justify-content:space-between}.modal-head h2{margin:3px 0 0;font-size:24px}.modal-head p{color:var(--muted);font-size:12px;margin:4px 0 6px}.modal-kicker{font-size:9px;letter-spacing:1.4px;color:#3fc5ff;font-weight:800}.iconbtn{font-size:22px;padding:4px 11px}.slugfield{display:flex;align-items:center;background:#061425;border:1px solid #21466d;border-radius:11px;overflow:hidden}.slugfield span{padding-left:12px;color:#7898bb;font-size:12px;white-space:nowrap}.slugfield input{border:0;border-radius:0;padding-left:3px}.checks{display:flex;gap:18px;margin-top:18px;color:#a8c1dd;font-size:12px}.checks label{display:flex;align-items:center;gap:7px}.checks input{width:auto}.actions{display:flex;justify-content:flex-end;gap:9px;margin-top:24px}.toast{position:fixed;right:22px;top:22px;z-index:30;background:#0b3b30;border:1px solid #238965;color:#caffea;padding:12px 16px;border-radius:11px;opacity:0;transform:translateY(-8px);pointer-events:none;transition:.2s;box-shadow:var(--soft)}.toast.show{opacity:1;transform:none}.toast.bad{background:#451421;border-color:#a7334c;color:#ffd0d7}.centerpage{min-height:100vh;display:grid;place-content:center;text-align:center;padding:28px}.centerpage .code{font-size:90px;font-weight:950;color:var(--cyan);letter-spacing:-5px;margin-top:35px}.centerpage h1{margin:0}.centerpage p{color:var(--muted)}.linkbtn{display:inline-block;text-decoration:none;margin:18px auto 0}
@media(max-width:1180px){.stats{grid-template-columns:repeat(2,1fr)}.headbadges{display:none}.bulkbar{grid-template-columns:auto auto 1fr auto auto}.bulkbar .secondary{display:none}.dashfooter{grid-template-columns:1fr auto}.dashfooter>span:last-child{display:none}}
@media(max-width:850px){.app{grid-template-columns:1fr}aside{height:auto;position:static;flex-direction:row;align-items:center;gap:12px;padding:12px 14px;border-right:0;border-bottom:1px solid var(--line)}.sidebrand .brand-copy small,.edge-card,.adminbox,.sidenav{display:none}.sidebrand{padding:0}.dashboard{padding:18px 12px 0}.dashhead{align-items:flex-start}.dashhead h1{font-size:26px}.stats{grid-template-columns:1fr 1fr}.panel-title{align-items:stretch;flex-direction:column}.panel-title .primary{width:100%}.bulkbar{grid-template-columns:1fr}.selectall-label,.bulkinfo{width:max-content}.toolbar{flex-wrap:wrap}.toolbar-note{display:none}.searchbox{min-width:100%}.refreshbtn{margin-left:auto}.dashfooter{grid-template-columns:1fr;text-align:center}.mini-brand{justify-content:center}.dashfooter>span{display:block}.hero h1{letter-spacing:-2px}.demo{flex-wrap:wrap}.demo button{width:100%;margin-top:8px}.trust{gap:18px}.checks{flex-direction:column;gap:10px}}
@media(max-width:560px){.stats{grid-template-columns:1fr}.stat{padding:14px}.dashboard{padding-left:9px;padding-right:9px}.dashhead .subhead{font-size:11px}.table-wrap{border-radius:8px}.panel-foot{flex-direction:column;align-items:flex-start;gap:10px}.pager{align-self:flex-end}.bulk-url{width:100%}.dangerbtn,.smallbtn{width:100%}}
`}
