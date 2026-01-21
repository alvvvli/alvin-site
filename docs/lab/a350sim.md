# 🛫 ULR Procedure Trainer

<div class="trainer-hero">
  <div class="trainer-hero__left">
    <div class="trainer-title">Procedure Trainer</div>
    <div class="trainer-subtitle">
      ILS + stabilized gates · A/THR · AP (LOC/G/S) · FMA · mouse/touch yoke
    </div>

    <div class="trainer-actions">
      <a class="trainer-btn primary" href="../a350sim.html" target="_blank" rel="noopener">Open Full Screen</a>
      <a class="trainer-btn" href="../a350sim.html" target="_blank" rel="noopener">Open in New Tab</a>
    </div>
  </div>

  <div class="trainer-hero__right">
    <div class="kbd-grid">
      <div class="kbd-row"><span class="k">H</span> HUD minimal (hide help/panel)</div>
      <div class="kbd-row"><span class="k">T</span> A/THR</div>
      <div class="kbd-row"><span class="k">M</span> AP1</div>
      <div class="kbd-row"><span class="k">L</span> LOC</div>
      <div class="kbd-row"><span class="k">K</span> G/S</div>
      <div class="kbd-row"><span class="k">[ ]</span> SPD target</div>
      <div class="kbd-row"><span class="k">WASD</span> pitch/roll</div>
      <div class="kbd-row"><span class="k">Z/X</span> flaps</div>
      <div class="kbd-row"><span class="k">G</span> gear</div>
      <div class="kbd-row"><span class="k">B</span> brakes</div>
      <div class="kbd-row"><span class="k">SPACE</span> ACK / Continue</div>
      <div class="kbd-row"><span class="k">1 / 2</span> reset app / rwy</div>
    </div>
  </div>
</div>

<div class="trainer-card">
  <div class="trainer-frame">
    <iframe
      id="a350sim"
      tabindex="0"
      src="../a350sim.html"
      title="A350 Procedure Trainer"
      loading="lazy"
      allow="fullscreen"
    ></iframe>
  </div>

  <div class="trainer-foot">
    <div class="trainer-foot__left">
      <b>Mouse/touch:</b> drag to command pitch/roll (AP OFF). Double-click to center.
      <span class="hint">Click inside the sim once to capture keyboard.</span>
    </div>
    <div class="trainer-foot__right">
      <a href="../a350sim.html" target="_blank" rel="noopener">Full screen</a>
    </div>
  </div>
</div>

<!-- Focus helper: make keyboard controls reach the iframe -->
<script>
  (function(){
    const f = document.getElementById('a350sim');
    if (!f) return;

    // 1) Try focusing after load (may be blocked by browser until user gesture)
    f.addEventListener('load', () => {
      try { f.focus(); } catch(e) {}
    });

    // 2) Most reliable: focus on click/touch
    f.addEventListener('pointerdown', () => {
      try { f.focus(); } catch(e) {}
    });

    // 3) Click anywhere in the card to focus
    const card = f.closest('.trainer-card');
    if (card){
      card.addEventListener('pointerdown', () => {
        try { f.focus(); } catch(e) {}
      });
    }
  })();
</script>

---

## Notes

- This is a **toy procedure trainer** (not Airbus control laws).
- Best experience: **desktop + full screen**.
- If the sim UI overlaps: use **H** (HUD minimal) and/or open full screen.
- If keys don’t work: **click inside the sim once** (iframe focus).

<style>
/* ===========================
   Trainer Page Styling
   (page-scoped)
=========================== */

.trainer-hero{
  display:grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 16px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.20);
  backdrop-filter: blur(8px);
}

.trainer-title{
  font-size:28px;
  font-weight:800;
  margin-top:4px;
}

.trainer-subtitle{
  opacity:0.85;
  margin-top:6px;
  line-height:1.4;
}

.trainer-actions{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  margin-top:12px;
}

.trainer-btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:10px 12px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  text-decoration:none !important;
  font-weight:700;
}

.trainer-btn.primary{
  border-color: rgba(145,255,170,0.30);
  background: rgba(145,255,170,0.12);
}

.kbd-grid{
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.04);
  padding: 12px;
}

.kbd-row{
  display:flex;
  gap:10px;
  align-items:center;
  padding: 4px 0;
  opacity:0.92;
}

.k{
  min-width: 78px;
  display:inline-flex;
  justify-content:center;
  padding:3px 8px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,0.16);
  background: rgba(0,0,0,0.25);
  font-weight:800;
}

.trainer-card{
  margin-top: 16px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.18);
  overflow:hidden;
}

.trainer-frame{
  width:100%;
  height: min(86vh, 1020px);
  background: rgba(0,0,0,0.25);
}

.trainer-frame iframe{
  width:100%;
  height:100%;
  border:0;
  display:block;
}

.trainer-foot{
  display:flex;
  justify-content:space-between;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid rgba(255,255,255,0.10);
  opacity:0.9;
  font-size: 12px;
}

.trainer-foot .hint{
  opacity:0.75;
  margin-left:10px;
}

@media (max-width: 980px){
  .trainer-hero{ grid-template-columns: 1fr; }
  .trainer-title{ font-size:24px; }
  .trainer-frame{ height: 78vh; }
  .k{ min-width: 72px; }
}

/* ===========================
   MkDocs: dedicated trainer bay
   IMPORTANT: update slug if needed
=========================== */

/* Full width content */
body[data-md-url^="lab/ulr/"] .md-content__inner{
  max-width: 100% !important;
}

/* Hide sidebars (left nav + right TOC) */
body[data-md-url^="lab/ulr/"] .md-sidebar--primary,
body[data-md-url^="lab/ulr/"] .md-sidebar--secondary{
  display:none !important;
}

/* Remove left margin when primary sidebar is hidden */
body[data-md-url^="lab/ulr/"] .md-content{
  margin-left: 0 !important;
}
</style>
