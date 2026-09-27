document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".md-header__inner");
  const search = header && header.querySelector(".md-search");
  if (!header || !search) return;

  // wrapper styled like other header options
  const opt = document.createElement("div");
  opt.className = "md-header__option";

  // button with SVG icons (no fonts required)
  const btn = document.createElement("button");
  btn.className = "theme-toggle-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Toggle color scheme");
  btn.innerHTML = `
    <svg class="icon-sun" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
  <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M12 2v2M12 20v2M22 12h-2M4 12H2
           M18.364 5.636l-1.414 1.414M7.05 16.95l-1.414 1.414
           M18.364 18.364l-1.414-1.414M7.05 7.05L5.636 5.636"
        fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>
    <svg class="icon-moon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
  <path d="M21 12.8A9 9 0 1 1 11.2 3
           A7.2 7.2 0 0 0 21 12.8z"
        fill="currentColor"/>
</svg>
  `;
  opt.appendChild(btn);
  search.parentNode.insertBefore(opt, search);

  const root = document.documentElement;

  function getScheme() {
    const attr = root.getAttribute("data-md-color-scheme");
    if (attr) return attr;
    try {
      const pal = typeof __md_get !== "undefined" && __md_get("__palette");
      if (pal && pal.color && pal.color.scheme) return pal.color.scheme;
    } catch {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "slate" : "default";
  }

  function setScheme(scheme) {
    // Apply immediately
    root.setAttribute("data-md-color-scheme", scheme);
    // Persist using Material’s storage helpers if present
    try {
      const pal = (typeof __md_get !== "undefined" && __md_get("__palette")) || {};
      const color = Object.assign({}, pal.color || {}, { scheme });
      typeof __md_set !== "undefined" && __md_set("__palette", Object.assign({}, pal, { color }));
    } catch {}
    updateIcon();
  }

  function updateIcon() {
    const dark = getScheme() === "slate";
    btn.classList.toggle("is-dark", dark);
  }

  // init + click
  updateIcon();
  btn.addEventListener("click", () => {
    setScheme(getScheme() === "slate" ? "default" : "slate");
  });
});
