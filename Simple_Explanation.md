# SIH26027: Feature Guide (Explainable Decision Support System)

### 1. The Railway Operations Command Center (/command)
**What it is:** Premium Light-Glass centralized advisory dashboard for Section Controllers and Divisional Officers.
**In simple terms:** It provides a comprehensive live picture of the 58 km corridor (KM 100.0 to 158.0). It visualizes scheduled train movements, pending track possessions, active Temporary Speed Restrictions (TSRs), and task readiness metrics. The system operates strictly in an **ADVISORY-ONLY** capacity, recommending decisions for authorized railway personnel.

### 2. Task Register & 100-Point Readiness Gate (/tasks)
**What it is:** Structured database for Engineering (P-Way), TRD (OHE), and S&T (Signals) maintenance.
**In simple terms:** Tasks are separated into Lane A (Emergency protocol-led work, handled directly under emergency rules) and Lane B (Optimizable planned & statutory maintenance). Before any task is scheduled, an explainable 100-point Readiness Gate verifies material staging (20 pts), crew (20 pts), machinery (25 pts), PTW/disconnection memos (20 pts), and weather suitability (15 pts).

### 3. Dual-Plan Automatic Planning Engine (/planning)
**What it is:** Explainable rule-based and CP-SAT constraint-aware schedule formulation engine.
**In simple terms:** Formulates least-cost feasible block windows by bundling compatible Engineering, TRD, and S&T tasks into joint possessions to minimize traffic regulation penalties. It simultaneously produces **Plan A** (least-cost feasible option based on P50 baseline duration) and **Plan B** (alternate robust option with P90 conservative buffer).

### 4. The Time-Distance Marey Train Graph (/train-graph)
**What it is:** Standard Indian Railways Time-Distance graphical chart.
**In simple terms:** Plots time on the horizontal axis (00:00 to 06:00 in 15-min divisions) and corridor chainage (KM 100.0 to 158.0) on the vertical axis. Displays diagonal train trajectories alongside rectangular joint maintenance blocks, providing instant visual confirmation of headway margins.

### 5. Disruption What-If Simulation Sandbox
**What it is:** Interactive operational contingency evaluator.
**In simple terms:** Allows controllers to simulate real-world disturbances—such as machine transit delays or adverse monsoon weather. The engine calculates the penalty delta in **Weighted Train-Minutes (WTM)** and recommends automatic switchover to Plan B if Plan A buffers are exhausted.

### 6. 5-Step Mobile Field Execution (/field)
**What it is:** Responsive touch-friendly execution interface for field supervisors on site.
**In simple terms:** Features a standardized 5-step lifecycle: **Acknowledge -> Confirm Readiness -> Start Work -> Complete Work -> Hand Back Line.** Captures precise timestamps and standard Indian Railways delay loss codes to maintain complete accountability.

### 7. Immutable Governance Audit Log (/audit)
**What it is:** Full digital audit trail.
**In simple terms:** Records every automatic solver execution, controller sanction, manual override with mandatory reason codes, and field possession event.
