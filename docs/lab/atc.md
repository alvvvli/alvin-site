# ✈️ ATC Scheduler
<!-- ===== ATC Fullscreen Modal (production-grade) ===== -->
<div style="margin: 8px 0 16px 0;">
  <button id="atc-open" class="md-button md-button--primary">▶ Open ATC in Fullscreen</button>
  <a href="../atc-embed.html" class="md-button" target="_blank" rel="noopener">Open in new tab</a>
</div>

<style>
  /* Lock background scroll when modal is open */
  html.atc-lock, body.atc-lock { overflow: hidden !important; }

  /* Modal scaffolding */
  .atc-modal { position: fixed; inset: 0; z-index: 9999; display: none; }
  .atc-modal.is-open { display: block; }
  .atc-backdrop {
    position: absolute; inset: 0;
    background: rgba(0,0,0,.65); backdrop-filter: blur(2px);
    opacity: 0; transition: opacity .18s ease-out;
  }
  .atc-modal.is-anim .atc-backdrop { opacity: 1; }

  /* Sheet: fill below MkDocs header + iOS safe area */
  .atc-sheet {
    position: absolute;
    inset: calc(var(--md-header-height,64px) + env(safe-area-inset-top,0)) 0 0 0;
    background:#0b0f14;
    display: flex; flex-direction: column;
    box-shadow: 0 -8px 24px rgba(0,0,0,.35);
    transform: translateY(8px); opacity: 0; transition: transform .18s ease-out, opacity .18s ease-out;
  }
  .atc-modal.is-anim .atc-sheet { transform: none; opacity: 1; }

  /* Top controls */
  .atc-bar {
    position: sticky; top: 0; z-index: 2;
    display: flex; justify-content: flex-end; gap: .5rem;
    padding: .5rem .75rem; background: linear-gradient(180deg,#0b0f14,#0b0f14cc 60%,#0b0f1400);
  }
  .atc-btn {
    appearance: none; border: 0; border-radius: 10px;
    padding: .5rem .75rem; background:#111827; color:#e6eef9;
    box-shadow:0 6px 18px rgba(0,0,0,.25); cursor:pointer; font: inherit;
  }
  .atc-btn:hover { opacity: .9; }
  .atc-btn:focus { outline: 2px solid #60a5fa; outline-offset: 2px; }

  /* Frame fills remaining space without inner scrollbars around it */
  .atc-fill { flex: 1 1 auto; min-height: 0; }
  .atc-frame { width: 100%; height: 100%; border: 0; display: block; background:#0b0f14; }

  /* Respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .atc-backdrop, .atc-sheet { transition: none; }
  }
</style>

<div id="atc-modal"
     class="atc-modal"
     role="dialog"
     aria-modal="true"
     aria-labelledby="atc-title"
     aria-hidden="true"
     tabindex="-1">
  <div class="atc-backdrop" id="atc-close-backdrop"></div>
  <div class="atc-sheet">
    <div class="atc-bar">
      <button id="atc-full"  class="atc-btn" aria-label="Toggle browser fullscreen">⤢ Browser Fullscreen</button>
      <button id="atc-close" class="atc-btn" aria-label="Close ATC">✕ Close</button>
    </div>
    <div class="atc-fill">
      <iframe id="atc-iframe"
              class="atc-frame"
              src="../atc-embed.html"
              title="ATC Hub Scheduler"
              allow="fullscreen"></iframe>
    </div>
  </div>
</div>

<script>
(function(){
  const modal    = document.getElementById('atc-modal');
  const openBtn  = document.getElementById('atc-open');
  const closeBtn = document.getElementById('atc-close');
  const backdrop = document.getElementById('atc-close-backdrop');
  const frame    = document.getElementById('atc-iframe');
  const fullBtn  = document.getElementById('atc-full');
  let lastFocus  = null;

  function lockBody(lock) {
    document.documentElement.classList.toggle('atc-lock', lock);
    document.body.classList.toggle('atc-lock', lock);
  }

  function open() {
    lastFocus = document.activeElement;
    modal.classList.add('is-open');   // render
    requestAnimationFrame(()=> modal.classList.add('is-anim')); // fade in
    modal.setAttribute('aria-hidden','false');
    lockBody(true);
    closeBtn?.focus();
  }

  function close() {
    modal.classList.remove('is-anim');
    modal.addEventListener('transitionend', function handler(){
      modal.classList.remove('is-open');
      modal.removeEventListener('transitionend', handler);
    });
    modal.setAttribute('aria-hidden','true');
    lockBody(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && modal.classList.contains('is-open')) close(); });

  // Fullscreen API toggle (with Safari/WebKit fallback)
  async function toggleFull() {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      } else {
        if (frame.requestFullscreen) await frame.requestFullscreen();
        else if (frame.webkitRequestFullscreen) await frame.webkitRequestFullscreen();
      }
    } catch(e){ console.warn('Fullscreen not available', e); }
  }
  fullBtn?.addEventListener('click', toggleFull);

  // Optional: auto-open once per session
  try { const k='atc_auto_opened';
    if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k,'1'); open(); }
  } catch (_) {}
})();
</script>


## 📘 Overview
| Feature | Description |
|----------|--------------|
| **Gameplay** | Drag each Shinkansen to its correct platform before it leaves the screen |
| **Models Included** | E5 / H5 / E6 / E7 / W7 / N700S / 800 (accurate JR liveries) |
| **Objective** | Dispatch correctly to build combo and score; wrong lane resets combo |
| **Timer** | 60 seconds per session |
| **Ranks** | Conductor → Dispatcher → Station Master → JR East Pro |
| **Inspiration** | Based on Japanese high-speed rail punctuality and platform management |

