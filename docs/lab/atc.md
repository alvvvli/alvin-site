# ✈️ ATC Scheduler
<!-- Immersive modal launcher -->
<div style="margin: 8px 0 16px 0;">
  <button id="atc-open" class="md-button md-button--primary">▶ Open ATC in Fullscreen</button>
  <a href="../atc-embed.html" class="md-button" target="_blank" rel="noopener">Open in new tab</a>
</div>

<!-- Fullscreen modal -->
<style>
  .atc-modal { position: fixed; inset: 0; z-index: 9999; display: none; }
  .atc-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.65); backdrop-filter: blur(2px); }
  .atc-sheet { position: absolute; inset: var(--md-header-height,64px) 0 0 0; background:#0b0f14; }
  .atc-frame { width: 100%; height: 100%; border: 0; display: block; }
  .atc-bar { position: absolute; top: calc(var(--md-header-height,64px) + 8px); right: 12px; z-index: 2; }
  .atc-btn { appearance: none; border: 0; border-radius: 10px; padding: .5rem .75rem; margin-left: .5rem;
             background:#111827; color:#e6eef9; box-shadow:0 6px 18px rgba(0,0,0,.25); cursor:pointer; }
  .atc-btn:hover { opacity:.9 }
  @media (max-width: 599px) { .atc-sheet { inset: var(--md-header-height,56px) 0 0 0; } }
</style>

<div id="atc-modal" class="atc-modal" aria-hidden="true">
  <div class="atc-backdrop" id="atc-close-backdrop"></div>
  <div class="atc-sheet">
    <div class="atc-bar">
      <button id="atc-full" class="atc-btn">⤢ Browser Fullscreen</button>
      <button id="atc-close" class="atc-btn">✕ Close</button>
    </div>
    <iframe id="atc-iframe" class="atc-frame" src="../atc-embed.html" title="ATC Scheduler" allow="fullscreen"></iframe>
  </div>
</div>

<script>
(function(){
  const modal = document.getElementById('atc-modal');
  const openBtn = document.getElementById('atc-open');
  const closeBtn = document.getElementById('atc-close');
  const backdrop = document.getElementById('atc-close-backdrop');
  const frame = document.getElementById('atc-iframe');
  const fullBtn = document.getElementById('atc-full');

  function open()  { modal.style.display = 'block'; modal.setAttribute('aria-hidden','false'); }
  function close() { modal.style.display = 'none';  modal.setAttribute('aria-hidden','true');  }

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

  // Browser fullscreen API (esc to exit)
  fullBtn?.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await frame.requestFullscreen();
    } catch(e){ console.warn('Fullscreen not available', e); }
  });

  // Optional: auto-open once per visitor (first page view)
  try {
    const k='atc_auto_opened';
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

