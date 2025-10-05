# 🧩 PartMatrix Demo  
_Excel-logic reconciliation engine (JavaScript port)_

This lightweight demo recreates part of the original **PartMatrix** tool you built at GE Vernova — a logic engine that performs `IF`, `MATCH`, and `LOOKUP` operations to reconcile turbine components.

---

### ⚙️ Demo

<div style="max-width:1000px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.25);height:95vh;">
  <iframe src="../partmatrix.html" style="width:100%;height:100%;border:0;" title="PartMatrix Demo"></iframe>
</div>

---

### 📘 Overview
| Feature | Description |
|----------|--------------|
| **Core Logic** | JavaScript version of Excel `IF/LOOKUP` mappings |
| **Sample Data** | 10 turbine components (`order_no`, `part_no`, `match_status`) |
| **Interaction** | Click “Run Reconciliation” to flag matched / unmatched entries |
| **Goal** | Demonstrate deterministic reconciliation logic for audit-grade matching |

---

### 🧠 Notes
- Optimized for browser-side execution (no backend required).  
- Original VBA logic migrated line-for-line for reproducibility.  
- Extendable to real CSV uploads later.
