import { a as require_react, o as __toESM, t as require_jsx_runtime } from "../index.js";
import ThemeToggle from "./ThemeToggle-q3ttAaV0.js";
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
	const [links, setLinks] = (0, import_react.useState)([]), [url, setUrl] = (0, import_react.useState)(""), [alias, setAlias] = (0, import_react.useState)(""), [search, setSearch] = (0, import_react.useState)(""), [notice, setNotice] = (0, import_react.useState)(""), [loading, setLoading] = (0, import_react.useState)(true), [copied, setCopied] = (0, import_react.useState)(""), [editing, setEditing] = (0, import_react.useState)(null), [editUrl, setEditUrl] = (0, import_react.useState)(""), [saving, setSaving] = (0, import_react.useState)(false), [deleting, setDeleting] = (0, import_react.useState)(null), [removing, setRemoving] = (0, import_react.useState)(false);
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
	function startEdit(link) {
		setEditing(link);
		setEditUrl(link.url);
	}
	async function saveEdit(e) {
		e.preventDefault();
		if (!editing) return;
		setSaving(true);
		const r = await fetch("/api/links", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id: editing.id,
				url: editUrl
			})
		});
		const data = await r.json();
		setSaving(false);
		if (!r.ok) {
			setNotice(data.error || "Gagal memperbarui tautan.");
			return;
		}
		setEditing(null);
		setNotice(`Tujuan taut.ink/${editing.slug} berhasil diperbarui.`);
		await load();
	}
	async function removeLink() {
		if (!deleting) return;
		setRemoving(true);
		const r = await fetch("/api/links", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: deleting.id })
		});
		const data = await r.json();
		setRemoving(false);
		if (!r.ok) {
			setNotice(data.error || "Gagal menghapus tautan.");
			return;
		}
		const slug = deleting.slug;
		setDeleting(null);
		setNotice(`taut.ink/${slug} sudah dihapus.`);
		await load();
	}
	const shown = (0, import_react.useMemo)(() => links.filter((x) => `${x.slug} ${x.url}`.toLowerCase().includes(search.toLowerCase())), [links, search]);
	const total = links.reduce((n, x) => n + x.clicks, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "taut-dashboard",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "navbar dashboard-nav",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					className: "brand",
					href: "/",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "brand-icon",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinkMark, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Taut", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "brand-dot",
						children: ".ink"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "nav-actions",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "admin-chip",
							children: "● Admin"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "ghost-btn logout-link",
							href: "/api/logout",
							children: "Keluar"
						})
					]
				})]
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
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "row-actions",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "edit-link",
													onClick: () => startEdit(x),
													children: "Edit"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "delete-link",
													onClick: () => setDeleting(x),
													children: "Hapus"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													className: "more",
													href: `/${x.slug}`,
													target: "_blank",
													"aria-label": "Buka shortlink",
													children: "↗"
												})
											]
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
			editing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "edit-backdrop",
				role: "presentation",
				onMouseDown: (e) => {
					if (e.target === e.currentTarget) setEditing(null);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "edit-modal",
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "edit-title",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "modal-close",
							onClick: () => setEditing(null),
							"aria-label": "Tutup",
							children: "×"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "modal-kicker",
							children: "EDIT TAUTAN"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							id: "edit-title",
							children: ["taut.ink/", editing.slug]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Ubah alamat tujuan tanpa mengganti shortlink yang sudah dibagikan." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: saveEdit,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "edit-url",
									children: "Alamat tujuan baru"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "edit-url",
									value: editUrl,
									onChange: (e) => setEditUrl(e.target.value),
									autoFocus: true,
									required: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "modal-actions",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "cancel-btn",
										onClick: () => setEditing(null),
										children: "Batal"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "primary-btn",
										disabled: saving,
										children: saving ? "Menyimpan..." : "Simpan Perubahan"
									})]
								})
							]
						})
					]
				})
			}),
			deleting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "edit-backdrop",
				role: "presentation",
				onMouseDown: (e) => {
					if (e.target === e.currentTarget) setDeleting(null);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "edit-modal delete-modal",
					role: "alertdialog",
					"aria-modal": "true",
					"aria-labelledby": "delete-title",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "modal-close",
							onClick: () => setDeleting(null),
							"aria-label": "Tutup",
							children: "×"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "delete-icon",
							children: "!"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							id: "delete-title",
							children: [
								"Hapus taut.ink/",
								deleting.slug,
								"?"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Shortlink ini akan berhenti berfungsi dan tidak dapat dikembalikan." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "modal-actions",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "cancel-btn",
								onClick: () => setDeleting(null),
								children: "Batal"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "danger-btn",
								onClick: removeLink,
								disabled: removing,
								children: removing ? "Menghapus..." : "Ya, Hapus"
							})]
						})
					]
				})
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
