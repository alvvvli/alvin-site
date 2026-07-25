# ✈️ ATC Scheduler

<!-- ===== ATC Fullscreen Modal ===== -->

<div class="atc-launch">
  <button
    id="atc-open"
    type="button"
    class="md-button md-button--primary"
    aria-controls="atc-modal"
    aria-expanded="false">
    ⤢ Launch ATC Scheduler
  </button>

  <a
    href="../atc-embed.html"
  class="md-button"
  target="_blank"
  rel="noopener noreferrer">
  ↗ Open separate tab
</a>
</div>

<style>
  .atc-launch {
    display: flex;
    flex-wrap: wrap;
    gap: .6rem;
    margin: 8px 0 16px;
  }

  html.atc-lock,
  body.atc-lock {
    overflow: hidden !important;
  }

  .atc-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: none;
  }

  .atc-modal.is-open {
    display: block;
  }

  .atc-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, .68);
    backdrop-filter: blur(3px);
    opacity: 0;
    transition: opacity .18s ease-out;
  }

  .atc-modal.is-anim .atc-backdrop {
    opacity: 1;
  }

  .atc-sheet {
    position: absolute;
    inset:
      calc(var(--md-header-height, 64px) + env(safe-area-inset-top, 0px))
      0
      0
      0;

    display: flex;
    flex-direction: column;
    min-height: 0;
    background: #0b0f14;
    box-shadow: 0 -8px 28px rgba(0, 0, 0, .4);

    opacity: 0;
    transform: translateY(8px);
    transition:
      transform .18s ease-out,
      opacity .18s ease-out;
  }

  .atc-modal.is-anim .atc-sheet {
    opacity: 1;
    transform: none;
  }

  .atc-bar {
    z-index: 2;
    display: flex;
    align-items: center;
    gap: .5rem;
    flex: 0 0 auto;
    padding: .55rem .75rem;
    background: #0b0f14;
    border-bottom: 1px solid rgba(255, 255, 255, .08);
  }

  .atc-title {
    margin-right: auto;
    color: #e6eef9;
    font-size: .95rem;
    font-weight: 600;
  }

  .atc-btn {
    appearance: none;
    border: 1px solid rgba(255, 255, 255, .08);
    border-radius: 10px;
    padding: .5rem .75rem;
    background: #111827;
    color: #e6eef9;
    box-shadow: 0 6px 18px rgba(0, 0, 0, .25);
    cursor: pointer;
    font: inherit;
  }

  .atc-btn:hover {
    filter: brightness(1.1);
  }

  .atc-btn:focus-visible {
    outline: 2px solid #60a5fa;
    outline-offset: 2px;
  }

  .atc-fill {
    flex: 1 1 auto;
    min-height: 0;
  }

  .atc-frame {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: #0b0f14;
  }

  @media (prefers-reduced-motion: reduce) {
    .atc-backdrop,
    .atc-sheet {
      transition: none;
    }
  }
</style>

<div
  id="atc-modal"
  class="atc-modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="atc-title"
  aria-hidden="true"
  tabindex="-1">

  <div
    id="atc-close-backdrop"
    class="atc-backdrop">
  </div>

  <div class="atc-sheet">
    <div class="atc-bar">
      <strong id="atc-title" class="atc-title">
        ATC Hub Scheduler
      </strong>

  <button
        id="atc-full"
        type="button"
        class="atc-btn"
        aria-label="Toggle browser fullscreen">
        ⤢ Fullscreen
  </button>

  <button
        id="atc-close"
        type="button"
        class="atc-btn"
        aria-label="Close ATC Scheduler">
        ✕ Close
      </button>
  </div>

  <div class="atc-fill">
      <iframe
        id="atc-iframe"
        class="atc-frame"
        src="about:blank"
        data-src="../atc-embed.html"
        title="ATC Hub Scheduler"
        allow="fullscreen"
        allowfullscreen>
      </iframe>
    </div>
  </div>
</div>

<script>
(() => {
  const modal = document.getElementById("atc-modal");
  const openBtn = document.getElementById("atc-open");
  const closeBtn = document.getElementById("atc-close");
  const backdrop = document.getElementById("atc-close-backdrop");
  const frame = document.getElementById("atc-iframe");
  const fullBtn = document.getElementById("atc-full");

  if (
    !modal ||
    !openBtn ||
    !closeBtn ||
    !backdrop ||
    !frame ||
    !fullBtn
  ) {
    console.warn("ATC modal initialization failed: required element missing.");
    return;
  }

  let lastFocus = null;
  let closeTimer = null;

  function lockPage(locked) {
    document.documentElement.classList.toggle("atc-lock", locked);
    document.body.classList.toggle("atc-lock", locked);
  }

  function ensureFrameLoaded() {
    if (
      frame.src === "about:blank" ||
      frame.getAttribute("src") === "about:blank"
    ) {
      frame.src = frame.dataset.src;
    }
  }

  function openModal() {
    clearTimeout(closeTimer);

    lastFocus = document.activeElement;
    ensureFrameLoaded();

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    openBtn.setAttribute("aria-expanded", "true");
    lockPage(true);

    requestAnimationFrame(() => {
      modal.classList.add("is-anim");
      closeBtn.focus();
    });
  }

  function finishClose() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    openBtn.setAttribute("aria-expanded", "false");
    lockPage(false);

    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function closeModal() {
    modal.classList.remove("is-anim");

    clearTimeout(closeTimer);
    closeTimer = setTimeout(finishClose, 220);
  }

  async function toggleFullscreen() {
    try {
      const fullscreenElement =
        document.fullscreenElement ||
        document.webkitFullscreenElement;

      if (fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }

        return;
      }

      if (frame.requestFullscreen) {
        await frame.requestFullscreen();
      } else if (frame.webkitRequestFullscreen) {
        frame.webkitRequestFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen is unavailable:", error);
    }
  }

  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  fullBtn.addEventListener("click", toggleFullscreen);

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      modal.classList.contains("is-open") &&
      !document.fullscreenElement
    ) {
      closeModal();
    }
  });
})();
</script>
