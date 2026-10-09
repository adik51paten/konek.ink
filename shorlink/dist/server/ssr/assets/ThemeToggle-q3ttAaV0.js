import { a as require_react, o as __toESM, t as require_jsx_runtime } from "../index.js";
//#region app/ThemeToggle.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ThemeToggle() {
	const [dark, setDark] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const saved = localStorage.getItem("tautink-theme");
		const active = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
		setDark(active);
		document.documentElement.classList.toggle("dark", active);
	}, []);
	function toggle() {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle("dark", next);
		localStorage.setItem("tautink-theme", next ? "dark" : "light");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: "theme-toggle",
		onClick: toggle,
		"aria-label": dark ? "Aktifkan mode terang" : "Aktifkan mode malam",
		title: dark ? "Mode terang" : "Mode malam",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: dark ? "☀" : "☾" })
	});
}
//#endregion
export { ThemeToggle as default };
