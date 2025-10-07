# 🛹 Siemens AGV Simulation  
### 🎮 Simulation

<div style="width:100%;max-width:1400px;margin:0 auto 24px;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.35);height:clamp(880px,108vh,1680px);background:#0b0f14;"><iframe src="/alvin-site/lab/agv.html" title="AGV Simulation" style="width:100%;height:100%;border:0;display:block;overflow:hidden;" scrolling="no" allowfullscreen></iframe></div>
<iframe width="560" height="560" style="border-radius:12px; margin-top:10px; aspect-ratio:4/5;" src="https://www.youtube.com/embed/mCRT47i3MHI" frameborder="0" allowfullscreen> </iframe>

### 🛹 Original Demo
<iframe width="560" height="315" style="border-radius:12px; margin-top:10px; aspect-ratio:16/9;" src="https://www.youtube.com/embed/7qntLauB2-M" frameborder="0" allowfullscreen> </iframe>

### 🔍 Overview
| **Aspect**     | **Details**                                                                              | **Defaults**       |
| :------------- | :--------------------------------------------------------------------------------------- | :----------------- |
| **Flow**       | 3 conveyor lanes → palletize (R1–R3) → merge → buffer/queue → 2 docks (A/B) via AGV loop | —                  |
| **Entities**   | Pallets travel on conveyors; AGVs carry from queue to docks                              | 2 AGVs             |
| **Pathing**    | Waypoint loop `[merge → A → B → merge]`, queue first-in pickup                           | AGV speed 120 px/s |
| **Arrivals**   | Stochastic spawns per lane (probability / sec)                                           | 0.50               |
| **Processing** | Robot dwell ≈ 0.8 s → send to merge                                                      | —                  |
| **Buffer**     | Fixed-size queue; overflow marks pallets as *blocked* (visual backpressure)              | Cap 12             |
| **Docks**      | Two offload zones; each AGV drops then rejoins loop                                      | —                  |

### ⚙️ Presets
| **Preset**        | **Spawn** | **AGV Speed** | **Queue Cap** | **Use Case**                  |
| :---------------- | --------: | ------------: | ------------: | :---------------------------- |
| **Balanced**      |      0.50 |           120 |            12 | Stable demo (default)         |
| **Starved Lines** |      0.18 |           140 |            12 | Low WIP / under-utilized AGVs |
| **AGV-Saturated** |      0.65 |            90 |            10 | Transport bottleneck          |
| **High WIP**      |      0.85 |           120 |            20 | Stress-test buffers           |

### 📊 KPIs (Live)
| **KPI**                  | **Meaning**                                          | **How it’s computed**           |
| :----------------------- | :--------------------------------------------------- | :------------------------------ |
| **Throughput (jobs/hr)** | Completed drops per rolling 60 s → scaled to hourly  | Rolling window of `completed[]` |
| **WIP**                  | Total items in system (lines + queue + AGVs)         | Count by state                  |
| **AGV Utilization**      | Busy time / total time (avg across AGVs)             | Per-AGV timers                  |
| **Bottleneck (hint)**    | “AGV/Docks” if queue ≥ 70% full, else “Lines/Robots” | Threshold check                 |

### 🕹️ Controls & Shortcuts
| **Control**                 | **Action**                    | **Shortcut**            |
| :-------------------------- | :---------------------------- | :---------------------- |
| Play / Pause / Step / Reset | Run, step 1 frame, or re-seed | **Space**, **S**, **R** |
| Speed / Spawn Sliders       | Time scale & arrival rate     | `[ ]` to ± speed        |
| AGVs − / +                  | Change vehicle count (1–10)   | **D** / **A**           |
| Toggles                     | Trails, Grid, Labels          | —                       |
| Screenshot / Export CSV     | PNG of canvas / log of KPIs   | —                       |

### 🧩 Embed & Layout
| **Item**        | **Value**                                         |
| :-------------- | :------------------------------------------------ |
| Canvas          | Fit-to-frame (flex column), DPR-aware drawing     |
| No-scroll embed | `height: clamp(680px, 88vh, 1080px)`              |
| CSP-safe        | Inline JS removed → external `agv.js` ( `defer` ) |
