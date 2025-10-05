# 🔩 Gas Turbine Reconciliation Engine  
_Component matching and validation system prototype_

This interactive tool shows how mismatched turbine parts are reconciled across BOM, ERP, and CRM datasets — similar to your **GE Vernova** workflow.

---

### ⚙️ Demo

<iframe 
  src="/alvin-site/lab/parts_match_integrated.html" 
  width="100%" 
  height="720" 
  style="width:100%;height:100%;border:0;display:block;overflow:hidden;" scrolling="no"   allowfullscreen></iframe>
</iframe>
---

### 🧩 Overview
| Aspect        | Details                                                                                                                                                                                                                                      |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**     | Automatically generated part identifiers representing turbine components across two layers: <br>• **Simple Mode**: easy-to-read mock codes (e.g. `TUR-1021-A`) <br>• **Pro Mode**: realistic BOM / ERP / CRM datasets with deliberate mismatches |
| **Algorithm** | Stepwise normalization and fuzzy mutation: <br>• Removes noise (extra zeros, dashes, suffixes) <br>• Seeds consistent “messy” variants for matching challenges                                                                               |
| **Output**    | Live table of results showing which parts matched, mismatched, or auto-normalized with status color cues                                                                                                                                     |
| **Purpose**   | Demonstrate how deterministic reconciliation works — from human-friendly pattern recognition to machine-precision audit validation                                                                                                           |

### ⚙️ Core Mechanics
| Layer                    | Function                                                                                     | Example                                              |
| :----------------------- | :------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| **Normalization Engine** | Cleans and standardizes part numbers so “TUR1021A” and “tur-01021-a” resolve as identical    | `normalize("tur-01021-a") → "TUR1021A"`              |
| **Mutation Generator**   | Introduces realistic data “noise” to simulate vendor differences and human typos             | `mutate("HGP-042-001") → "hgp0042-001-TW"`           |
| **Scoring System**       | Rewards correct mappings (+5), deducts wrong attempts (−2), and logs auto-matched pairs (+3) | Enables gamified learning and quick audits           |
| **Audit Layer**          | Displays part-by-part reconciliation notes for traceability and feedback                     | “Auto-matched (BOM=ERP)” or “Wrong guess: try again” |

### 🧠 Design Philosophy
| Principle             | Description                                                                                       |
| :-------------------- | :------------------------------------------------------------------------------------------------ |
| **Transparency**      | Every normalization or mutation is visible and reproducible — no black-box matching               |
| **User Friendliness** | The *Simple Mode* is designed for anyone to understand reconciliation logic without jargon        |
| **Scalability**       | The *Pro Mode* mimics enterprise datasets — aligning with real-world turbine BOM / ERP structures |
| **Consistency**       | Each session runs on a seeded random engine, ensuring identical results when replayed             |
