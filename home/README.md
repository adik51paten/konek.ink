# KUCIRLINK – High Traffic Worker

Versi ini menggunakan arsitektur yang dipisah agar redirect tidak lagi menulis click counter ke Workers KV pada setiap klik.

## Arsitektur

- **Cloudflare Worker**: menerima request dan melakukan redirect.
- **Workers KV (`LINKS`)**: menyimpan konfigurasi shortlink (slug, URL tujuan, status, 301/302, judul).
- **Durable Object (`CLICK_COUNTER`)**: menyimpan statistik klik secara atomik per slug.
- **GitHub + Cloudflare Workers Builds**: deploy otomatis setiap commit.

Alur redirect:

```text
Pengunjung -> Worker -> baca target dari KV -> redirect
                         \
                          -> waitUntil -> Durable Object counter
```

Karena pencatatan klik dijalankan melalui `waitUntil()`, respons redirect tidak menunggu proses penyimpanan statistik selesai.

## Upgrade dari versi sebelumnya

Ganti minimal dua file di repository GitHub:

```text
src/index.js
wrangler.jsonc
```

Lalu Commit. Cloudflare akan melakukan deployment otomatis.

`wrangler.jsonc` sudah berisi binding KV yang sama dan menambahkan Durable Object:

```json
"durable_objects": {
  "bindings": [
    {
      "name": "CLICK_COUNTER",
      "class_name": "ClickCounter"
    }
  ]
},
"exports": {
  "ClickCounter": {
    "type": "durable-object",
    "storage": "sqlite"
  }
}
```

Tidak perlu membuat Durable Object secara manual di dashboard. Deployment Wrangler akan membuat namespace SQLite-backed Durable Object dari konfigurasi `exports`.

## Data klik lama

Record KV lama masih memiliki field `clicks`. Saat counter Durable Object untuk suatu slug pertama kali digunakan, nilai lama tersebut dipakai sebagai seed sehingga statistik lama tidak langsung kembali ke nol.

Jika slug diubah melalui dashboard, statistik ikut dipindahkan ke slug baru. Jika link dihapus, counter slug tersebut di-reset agar slug yang sama dapat dipakai kembali dari nol.

## Secret yang tetap dibutuhkan

Pastikan Worker mempunyai Runtime Secrets:

```text
ADMIN_PASSWORD
SESSION_SECRET
```

Tidak perlu menaruh nilainya di GitHub.

## URL uji coba

```text
https://kucir-in.headmkt-ina62.workers.dev/
https://kucir-in.headmkt-ina62.workers.dev/admin
```

## Fitur

- Landing page publik tanpa form pembuatan shortlink
- Dashboard admin
- Login berbasis secret + signed session cookie
- Create / edit / delete shortlink
- Random slug
- 301 / 302 redirect
- Aktif / nonaktif link
- Statistik klik
- Multi-select / bulk update tujuan URL
- Pilih semua
- Search
- Copy short URL
- KV untuk konfigurasi link
- Durable Object per slug untuk counter klik

## Update tampilan dashboard
Versi ini menambahkan dashboard dark-blue profesional, favicon SVG biru-putih, statistik ringkas, toolbar pencarian yang lebih rapi, responsive layout, dan fitur hapus massal shortlink terpilih. Fitur high-traffic KV + Durable Object tetap dipertahankan.
