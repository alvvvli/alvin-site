document.addEventListener("DOMContentLoaded", () => {
  const headerInner = document.querySelector(".md-header__inner");
  const searchEl = headerInner && headerInner.querySelector(".md-search");
  if (!headerInner || !searchEl) return;

  // Create button inside a header option (for proper spacing)
  const opt = document.createElement("div");
  opt.className = "md-header__option";

  const btn = document.createElement("button");
  btn.className = "theme-toggle";
  btn.setAttribute("aria-label", "Toggle color scheme");
  btn.innerHTML = `
    <span class="material-symbols-outlined light">light_mode</span>
    <span class="material-symbols-outlined dark">dark_mode</span>
  `;
  opt.appendChild(btn);

  // Insert before the search element
  searchEl.parentNode.insertBefore(opt, searchEl);

  // Restore theme (Material uses attribute on <html>)
  const root = document.documentElement;
  const stored = localStorage.getItem("md-color-scheme");
  if (stored) root.setAttribute("data-md-color-scheme", stored);

  updateIcons();

  btn.addEventListener("click", () => {
    const active = root.getAttribute("data-md-color-scheme") || "default";
    const next = active === "slate" ? "default" : "slate";
    root.setAttribute("data-md-color-scheme", next);
    localStorage.setItem("md-color-scheme", next);
    updateIcons();
  });

  function updateIcons() {
    const mode = root.getAttribute("data-md-color-scheme") || "default";
    btn.classList.toggle("dark-mode", mode === "slate");
  }
});
