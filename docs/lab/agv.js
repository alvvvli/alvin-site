(() => {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const panel = document.querySelector('.panel');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // 1) Set the CSS height of the canvas to fill what's left under the panel
  function sizeCanvasCss() {
    const pad = 20; // total vertical padding (10px top + 10px bottom)
    const panelH = panel ? panel.offsetHeight : 0;
    const h = Math.max(320, window.innerHeight - panelH - pad);
    canvas.style.height = h + 'px';
  }

  // 2) Match the drawing buffer to the rendered size
  function resizeBuffer() {
    const rect = canvas.getBoundingClientRect();
    canvas.width  = Math.floor(rect.width  * DPR);
    canvas.height = Math.floor(rect.height * DPR);
  }

  function resizeAll(){ sizeCanvasCss(); resizeBuffer(); }

  window.addEventListener('resize', resizeAll);
  if (panel && 'ResizeObserver' in window) new ResizeObserver(resizeAll).observe(panel);
  window.addEventListener('load', resizeAll);
  resizeAll();
  
  function resize(){
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * DPR);
    canvas.height = Math.floor(rect.height * DPR);
  }
  window.addEventListener('resize', resize); resize();

  // World units
  const W = () => canvas.width;
  const H = () => canvas.height;

  // Utility
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  function toPx([nx,ny]){ return {x:nx*W(), y:ny*H()}; }
  function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); }

  // Layout (normalized coordinates 0..1)
  const L = {
    lines:[
      {from:[0.08,0.25], to:[0.36,0.25]},
      {from:[0.08,0.45], to:[0.36,0.45]},
      {from:[0.08,0.65], to:[0.36,0.65]},
    ],
    robots:[ [0.40,0.25], [0.40,0.45], [0.40,0.65] ],
    merge:[0.50,0.45],
    agvPath:[ [0.52,0.45], [0.75,0.30], [0.90,0.30], [0.75,0.60], [0.90,0.60], [0.52,0.45] ],
    docks:[ {pos:[0.90,0.28], name:'Dock A'}, {pos:[0.90,0.58], name:'Dock B'} ],
    queue:[0.48,0.45],
  };

  // Entities & state
  let pallets = [];     // moving on conveyors/queue
  let agvs = [];        // vehicles
  const completed = []; // timestamps of finished jobs (sec)

  const params = {
    speed:1,
    spawnRate:0.5, // probability per second per line
    palletSpeed: 80, // px/s
    agvSpeed:120, // px/s
    queueCap: 12,
    agvCount: 2,
    showGrid:true,
    showLabels:true,
    trails:false,
  };

  // Logging (sampled once per second)
  const log = [];
  let logAccum = 0;
  function pushLog(dt){
    logAccum += dt; if(logAccum<1) return; logAccum = 0;
    const tnow = perf.now();
    const tph = rollingTPH();
    const util = agvs.reduce((s,a)=>s + (a.totalTime? a.busyTime/a.totalTime:0),0)/Math.max(agvs.length,1);
    log.push({t:tnow.toFixed(1), tph:tph.toFixed(2), wip:currentWIP(), util:(util*100).toFixed(1), queue:qArr.length});
  }

  // Controls DOM
  const kpi_tph = document.getElementById('kpi_tph');
  const kpi_wip = document.getElementById('kpi_wip');
  const kpi_util = document.getElementById('kpi_util');
  const kpi_bn = document.getElementById('kpi_bn');
  const speed = document.getElementById('speed');
  const speedVal = document.getElementById('speedVal');
  const spawn = document.getElementById('spawn');
  const spawnVal = document.getElementById('spawnVal');
  const presetSel = document.getElementById('preset');
  const agvPlus = document.getElementById('agvPlus');
  const agvMinus = document.getElementById('agvMinus');
  const agvCountEl = document.getElementById('agvCount');
  const playBtn = document.getElementById('playPause');
  const stepBtn = document.getElementById('step');
  const resetBtn = document.getElementById('reset');
  const shotBtn = document.getElementById('shot');
  const exportBtn = document.getElementById('export');
  const trailsBtn = document.getElementById('toggleTrails');
  const gridBtn = document.getElementById('toggleGrid');
  const labelsBtn = document.getElementById('toggleLabels');

  speed.addEventListener('input',()=>{params.speed=parseFloat(speed.value); speedVal.textContent=params.speed.toFixed(1)+'x'});
  spawn.addEventListener('input',()=>{params.spawnRate=parseFloat(spawn.value); spawnVal.textContent=params.spawnRate.toFixed(2)});
  presetSel.addEventListener('change',()=>applyPreset(presetSel.value));
  agvPlus.addEventListener('click',()=>{addAGV();});
  agvMinus.addEventListener('click',()=>{removeAGV();});
  trailsBtn.addEventListener('click',()=>{params.trails=!params.trails; trailsBtn.textContent='Trails: '+(params.trails?'On':'Off')});
  gridBtn.addEventListener('click',()=>{params.showGrid=!params.showGrid; gridBtn.textContent='Grid: '+(params.showGrid?'On':'Off')});
  labelsBtn.addEventListener('click',()=>{params.showLabels=!params.showLabels; labelsBtn.textContent='Labels: '+(params.showLabels?'On':'Off')});

  // AGV class
  class AGV{
    constructor(i){
      this.i=i; this.pos = toPx(L.agvPath[0]); this.state='idle';
      this.pathIndex=0; this.carry=null; this.busyTime=0; this.totalTime=0; this.trail=[];
    }
    update(dt){
      this.totalTime+=dt; if(this.state!=='idle') this.busyTime+=dt;
      if(this.state==='idle'){
        const q = queuePeek();
        if(q){ this.carry=q; q.state='agv'; dequeue(q); this.state='toDock'; this.pathIndex=0; }
        return;
      }
      const tgt = toPx(L.agvPath[this.pathIndex+1]);
      const here = this.pos; const d = dist(here,tgt);
      const step = params.agvSpeed*dt;
      if(d<=step){
        this.pos=tgt; this.pathIndex++;
        if(this.pathIndex>=L.agvPath.length-1){
          if(this.carry){ completed.push(perf.now()); this.carry=null; }
          this.state='idle'; this.pathIndex=0; this.pos = toPx(L.agvPath[0]);
        }
      }else{
        const v = [(tgt.x-here.x)/d*step,(tgt.y-here.y)/d*step];
        this.pos = {x: here.x+v[0], y: here.y+v[1]};
      }
      if(params.trails){
        this.trail.push({...this.pos, life:1}); if(this.trail.length>120) this.trail.shift();
        this.trail.forEach(pt=>pt.life=Math.max(0,pt.life-0.02));
      } else { this.trail.length=0; }
    }
    draw(){
      if(this.trail.length){
        for(let i=1;i<this.trail.length;i++){
          const a=this.trail[i-1], b=this.trail[i];
          ctx.strokeStyle=`rgba(74,222,128,${b.life*0.35})`; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
      const r=10*DPR; ctx.fillStyle="#4ade80"; ctx.beginPath(); ctx.arc(this.pos.x,this.pos.y,r,0,Math.PI*2); ctx.fill();
      if(this.carry){ ctx.fillStyle="#ffd166"; ctx.fillRect(this.pos.x-6*DPR,this.pos.y-16*DPR,12*DPR,8*DPR); }
      if(params.showLabels){ ctx.fillStyle="#052b1f"; ctx.font=`${10*DPR}px system-ui`; ctx.fillText(`A${this.i+1}`, this.pos.x-10*DPR, this.pos.y+22*DPR); }
    }
  }

  // Pallets
  let nextId=1;
  function spawnPallet(lineIdx){
    const p = { id:nextId++, line:lineIdx, pos:0, state:'line', at:perf.now() };
    pallets.push(p);
  }

  // Queue
  const qArr=[];
  function enqueue(p){ qArr.push(p); }
  function dequeue(p){ const i=qArr.indexOf(p); if(i>=0) qArr.splice(i,1); }
  function queuePeek(){ return qArr[0]; }

  // Initialize AGVs
  function refreshAGVs(){
    agvs = []; for(let i=0;i<params.agvCount;i++) agvs.push(new AGV(i));
    agvCountEl.textContent = String(params.agvCount);
  }
  function addAGV(){ params.agvCount = clamp(params.agvCount+1,1,10); refreshAGVs(); }
  function removeAGV(){ params.agvCount = clamp(params.agvCount-1,1,10); refreshAGVs(); }
  refreshAGVs();

  // Timing
  const perf = { start: performance.now(), now(){return (performance.now()-this.start)/1000;}};
  let last = performance.now(); let playing=true; // autostart
  playBtn.textContent = '⏸ Pause';

  // Controls
  playBtn.addEventListener('click',()=>{ playing=!playing; playBtn.textContent = playing? '⏸ Pause':'▶ Play'; });
  stepBtn.addEventListener('click',()=>tick(1/30));
  resetBtn.addEventListener('click',resetSim);
  shotBtn.addEventListener('click',saveScreenshot);
  exportBtn.addEventListener('click',exportCSV);

  // Keyboard shortcuts
  window.addEventListener('keydown',e=>{
    if(e.key===' '){ e.preventDefault(); playBtn.click(); }
    if(e.key.toLowerCase()==='r'){ resetSim(); }
    if(e.key==='['){ speed.value=Math.max(0.1,parseFloat(speed.value)-0.1).toFixed(1); speed.dispatchEvent(new Event('input')); }
    if(e.key===']'){ speed.value=Math.min(5,parseFloat(speed.value)+0.1).toFixed(1); speed.dispatchEvent(new Event('input')); }
    if(e.key.toLowerCase()==='a'){ addAGV(); }
    if(e.key.toLowerCase()==='d'){ removeAGV(); }
    if(e.key.toLowerCase()==='s'){ tick(1/30); }
  });

  function tick(forcedDt){
    const now = performance.now();
    let dt = forcedDt ?? (now-last)/1000; last = now; dt = clamp(dt,0,0.1);
    dt *= params.speed;

    // stochastic arrivals per line
    for(let i=0;i<L.lines.length;i++){
      if(Math.random() < params.spawnRate * dt){ spawnPallet(i); }
    }

    // Update pallets on lines → robot → merge → queue
    pallets.forEach(p=>{
      if(p.state==='line'){
        const s=L.lines[p.line];
        const len = (s.to[0]-s.from[0])*W();
        p.pos += (params.palletSpeed*dt)/len; // 0..1 along the line
        const robotX = L.robots[p.line][0];
        const progressAtRobot = (robotX - s.from[0]) / (s.to[0]-s.from[0]);
        if(p.pos >= progressAtRobot){ p.state='robot'; }
      }else if(p.state==='robot'){
        p.timer = (p.timer||0) + dt;
        if(p.timer>0.8){ p.state='merge'; p.timer=0; }
      }else if(p.state==='merge'){
        p.m = (p.m||0)+dt*0.6; if(p.m>=1){ p.state='queue'; enqueue(p);}        
      }
    });

    // enforce queue capacity (visual backpressure)
    while(qArr.length>params.queueCap){ const drop=qArr.shift(); drop.state='blocked'; }

    // Update AGVs
    agvs.forEach(a=>a.update(dt));

    // KPIs + logging
    kpi_tph.textContent = rollingTPH().toFixed(1);
    kpi_wip.textContent = currentWIP();
    const util = agvs.reduce((s,a)=>s + (a.totalTime? a.busyTime/a.totalTime:0),0)/Math.max(agvs.length,1);
    kpi_util.textContent = Math.round(util*100)+"%";
    kpi_bn.textContent = qArr.length/params.queueCap>0.7 ? 'AGV/Docks' : 'Lines/Robots';
    pushLog(dt);

    draw();
  }

  function rollingTPH(){
    const windowSec = 60; // rolling 60s
    const tnow = perf.now();
    while(completed.length && (tnow - completed[0])>windowSec) completed.shift();
    return completed.length * 3600 / windowSec;
  }
  function currentWIP(){
    return String(pallets.filter(p=>p.state!=='blocked').length + qArr.length + agvs.filter(a=>a.carry).length);
  }

  function draw(){
    ctx.clearRect(0,0,W(),H());
    ctx.save(); ctx.scale(DPR,DPR); ctx.scale(1/DPR,1/DPR);

    // Floor grid
    if(params.showGrid){
      ctx.globalAlpha=0.15; ctx.strokeStyle="#1b2a40";
      for(let x=0;x<W();x+=40*DPR){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H());ctx.stroke()}
      for(let y=0;y<H();y+=40*DPR){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W(),y);ctx.stroke()}
      ctx.globalAlpha=1;
    }

    // Conveyors
    ctx.lineWidth=10*DPR; ctx.strokeStyle="#89c2ff"; ctx.lineCap='round';
    L.lines.forEach(Li=>{ const a=toPx(Li.from), b=toPx(Li.to); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); });

    // Robots (palletize)
    L.robots.forEach((r,i)=>{ const p=toPx(r); ctx.fillStyle='#94a3b8'; ctx.beginPath(); ctx.arc(p.x,p.y,16*DPR,0,Math.PI*2); ctx.fill(); if(params.showLabels){ ctx.fillStyle='#071521'; ctx.font=`${12*DPR}px system-ui`; ctx.fillText('R'+(i+1), p.x-8*DPR,p.y+4*DPR);} });

    // Merge lines
    ctx.strokeStyle="#ffd166"; ctx.lineWidth=4*DPR; ctx.setLineDash([8*DPR,8*DPR]);
    const m=toPx(L.merge); [[0.42,0.25],[0.42,0.45],[0.42,0.65]].forEach(pt=>{ const a=toPx(pt); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(m.x,m.y); ctx.stroke(); }); ctx.setLineDash([]);

    // Queue area
    const q=toPx(L.queue); ctx.fillStyle="#3b0a12"; const qW=180*DPR, qH=40*DPR; ctx.fillRect(q.x, q.y-qH/2, qW, qH);

    // Docks
    L.docks.forEach(d=>{ const p=toPx(d.pos); ctx.strokeStyle="#ef4444"; ctx.lineWidth=2*DPR; ctx.strokeRect(p.x-70*DPR, p.y-40*DPR, 120*DPR, 80*DPR); if(params.showLabels){ ctx.fillStyle="#ef4444"; ctx.font=`${12*DPR}px system-ui`; ctx.fillText(d.name, p.x-24*DPR, p.y-48*DPR);} });

    // Pallets on lines/queue
    const qRect = {x:q.x, y:q.y, w:180*DPR, h:40*DPR};
    pallets.forEach(p=>{
      let pos; const s=L.lines[p.line];
      if(p.state==='line'){
        const ax=toPx(s.from).x, ay=toPx(s.from).y, bx=toPx(s.to).x, by=toPx(s.to).y;
        const t = clamp(p.pos,0,1); pos = {x: lerp(ax,bx,t), y: lerp(ay,by,t)};
      }else if(p.state==='robot'){
        pos = toPx(L.robots[p.line]);
      }else if(p.state==='merge'){
        const r = toPx([0.42,[0.25,0.45,0.65][p.line]]); const m = toPx(L.merge);
        const t = clamp(p.m||0,0,1); pos={x: lerp(r.x,m.x,t), y: lerp(r.y,m.y,t)};
      }else if(p.state==='queue' || p.state==='agv'){
        const idx = Math.max(0,qArr.indexOf(p));
        pos = {x: qRect.x + 10*DPR + (idx%params.queueCap)*( (qRect.w-20*DPR)/params.queueCap ), y:qRect.y};
      }else if(p.state==='blocked'){
        pos={x:qRect.x - 20*DPR, y:qRect.y};
      }
      if(!pos) return;
      const w=14*DPR,h=10*DPR; ctx.fillStyle = (p.state==='blocked')?"#ff6b6b":"#ffd166"; ctx.fillRect(pos.x-w/2,pos.y-h/2,w,h);
    });

    // AGVs
    agvs.forEach(a=>a.draw());
    ctx.restore();
  }

  function resetSim(){
    pallets=[]; qArr.length=0; completed.length=0; nextId=1; log.length=0; logAccum=0;
    refreshAGVs();
    warmup(2); // instant KPIs after reset
  }

  function applyPreset(p){
    if(p==='balanced'){ params.spawnRate=0.5; params.agvSpeed=120; params.queueCap=12; params.palletSpeed=80; params.agvCount=2; }
    if(p==='starved'){ params.spawnRate=0.18; params.agvSpeed=140; params.queueCap=12; }
    if(p==='agv_cap'){ params.spawnRate=0.65; params.agvSpeed=90; params.queueCap=10; }
    if(p==='wip_heavy'){ params.spawnRate=0.85; params.agvSpeed=120; params.queueCap=20; }
    spawn.value=params.spawnRate; spawn.dispatchEvent(new Event('input'));
    refreshAGVs();
  }

  function saveScreenshot(){
    const link = document.createElement('a');
    link.download = 'agv-mockup.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function exportCSV(){
    if(!log.length){ alert('No data yet. Let it run a few seconds.'); return; }
    const header = 't(sec),throughput(jobs/hr),WIP,AGV util(%),queue\n';
    const body = log.map(r=>`${r.t},${r.tph},${r.wip},${r.util},${r.queue}`).join('\n');
    const blob = new Blob([header+body], {type:'text/csv'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='agv-kpis.csv'; a.click(); URL.revokeObjectURL(url);
  }

  function warmup(seconds=3){ const dt=1/60; for(let i=0;i<seconds/dt;i++) tick(dt); }
  warmup(2.5); // seed the system on load
  function loop(){ if(playing) tick(); draw(); requestAnimationFrame(loop);} loop();
})();
