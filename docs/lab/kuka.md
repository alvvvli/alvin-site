# 🤖 KUKA Industrial Robot Digital Twin Simulation

<div align="center">

![KUKA Digital Twin Banner](assets/kuka-banner.png)

**A browser-based industrial robotics simulation environment demonstrating robot kinematics, PLC-style state machines, safety logic, and production workflow optimization.**

</div>

---

## 🚀 Project Overview

This project recreates a simplified **KUKA robotic cell digital twin**, simulating an industrial pick-and-place workflow with:

- Robot motion planning
- Conveyor interaction
- PLC-inspired sequence control
- Safety interlocks
- Fault injection and diagnostics
- Production cycle monitoring

The objective is to bridge **industrial automation concepts** with an interactive web-based simulation environment.

---

## 🎮 Live Simulation

<div align="center">

<iframe 
    src="kuka-sim.html"
    width="100%"
    height="600"
    frameborder="0">
</iframe>

</div>

---

# 🏭 System Architecture

```mermaid
flowchart LR

A[Operator Interface] --> B[Simulation Controller]

B --> C[PLC State Machine]

C --> D[KUKA Robot Model]

D --> E[Pick Operation]

E --> F[Conveyor System]

F --> G[Production Validation]

G --> C
