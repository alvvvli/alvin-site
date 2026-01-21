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

<div class="trainer-footline">
  <b>Mouse/touch:</b> drag to command pitch/roll (AP OFF). Double-click to center.
  <span class="hint">Click inside the sim once to capture keyboard.</span>
</div>

<div class="trainer-card">
  <div class="trainer-frame">
    <iframe
      id="a350sim"
      src="../a350sim.html"
      title="A350 Procedure Trainer"
      loading="lazy"
      allow="fullscreen"
    ></iframe>
  </div>

  <div class="trainer-foot">
    <div class="trainer-foot__left">
      <b>Tip:</b> If keys don’t work, click inside the sim once (iframe focus).
    </div>
    <div class="trainer-foot__right">
      <a href="../a350sim.html" target="_blank" rel="noopener">Full screen</a>
    </div>
  </div>
</div>

<!-- Focus helper (best-effort; browsers may require user click) -->
<script>
  (function(){
    const f = document.getElementById('a350sim');
    if (!f) return;

    // focus on user gesture (reliable)
    f.addEventListener('pointerdown', () => { try { f.focus(); } catch(e){} });

    // also allow clicking the card area to focus the iframe
    const card = f.closest('.trainer-card');
    if (card){
      card.addEventListener('pointerdown', () => { try { f.focus(); } catch(e){} });
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
  margin-bottom: 12px;
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

.trainer-footline{
  margin: 6px 0 12px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.14);
  font-size: 12px;
  opacity: 0.92;
}

.trainer-footline .hint{
  opacity:0.75;
  margin-left:10px;
}

/* ===== The safe embed card ===== */
.trainer-card{
  margin-top: 12px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.18);
  overflow:hidden;
}

.trainer-frame{
  width:100%;
  height: min(86vh, 980px);
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

@media (max-width: 980px){
  .trainer-hero{ grid-template-columns: 1fr; }
  .trainer-title{ font-size:24px; }
  .k{ min-width: 72px; }
  .trainer-frame{ height: 76vh; }
}

/* NOTE:
   Do NOT hide sidebars or do layout hacks here.
   We'll do right-TOC behavior in custom.css cleanly.
*/
</style>
