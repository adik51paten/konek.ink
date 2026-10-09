import { a as require_react, o as __toESM, t as require_jsx_runtime } from "../index.js";
//#region app/dashboard/DashboardClient.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function LinkMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "link-mark",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})]
	});
}
function DashboardClient() {
	const [links, setLinks] = (0, import_react.useState)([]), [url, setUrl] = (0, import_react.useState)(""), [alias, setAlias] = (0, import_react.useState)(""), [search, setSearch] = (0, import_react.useState)(""), [notice, setNotice] = (0, import_react.useState)(""), [loading, setLoading] = (0, import_react.useState)(true), [copied, setCopied] = (0, import_react.useState)("");
	async function load() {
		const r = await fetch("/api/links", { cache: "no-store" });
		if (r.ok) setLinks((await r.json()).links);
		else setNotice("Database belum terhubung. Tambahkan binding D1 bernama DB di Cloudflare.");
		setLoading(false);
	}
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	async function submit(e) {
		e.preventDefault();
		setNotice("Membuat shortlink...");
		const r = await fetch("/api/links", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				url,
				alias
			})
		});
		const data = await r.json();
		if (!r.ok) {
			setNotice(data.error || "Gagal membuat shortlink.");
			return;
		}
		setUrl("");
		setAlias("");
		setNotice(`Berhasil! ${data.shortUrl} siap digunakan.`);
		await load();
	}
	async function copy(slug) {
		const value = `https://taut.ink/${slug}`;
		await navigator.clipboard.writeText(value);
		setCopied(slug);
		setTimeout(() => setCopied(""), 1500);
	}
	const shown = (0, import_react.useMemo)(() => links.filter((x) => `${x.slug} ${x.url}`.toLowerCase().includes(search.toLowerCase())), [links, search]);
	const total = links.reduce((n, x) => n + x.clicks, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "taut-dashboard",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "navbar dashboard-nav",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						className: "brand",
						href: "/",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "brand-icon",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinkMark, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Taut", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "brand-dot",
							children: ".ink"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#buat",
							children: "Buat Tautan"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#tautan",
							children: "Tautan Saya"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#statistik",
							children: "Statistik"
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "nav-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "admin-chip",
							children: "● Admin"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "ghost-btn logout-link",
							href: "/api/logout",
							children: "Keluar"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "hero dashboard-hero",
				id: "buat",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "dashboard-title",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "eyebrow",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "●" }), " Dashboard Taut.ink"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: ["Buat shortlink ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "baru." })] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "shortener",
						onSubmit: submit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "field main-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "url",
									children: "TAUTAN TUJUAN"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "input-icon",
									children: "↗"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "url",
									value: url,
									onChange: (e) => setUrl(e.target.value),
									"aria-label": "Tautan tujuan",
									required: true
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "field alias-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "alias",
									children: "ALIAS"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "domain",
									children: "taut.ink/"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "alias",
									value: alias,
									onChange: (e) => setAlias(e.target.value),
									"aria-label": "Alias shortlink",
									pattern: "[a-zA-Z0-9-]+"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "primary-btn shorten",
								children: ["Buat Tautan ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "→" })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "form-foot",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: notice ? "notice active" : "notice",
							children: notice || "Alias kosong akan dibuat otomatis."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🔒 Tersimpan aman di Cloudflare D1" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "dashboard",
				id: "tautan",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "stats",
					id: "statistik",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "stat-icon blue",
							children: "↗"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Total tautan" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: links.length }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "aktif" })
						] })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "stat-icon amber",
							children: "⌁"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Total klik" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: total.toLocaleString("id-ID") }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "semua waktu" })
						] })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "stat-icon violet",
							children: "⌾"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Rata-rata klik" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: links.length ? Math.round(total / links.length) : 0 }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "per tautan" })
						] })] })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "links-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "card-head",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Semua shortlink" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Data tersimpan permanen dan siap diakses." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "search",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "⌕" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: search,
									onChange: (e) => setSearch(e.target.value),
									placeholder: "Cari tautan..."
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "table-head",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "TAUTAN TUJUAN" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "SHORTLINK" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "KLIK" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "DIBUAT" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "link-list",
							children: [
								shown.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "link-row",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "link-info",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "site-icon",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinkMark, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: new URL(x.url).hostname }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: x.url })] })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											className: "shortlink",
											onClick: () => copy(x.slug),
											children: [
												"taut.ink/",
												x.slug,
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: copied === x.slug ? "✓" : "▣" })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "clicks",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: x.clicks.toLocaleString("id-ID") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "spark",
												children: "▁▂▃▅▆"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", { children: new Date(x.created_at).toLocaleDateString("id-ID") }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
											className: "more",
											href: `/${x.slug}`,
											target: "_blank",
											children: "↗"
										})
									]
								}, x.id)),
								!loading && !shown.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "empty",
									children: "Belum ada shortlink. Buat tautan pertama Anda di atas."
								}),
								loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "empty",
									children: "Memuat tautan..."
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					className: "brand footer-brand",
					href: "/",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "brand-icon",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinkMark, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Taut", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "brand-dot",
						children: ".ink"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "© 2026 Taut.ink" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/api/logout",
					children: "Keluar"
				}) })
			] })
		]
	});
}
//#endregion
export { DashboardClient as default };
