document.addEventListener("DOMContentLoaded", function() {
  const header = document.querySelector(".md-header__inner");
  if (!header) return;

  // create toggle button
  const btn = document.createElement("button");
  btn.className = "theme-toggle";
  btn.innerHTML = `
    <span class="material-symbols-outlined light">light_mode</span>
    <span class="material-symbols-outlined dark">dark_mode</span>
  `;
  header.appendChild(btn);

  // restore saved theme
  const current = localStorage.getItem("md-color-scheme") || "slate";
  document.body.setAttribute("data-md-color-scheme", current);
  updateIcons(current);

  btn.onclick = () => {
    const active = document.body.getAttribute("data-md-color-scheme");
    const next = active === "slate" ? "default" : "slate";
    document.body.setAttribute("data-md-color-scheme", next);
    localStorage.setItem("md-color-scheme", next);
    updateIcons(next);
  };

  function updateIcons(mode) {
    btn.classList.toggle("dark-mode", mode === "slate");
  }
});
