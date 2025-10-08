const { useMemo, useState } = React;

/**
 * ATC Hub Scheduler — 3D Segways Edition (Horizontal + Vertical)
 * --------------------------------------------------------------
 * Flight routing + ATC scheduling with a 3D airspace model.
 *
 * New concepts
 * - Horizontal corridors: H↔E and H↔W (great-circle simplification)
 * - Vertical segways: discrete altitude layers (FL290/310/330/350/370)
 * - Separation: ≥ SEP_MIN minutes on same corridor & altitude; vertical sep via different FLs
 * - Greedy altitude assignment; unresolved legs flagged as conflicts
 * - 3D viewer: CSS-perspective slabs with flight pins
 *
 * CE260 rules kept: banked hub schedule (45-min hub layover), 30-min spoke turns,
 * LF≤80%, goal = minimize Total Logistics Cost (TLC).
 */

/***** UTILITIES *****/
const toMin = (h, m = 0) => h * 60 + m;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad2 = (n) => String(n).padStart(2, "0");
const fmtHMM = (mins) => {
  const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const mm = pad2(Math.floor(m % 60));
  return `${pad2(h)}:${mm}`; // HTML time input requires 2-digit hours
};

/***** DEFAULTS *****/
const DEFAULTS = {
  seats: 128,
  capSeats: 100, // 80% LF cap
  layoverH: 45, // min (hub)
  turnSpoke: 30, // min (spoke)
  miles: { E: 500, W: 1000 },
  // Block-hours regression: BHrs = α + β·miles
  alphaHr: 0.5,
  betaHrPerMile: 0.0015,
  // Cost knobs
  ownPerAircraftPerDay: 33000000 * 0.1 / (1 - Math.pow(1 + 0.1, -20)) / 300,
  blockCostPerBH: 5500,
  servicePerSeatDeparture: 10,
  votTravel: 30,
  votSched: 70,
  // 3D airspace
  altLayers: [290, 310, 330, 350, 370], // flight levels (x100 ft)
  verticalSepFt: 1000,
  sepMin: 3, // minutes minimal same-alt same-corridor separation
};

// Demand matrix (pax/day each direction)
const DEMAND = { HE: 120, HW: 120, EW: 40, EE: 20, WW: 20 };

// Preference curve: 48 bins @ 30 min
const PREF_48 = (() => {
  const bins = 48;
  const arr = Array.from({ length: bins }, (_, i) => {
    const x = (i / bins) * 2 * Math.PI;
    const base = 0.4 + 0.6 * Math.max(0, Math.sin(x));
    const amRush = Math.exp(-Math.pow((i - 16) / 4, 2));
    const pmRush = Math.exp(-Math.pow((i - 34) / 4, 2));
    return base + 0.8 * (amRush + pmRush);
  });
  const sum = arr.reduce((a, b) => a + b, 0);
  return arr.map((v) => v / sum);
})();

/***** CORE ENGINE *****/
function blockMins(miles, alphaHr, betaHrPerMile) {
  return Math.round((alphaHr + betaHrPerMile * miles) * 60);
}

function makeWaves({ waves, firstArriveH, spacingMin }) {
  return Array.from({ length: waves }, (_, k) => firstArriveH + k * spacingMin);
}

function mkFlightsFromWaves({ arrHmins, miles, layoverH, alphaHr, betaHrPerMile }) {
  // ✅ FIX: use current α/β (was mistakenly locked to DEFAULTS)
  const legs = { E: [], W: [] };
  for (const S of ["E", "W"]) {
    const bh = blockMins(miles[S], alphaHr, betaHrPerMile);
    arrHmins.forEach((arrH, idx) => {
      const depS = arrH - bh; // S->H
      const depH = arrH + layoverH; // H->S
      const arrS = depH + bh; // back to S
      legs[S].push({ id: `${S}${idx + 1}`, S, depS, arrH, depH, arrS, BHmin: bh });
    });
  }
  return legs;
}

function capacityCheck({ waves, capSeats, demandDir }) {
  const need = demandDir;
  const cap = waves * capSeats;
  return { ok: cap >= need, need, cap, flightsNeeded: Math.ceil(need / capSeats) };
}

