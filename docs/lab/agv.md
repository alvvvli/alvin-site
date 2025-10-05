# 🛹 Siemens AGV Simulation  
**AGV routing and gate scheduling visualization**

A simplified simulation inspired by your **Siemens AGV digital-twin project** (CIVENG 260).  
It demonstrates how automated guided vehicles move through nodes with gate constraints and time-slot optimization.

---

### 🎮 Simulation

<div style="width:100%;max-width:1400px;margin:0 auto 24px;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.35);height:clamp(480px,72vh,920px);background:#0b0f14;"><iframe src="/alvin-site/lab/agv.html" title="AGV Simulation" style="width:100%;height:100%;border:0;display:block;overflow:hidden;" scrolling="no" allowfullscreen></iframe></div>


### Original Demo
<iframe width="560" height="315" style="border-radius:12px; margin-top:10px; aspect-ratio:16/9;" src="https://www.youtube.com/embed/7qntLauB2-M" frameborder="0" allowfullscreen> </iframe>
---

### 🔍 Overview
| Parameter | Description |
|------------|-------------|
| **Map** | Warehouse grid with four gates and one transfer zone |
| **Vehicles** | Two AGVs moving between pickup and drop-off nodes |
| **Logic** | Time-based pathing with queue avoidance |
| **Visualization** | Canvas-based animation with color-coded lanes |

---

### 🧭 Insights
- AGV scheduling can be treated as a **flow-shop** optimization problem.  
- The simplified logic mimics **shortest-path + queue-penalty** routing.  
- Extendable with Three.js for 3D visualization.
