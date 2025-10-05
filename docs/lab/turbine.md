# 🔩 Gas Turbine Reconciliation Engine  
_Component matching and validation system prototype_

This interactive tool shows how mismatched turbine parts are reconciled across BOM, ERP, and CRM datasets — similar to your **GE Vernova** workflow.

---

### ⚙️ Demo

<div style="aspect-ratio:16/9; max-width:900px; margin:0 auto; border-radius:12px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,.25);">
  <iframe src="../games/turbine.html" title="Gas Turbine Reconciliation"
          style="width:100%; height:100%; border:0;"></iframe>
</div>

---

### 🗂 Overview
| Aspect | Details |
|--------|----------|
| **Input** | Two sample data streams: CRM orders vs. ERP component lists |
| **Algorithm** | Key-pair comparison with `fuzzyMatch()` for near duplicates |
| **Output** | Highlighted discrepancies and summary stats |
| **Purpose** | Demonstrate deterministic audit matching at scale |

---

### 📈 Future Extension
- Add CSV upload to allow custom datasets.  
- Integrate visualization (Plotly / D3) for reconciliation flow.  
- Connect to the real `PartMatrix` engine for live sync.

---

> _“Precision in data reconciliation defines trust in every megawatt.”_