function assignByQuantile(loadPerFlight, pref48) {
  const total = pref48.reduce((a, b) => a + b, 0);
  const cdf = pref48.reduce((a, p) => {
    const last = a.length ? a[a.length - 1] : 0;
    a.push(last + p / total);
    return a;
  }, []);
  const qcuts = [];
  let acc = 0;
  while (acc < 1 - 1e-9) {
    qcuts.push(Math.min(acc + loadPerFlight, 1));
    acc += loadPerFlight;
  }
  const binCenters = pref48.map((_, i) => i * 30 + 15);
  const assignedIdx = cdf.map((c) => qcuts.findIndex((q) => c <= q));
  return { binCenters, assignedIdx };
}

function scheduleDelayForUniformWaves({ waves, firstDepMin, spacingMin, pref48 }) {
  if (waves === 0) return 0;
  const depTimes = Array.from({ length: waves }, (_, k) => firstDepMin + k * spacingMin);
  const loadPerFlight = 1 / waves;
  const { binCenters, assignedIdx } = assignByQuantile(loadPerFlight, pref48);
  let delayMin = 0;
  for (let i = 0; i < pref48.length; i++) {
    const w = pref48[i];
    const dep = depTimes[assignedIdx[i]];
    const pref = binCenters[i];
    const raw = ((dep - pref) % (24 * 60) + 24 * 60) % (24 * 60);
    const diff = Math.min(Math.abs(raw), 24 * 60 - Math.abs(raw));
    delayMin += w * diff;
  }
  return delayMin / pref48.reduce((a, b) => a + b, 0);
}

