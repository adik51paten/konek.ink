import { m as require_react, t as require_jsx_runtime, v as __toESM } from "../index.js";
//#region app/page.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var seedLinks = [
	{
		id: 1,
		title: "Katalog Produk Agustus",
		original: "https://tokokita.id/katalog/produk-terbaru-agustus-2026",
		slug: "s.id/katalog-aug",
		clicks: 1284,
		date: "5 Agu 2026"
	},
	{
		id: 2,
		title: "Pendaftaran Webinar",
		original: "https://event.tokokita.id/webinar/strategi-digital",
		slug: "s.id/webinar-digital",
		clicks: 856,
		date: "3 Agu 2026"
	},
	{
		id: 3,
		title: "Promo Kemerdekaan",
		original: "https://tokokita.id/promo/kemerdekaan?ref=instagram",
		slug: "s.id/promo-merdeka",
		clicks: 492,
		date: "1 Agu 2026"
	}
];
function makeSlug() {
	return Math.random().toString(36).slice(2, 8);
}
function LinkMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "link-mark",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})]
	});
}
function DashboardApp() {
	const [links, setLinks] = (0, import_react.useState)(seedLinks);
	const [url, setUrl] = (0, import_react.useState)("");
	const [alias, setAlias] = (0, import_react.useState)("");
	const [search, setSearch] = (0, import_react.useState)("");
	const [copied, setCopied] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)("");
	const filteredLinks = (0, import_react.useMemo)(() => links.filter((link) => `${link.title} ${link.original} ${link.slug}`.toLowerCase().includes(search.toLowerCase())), [links, search]);
	const totalClicks = links.reduce((sum, item) => sum + item.clicks, 0);
	function submit(event) {
		event.preventDefault();
		let normalized = url.trim();
		if (!normalized) return setNotice("Masukkan URL yang ingin dipendekkan.");
		if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
		try {
			new URL(normalized);
		} catch {
			return setNotice("URL belum valid. Coba periksa kembali.");
		}
		const slug = `s.id/${alias.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") || makeSlug()}`;
		setLinks((items) => [{
			id: Date.now(),
			title: new URL(normalized).hostname.replace("www.", ""),
			original: normalized,
			slug,
			clicks: 0,
			date: "Baru saja"
		}, ...items]);
		setUrl("");
		setAlias("");
		setNotice(`Berhasil! Shortlink ${slug} sudah dibuat.`);
	}
	async function copy(value) {
		try {
			await navigator.clipboard.writeText(`https://${value}`);
		} catch {}
		setCopied(value);
		setTimeout(() => setCopied(null), 1600);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "navbar dashboard-nav",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					className: "brand",
					href: "#",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "brand-icon",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinkMark, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"Pendek",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "brand-dot",
							children: "."
						}),
						"in"
					] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					"aria-label": "Navigasi utama",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#fitur",
							children: "Fitur"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#tautan",
							children: "Tautan Saya"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#statistik",
							children: "Statistik"
						})
					]
				}),
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
			className: "hero",
			id: "fitur",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "eyebrow",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "●" }), " Cepat, aman, dan mudah digunakan"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: [
					"Shortlink simpel.",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Dampak maksimal." })
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hero-copy",
					children: "Ubah tautan panjang menjadi singkat, mudah diingat, dan siap dibagikan. Pantau performanya dalam satu tempat."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "shortener",
					onSubmit: submit,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "field main-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "url",
								children: "TAUTAN PANJANG"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "input-icon",
								children: "↗"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "url",
								value: url,
								onChange: (e) => setUrl(e.target.value),
								placeholder: "Tempel tautan panjang di sini..."
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "field alias-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "alias",
								children: "ALIAS (OPSIONAL)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "domain",
								children: "s.id/"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "alias",
								value: alias,
								onChange: (e) => setAlias(e.target.value),
								placeholder: "nama-kamu"
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "primary-btn shorten",
							type: "submit",
							children: ["Pendekkan ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "→" })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "form-foot",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: notice ? "notice active" : "notice",
						children: notice || "Tidak perlu kartu kredit. Gratis selamanya."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🔒 Tautan aman & terenkripsi" })]
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: ["+", Math.max(1, links.length - 2)] }), " bulan ini"] })
					] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "stat-icon amber",
						children: "⌁"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Total klik" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: totalClicks.toLocaleString("id-ID") }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "+18,2%" }), " dari bulan lalu"] })
					] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "stat-icon violet",
						children: "⌾"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Rata-rata klik" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: Math.round(totalClicks / links.length).toLocaleString("id-ID") }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "per tautan" })
					] })] })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "links-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-head",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Tautan terbaru" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Kelola dan pantau semua shortlink kamu." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "search",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "⌕" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: search,
								onChange: (e) => setSearch(e.target.value),
								"aria-label": "Cari tautan",
								placeholder: "Cari tautan..."
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "table-head",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "TAUTAN" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "SHORTLINK" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "KLIK" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "DIBUAT" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "link-list",
						children: [filteredLinks.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "link-row",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "link-info",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "site-icon",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinkMark, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: link.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: link.original })] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "shortlink",
									onClick: () => copy(link.slug),
									children: [
										link.slug,
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: copied === link.slug ? "✓" : "▣" })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "clicks",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: link.clicks.toLocaleString("id-ID") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "spark",
										children: "▁▂▂▃▃▅▆"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", { children: link.date }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "more",
									"aria-label": `Menu ${link.title}`,
									children: "•••"
								})
							]
						}, link.id)), !filteredLinks.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "empty",
							children: "Tidak ada tautan yang cocok."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "all-links",
						children: ["Lihat semua tautan ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "→" })]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "trust",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Dipercaya oleh ribuan kreator dan bisnis di Indonesia" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "NUSANTARA" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["KARYA", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "KU" })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "☕ KopiKita" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["RUANG", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "IDE" })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "lokal.in" })
			] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				className: "brand footer-brand",
				href: "#",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "brand-icon",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinkMark, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					"Pendek",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "brand-dot",
						children: "."
					}),
					"in"
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "© 2026 Pendek.in — Tautan singkat, hasil hebat." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#",
					children: "Privasi"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#",
					children: "Ketentuan"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#",
					children: "Bantuan"
				})
			] })
		] })
	] });
}
function LandingPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "landing-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "navbar landing-nav",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						className: "brand",
						href: "/",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "brand-icon",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinkMark, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"Pendek",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "brand-dot",
								children: "."
							}),
							"in"
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						"aria-label": "Navigasi landing page",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#keunggulan",
								children: "Keunggulan"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#cara-kerja",
								children: "Cara kerja"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#keamanan",
								children: "Keamanan"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "nav-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "ghost-btn",
							href: "/login",
							children: "Masuk"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							className: "primary-btn small",
							href: "/login",
							children: ["Buka Dashboard ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "→" })]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "landing-hero",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "landing-copy",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "eyebrow",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "●" }), " Platform shortlink untuk bisnis modern"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: [
							"Satu tautan singkat.",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Lebih banyak peluang." })
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Pendek.in membantu tim mengubah tautan panjang menjadi ringkas, profesional, dan mudah diukur—semuanya dari satu dashboard yang aman." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "landing-actions",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								className: "primary-btn",
								href: "/login",
								children: ["Masuk ke Dashboard ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "→" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "text-link",
								href: "#keunggulan",
								children: "Pelajari lebih lanjut ↓"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mini-proof",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "✓ Tautan bermerek" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "✓ Analitik klik" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "✓ Akses terlindungi" })
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "product-preview",
					"aria-label": "Pratinjau dashboard Pendek.in",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "preview-top",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "preview-logo",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinkMark, {})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Ringkasan performa" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "•••" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "preview-metric",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "TOTAL KLIK BULAN INI" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "12.480" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "↗ 24,8%" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "chart-bars",
							children: [
								34,
								52,
								43,
								70,
								56,
								83,
								72,
								94,
								78,
								100,
								88,
								110
							].map((height, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { style: { height } }, index))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "preview-link",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "site-icon",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinkMark, {})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "s.id/kampanye-baru" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "4.821 klik" })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "↗" })
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "logo-strip",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Dipercaya oleh tim yang bergerak cepat" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "NUSANTARA" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["KARYA", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "KU" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "☕ KopiKita" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["RUANG", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "IDE" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "lokal.in" })
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "feature-section",
				id: "keunggulan",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "section-heading",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "KENAPA PENDEK.IN" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Lebih dari sekadar tautan pendek" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Semua yang dibutuhkan untuk membagikan tautan dengan percaya diri." })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "feature-grid",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "feature-icon blue",
								children: "↗"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Ringkas & bermerek" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Buat alias yang mudah diingat dan terlihat profesional di setiap kanal." })
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "feature-icon amber",
								children: "⌁"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Analitik yang jelas" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Pantau jumlah klik dan performa setiap tautan dari satu tampilan." })
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							id: "keamanan",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "feature-icon violet",
									children: "⌾"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Dashboard terlindungi" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Hanya pengguna terdaftar yang dapat membuat dan mengelola shortlink." })
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "steps-section",
				id: "cara-kerja",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "01" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Masuk dengan aman" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Gunakan akun terdaftar untuk membuka dashboard." })
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "→" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "02" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Buat shortlink" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Tempel URL, tentukan alias, lalu pendekkan." })
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "→" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "03" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Pantau hasilnya" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Lihat performa tautan secara ringkas dan cepat." })
					] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "landing-cta",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Siap membuat tautan yang bekerja lebih keras?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Masuk ke dashboard dan mulai kelola shortlink Anda." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					className: "primary-btn light-button",
					href: "/login",
					children: ["Masuk Sekarang ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "→" })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					className: "brand footer-brand",
					href: "/",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "brand-icon",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinkMark, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"Pendek",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "brand-dot",
							children: "."
						}),
						"in"
					] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "© 2026 Pendek.in — Tautan singkat, hasil hebat." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#keamanan",
					children: "Keamanan"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/login",
					children: "Login"
				})] })
			] })
		]
	});
}
//#endregion
export { DashboardApp, LandingPage as default };
