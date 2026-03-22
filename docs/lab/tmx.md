<div style="margin: 1rem 0 1.2rem 0;">
  <a href="../tmx.html" target="_blank"
     style="
       display:inline-block;
       padding:12px 18px;
       border-radius:12px;
       text-decoration:none;
       font-weight:600;
       background:linear-gradient(180deg,#17304d,#11253d);
       color:#dbe7ff;
       border:1px solid rgba(255,255,255,.10);
     ">
    Full screen ↗
  </a>
</div>

<iframe
  src="../tmx.html"
  width="100%"
  height="820"
  style="
    border:1px solid rgba(255,255,255,0.10);
    border-radius:16px;
    background:#07111f;
  "
  loading="lazy">
</iframe>
🔍 Overview

| Aspect | Details | Defaults |
|---|---|---|
| Layout | Build and edit conveyors, robot cells, stations, docks, and AGV spawns on a live canvas | Demo plant included |
| Flow | Conveyors → robot transfer → station / merge buffer → AGV pickup → outbound dock | — |
| Layers | Feed, transfer, buffer / merge, transport | — |
| Editing | Drag, place, and delete assets while simulation is running | Grid-snapped |
| Dispatch | AGVs pick from queue and deliver to nearest dock | AGV speed 120 px/s |
| Arrivals | Stochastic pallet generation across conveyor lines | 0.55 |
| Buffer | Queue builds at station before AGV pickup | Cap 12 |
| Visualization | Labels, grid, trails, heatmap, KPI side panels | Labels + grid on |

🧩 What makes it tool-like

| Feature | Purpose |
|---|---|
| Build modes | Place plant assets directly on the canvas |
| Live editing | Rearrange layout while the model keeps running |
| Asset selection | View station, robot, dock, and conveyor status |
| Demand tuning | Adjust arrival intensity and AGV count |
| Queue tuning | Stress buffers and reveal transport limits |
| KPI panel | Monitor throughput, WIP, utilization, bottlenecks |
| Event log | Track simulation actions and layout changes |
| Visual overlays | Use grid, labels, trails, and heatmap for readability |

🕹️ Core interaction model

| Step | Action |
|---|---|
| 1 | Place conveyors, stations, robots, docks, and AGV spawn points |
| 2 | Adjust demand, AGV speed, and queue capacity |
| 3 | Run the line and observe WIP accumulation and transport response |
| 4 | Rearrange assets while the simulation is still active |
| 5 | Compare throughput, utilization, and bottleneck shifts |

⚙️ Included logic

| Logic | Behavior |
|---|---|
| Pallet spawning | Items generate stochastically by conveyor |
| Conveyor travel | Pallets progress along line segments |
| Robot transfer | Robot cells hand off loads downstream |
| Station accumulation | Stations build WIP and shift into congestion states |
| Queue release | Loads wait for AGV pickup |
| AGV transport | AGVs deliver to nearest dock |
| Throughput KPI | Rolling jobs-per-hour measure |
| WIP tracking | Counts active pallets across system states |
| AGV utilization | Estimates busy time share |
| Bottleneck hint | Infers likely constrained layer from queue and load conditions |

📁 File structure

| Layer | Contents |
|---|---|
| HTML shell | Page structure, side panels, canvas host, visual styling |
| JS builder layer | Simulation state, asset placement, AGV logic, KPI updates, rendering, controls |
| Markdown page | Project overview and site presentation |

📌 Positioning

> A Tecnomatix-inspired browser demo for building and testing AGV-supported plant layouts with live flow, queue, and dispatch behavior.

🚀 Next upgrade path

| Upgrade | Purpose |
|---|---|
| Route graph authoring | Define explicit AGV paths between stations and docks |
| Orthogonal conveyors | Add corner nodes and cleaner plant-style routing |
| Asset properties | Edit processing times and behavior per object |
| Save / load JSON | Store and reload scenarios |
| Downtime events | Simulate blockage, maintenance, and failures |
| Mini-map / zoom | Improve navigation in larger layouts |
| KPI trend charts | Show performance over time |
| Multi-station dispatch | Add richer dispatch rules |

🏭 Why this matters

| Value | Explanation |
|---|---|
| Layout-sensitive behavior | Performance changes when the plant layout changes |
| Congestion visibility | Shows where queues and backpressure build |
| Transport insight | Reveals how AGV capacity affects system clearance |
| Stronger portfolio artifact | Feels closer to a real digital factory exercise than a static animation |
