# 🛫 ULR Procedure Trainer

<div class="trainer-hero">
  <div class="trainer-hero__left">
    <div class="trainer-kicker">Interactive Lab</div>
    <div class="trainer-title">Procedure Trainer v2</div>
    <div class="trainer-subtitle">
      ILS + stabilized gates · A/THR · AP (LOC/G/S) · FMA · mouse/touch yoke
    </div>

    <div class="trainer-actions">
      <a class="trainer-btn primary" href="../a350sim.html" target="_blank" rel="noopener">Open Full Screen</a>
      <a class="trainer-btn" href="../a350sim.html" target="_blank" rel="noopener">Open in New Tab</a>
    </div>

    <div class="trainer-meta">
      <span class="pill">Single-file</span>
      <span class="pill">Toy physics</span>
      <span class="pill">Procedure flow</span>
      <span class="pill">Trainer UI</span>
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
      src="../a350sim.html"
      title="A350 Procedure Trainer"
      loading="lazy"
      allow="fullscreen"
    ></iframe>
  </div>

  <div class="trainer-foot">
    <div class="trainer-foot__left">
      <b>Mouse/touch:</b> drag to command pitch/roll (AP OFF). Double-click to center.
    </div>
    <div class="trainer-foot__right">
      <a href="../a350sim.html" target="_blank" rel="noopener">Full screen</a>
    </div>
  </div>
</div>

---

## Notes

- This is a **toy procedure trainer** (not Airbus control laws).
- Best experience: **desktop + full screen**.
- If the sim UI overlaps: use **H** (HUD minimal) and/or open full screen.

<style>
/* ===========================
   A350 Trainer Page Styling
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

.trainer-kicker{
  opacity:0.75;
  letter-spacing:0.5px;
  text-transform:uppercase;
  font-size:12px;
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

.trainer-meta{
  margin-top:12px;
  display:flex;
  gap:8px;
  flex-wrap:wrap;
}

.pill{
  display:inline-flex;
  padding:4px 10px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.05);
  font-size:12px;
  opacity:0.9;
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

@media (max-width: 980px){
  .trainer-hero{ grid-template-columns: 1fr; }
  .trainer-title{ font-size:24px; }
  .trainer-frame{ height: 78vh; }
  .k{ min-width: 72px; }
}

/* ===========================
   MkDocs: make this page feel
   like a dedicated trainer bay
=========================== */

/* Full width content */
body[data-md-url^="lab/a350sim/"] .md-content__inner{
  max-width: 100% !important;
}

/* Optional: hide sidebars to reduce chrome */
body[data-md-url^="lab/a350sim/"] .md-sidebar--primary,
body[data-md-url^="lab/a350sim/"] .md-sidebar--secondary{
  display:none !important;
}
body[data-md-url^="lab/a350sim/"] .md-content{
  margin-left: 0 !important;
}
</style>
