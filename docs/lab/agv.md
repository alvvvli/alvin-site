# 🚙 Siemens AGV Simulation  
_AGV routing and gate scheduling visualization_

A simplified simulation inspired by your **Siemens AGV digital-twin project** (CIVENG 260).  
It demonstrates how automated guided vehicles move through nodes with gate constraints and time-slot optimization.

---

### 🎮 Simulation

<div style="aspect-ratio:16/9; max-width:900px; margin:0 auto; border-radius:12px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,.25);">
  <iframe src="../agv.html" title="AGV Simulation"
          style="width:100%; height:100%; border:0;"></iframe>
</div>

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
