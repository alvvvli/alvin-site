/* global React */
const { useMemo, useState } = React;

/**
 * ATC Hub Scheduler — 3D Segways Edition (browser build)
 * - No ESM imports/exports
 * - NaN-safe inputs, zero-wave guards, robust time parsing
 * - Inline CSS fallbacks for critical layout (works even if Tailwind CDN fails)
 */

/***** UTILITIES *****/
const toMin = (h, m = 0) => h * 60 + m;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const safeN = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const pad2 = (n) => String(n).padStart(2, "0");
const fmtHMM = (mins) => {
  const M = ((safeN(mins) % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(M / 60);
  const mm = pad2(Math.floor(M % 60));
  return `${pad2(h)}:${mm}`; // required by <input type="time">
};

/***** DEFAULTS *****/
const DEFAULTS = {
  seats: 128,
  capSeats: 100, // 80% LF cap
  layoverH: 45,  // hub layover (min)
  turnSpoke: 30, // spoke turn (min)
  miles: { E: 500, W: 1000 },
  alphaHr: 0.5,
  betaHrPerMile: 0.0015,
  ownPerAircraftPerDay: (33000000 * 0.1) / (1 - Math.pow(1 + 0.1, -20)) / 300,
  blockCostPerBH: 5500,
  servicePerSeatDeparture: 10,
  votTravel: 30,
  votSched: 70,
  altLayers: [290, 310, 330, 350, 370], // x100 ft flight levels
  verticalSepFt: 1000,
  sepMin: 3, // min same-corridor same-FL separation
};

// Demand (pax/day each direction)
const DEMAND = { HE: 120, HW: 120, EW: 40, EE: 20, WW: 20 };

// 48×30min preference curve
const PREF_48 = (() => {
  const bins = 48;
  const arr = Array.from({ length: bins }, (_, i) => {
    const x = (i / bins) * 2 * Math.PI;
    const base = 0.4 + 0.6 * Math.max(0, Math.sin(x));
    const am = Math.exp(-Math.pow((i - 16) / 4, 2));
    const pm = Math.exp(-Math.pow((i - 34) / 4, 2));
    return base + 0.8 * (am + pm);
  });
  const s = arr.reduce((a, b) => a + b, 0) || 1;
  return arr.map((v) => v / s);
})();

/***** CORE ENGINE *****/
function blockMins(miles, alphaHr, betaHrPerMile) {
  return Math.max(1, Math.round((safeN(alphaHr) + safeN(betaHrPerMile) * safeN(miles)) * 60));
}

function makeWaves({ waves, firstArriveH, spacingMin }) {
  const W = Math.max(0, Math.floor(safeN(waves)));
  const S = Math.max(1, Math.floor(safeN(spacingMin, 1)));
  const F = Math.max(0, Math.floor(safeN(firstArriveH)));
  return Array.from({ length: W }, (_, k) => F + k * S);
}

function mkFlightsFromWaves({ arrHmins, miles, layoverH, alphaHr, betaHrPerMile }) {
  const legs = { E: [], W: [] };
  for (const S of ["E", "W"]) {
    const bh = blockMins(safeN(miles[S]), alphaHr, betaHrPerMile);
    arrHmins.forEach((arrH, idx) => {
      const depS = arrH - bh;         // S->H
      const depH = arrH + safeN(layoverH); // H->S
      const arrS = depH + bh;         // back to S
      legs[S].push({ id: `${S}${idx + 1}`, S, depS, arrH, depH, arrS, BHmin: bh });
    });
  }
  return legs;
}

function capacityCheck({ waves, capSeats, demandDir }) {
  const cap = Math.max(0, Math.floor(safeN(waves)) * Math.max(0, Math.floor(safeN(capSeats))));
  const need = Math.max(0, Math.floor(safeN(demandDir)));
  return { ok: cap >= need, need, cap, flightsNeeded: capSeats ? Math.ceil(need / capSeats) : 0 };
}

function assignByQuantile(loadPerFlight, pref48) {
  const total = pref48.reduce((a, b) => a + b, 0) || 1;
  const cdf = pref48.reduce((a, p) => {
    a.push((a.length ? a[a.length - 1] : 0) + p / total);
    return a;
  }, []);
  const qcuts = [];
  let acc = 0;
  const step = Math.max(1e-9, loadPerFlight);
  while (acc < 1 - 1e-9) {
    qcuts.push(Math.min(acc + step, 1));
    acc += step;
  }
  const binCenters = pref48.map((_, i) => i * 30 + 15);
  const assignedIdx = cdf.map((c) => Math.max(0, qcuts.findIndex((q) => c <= q)));
  return { binCenters, assignedIdx };
}

function scheduleDelayForUniformWaves({ waves, firstDepMin, spacingMin, pref48 }) {
  const W = Math.max(0, Math.floor(safeN(waves)));
  if (W === 0) return 0;
  const S = Math.max(1, Math.floor(safeN(spacingMin, 1)));
  const F = Math.max(0, Math.floor(safeN(firstDepMin)));
  const depTimes = Array.from({ length: W }, (_, k) => F + k * S);
  const { binCenters, assignedIdx } = assignByQuantile(1 / W, pref48);
  let delayMin = 0;
  let denom = pref48.reduce((a, b) => a + b, 0) || 1;
  for (let i = 0; i < pref48.length; i++) {
    const w = pref48[i];
    const dep = depTimes[assignedIdx[i] % depTimes.length];
    const pref = binCenters[i];
    const raw = ((dep - pref) % (24 * 60) + 24 * 60) % (24 * 60);
    const diff = Math.min(Math.abs(raw), 24 * 60 - Math.abs(raw));
    delayMin += w * diff;
  }
  return delayMin / denom;
}

/***** 3D AIRSPACE ENGINE *****/
function planAltitudes({ legs, altLayers, sepMin }) {
  const flights = [];
  for (const S of ["E", "W"]) {
    (legs[S] || []).forEach((l) => {
      flights.push({ key: `${l.id}-HS`, corridor: S, dir: "HS", start: l.depH, end: l.depH + l.BHmin });
      flights.push({ key: `${l.id}-SH`, corridor: S, dir: "SH", start: l.depS, end: l.arrH });
    });
  }
  flights.sort((a, b) => a.start - b.start);
  const layerUse = {}; // corridor -> layer index -> last end
  const assigned = [];
  const layers = (altLayers || []).slice();
  const sep = Math.max(0, Math.floor(safeN(sepMin)));
  for (const f of flights) {
    const corr = f.corridor;
    if (!layerUse[corr]) layerUse[corr] = layers.map(() => -Infinity);
    let placed = false;
    let layerIdx = 0;
    for (; layerIdx < layers.length; layerIdx++) {
      const lastEnd = layerUse[corr][layerIdx];
      if (f.start - lastEnd >= sep) {
        layerUse[corr][layerIdx] = f.end;
        placed = true;
        break;
      }
    }
    assigned.push({ ...f, layerIdx, placed });
  }
  const conflicts = assigned.filter((a) => !a.placed);
  return { assigned, conflicts };
}

/***** APP *****/
function App() {
  // state (NaN-safe setters)
  const [waves, setWaves] = useState(4);
  const [firstArriveH, setFirstArriveH] = useState(toMin(7, 30));
  const [spacing, setSpacing] = useState(180);

  const [mE, setME] = useState(DEFAULTS.miles.E);
  const [mW, setMW] = useState(DEFAULTS.miles.W);

  const [alpha, setAlpha] = useState(DEFAULTS.alphaHr);
  const [beta, setBeta] = useState(DEFAULTS.betaHrPerMile);

  const [fleetE, setFleetE] = useState(1);
  const [fleetW, setFleetW] = useState(1);

  const [ownCost, setOwnCost] = useState(DEFAULTS.ownPerAircraftPerDay);
  const [bhCost, setBhCost] = useState(DEFAULTS.blockCostPerBH);
  const [svcSeat, setSvcSeat] = useState(DEFAULTS.servicePerSeatDeparture);
  const [votT, setVotT] = useState(DEFAULTS.votTravel);
  const [votS, setVotS] = useState(DEFAULTS.votSched);

  const [altLayers, setAltLayers] = useState(DEFAULTS.altLayers);
  const [sepMin, setSepMin] = useState(DEFAULTS.sepMin);

  const arrH = useMemo(
    () => makeWaves({ waves, firstArriveH, spacingMin: spacing }),
    [waves, firstArriveH, spacing]
  );

  const legs = useMemo(
    () =>
      mkFlightsFromWaves({
        arrHmins: arrH,
        miles: { E: mE, W: mW },
        layoverH: DEFAULTS.layoverH,
        alphaHr: alpha,
        betaHrPerMile: beta,
      }),
    [arrH, mE, mW, alpha, beta]
  );

  const bhE = blockMins(mE, alpha, beta);
  const bhW = blockMins(mW, alpha, beta);

  // capacity
  const capHE = capacityCheck({ waves, capSeats: DEFAULTS.capSeats, demandDir: DEMAND.HE });
  const capHW = capacityCheck({ waves, capSeats: DEFAULTS.capSeats, demandDir: DEMAND.HW });

  // schedule delay
  const firstOutH = (arrH[0] ?? 0) + DEFAULTS.layoverH;
  const schedDelayMin = scheduleDelayForUniformWaves({
    waves,
    firstDepMin: firstOutH,
    spacingMin: spacing,
    pref48: PREF_48,
  });

  // travel time aggregation
  const trips = [
    { name: "H↔E", pax: DEMAND.HE * 2, timeMin: bhE },
    { name: "H↔W", pax: DEMAND.HW * 2, timeMin: bhW },
    { name: "E↔W", pax: DEMAND.EW * 2, timeMin: bhE + DEFAULTS.layoverH + bhW },
    { name: "E↔E", pax: DEMAND.EE * 2, timeMin: bhE + DEFAULTS.layoverH + bhE },
    { name: "W↔W", pax: DEMAND.WW * 2, timeMin: bhW + DEFAULTS.layoverH + bhW },
  ];
  const totalPax = trips.reduce((a, t) => a + t.pax, 0) || 1;
  const avgTravelMin = trips.reduce((a, t) => a + t.pax * t.timeMin, 0) / totalPax;

  // costs
  const dailyAircraft = Math.max(0, Math.floor(fleetE + fleetW));
  const OWN = dailyAircraft * safeN(ownCost);
  const BHhrs = ((bhE + bhW) * Math.max(0, Math.floor(waves)) * 2) / 60;
  const BLK = BHhrs * safeN(bhCost);
  const seatsDepartures = Math.max(0, Math.floor(waves)) * 2 * DEFAULTS.seats;
  const SVC = seatsDepartures * safeN(svcSeat);
  const TravT = (avgTravelMin / 60) * totalPax * safeN(votT);
  const SchD = (schedDelayMin / 60) * totalPax * safeN(votS);
  const TLC = OWN + BLK + SVC + TravT + SchD;

  // 3D altitudes
  const plan = useMemo(() => planAltitudes({ legs, altLayers, sepMin }), [legs, altLayers, sepMin]);
  const conflicts = plan.conflicts.length;

  // altitude text for input
  const altString = (altLayers || []).map((fl) => `FL${fl}`).join(", ");

  // Fallback style for grid-cols-24 if Tailwind fails
  const col24 = { display: "grid", gridTemplateColumns: "repeat(24, minmax(0, 1fr))", gap: "6px" };

  return (
    <div className="min-h-screen" style={{ background: "#0b0f14", color: "#e6eef9" }}>
      {/* Inline CSS for the 3D viewer */}
      <style>{`
        .airspace { perspective: 900px; height: 340px; position: relative; overflow:hidden; border-radius: 16px; }
        .layer { position:absolute; left:0; right:0; top:0; bottom:0; transform-style: preserve-3d;}
        .slab { position:absolute; left:5%; right:5%; top:10%; bottom:10%; border:1px solid rgba(255,255,255,.08); border-radius:12px; background:rgba(255,255,255,.02); }
        .slab::after{ content:''; position:absolute; inset:0; border:1px dashed rgba(255,255,255,.06); border-radius:12px; }
        .slabLabel{ position:absolute; left:8px; top:8px; font-size:12px; opacity:.7 }
        .pin{ position:absolute; width:10px; height:10px; border-radius:50%; background:#60a5fa; box-shadow:0 0 10px rgba(96,165,250,.8);} 
        .pin.W{ background:#22c55e; box-shadow:0 0 10px rgba(34,197,94,.8);} 
        .pin.bad{ background:#ef4444; box-shadow:0 0 12px rgba(239,68,68,.9);} 
        .legendDot{ display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:6px; }
        .card { background:#0f172a; border-radius:16px; box-shadow: 0 6px 24px rgba(0,0,0,.25); }
        .chip { background:#0b1219; border:1px solid #1f2a44; border-radius:10px; padding:.5rem .75rem; }
        input, button { color:inherit; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl md:text-3xl" style={{ fontWeight: 600 }}>ATC Hub Scheduler — 3D Segways Edition</h1>
          <div className="text-sm" style={{ opacity: .8 }}>WEX Lab · v2.2</div>
        </header>

        <div className="grid lg:grid-cols-3 gap-4">
          <section className="card p-4 lg:col-span-2">
            <h2 className="text-lg" style={{ fontWeight: 500, marginBottom: ".75rem" }}>Waves, Network & Airspace</h2>

            {/* Controls */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>Waves / day</span>
                <input type="range" min={0} max={12} value={waves}
                  onChange={(e)=>setWaves(clamp(Math.floor(safeN(e.target.value,4)),0,12))} />
                <div className="text-xs">{waves}</div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>First hub arrival</span>
                <input
                  type="time"
                  value={fmtHMM(firstArriveH)}
                  onChange={(e)=>{
                    const parts = String(e.target.value||"07:30").split(":");
                    const h = clamp(Math.floor(safeN(parts[0],7)),0,23);
                    const m = clamp(Math.floor(safeN(parts[1],30)),0,59);
                    setFirstArriveH(h*60+m);
                  }}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>Spacing (min)</span>
                <input type="number" className="chip" value={spacing}
                  onChange={(e)=>setSpacing(clamp(Math.floor(safeN(e.target.value,180)),1,1440))} />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>Miles to E</span>
                <input type="number" className="chip" value={mE}
                  onChange={(e)=>setME(clamp(Math.floor(safeN(e.target.value,DEFAULTS.miles.E)),50,4000))} />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>Miles to W</span>
                <input type="number" className="chip" value={mW}
                  onChange={(e)=>setMW(clamp(Math.floor(safeN(e.target.value,DEFAULTS.miles.W)),50,4000))} />
              </label>

              <div className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>Block time model (hrs)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="0.01" className="chip" value={alpha}
                    onChange={(e)=>setAlpha(clamp(safeN(e.target.value,DEFAULTS.alphaHr),0,5))} />
                  <input type="number" step="0.0001" className="chip" value={beta}
                    onChange={(e)=>setBeta(clamp(safeN(e.target.value,DEFAULTS.betaHrPerMile),0,0.01))} />
                </div>
                <div className="text-xs" style={{ opacity: .7 }}>BH = α + β·miles</div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>Altitude layers</span>
                <input
                  type="text"
                  className="chip"
                  value={altString}
                  onChange={(e)=>{
                    const vals = String(e.target.value||"")
                      .replace(/FL/gi,'')
                      .split(',')
                      .map(v=>parseInt(String(v).trim(),10))
                      .filter(v=>Number.isFinite(v));
                    if (vals.length) setAltLayers(vals);
                  }}
                />
                <div className="text-xs" style={{ opacity: .7 }}>Comma list, e.g., FL290, FL310, FL330</div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>Same-alt sep (min)</span>
                <input type="number" className="chip" value={sepMin}
                  onChange={(e)=>setSepMin(clamp(Math.floor(safeN(e.target.value,DEFAULTS.sepMin)),0,60))} />
              </label>
            </div>

            {/* Block time quick stats */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: "#0b1219" }}>
                <div className="text-sm" style={{ opacity: .8, marginBottom: ".25rem" }}>E spoke block</div>
                <div className="text-xl">{Math.round(blockMins(mE, alpha, beta))} min</div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "#0b1219" }}>
                <div className="text-sm" style={{ opacity: .8, marginBottom: ".25rem" }}>W spoke block</div>
                <div className="text-xl">{Math.round(blockMins(mW, alpha, beta))} min</div>
              </div>
            </div>

            {/* 3D viewer */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm" style={{ opacity: .8 }}>3D Airspace (hover pins)</div>
                <div className="text-xs" style={{ opacity: .7 }}>
                  <span className="legendDot" style={{background:'#60a5fa'}}/> H↔E
                  <span className="legendDot" style={{background:'#22c55e', marginLeft: "1rem"}}/> H↔W
                  <span className="legendDot" style={{background:'#ef4444', marginLeft: "1rem"}}/> conflict
                </div>
              </div>

              <div className="airspace" style={{ borderRadius: "16px", background: "#0b1219" }}>
                {altLayers.map((fl, idx) => {
                  const depth = idx * 40; // px translateZ
                  const tilt = -12;       // deg
                  return (
                    <div key={fl} className="layer" style={{ transform:`translateZ(${depth}px) rotateX(${tilt}deg)` }}>
                      <div className="slab">
                        <div className="slabLabel">FL{fl}</div>
                        {plan.assigned.filter(a=>a.layerIdx===idx).map(f=>{
                          const tMid = (f.start + f.end) / 2;
                          const x = ((tMid % (24*60))/(24*60))*90 + 5; // 5–95%
                          const y = f.corridor==='E'? 30 : 65;
                          const cls = `pin ${f.corridor==='W'?'W':''} ${f.placed?'':'bad'}`;
                          return <div key={f.key} className={cls}
                            title={`${f.key} • ${fmtHMM(f.start)}–${fmtHMM(f.end)} • FL${fl}`}
                            style={{ left:`${x}%`, top:`${y}%`}}/>;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs" style={{ opacity: .7, marginTop: ".25rem" }}>
                Pins = leg cruise windows on assigned FLs. Nearer slab = lower FL.
              </div>
            </div>
          </section>

          {/* Right panel */}
          <section className="card p-4">
            <h2 className="text-lg" style={{ fontWeight: 500, marginBottom: ".75rem" }}>Fleet & Costs</h2>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>A/C at E</span>
                <input type="number" min={0} max={8} className="chip" value={fleetE}
                  onChange={(e)=>setFleetE(clamp(Math.floor(safeN(e.target.value,1)),0,8))} />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>A/C at W</span>
                <input type="number" min={0} max={8} className="chip" value={fleetW}
                  onChange={(e)=>setFleetW(clamp(Math.floor(safeN(e.target.value,1)),0,8))} />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>Ownership $/AC/day</span>
                <input type="number" className="chip" value={Math.round(ownCost)}
                  onChange={(e)=>setOwnCost(Math.max(0, safeN(e.target.value, DEFAULTS.ownPerAircraftPerDay)))} />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>Block $/BH</span>
                <input type="number" className="chip" value={bhCost}
                  onChange={(e)=>setBhCost(Math.max(0, safeN(e.target.value, DEFAULTS.blockCostPerBH)))} />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>Service $/seat-dep</span>
                <input type="number" className="chip" value={svcSeat}
                  onChange={(e)=>setSvcSeat(Math.max(0, safeN(e.target.value, DEFAULTS.servicePerSeatDeparture)))} />
              </label>

              <div className="flex flex-col gap-1">
                <span className="text-sm" style={{ opacity: .8 }}>Value-of-time $/hr</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" className="chip" value={votT}
                    onChange={(e)=>setVotT(Math.max(0, safeN(e.target.value, DEFAULTS.votTravel)))} />
                  <input type="number" className="chip" value={votS}
                    onChange={(e)=>setVotS(Math.max(0, safeN(e.target.value, DEFAULTS.votSched)))} />
                </div>
                <div className="text-xs" style={{ opacity: .7 }}>Travel / SchedDelay</div>
              </div>
            </div>

            {/* Metrics */}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Capacity H↔E</span><span>{capHE.cap}/{capHE.need} {capHE.ok?"OK":"Add"}</span></div>
              <div className="flex justify-between"><span>Capacity H↔W</span><span>{capHW.cap}/{capHW.need} {capHW.ok?"OK":"Add"}</span></div>
              <div className="flex justify-between">
                <span>Conflicts (3D)</span>
                <span style={{ color: conflicts ? "#ef4444" : "#16a34a" }}>{conflicts ? `${conflicts} flagged` : "None"}</span>
              </div>
              <hr style={{ borderColor: "#1f2a44", margin: ".5rem 0" }}/>
              <div className="flex justify-between"><span>Ownership</span><span>${Math.round(OWN).toLocaleString("en-US")}</span></div>
              <div className="flex justify-between"><span>Block (BH={BHhrs.toFixed(1)}h)</span><span>${Math.round(BLK).toLocaleString("en-US")}</span></div>
              <div className="flex justify-between"><span>Servicing</span><span>${Math.round(SVC).toLocaleString("en-US")}</span></div>
              <div className="flex justify-between"><span>Travel time (avg {(avgTravelMin/60).toFixed(2)}h)</span><span>${Math.round(TravT).toLocaleString("en-US")}</span></div>
              <div className="flex justify-between"><span>Schedule delay (avg {(schedDelayMin/60).toFixed(2)}h)</span><span>${Math.round(SchD).toLocaleString("en-US")}</span></div>
              <hr style={{ borderColor: "#1f2a44", margin: ".5rem 0" }}/>
              <div className="flex justify-between" style={{ fontWeight: 600 }}><span>Total Logistics Cost</span><span>${Math.round(TLC).toLocaleString("en-US")}</span></div>
            </div>

            <div className="mt-3 text-xs" style={{ opacity: .7, lineHeight: 1.5 }}>
              <p>Tip: tighter spacing reduces schedule delay but can raise same-layer conflicts. Add layers or widen banks to deconflict.</p>
            </div>
          </section>
        </div>

        <footer className="mt-6 text-xs" style={{ opacity: .7 }}>
          <p>Training abstraction: discrete FL layers and cruise-window pins. Extend with runway queues, SIDs/STARs, or weather penalties.</p>
        </footer>
      </div>
    </div>
  );
}

window.App = App;