/***** 3D AIRSPACE ENGINE *****/
function planAltitudes({ legs, altLayers, sepMin }) {
  const flights = [];
  for (const S of ["E", "W"]) {
    legs[S].forEach((l) => {
      flights.push({ key: `${l.id}-HS`, corridor: S, dir: "HS", start: l.depH, end: l.depH + l.BHmin });
      flights.push({ key: `${l.id}-SH`, corridor: S, dir: "SH", start: l.depS, end: l.arrH });
    });
  }
  flights.sort((a, b) => a.start - b.start);
  const layerUse = {}; // corridor -> layer index -> last end
  const assigned = [];
  for (const f of flights) {
    const corr = f.corridor;
    if (!layerUse[corr]) layerUse[corr] = altLayers.map(() => -Infinity);
    let placed = false;
    let layerIdx = 0;
    for (; layerIdx < altLayers.length; layerIdx++) {
      const lastEnd = layerUse[corr][layerIdx];
      if (f.start - lastEnd >= sepMin) {
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

/***** REACT APP *****/
export default function App() {
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

  const arrH = useMemo(() => makeWaves({ waves, firstArriveH, spacingMin: spacing }), [waves, firstArriveH, spacing]);

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

  // Capacity checks
  const capHE = capacityCheck({ waves, capSeats: DEFAULTS.capSeats, demandDir: DEMAND.HE });
  const capHW = capacityCheck({ waves, capSeats: DEFAULTS.capSeats, demandDir: DEMAND.HW });

  // Schedule delay
  const firstOutH = arrH[0] + DEFAULTS.layoverH;
  const schedDelayMin = scheduleDelayForUniformWaves({ waves, firstDepMin: firstOutH, spacingMin: spacing, pref48: PREF_48 });

  // Travel time aggregation (simple weighted)
  const trips = [
    { name: "H↔E", pax: DEMAND.HE * 2, timeMin: bhE },
    { name: "H↔W", pax: DEMAND.HW * 2, timeMin: bhW },
    { name: "E↔W", pax: DEMAND.EW * 2, timeMin: bhE + DEFAULTS.layoverH + bhW },
    { name: "E↔E", pax: DEMAND.EE * 2, timeMin: bhE + DEFAULTS.layoverH + bhE },
    { name: "W↔W", pax: DEMAND.WW * 2, timeMin: bhW + DEFAULTS.layoverH + bhW },
  ];
  const totalPax = trips.reduce((a, t) => a + t.pax, 0);
  const avgTravelMin = trips.reduce((a, t) => a + t.pax * t.timeMin, 0) / totalPax;

  // Costs
  const dailyAircraft = fleetE + fleetW;
  const OWN = dailyAircraft * ownCost;
  const BHhrs = ((bhE + bhW) * waves * 2) / 60;
  const BLK = BHhrs * bhCost;
  const seatsDepartures = waves * 2 * DEFAULTS.seats;
  const SVC = seatsDepartures * svcSeat;
  const TravT = (avgTravelMin / 60) * totalPax;
  const SchD = (schedDelayMin / 60) * totalPax;
  const TLC = OWN + BLK + SVC + votT * TravT + votS * SchD;

  // 3D altitude planner
  const plan = useMemo(() => planAltitudes({ legs, altLayers, sepMin }), [legs, altLayers, sepMin]);
  const conflicts = plan.conflicts.length;

  const altString = altLayers.map((fl) => `FL${fl}`).join(", ");

  return (
    <div className="min-h-screen bg-[#0b0f14] text-[#e6eef9]">
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
      `}</style>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl md:text-3xl font-semibold">ATC Hub Scheduler — 3D Segways Edition</h1>
          <div className="text-sm opacity-80">WEX Lab · v2.1</div>
        </header>

        <div className="grid lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 p-4 rounded-2xl bg-[#0f172a] shadow">
            <h2 className="text-lg font-medium mb-3">Waves, Network & Airspace</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1"><span className="text-sm opacity-80">Waves / day</span>
                <input type="range" min={1} max={12} value={waves} onChange={(e)=>setWaves(+e.target.value)} />
                <div className="text-xs">{waves}</div>
              </label>
              <label className="flex flex-col gap-1"><span className="text-sm opacity-80">First hub arrival</span>
                <input type="time" value={fmtHMM(firstArriveH)} onChange={(e)=>{const [h,m]=e.target.value.split(":").map(Number); setFirstArriveH(h*60+m);}} />
              </label>
              <label className="flex flex-col gap-1"><span className="text-sm opacity-80">Spacing (min)</span>
                <input type="number" className="bg-[#0b1219] rounded p-2" value={spacing} onChange={(e)=>setSpacing(+e.target.value)} />
              </label>
              <label className="flex flex-col gap-1"><span className="text-sm opacity-80">Miles to E</span>
                <input type="number" className="bg-[#0b1219] rounded p-2" value={mE} onChange={(e)=>setME(+e.target.value)} />
              </label>
              <label className="flex flex-col gap-1"><span className="text-sm opacity-80">Miles to W</span>
                <input type="number" className="bg-[#0b1219] rounded p-2" value={mW} onChange={(e)=>setMW(+e.target.value)} />
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-sm opacity-80">Block time model (hrs)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="0.01" className="bg-[#0b1219] rounded p-2" value={alpha} onChange={(e)=>setAlpha(+e.target.value)} />
                  <input type="number" step="0.0001" className="bg-[#0b1219] rounded p-2" value={beta} onChange={(e)=>setBeta(+e.target.value)} />
                </div>
                <div className="text-xs opacity-70">BH = α + β·miles</div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm opacity-80">Altitude layers</span>
                <input type="text" className="bg-[#0b1219] rounded p-2" value={altString} onChange={(e)=>{
                  const vals=e.target.value.replace(/FL/gi,'').split(',').map(v=>parseInt(v.trim(),10)).filter(v=>!isNaN(v));
                  if(vals.length>0) setAltLayers(vals);
                }} />
                <div className="text-xs opacity-70">Comma list, e.g., FL290, FL310, FL330</div>
              </div>
              <label className="flex flex-col gap-1"><span className="text-sm opacity-80">Same-alt sep (min)</span>
                <input type="number" className="bg-[#0b1219] rounded p-2" value={sepMin} onChange={(e)=>setSepMin(clamp(+e.target.value,0,30))} />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#0b1219]"><div className="text-sm opacity-80 mb-1">E spoke block</div><div className="text-xl">{Math.round(blockMins(mE, alpha, beta))} min</div></div>
              <div className="p-3 rounded-xl bg-[#0b1219]"><div className="text-sm opacity-80 mb-1">W spoke block</div><div className="text-xl">{Math.round(blockMins(mW, alpha, beta))} min</div></div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm opacity-80">3D Airspace (hover dots for flight & layer)</div>
                <div className="text-xs opacity-70">
                  <span className="legendDot" style={{background:'#60a5fa'}}/> H↔E
                  <span className="ml-4 legendDot" style={{background:'#22c55e'}}/> H↔W
                  <span className="ml-4 legendDot" style={{background:'#ef4444'}}/> conflict
                </div>
              </div>
              <div className="airspace rounded-2xl bg-[#0b1219]">
                {altLayers.map((fl, idx)=>{
                  const depth = idx*40; // px translateZ
                  const tilt = -12; // deg
                  return (
                    <div key={fl} className="layer" style={{ transform:`translateZ(${depth}px) rotateX(${tilt}deg)` }}>
                      <div className="slab">
                        <div className="slabLabel">FL{fl}</div>
                        {plan.assigned.filter(a=>a.layerIdx===idx).map(f=>{
                          const tMid = (f.start+f.end)/2; // pin by time
                          const x = ((tMid % (24*60))/(24*60))*90 + 5; // 5-95%
                          const y = f.corridor==='E'? 30 : 65; // E higher, W lower
                          const cls = `pin ${f.corridor==='W'?'W':''} ${f.placed?'':'bad'}`;
                          return <div key={f.key} className={cls} title={`${f.key} • ${fmtHMM(f.start)}–${fmtHMM(f.end)} • FL${fl}`} style={{ left:`${x}%`, top:`${y}%`}}/>;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs opacity-70 mt-1">Pins represent leg cruise windows on assigned FLs. Layers stack in perspective (near = lower FL).</div>
            </div>
          </section>

          <section className="p-4 rounded-2xl bg-[#0f172a] shadow">
            <h2 className="text-lg font-medium mb-3">Fleet & Costs</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1"><span className="text-sm opacity-80">A/C at E</span>
                <input type="number" min={1} max={4} className="bg-[#0b1219] rounded p-2" value={fleetE} onChange={(e)=>setFleetE(+e.target.value)} />
              </label>
              <label className="flex flex-col gap-1"><span className="text-sm opacity-80">A/C at W</span>
                <input type="number" min={1} max={4} className="bg-[#0b1219] rounded p-2" value={fleetW} onChange={(e)=>setFleetW(+e.target.value)} />
              </label>
              <label className="flex flex-col gap-1"><span className="text-sm opacity-80">Ownership $/AC/day</span>
                <input type="number" className="bg-[#0b1219] rounded p-2" value={Math.round(ownCost)} onChange={(e)=>setOwnCost(+e.target.value)} />
              </label>
              <label className="flex flex-col gap-1"><span className="text-sm opacity-80">Block $/BH</span>
                <input type="number" className="bg-[#0b1219] rounded p-2" value={bhCost} onChange={(e)=>setBhCost(+e.target.value)} />
              </label>
              <label className="flex flex-col gap-1"><span className="text-sm opacity-80">Service $/seat-dep</span>
                <input type="number" className="bg-[#0b1219] rounded p-2" value={svcSeat} onChange={(e)=>setSvcSeat(+e.target.value)} />
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-sm opacity-80">Value-of-time $/hr</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" className="bg-[#0b1219] rounded p-2" value={votT} onChange={(e)=>setVotT(+e.target.value)} />
                  <input type="number" className="bg-[#0b1219] rounded p-2" value={votS} onChange={(e)=>setVotS(+e.target.value)} />
                </div>
                <div className="text-xs opacity-70">Travel / SchedDelay</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Capacity H↔E</span><span>{capHE.cap}/{capHE.need} {capHE.ok?"OK":"Add"}</span></div>
              <div className="flex justify-between"><span>Capacity H↔W</span><span>{capHW.cap}/{capHW.need} {capHW.ok?"OK":"Add"}</span></div>
              <div className="flex justify-between"><span>Conflicts (3D)</span><span className={conflicts?"text-[#ef4444]":"text-[#16a34a]"}>{conflicts?conflicts+" flagged":"None"}</span></div>
              <hr className="border-[#1f2a44] my-2"/>
              <div className="flex justify-between"><span>Ownership</span><span>${OWN.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Block (BH={BHhrs.toFixed(1)}h)</span><span>${Math.round(BLK).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Servicing</span><span>${Math.round(SVC).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Travel time (avg {(avgTravelMin/60).toFixed(2)}h)</span><span>${Math.round(votT*TravT).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Schedule delay (avg {(schedDelayMin/60).toFixed(2)}h)</span><span>${Math.round(votS*SchD).toLocaleString()}</span></div>
              <hr className="border-[#1f2a44] my-2"/>
              <div className="flex justify-between text-base font-semibold"><span>Total Logistics Cost</span><span>${Math.round(TLC).toLocaleString()}</span></div>
            </div>

            <div className="mt-3 text-xs opacity-70 leading-relaxed">
              <p>Tip: Tight spacing lowers schedule delay but raises same-layer conflicts. Add layers or widen banks to deconflict.</p>
            </div>
          </section>
        </div>

        <footer className="mt-6 text-xs opacity-70">
          <p>Training abstraction: layers as discrete FLs; pins show cruise-window occupancy. Extend with runway queues, SIDs/STARs, or weather penalties.</p>
        </footer>
      </div>
    </div>
  );
}

window.App = App;

