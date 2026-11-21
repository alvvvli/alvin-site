(() => {
  const $ = (id) => document.getElementById(id);
  const canvas = $('stage');
  if (!canvas) {
    console.warn('AGV Builder Layer: missing canvas#stage');
    return;
  }

  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  const ui = {
    speed: $('speed'),
    speedVal: $('speedVal'),
    spawn: $('spawn'),
    spawnVal: $('spawnVal'),
    agvSpeed: $('agvSpeed'),
    agvSpeedVal: $('agvSpeedVal'),
    queueCap: $('queueCap'),
    queueCapVal: $('queueCapVal'),
    preset: $('preset'),
    playPause: $('playPause'),
    step: $('step'),
    reset: $('reset'),
    clearLayout: $('clearLayout'),
    loadDemo: $('loadDemo'),
    toggleGrid: $('toggleGrid'),
    toggleLabels: $('toggleLabels'),
    toggleHeat: $('toggleHeat'),
    toggleTrails: $('toggleTrails'),
    addAGV: $('addAGV'),
    removeAGV: $('removeAGV'),
    agvCount: $('agvCount'),
    selectionInfo: $('selectionInfo'),
    queueInfo: $('queueInfo'),
    stationTable: $('stationTable'),
    eventLog: $('eventLog'),
    kpi_tph: $('kpi_tph'),
    kpi_wip: $('kpi_wip'),
    kpi_util: $('kpi_util'),
    kpi_bn: $('kpi_bn'),
    zoomInBtn: $('zoomInBtn'),
    zoomOutBtn: $('zoomOutBtn'),
    zoomResetBtn: $('zoomResetBtn'),
    focusBtn: $('focusBtn'),
    modes: {
      select: $('modeSelect'),
      pan: $('modePan'),
      conveyor: $('modeConveyor'),
      station: $('modeStation'),
      robot: $('modeRobot'),
      dock: $('modeDock'),
      agvSpawn: $('modeAGVSpawn'),
      delete: $('modeDelete'),
    },
  };

  const colors = {
    bg: '#07111f',
    grid: 'rgba(125,160,220,.10)',
    conveyor: '#89c2ff',
    pallet: '#ffd166',
    agv: '#4ade80',
    robot: '#9aa8bb',
    dock: '#ef4444',
    station: '#8b5cf6',
    labelFill: 'rgba(7,17,31,.88)',
    labelStroke: 'rgba(255,255,255,.10)',
    text: '#dbe7ff',
  };

  const state = {
    params: {
      speed: 1,
      spawnRate: 0.55,
      palletSpeed: 90,
      agvSpeed: 120,
      queueCap: 12,
      agvCount: 2,
      showGrid: true,
      showLabels: true,
      showHeat: false,
      showTrails: true,
      snap: 20,
    },
    world: {
      nextId: 1,
      mode: 'select',
      conveyors: [],
      robots: [],
      stations: [],
      docks: [],
      agvSpawns: [],
      pallets: [],
      queue: [],
      agvs: [],
      selected: null,
      dragging: null,
      tempConveyorStart: null,
      playing: true,
      lastT: performance.now(),
      perfStart: performance.now(),
      completed: [],
      traffic: [],
      events: ['Builder layer initialized.'],
    },
  };

  const camera = {
    zoom: 1,
    minZoom: 0.55,
    maxZoom: 2.8,
    offsetX: 0,
    offsetY: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * DPR);
    canvas.height = Math.floor(rect.height * DPR);
  }
  window.addEventListener('resize', resize);
  resize();

  const W = () => canvas.width;
  const H = () => canvas.height;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const nowSec = () => (performance.now() - state.world.perfStart) / 1000;
  const snap = (n) => Math.round(n / state.params.snap) * state.params.snap;

  function worldToScreen(x, y) {
    return { x: x * camera.zoom + camera.offsetX, y: y * camera.zoom + camera.offsetY };
  }

  function screenToWorld(x, y) {
    return { x: (x - camera.offsetX) / camera.zoom, y: (y - camera.offsetY) / camera.zoom };
  }

  function zoomAt(screenX, screenY, factor) {
    const before = screenToWorld(screenX, screenY);
    camera.zoom = clamp(camera.zoom * factor, camera.minZoom, camera.maxZoom);
    const after = worldToScreen(before.x, before.y);
    camera.offsetX += screenX - after.x;
    camera.offsetY += screenY - after.y;
  }

  function resetCamera() {
    camera.zoom = 1;
    camera.offsetX = 0;
    camera.offsetY = 0;
  }

  function focusOnPoint(x, y, targetZoom = 1.8) {
    camera.zoom = clamp(targetZoom, camera.minZoom, camera.maxZoom);
    camera.offsetX = W() / 2 - x * camera.zoom;
    camera.offsetY = H() / 2 - y * camera.zoom;
  }

  function focusSelectedAsset() {
    const s = state.world.selected;
    if (!s) return;
    if (s.type === 'conveyor') {
      focusOnPoint((s.a.x + s.b.x) / 2, (s.a.y + s.b.y) / 2, 1.45);
    } else if ('x' in s && 'y' in s) {
      focusOnPoint(s.x, s.y, 1.9);
    }
  }

  function screenPoint(evt) {
    const rect = canvas.getBoundingClientRect();
    const sx = (evt.clientX - rect.left) * DPR;
    const sy = (evt.clientY - rect.top) * DPR;
    const wp = screenToWorld(sx, sy);
    return { x: wp.x, y: wp.y, sx, sy };
  }

  function newId(prefix) {
    return `${prefix}-${state.world.nextId++}`;
  }

  function logEvent(msg) {
    const t = nowSec().toFixed(1);
    state.world.events.unshift(`[${t}s] ${msg}`);
    state.world.events = state.world.events.slice(0, 12);
    if (ui.eventLog) {
      ui.eventLog.innerHTML = state.world.events.map((e) => `<div style="margin:0 0 6px">${e}</div>`).join('');
    }
  }

  function setMode(mode) {
    state.world.mode = mode;
    Object.entries(ui.modes).forEach(([k, el]) => el?.classList.toggle('active', k === mode));
  }

  function addConveyor(a, b) {
    state.world.conveyors.push({ id: newId('CV'), type: 'conveyor', a, b, load: 0 });
  }
  function addRobot(x, y) {
    state.world.robots.push({ id: newId('RB'), type: 'robot', x, y, busy: 0, queue: 0 });
  }
  function addStation(x, y) {
    state.world.stations.push({ id: newId('ST'), type: 'station', x, y, role: 'Buffer / Merge', load: 0, status: 'Ready' });
  }
  function addDock(x, y) {
    state.world.docks.push({ id: newId('DK'), type: 'dock', x, y, status: 'Idle' });
  }
  function addAGVSpawn(x, y) {
    state.world.agvSpawns.push({ id: newId('SP'), type: 'agvSpawn', x, y });
  }

  function clearLayout() {
    state.world.conveyors = [];
    state.world.robots = [];
    state.world.stations = [];
    state.world.docks = [];
    state.world.agvSpawns = [];
    state.world.pallets = [];
    state.world.queue = [];
    state.world.completed = [];
    state.world.selected = null;
    refreshAGVs();
  }

  function loadDemoPlant() {
    clearLayout();
    addConveyor({ x: 120, y: 180 }, { x: 420, y: 180 });
    addConveyor({ x: 120, y: 320 }, { x: 420, y: 320 });
    addConveyor({ x: 120, y: 460 }, { x: 420, y: 460 });
    addRobot(450, 180);
    addRobot(450, 320);
    addRobot(450, 460);
    addStation(640, 320);
    addDock(980, 170);
    addDock(980, 470);
    addAGVSpawn(700, 320);
    addAGVSpawn(740, 350);
    refreshAGVs();
    resetCamera();
  }

  class AGV {
    constructor(i, spawn) {
      this.id = `A${i + 1}`;
      this.x = spawn?.x ?? (700 + i * 24);
      this.y = spawn?.y ?? (320 + i * 18);
      this.home = { x: this.x, y: this.y };
      this.state = 'idle';
      this.target = null;
      this.carry = null;
      this.busyTime = 0;
      this.totalTime = 0;
      this.trail = [];
    }
    update(dt) {
      this.totalTime += dt;
      if (this.state !== 'idle') this.busyTime += dt;
      if (this.state === 'idle') {
        const next = state.world.queue[0];
        if (next) {
          state.world.queue.shift();
          this.carry = next;
          this.state = 'toDock';
          this.target = nearestDock(this);
        }
        return;
      }
      if (!this.target) {
        this.state = 'idle';
        return;
      }
      const d = dist(this, this.target);
      const step = state.params.agvSpeed * dt;
      if (d <= step) {
        this.x = this.target.x;
        this.y = this.target.y;
        if (this.state === 'toDock') {
          if (this.carry) {
            state.world.completed.push(nowSec());
            this.carry.done = true;
            this.carry = null;
          }
          this.state = 'returning';
          this.target = this.home;
        } else {
          this.state = 'idle';
          this.target = null;
        }
      } else {
        this.x += ((this.target.x - this.x) / d) * step;
        this.y += ((this.target.y - this.y) / d) * step;
      }
      if (state.params.showTrails) {
        this.trail.push({ x: this.x, y: this.y, life: 1 });
        if (this.trail.length > 80) this.trail.shift();
        this.trail.forEach((t) => { t.life = Math.max(0, t.life - 0.025); });
      } else {
        this.trail = [];
      }
      state.world.traffic.push({ x: this.x, y: this.y, life: 1 });
      if (state.world.traffic.length > 600) state.world.traffic.shift();
    }
  }

  function refreshAGVs() {
    const w = state.world;
    const spawns = w.agvSpawns.length ? w.agvSpawns : [{ x: 700, y: 320 }, { x: 740, y: 350 }];
    w.agvs = [];
    for (let i = 0; i < state.params.agvCount; i++) w.agvs.push(new AGV(i, spawns[i % spawns.length]));
    if (ui.agvCount) ui.agvCount.textContent = String(state.params.agvCount);
  }

  function nearestRobot(p) {
    let best = null, bestD = Infinity;
    for (const r of state.world.robots) {
      const d = dist(p, r);
      if (d < bestD) { best = r; bestD = d; }
    }
    return best;
  }

  function nearestStation(p) {
    let best = null, bestD = Infinity;
    for (const s of state.world.stations) {
      const d = dist(p, s);
      if (d < bestD) { best = s; bestD = d; }
    }
    return best;
  }

  function nearestDock(p) {
    let best = null, bestD = Infinity;
    for (const d of state.world.docks) {
      const dd = dist(p, d);
      if (dd < bestD) { best = d; bestD = dd; }
    }
    return best ?? { x: p.x + 150, y: p.y };
  }

  function spawnPallet(conveyor) {
    state.world.pallets.push({
      id: newId('PL'),
      type: 'pallet',
      conveyorId: conveyor.id,
      t: 0,
      state: 'line',
      x: conveyor.a.x,
      y: conveyor.a.y,
      timer: 0,
      done: false,
    });
  }

  function updateSpawns(dt) {
    const conveyors = state.world.conveyors;
    if (!conveyors.length) return;
    for (const c of conveyors) {
      const chance = state.params.spawnRate * dt * (1 / Math.max(1, conveyors.length * 0.7));
      if (Math.random() < chance) spawnPallet(c);
    }
  }

  function updatePallets(dt) {
    for (const c of state.world.conveyors) c.load = 0;
    for (const r of state.world.robots) { r.queue = 0; r.busy = Math.max(0, r.busy - dt); }
    for (const s of state.world.stations) { s.load = 0; s.status = 'Ready'; }
    for (const d of state.world.docks) d.status = 'Idle';

    for (const p of state.world.pallets) {
      if (p.done) continue;
      const conveyor = state.world.conveyors.find((c) => c.id === p.conveyorId);
      if (!conveyor) continue;

      if (p.state === 'line') {
        const len = Math.max(40, dist(conveyor.a, conveyor.b));
        p.t += (state.params.palletSpeed * dt) / len;
        p.x = lerp(conveyor.a.x, conveyor.b.x, clamp(p.t, 0, 1));
        p.y = lerp(conveyor.a.y, conveyor.b.y, clamp(p.t, 0, 1));
        conveyor.load += 1;
        if (p.t >= 0.82 && state.world.robots.length) {
          const rb = nearestRobot(p);
          if (rb) {
            p.state = 'robot';
            p.robotId = rb.id;
            rb.queue += 1;
          }
        }
      } else if (p.state === 'robot') {
        const rb = state.world.robots.find((r) => r.id === p.robotId) ?? nearestRobot(p);
        if (!rb) continue;
        p.x = rb.x;
        p.y = rb.y;
        rb.queue += 1;
        if (rb.busy <= 0) {
          rb.busy = 0.65 + Math.random() * 0.35;
          p.state = 'station';
          p.stationId = nearestStation(p)?.id ?? null;
        }
      } else if (p.state === 'station') {
        const st = state.world.stations.find((s) => s.id === p.stationId) ?? nearestStation(p);
        if (!st) continue;
        p.x += (st.x - p.x) * Math.min(1, dt * 2.5);
        p.y += (st.y - p.y) * Math.min(1, dt * 2.5);
        st.load += 1;
        st.status = st.load > state.params.queueCap * 0.7 ? 'Congested' : st.load > 0 ? 'Processing' : 'Ready';
        if (dist(p, st) < 12) {
          p.timer += dt;
          if (p.timer > 0.25 && state.world.queue.length < state.params.queueCap) {
            p.state = 'queue';
            state.world.queue.push(p);
            p.timer = 0;
          }
        }
      } else if (p.state === 'queue') {
        const st = state.world.stations[0] ?? { x: 640, y: 320 };
        const idx = state.world.queue.indexOf(p);
        p.x = st.x + 28 + (idx % 10) * 16;
        p.y = st.y - 18 + Math.floor(idx / 10) * 14;
        if (idx >= 0 && state.world.queue.length >= state.params.queueCap * 0.85) st.status = 'Queue Full';
      }
    }
  }

  function updateAGVs(dt) {
    for (const a of state.world.agvs) a.update(dt);
    for (const a of state.world.agvs) {
      if (a.carry) {
        a.carry.state = 'agv';
        a.carry.x = a.x;
        a.carry.y = a.y - 16;
        const dock = nearestDock(a);
        if (dock) dock.status = 'Receiving';
      }
    }
  }

  function rollingTPH() {
    const t = nowSec();
    while (state.world.completed.length && t - state.world.completed[0] > 60) state.world.completed.shift();
    return state.world.completed.length * 60;
  }

  function currentWIP() {
    return state.world.pallets.filter((p) => !p.done).length + state.world.queue.length + state.world.agvs.filter((a) => a.carry).length;
  }

  function updatePanels() {
    const util = state.world.agvs.reduce((s, a) => s + (a.totalTime ? a.busyTime / a.totalTime : 0), 0) / Math.max(1, state.world.agvs.length);
    ui.kpi_tph && (ui.kpi_tph.textContent = rollingTPH().toFixed(1));
    ui.kpi_wip && (ui.kpi_wip.textContent = String(currentWIP()));
    ui.kpi_util && (ui.kpi_util.textContent = `${Math.round(util * 100)}%`);

    const qRatio = state.world.queue.length / Math.max(1, state.params.queueCap);
    let bn = 'Balanced';
    if (qRatio > 0.7) bn = 'Station / AGV';
    else if (state.world.robots.some((r) => r.queue > 2)) bn = 'Robot';
    else if (state.world.conveyors.some((c) => c.load > 3)) bn = 'Feed Conveyor';
    ui.kpi_bn && (ui.kpi_bn.textContent = bn);

    if (ui.queueInfo) {
      ui.queueInfo.innerHTML = state.world.queue.length
        ? `Queued pallets: <b>${state.world.queue.length}</b><br>Capacity used: <b>${Math.round(qRatio * 100)}%</b>`
        : 'Queue empty.';
    }

    if (ui.selectionInfo) {
      const s = state.world.selected;
      ui.selectionInfo.innerHTML = s
        ? [
            `<b>${s.id}</b>`,
            `Type: ${s.type}`,
            'x' in s ? `X: ${Math.round(s.x)}, Y: ${Math.round(s.y)}` : '',
            s.type === 'station' ? `Role: ${s.role}<br>Load: ${s.load}<br>Status: ${s.status}` : '',
            s.type === 'robot' ? `Queue: ${s.queue}<br>Busy: ${s.busy.toFixed(2)}s` : '',
            s.type === 'dock' ? `Status: ${s.status}` : '',
            s.type === 'conveyor' ? `Length: ${Math.round(dist(s.a, s.b))} px<br>Load: ${s.load}` : '',
          ].filter(Boolean).join('<br>')
        : 'Nothing selected.';
    }

    if (ui.stationTable) {
      const rows = [];
      state.world.stations.forEach((s) => rows.push(`<div class="trow"><div>${s.id}</div><div>${s.role}</div><div>${s.load}</div><div>${s.status}</div></div>`));
      state.world.robots.forEach((r) => rows.push(`<div class="trow"><div>${r.id}</div><div>Robot Cell</div><div>${r.queue}</div><div>${r.busy > 0 ? 'Busy' : 'Ready'}</div></div>`));
      state.world.docks.forEach((d) => rows.push(`<div class="trow"><div>${d.id}</div><div>Outbound Dock</div><div>—</div><div>${d.status}</div></div>`));
      ui.stationTable.innerHTML = `<div class="thead"><div>ID</div><div>Role</div><div>Load</div><div>Status</div></div>${rows.join('') || '<div class="trow"><div>—</div><div>No assets</div><div>—</div><div>—</div></div>'}`;
    }
  }

  function drawGrid() {
    if (!state.params.showGrid) return;
    const leftWorld = screenToWorld(0, 0).x;
    const rightWorld = screenToWorld(W(), 0).x;
    const topWorld = screenToWorld(0, 0).y;
    const bottomWorld = screenToWorld(0, H()).y;
    const step = 40;
    const startX = Math.floor(leftWorld / step) * step;
    const startY = Math.floor(topWorld / step) * step;

    ctx.save();
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1 / camera.zoom;
    for (let x = startX; x <= rightWorld + step; x += step) {
      ctx.beginPath(); ctx.moveTo(x, topWorld - step); ctx.lineTo(x, bottomWorld + step); ctx.stroke();
    }
    for (let y = startY; y <= bottomWorld + step; y += step) {
      ctx.beginPath(); ctx.moveTo(leftWorld - step, y); ctx.lineTo(rightWorld + step, y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawLabel(text, x, y) {
    const fontSize = 11 / camera.zoom;
    ctx.fillStyle = colors.labelFill;
    ctx.strokeStyle = colors.labelStroke;
    ctx.lineWidth = 1 / camera.zoom;
    ctx.font = `${fontSize}px system-ui`;
    const w = ctx.measureText(text).width + 12 / camera.zoom;
    ctx.beginPath();
    roundRect(x - w / 2, y - 10 / camera.zoom, w, 20 / camera.zoom, 8 / camera.zoom);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function roundRect(x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
  }

  function drawHeat() {
    if (!state.params.showHeat) return;
    for (const t of state.world.traffic) {
      t.life = Math.max(0, t.life - 0.0025);
      ctx.fillStyle = `rgba(255,120,60,${t.life * 0.08})`;
      ctx.beginPath(); ctx.arc(t.x, t.y, 28, 0, Math.PI * 2); ctx.fill();
    }
    state.world.traffic = state.world.traffic.filter((t) => t.life > 0.01);
  }

  function drawConveyors() {
    ctx.lineCap = 'round';
    for (const c of state.world.conveyors) {
      ctx.strokeStyle = colors.conveyor;
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(c.a.x, c.a.y); ctx.lineTo(c.b.x, c.b.y); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.12)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(c.a.x, c.a.y); ctx.lineTo(c.b.x, c.b.y); ctx.stroke();
      ctx.setLineDash([]);
      if (state.params.showLabels) drawLabel(c.id, (c.a.x + c.b.x) / 2, (c.a.y + c.b.y) / 2 - 14);
    }
  }

  function drawStations() {
    for (const s of state.world.stations) {
      ctx.fillStyle = s.status === 'Congested' || s.status === 'Queue Full' ? '#a855f7' : colors.station;
      ctx.strokeStyle = state.world.selected === s ? '#ffffff' : 'rgba(255,255,255,.08)';
      ctx.lineWidth = state.world.selected === s ? 2.5 : 1.5;
      ctx.beginPath(); roundRect(s.x - 24, s.y - 18, 48, 36, 10); ctx.fill(); ctx.stroke();
      if (state.params.showLabels) drawLabel(s.id, s.x, s.y - 30);
    }
  }

  function drawRobots() {
    for (const r of state.world.robots) {
      ctx.fillStyle = colors.robot;
      ctx.strokeStyle = state.world.selected === r ? '#ffffff' : 'rgba(255,255,255,.08)';
      ctx.lineWidth = state.world.selected === r ? 2.5 : 1.5;
      ctx.beginPath(); ctx.arc(r.x, r.y, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#c7d2e2'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + 18, r.y - 10); ctx.lineTo(r.x + 30, r.y - 2); ctx.stroke();
      if (state.params.showLabels) drawLabel(r.id, r.x, r.y - 28);
    }
  }

  function drawDocks() {
    for (const d of state.world.docks) {
      ctx.strokeStyle = colors.dock;
      ctx.lineWidth = 2;
      ctx.strokeRect(d.x - 42, d.y - 26, 84, 52);
      ctx.fillStyle = 'rgba(239,68,68,.08)';
      ctx.fillRect(d.x - 42, d.y - 26, 84, 52);
      if (state.params.showLabels) drawLabel(d.id, d.x, d.y - 38);
    }
  }

  function drawSpawns() {
    for (const s of state.world.agvSpawns) {
      ctx.strokeStyle = colors.agv;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, 12, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.x - 16, s.y); ctx.lineTo(s.x + 16, s.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.x, s.y - 16); ctx.lineTo(s.x, s.y + 16); ctx.stroke();
      if (state.params.showLabels) drawLabel(s.id, s.x, s.y - 26);
    }
  }

  function drawPallets() {
    for (const p of state.world.pallets) {
      if (p.done) continue;
      ctx.fillStyle = colors.pallet;
      ctx.fillRect(p.x - 8, p.y - 6, 16, 12);
    }
  }

  function drawAGVs() {
    for (const a of state.world.agvs) {
      if (a.trail?.length) {
        for (let i = 1; i < a.trail.length; i++) {
          const u = a.trail[i - 1], v = a.trail[i];
          ctx.strokeStyle = `rgba(74,222,128,${v.life * 0.25})`;
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.lineTo(v.x, v.y); ctx.stroke();
        }
      }
      ctx.fillStyle = colors.agv;
      ctx.beginPath(); roundRect(a.x - 13, a.y - 10, 26, 20, 7); ctx.fill();
      if (a.carry) {
        ctx.fillStyle = colors.pallet;
        ctx.fillRect(a.x - 7, a.y - 18, 14, 9);
      }
      if (state.params.showLabels) drawLabel(a.id, a.x, a.y + 22);
    }
  }

  function drawSelection() {
    const s = state.world.selected;
    if (!s) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 2;
    if (s.type === 'conveyor') {
      ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(s.x, s.y, 22, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function pointSegDist(p, a, b) {
    const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    if (!l2) return dist(p, a);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = clamp(t, 0, 1);
    const q = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
    return dist(p, q);
  }

  function hitTest(p) {
    const radius = 18 / camera.zoom;
    const lineRadius = 10 / camera.zoom;
    const pools = [state.world.agvs, state.world.stations, state.world.robots, state.world.docks, state.world.agvSpawns];
    for (const pool of pools) {
      for (const o of pool) if (dist(p, o) < radius) return o;
    }
    for (const c of state.world.conveyors) if (pointSegDist(p, c.a, c.b) < lineRadius) return c;
    return null;
  }

  function deleteAsset(hit) {
    for (const key of ['stations', 'robots', 'docks', 'agvSpawns', 'conveyors']) {
      const i = state.world[key].indexOf(hit);
      if (i >= 0) {
        state.world[key].splice(i, 1);
        if (key === 'agvSpawns') refreshAGVs();
        if (state.world.selected === hit) state.world.selected = null;
        logEvent(`${hit.id} removed.`);
        return;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W(), H());
    ctx.save();
    ctx.translate(camera.offsetX, camera.offsetY);
    ctx.scale(camera.zoom, camera.zoom);
    drawGrid();
    drawHeat();
    drawConveyors();
    drawRobots();
    drawStations();
    drawDocks();
    drawSpawns();
    drawPallets();
    drawAGVs();
    drawSelection();
    if (state.world.tempConveyorStart) {
      ctx.fillStyle = 'rgba(99,179,255,.8)';
      ctx.beginPath(); ctx.arc(state.world.tempConveyorStart.x, state.world.tempConveyorStart.y, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function resetSim() {
    state.world.pallets = [];
    state.world.queue = [];
    state.world.completed = [];
    state.world.traffic = [];
    state.world.perfStart = performance.now();
    refreshAGVs();
    logEvent('Simulation reset. Layout preserved.');
  }

  function tick(forcedDt) {
    const now = performance.now();
    let dt = forcedDt ?? (now - state.world.lastT) / 1000;
    state.world.lastT = now;
    dt = clamp(dt, 0, 0.1) * state.params.speed;
    updateSpawns(dt);
    updatePallets(dt);
    updateAGVs(dt);
    updatePanels();
    draw();
  }

  function loop() {
    if (state.world.playing) tick();
    else draw();
    requestAnimationFrame(loop);
  }

  Object.entries(ui.modes).forEach(([mode, el]) => el?.addEventListener('click', () => setMode(mode)));
  ui.speed?.addEventListener('input', () => { state.params.speed = parseFloat(ui.speed.value); ui.speedVal.textContent = `${state.params.speed.toFixed(1)}x`; });
  ui.spawn?.addEventListener('input', () => { state.params.spawnRate = parseFloat(ui.spawn.value); ui.spawnVal.textContent = state.params.spawnRate.toFixed(2); });
  ui.agvSpeed?.addEventListener('input', () => { state.params.agvSpeed = parseFloat(ui.agvSpeed.value); ui.agvSpeedVal.textContent = String(state.params.agvSpeed); });
  ui.queueCap?.addEventListener('input', () => { state.params.queueCap = parseInt(ui.queueCap.value, 10); ui.queueCapVal.textContent = String(state.params.queueCap); });
  ui.toggleGrid?.addEventListener('click', () => { state.params.showGrid = !state.params.showGrid; ui.toggleGrid.textContent = `Grid: ${state.params.showGrid ? 'On' : 'Off'}`; });
  ui.toggleLabels?.addEventListener('click', () => { state.params.showLabels = !state.params.showLabels; ui.toggleLabels.textContent = `Labels: ${state.params.showLabels ? 'On' : 'Off'}`; });
  ui.toggleHeat?.addEventListener('click', () => { state.params.showHeat = !state.params.showHeat; ui.toggleHeat.textContent = `Heatmap: ${state.params.showHeat ? 'On' : 'Off'}`; });
  ui.toggleTrails?.addEventListener('click', () => { state.params.showTrails = !state.params.showTrails; ui.toggleTrails.textContent = `Trails: ${state.params.showTrails ? 'On' : 'Off'}`; });
  ui.playPause?.addEventListener('click', () => { state.world.playing = !state.world.playing; ui.playPause.textContent = state.world.playing ? '⏸ Pause' : '▶ Play'; });
  ui.step?.addEventListener('click', () => tick(1 / 30));
  ui.reset?.addEventListener('click', resetSim);
  ui.clearLayout?.addEventListener('click', () => { clearLayout(); logEvent('Layout cleared.'); });
  ui.loadDemo?.addEventListener('click', () => { loadDemoPlant(); logEvent('Demo plant loaded.'); });
  ui.addAGV?.addEventListener('click', () => { state.params.agvCount += 1; refreshAGVs(); logEvent('Added AGV.'); });
  ui.removeAGV?.addEventListener('click', () => { state.params.agvCount = Math.max(0, state.params.agvCount - 1); refreshAGVs(); logEvent('Removed AGV.'); });
  ui.zoomInBtn?.addEventListener('click', () => zoomAt(W() / 2, H() / 2, 1.15));
  ui.zoomOutBtn?.addEventListener('click', () => zoomAt(W() / 2, H() / 2, 0.87));
  ui.zoomResetBtn?.addEventListener('click', () => resetCamera());
  ui.focusBtn?.addEventListener('click', () => focusSelectedAsset());

  canvas.addEventListener('mousedown', (evt) => {
    if (evt.button === 1 || evt.button === 2 || state.world.mode === 'pan') {
      evt.preventDefault();
      camera.dragging = true;
      camera.lastX = evt.clientX;
      camera.lastY = evt.clientY;
      return;
    }

    const p = screenPoint(evt);
    const sp = { x: snap(p.x), y: snap(p.y) };

    if (state.world.mode === 'conveyor') {
      if (!state.world.tempConveyorStart) {
        state.world.tempConveyorStart = sp;
        logEvent('Conveyor start set. Click endpoint.');
      } else {
        addConveyor(state.world.tempConveyorStart, sp);
        state.world.tempConveyorStart = null;
        logEvent('Conveyor created.');
      }
      return;
    }
    if (state.world.mode === 'station') return void (addStation(sp.x, sp.y), logEvent('Station placed.'));
    if (state.world.mode === 'robot') return void (addRobot(sp.x, sp.y), logEvent('Robot cell placed.'));
    if (state.world.mode === 'dock') return void (addDock(sp.x, sp.y), logEvent('Dock placed.'));
    if (state.world.mode === 'agvSpawn') return void (addAGVSpawn(sp.x, sp.y), refreshAGVs(), logEvent('AGV spawn placed.'));

    const hit = hitTest(p);
    if (state.world.mode === 'delete') return void (hit && deleteAsset(hit));

    state.world.selected = hit;
    if (hit && hit.type !== 'conveyor') {
      state.world.dragging = { kind: 'move', obj: hit, dx: p.x - hit.x, dy: p.y - hit.y };
    } else if (hit?.type === 'conveyor') {
      state.world.dragging = { kind: 'moveConveyor', obj: hit, x: p.x, y: p.y };
    }
  });

  canvas.addEventListener('mousemove', (evt) => {
    if (camera.dragging) {
      const dx = (evt.clientX - camera.lastX) * DPR;
      const dy = (evt.clientY - camera.lastY) * DPR;
      camera.offsetX += dx;
      camera.offsetY += dy;
      camera.lastX = evt.clientX;
      camera.lastY = evt.clientY;
      return;
    }

    const p = screenPoint(evt);
    const d = state.world.dragging;
    if (!d) return;
    if (d.kind === 'move') {
      d.obj.x = snap(p.x - d.dx);
      d.obj.y = snap(p.y - d.dy);
    } else if (d.kind === 'moveConveyor') {
      const dx = snap(p.x) - snap(d.x);
      const dy = snap(p.y) - snap(d.y);
      d.obj.a.x += dx; d.obj.a.y += dy; d.obj.b.x += dx; d.obj.b.y += dy;
      d.x = p.x; d.y = p.y;
    }
  });

  canvas.addEventListener('wheel', (evt) => {
    evt.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const sx = (evt.clientX - rect.left) * DPR;
    const sy = (evt.clientY - rect.top) * DPR;
    zoomAt(sx, sy, evt.deltaY < 0 ? 1.12 : 0.89);
  }, { passive: false });

  canvas.addEventListener('mouseup', () => {
    camera.dragging = false;
    state.world.dragging = null;
  });
  canvas.addEventListener('mouseleave', () => {
    camera.dragging = false;
    state.world.dragging = null;
  });
  canvas.addEventListener('contextmenu', (evt) => evt.preventDefault());

  window.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName;
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

  if (typing) return;

  if (e.key === ' ') {
    e.preventDefault();
    ui.playPause?.click();
    return;
  }

  if (e.key === '1') return setMode('select');
  if (e.key === '2') return setMode('pan');
  if (e.key === '3') return setMode('conveyor');
  if (e.key === '4') return setMode('station');
  if (e.key === '5') return setMode('robot');
  if (e.key === '6') return setMode('dock');
  if (e.key === '7') return setMode('agvSpawn');
  if (e.key === '8') return setMode('delete');

  if (e.key.toLowerCase() === 'r') return resetSim();
  if (e.key.toLowerCase() === 'g') return ui.toggleGrid?.click();
  if (e.key.toLowerCase() === 'l') return ui.toggleLabels?.click();

  if (e.key === '+' || e.key === '=') return zoomAt(W() / 2, H() / 2, 1.15);
  if (e.key === '-') return zoomAt(W() / 2, H() / 2, 0.87);
  if (e.key === '0') return resetCamera();
  if (e.key.toLowerCase() === 'f') return focusSelectedAsset();
});
  loadDemoPlant();
  setMode('select');
  ui.speed?.dispatchEvent(new Event('input'));
  ui.spawn?.dispatchEvent(new Event('input'));
  ui.agvSpeed?.dispatchEvent(new Event('input'));
  ui.queueCap?.dispatchEvent(new Event('input'));
  loop();

  window.TecnomatixAgvBuilder = {
    state,
    camera,
    loadDemoPlant,
    clearLayout,
    resetSim,
    resetCamera,
    focusSelectedAsset,
    setMode,
    exportLayout() {
      return JSON.stringify({
        conveyors: state.world.conveyors,
        robots: state.world.robots,
        stations: state.world.stations,
        docks: state.world.docks,
        agvSpawns: state.world.agvSpawns,
      }, null, 2);
    },
  };
})();
