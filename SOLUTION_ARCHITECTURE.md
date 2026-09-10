# System Solution Architecture

**Indian Railways Integrated Block Planning & Decision Support System (SIH26027)**  
*Corridor Optimization, Dual-Plan Generation, G&SR Safety Interlocking & Cryptographic Audit*

---

## 1. End-to-End System Architecture

The solution is architected as a high-reliability, event-sourced decision support platform comprising a modern reactive frontend, a high-throughput asynchronous REST API gateway, mathematical optimization solvers, and an append-only cryptographic event store.

```
+====================================================================================================+
|                                    PRESENTATION TIER (CLIENT)                                      |
|                                                                                                    |
|   +--------------------------------------------------------------------------------------------+   |
|   |                           React 19 + TypeScript + Vite 8 SPA                               |   |
|   |                                                                                            |   |
|   |  +------------------------+  +------------------------+  +------------------------------+  |   |
|   |  |     Command Center     |  |   Department Workspace |  |     Governance & Sanction    |  |   |
|   |  | - Interactive Marey    |  | - 6-Gate Matrix        |  | - Plan Sanction Gate         |  |   |
|   |  |   Train Graph (SVG)    |  | - 100-Point Readiness  |  | - Reason-Coded Overrides     |  |   |
|   |  | - What-If Delay Matrix |  | - TSR & Machine Siding |  | - Quota Utilization Charts   |  |   |
|   |  +------------------------+  +------------------------+  +------------------------------+  |   |
|   |  +------------------------+  +------------------------+  +------------------------------+  |   |
|   |  |    Station Awareness   |  |     Field Execution    |  |   Cryptographic Data Archive |  |   |
|   |  | - GZB Siding Topology  |  | - Mobile Worksite Cards|  | - SHA-256 Merkle Ledger      |  |   |
|   |  | - Caution Memos (T/409)|  | - Offline Event Queue  |  | - CSV Export & Raw Inspector |  |   |
|   |  +------------------------+  +------------------------+  +------------------------------+  |   |
|   +--------------------------------------------------------------------------------------------+   |
+================================================+===================================================+
                                                 |
                                                 | JSON over HTTP / REST (JWT Bearer Tokens)
                                                 v
+====================================================================================================+
|                                APPLICATION & SECURITY GATEWAY                                      |
|                                                                                                    |
|   +--------------------------------------------------------------------------------------------+   |
|   |                             FastAPI + Uvicorn Asynchronous Gateway                         |   |
|   |                                                                                            |   |
|   |   +----------------------+   +-----------------------+   +-----------------------------+   |   |
|   |   |  Authentication &    |   | Capability Guard &    |   | G&SR Rule 4.14 Handback     |   |   |
|   |   |  JWT Token Issuer    |   | Server-Side RBAC (403)|   | Safety Interlock Barrier    |   |   |
|   |   +----------------------+   +-----------------------+   +-----------------------------+   |   |
|   +--------------------------------------------------------------------------------------------+   |
+================================================+===================================================+
                                                 |
                                                 | Internal Service Invocations
                                                 v
+====================================================================================================+
|                              DOMAIN ENGINES & OPTIMIZATION TIER                                    |
|                                                                                                    |
|  +---------------------------+  +----------------------------+  +-------------------------------+  |
|  |     Dual-Plan Engine      |  |   6-Gate Compatibility     |  |   Space-Time Conflict Solver  |  |
|  |  - P50 Optimal Generation |  |   Validation Matrix        |  |  - Marey Trajectory Modeling  |  |
|  |  - P90 Robust Buffering   |  |  - Spatial & Temporal      |  |  - Loop Line Diversions       |  |
|  |  - Machine Transit Model  |  |  - TRD 25kV Isolation      |  |  - Headway Interval Guard    |  |
|  |  - WTM Objective Minimizer|  |  - S&T Axle Interlocking   |  |  - What-If Scenario Evaluator |  |
|  |    (Google OR-Tools CP)   |  |  - Machine Siding Stabling |  |                               |  |
|  |                           |  |  - Safety Lane A Exclusion |  |                               |  |
|  +---------------------------+  +----------------------------+  +-------------------------------+  |
+================================================+===================================================+
                                                 |
                                                 | SQLAlchemy ORM Queries & Event Logging
                                                 v
+====================================================================================================+
|                             DATA PERSISTENCE & AUDIT STREAM TIER                                   |
|                                                                                                    |
|  +-----------------------------+  +--------------------------+  +-------------------------------+  |
|  |     Relational Database     |  |   Event-Sourced Ledger   |  |  Cryptographic Audit Trail    |  |
|  |  - User Profiles (Bcrypt)   |  |  - Append-Only EventLog  |  |  - SecurityAuditLog           |  |
|  |  - Tasks & Safety Lanes     |  |  - StateProjection Table |  |    (403 Access Denials)       |  |
|  |  - BlockPlans & Allocations |  |    (Cache for Fast Reads)|  |  - Certified 0x SHA-256       |  |
|  |  - TrainSchedules (HDN-04)  |  |  - Rebuildable Projections |    Integrity Hash per Event   |  |
|  +-----------------------------+  +--------------------------+  +-------------------------------+  |
+====================================================================================================+
```

---

## 2. Mathematical Formulation

### 2.1. Weighted Train-Minute (WTM) Objective Function
The operational disruption caused by a track possession window is quantified in terms of cumulative delay inflicted upon traversing train paths across the 58 km corridor section:

$$\min \quad \mathcal{J}_{\text{WTM}} = \sum_{i \in \mathcal{T}} \Delta t_i \cdot w_i$$

Where:
- $\mathcal{T}$: Set of scheduled trains scheduled to traverse the corridor during the planning horizon.
- $\Delta t_i$: Total regulation delay (in minutes) suffered by train $i$ due to speed restrictions, loop dwelling, or dispatch holds.
- $w_i$: Priority weight assigned to train $i$, reflecting its commercial urgency, operational priority, and punctuality sensitivity.

#### Priority Coefficients Matrix ($w_i$):
In adherence to Indian Railways operational priority standards:

| Train Classification | Exemplar Services | Base Weight ($w_i$) | Multiplier vs Baseline | Operational Rationale |
|---|---|---|---|---|
| **Premium Passenger** | Vande Bharat (22436), Rajdhani (12424) | $10.0$ | $2.5\times$ | Zero-tolerance for delay; national punctuality benchmark |
| **Superfast / Mail** | Shatabdi (12004), Prayagraj Express (12417) | $8.0$ | $2.0\times$ | High passenger density; tight interchange turnarounds |
| **Express / Passenger** | Unchahar Express (14218) | $6.0$ | $1.5\times$ | Inter-division regional connectivity |
| **Freight (High Priority)**| Coal Rakes (BOXN-881), Container Trains | $4.0$ | $1.0\times$ | Thermal power plant supply chain commitment |
| **Suburban / Local** | Aligarh MEMU (64102), Shuttles | $2.0$ | $0.5\times$ | Low-speed commuter service |

---

### 2.2. Dual-Plan Formulation (Plan A vs Plan B)

To address real-world execution variability, the optimization engine generates a dual recommendation for every candidate possession:

```
Timeline (Minutes):
0m                      120m             165m
|-------------------------|----------------|
[--- Plan A: 120 min ----]
(P50 Optimal Execution)
[----------- Plan B: 165 min -------------]
(P50 Execution + 45 min Contingency Buffer)
```

#### Plan A ($P_{50}$ Optimal Median Window):
Assumes normal operational conditions where all pre-requisites are verified (Readiness Score $\ge 80$). It calculates the minimum duration required to complete all co-located tasks:

$$T_{\text{Plan A}} = \max_{k \in \mathcal{K}} \left( t_{\text{setup}, k} + t_{\text{work}, k} + t_{\text{clear}, k} \right) + \tau_{\text{buffer}}$$

$$\text{Subject to:} \quad \tau_{\text{buffer}} = 15 \text{ min}$$

$$\mathcal{J}_{\text{Plan A}} = \sum_{i \in \mathcal{T}} \Delta t_i (T_{\text{Plan A}}) \cdot w_i \quad (\approx 1243.0 \text{ WTM})$$

#### Plan B ($P_{90}$ Conservative Robust Window):
Mandatory when the weighted readiness score falls in the conditional band ($60 \le \text{Score} < 80$), or when complex machine turnout transit is involved. It absorbs transit jitter and minor site delays:

$$T_{\text{Plan B}} = T_{\text{Plan A}} + \Delta_{\text{contingency}} + \Delta_{\text{transit}}$$

$$\text{Where:} \quad \Delta_{\text{contingency}} = 0.25 \cdot T_{\text{Plan A}}, \quad \Delta_{\text{transit}} \ge 15 \text{ min}$$

$$\mathcal{J}_{\text{Plan B}} = \sum_{i \in \mathcal{T}} \Delta t_i (T_{\text{Plan B}}) \cdot w_i \quad (\approx 1554.0 \text{ WTM})$$

Because $T_{\text{Plan B}} > T_{\text{Plan A}}$, it is mathematically guaranteed that $\mathcal{J}_{\text{Plan B}} > \mathcal{J}_{\text{Plan A}}$, accurately reflecting the cost of uncertainty while preventing mid-corridor burst overruns.

---

### 2.3. Weighted 100-Point Readiness Diagnostic Equation
Before corridor entry is sanctioned, candidate tasks are evaluated through a 5-pillar weighted diagnostic model:

$$\text{Score} = \left(0.25 \cdot S_{\text{machine}}\right) + \left(0.20 \cdot S_{\text{gang}}\right) + \left(0.20 \cdot S_{\text{material}}\right) + \left(0.20 \cdot S_{\text{ptw}}\right) + \left(0.15 \cdot S_{\text{weather}}\right)$$

#### Decision Bands:
- **$\text{Score} \ge 80$ (GREEN - PASS)**: Eligible for Plan A execution. Minimal train detention, all prerequisites verified.
- **$60 \le \text{Score} < 80$ (AMBER - CONDITIONAL)**: Eligible strictly for Plan B (+25% buffer). Requires Senior Supervisor physical concurrence.
- **$\text{Score} < 60$ (RED - REJECT)**: High-risk statutory deferral. Automatic return to task pool; blocked from corridor possession.

---

## 3. Domain Logic & Statutory Compliance

### 3.1. General & Subsidiary Rules (G&SR Rule 4.14) Safety Interlock
Under Indian Railways G&SR Rule 4.14, no blocked section may be restored to normal train operation until every department holding the joint possession has formally certified physical clearance.

The DSS implements a **stateful software interlock barrier**:
- `POST /api/blocks/handback` strictly rejects line-clear requests with `HTTP 422 (Unprocessable Entity)` unless all three department signatures are verified:
  1. **Engineering (P-Way)**: Track cleared of tamping machines, ballast dressed, fishplates bolted.
  2. **Electrical Traction (TRD)**: 25kV catenary discharge earth leads removed, tower car stabled, OHE re-energized.
  3. **Signalling & Telecom (S&T)**: Point detection circuits interlocked, track circuits and axle counters tested.

```
+-------------------------------------------------------------------------------+
|                    G&SR RULE 4.14 JOINT HANDBACK INTERLOCK                    |
|                                                                               |
|   +-----------------------+                                                   |
|   | P-Way: SIGNED         |                                                   |
|   +-----------------------+                                                   |
|               |                                                               |
|   +-----------------------+         +--------------------+                    |
|   | TRD:   PENDING (False)| ------> | HTTP 422 REJECTION |                    |
|   +-----------------------+         | Handback Locked!   |                    |
|               |                     +--------------------+                    |
|   +-----------------------+                                                   |
|   | S&T:   SIGNED         |                                                   |
|   +-----------------------+                                                   |
|                                                                               |
|               v (When TRD Signature is Submitted)                             |
|   +------------------------------------------------------+                    |
|   | ALL 3 SIGNED -> Status: CLEAR -> Line Clear Released |                    |
|   +------------------------------------------------------+                    |
+-------------------------------------------------------------------------------+
```

---

### 3.2. Railway Act 1989 Section 11 Executive Sanction Delegation
- **Senior Divisional Operations Manager (Sr. DOM)** holds statutory authority to sanction or alter block schedules.
- If operational conditions mandate deviation from the AI-recommended window, an **IRTS Reason Code** is mandatory:
  - `OVERRIDE_SAFETY_MARGIN`: Buffer machine clearing for heavy freight rakes.
  - `TRAFFIC_PRESSURE`: Urgent coal freight corridor congestion clearing.
  - `MACHINE_UNAVAILABLE`: Tamping unit stabled for emergency repair.
  - `MATERIAL_NOT_READY`: Rails/sleepers pending depot dispatch.
  - `WEATHER`: Gale or monsoon waterlogging restrictions.
  - `SAFETY_PRIORITY`: Severe track defect taking precedence.
  - `LOCAL_OPERATIONAL_REASON`: Discretionary traffic diversion.
- All overrides are committed to the permanent audit ledger and cannot be erased.

---

### 3.3. 500m Spatial Safety Overlap & Stop Board Protocol
- Within a bundled possession, heavy track machines (e.g., BCM-340 and CSM-09) must maintain a minimum longitudinal separation of **500 metres**.
- Red Stop Flags / Stop Boards are physically positioned 30m on either side of the worksite boundary to demarcate the isolated zone.
- **Safety Lane A Exclusion**: Emergency unscheduled track defects (broken rails, weld fractures) are strictly flagged as `LANE_A` and are excluded from multi-department bundled slots. They are handled under emergency manual line blocks.

---

## 4. Data Models & Relational Schema

### 4.1. Core Entities Relationship Diagram (ERD)

```
+-------------------+           1:N           +---------------------+
|       User        | ----------------------> |   SecurityAuditLog  |
| - service_id (PK) |                         | - actor_id          |
| - role            |                         | - action            |
| - department      |                         | - endpoint          |
+-------------------+                         +---------------------+
          |
          | 1:N
          v
+-------------------+           1:N           +---------------------+
|     BlockPlan     | ----------------------> |     PlannedTask     |
| - id (PK)         |                         | - id (PK)           |
| - plan_code       |                         | - task_id (FK)      |
| - plan_type (A/B) |                         | - planned_start     |
| - total_cost_wtm  |                         | - planned_end       |
| - approval_status |                         +---------------------+
+-------------------+                                    |
          |                                              | N:1
          | 1:N                                          v
          |                                   +---------------------+
          v                                   |        Task         |
+-------------------+                         | - id (PK)           |
|     EventLog      |                         | - task_code         |
| - id (PK)         |                         | - department        |
| - ref_id          |                         | - lane (LANE_A/B1)  |
| - stage           |                         | - readiness_score   |
| - sha256_hash     |                         +---------------------+
+-------------------+
```

---

### 4.2. Database Schema Specifications

#### 1. `users` Table
- `id` (Integer, Primary Key)
- `service_id` (String, Unique, Index): Railway Service Code (e.g., `IR-CTRL-0104`, `IR-DRM-0012`).
- `password_hash` (String): Bcrypt hashed password.
- `name` (String): Officer's full name.
- `designation` (String): Official railway designation.
- `role` (Enum): `SECTION_CONTROLLER`, `DEPT_SUPERVISOR`, `DIVISIONAL_OFFICER`, `STATION_MASTER`, `FIELD_EXEC_LEAD`, `FIELD_INSPECTOR`.
- `department` (String): `OPS`, `ENG`, `TRD`, `SNT`.
- `division_id` (String): Railway Division (`DLI`).

#### 2. `tasks` Table
- `id` (Integer, Primary Key)
- `task_code` (String, Unique): E.g., `TSK_ENG_04`, `TSK_TRD_03`.
- `department` (Enum): `ENG`, `TRD`, `SNT`.
- `work_type` (String): Description of maintenance activity.
- `block_section_id` (Integer): Section segment ID (KM 100-120, KM 120-140, KM 140-158).
- `km_from` / `km_to` (Float): Longitudinal kilometer chainage.
- `lane` (Enum): `LANE_A` (Emergency), `LANE_B1` (Planned Co-Block), `LANE_B2` (Statutory).
- `requires_line_block` / `requires_power_block` / `requires_disconnection` (Boolean).
- `estimated_duration_minutes` (Integer): Base execution duration.
- `readiness_score` (Float): Weighted 100-point diagnostic score.
- `status` (Enum): `PENDING`, `READY`, `SCHEDULED`, `EXECUTED`, `CLOSED`.

#### 3. `block_plans` Table
- `id` (Integer, Primary Key)
- `plan_code` (String, Unique): E.g., `BLK-2026-DLI-04`.
- `plan_version` (Integer): Incremented on each replan or override.
- `plan_type` (Enum): `PLAN_A`, `PLAN_B`.
- `horizon_start` / `horizon_end` (DateTime): Recommended possession window.
- `total_cost` (Float): Total WTM delay penalty.
- `train_impact_cost` (Float): WTM delay incurred by train regulations.
- `tsr_cost` (Float): Temporary speed restriction delay cost.
- `approval_status` (Enum): `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `OVERRIDDEN`.
- `status` (String): `PENDING`, `SANCTIONED`, `ACTIVE`, `CLOSED`.

#### 4. `event_logs` & `state_projections` Tables
- `id` (Integer, Primary Key)
- `ref_type` (String): `BLOCK_REQUEST`, `BLOCK_PLAN`, `TASK`.
- `ref_id` (String): Unique identifier of subject entity.
- `stage` (String): Lifecycle stage (`REQUESTED`, `SANCTION_READY`, `SANCTIONED`, `IN_PROGRESS`, `CLOSED`).
- `event` (String): Event type (`SUBMIT_SANCTION`, `APPROVE_PLAN`, `OVERRIDE`, `HANDBACK`).
- `actor_id` / `actor_role` / `actor_dept` (String): Audit metadata.
- `plan_version` (Integer): Entity version at event timestamp.
- `payload` (JSON): Structured event data payload.
- `created_at` (DateTime): Server-side immutable timestamp.

#### 5. `audit_logs` & `security_audit_logs` Tables
- Contains certified `sha256_hash`:
  $$\text{SHA-256} \left( \text{IR-AUDIT}: \text{id} : \text{action} : \text{actor} : \text{timestamp} : \text{GOV-ACT-1989} \right)$$
- `security_audit_logs`: Dedicated barrier recording unauthorized access attempts (`ACCESS_DENIED`) on restricted endpoints.

---

## 5. Repository Directory Layout

```
sih027-2026-project/
├── backend/                              # FastAPI Python Application
│   ├── app/
│   │   ├── routes/                       # API Route Controllers
│   │   │   ├── auth.py                   # JWT Auth & Multi-Role Provisioning
│   │   │   ├── blocks.py                 # Block Optimization, Sanction & Handback
│   │   │   ├── plans.py                  # Dual-Plan Approval & Reason-Coded Overrides
│   │   │   ├── trains.py                 # Occupancy Ledger & Marey Trajectories
│   │   │   ├── tasks.py                  # Task Pool & 100-Point Readiness
│   │   │   ├── audit.py                  # Cryptographic SHA-256 Audit Ledger
│   │   │   └── dashboard.py              # Macro Corridor KPIS & Quota Telemetry
│   │   ├── services/                     # Algorithmic & Business Logic Services
│   │   │   ├── bundling_engine.py        # 6-Gate Compatibility Validator Matrix
│   │   │   ├── scheduler.py              # Dual-Plan Optimizer (P50/P90 Solver)
│   │   │   ├── event_engine.py           # Append-Only EventLog & State Projections
│   │   │   └── what_if.py                # Corridor Delay & Scenario Modeling
│   │   ├── seeds/                        # Pristine Demo Data Generators
│   │   │   ├── seed_users.py             # Official Railway Personas
│   │   │   └── seed_demo_data.py         # Delhi Division HDN-04 Tasks & Blocks
│   │   ├── database.py                   # SQLAlchemy Engine & Session Factory
│   │   ├── dependencies.py               # RBAC Capability Guards & Security Barriers
│   │   ├── models.py                     # SQLAlchemy Relational Models
│   │   ├── schemas.py                    # Pydantic Request/Response Models
│   │   └── main.py                       # FastAPI Application Entry & Middleware
│   ├── test_e2e_verification.py          # Automated Full-Stack 12-Check Verification Suite
│   └── requirements.txt                  # Python Dependency Manifest
│
├── frontend/                             # React 19 + TypeScript Frontend
│   ├── src/
│   │   ├── components/                   # Modular Component Library
│   │   │   ├── corridor/                 # Corridor Topology & Marey Train Graph
│   │   │   │   ├── CorridorTrackTopology.tsx # Multi-Tier Track Infrastructure View
│   │   │   │   └── MareyTrainGraph.tsx   # Interactive Space-Time Diagram (SVG)
│   │   │   ├── layout/                   # Master Navigation Layout
│   │   │   │   ├── Sidebar.tsx           # Role-Adaptive Crimson Navigation Sidebar
│   │   │   │   ├── Navbar.tsx            # Flush Header with Interlock & Search
│   │   │   │   └── HeroBanner.tsx        # Standardized Divisional Hero Card
│   │   │   ├── planning/                 # Horizon Selectors & Quota Ledgers
│   │   │   │   └── PlanningHorizonTabs.tsx # 24h / 7-Day / 30-Day Segment Switcher
│   │   │   ├── cards/                    # Task & Recommendation Cards
│   │   │   │   ├── RecommendationCard.tsx# Co-Block Recommendation & Sanction Push
│   │   │   │   └── TaskCard.tsx          # Task Readiness & Inspection Card
│   │   │   └── modals/                   # Interlock & Handback Dialogs
│   │   │       └── HandbackInterlockModal.tsx # G&SR Rule 4.14 Digital Handback
│   │   ├── pages/                        # Role-Specific Views & Workspaces
│   │   │   ├── CommandCenter.tsx         # Section Controller Operations Room
│   │   │   ├── DepartmentWorkspace.tsx   # Supervisor Workspace (ENG/TRD/SNT)
│   │   │   ├── GovernanceAudit.tsx       # Sr. DOM Sanction & Audit Trail Console
│   │   │   ├── ReportsInsights.tsx       # Corridor Punctuality & WTM Delay Trends
│   │   │   ├── DataArchive.tsx           # Full-Page Cryptographic Hash Ledger
│   │   │   ├── StationAwareness.tsx      # GZB Station Master Yard & Caution Memos
│   │   │   ├── FieldExecution.tsx        # Worksite Milestone Execution Console
│   │   │   └── Login.tsx                 # Universal Authentication Gateway
│   │   ├── context/
│   │   │   └── AuthContext.tsx           # JWT Session & Role State Management
│   │   ├── services/
│   │   │   └── railwayApi.ts             # Axios Client & Backend Service Endpoints
│   │   ├── App.tsx                       # Master Route Registry & Protected Routes
│   │   └── main.tsx                      # Vite Application Entry Point
│   ├── package.json                      # Node.js Package Manifest
│   └── vite.config.ts                    # Vite Build Configuration
│
├── scripts/
│   └── verify_system.py                  # Standalone Acceptance Verification Suite
├── README.md                             # Production User & System Manual
├── SOLUTION_ARCHITECTURE.md              # Technical Architecture & Math Formulation
└── walkthrough.md                        # Verification Audit Log & Visual Evidence
```

---

## 6. Security Architecture & Threat Mitigation

| Threat Vector | Potential Vulnerability | Mitigation Implemented in DSS |
|---|---|---|
| **Unauthorized Block Approval** | Non-divisional user sanctions track possession | Server-side `require_capabilities("DIVISIONAL_OFFICER")` guard rejects with HTTP 403. |
| **Premature Track Restoration** | Single department releases line clear before others complete work | Stateful G&SR Rule 4.14 barrier rejects with HTTP 422 until all 3 signatures match. |
| **Audit Ledger Tampering** | Malicious user alters past event record | Append-only event store with continuous SHA-256 hash chains. |
| **Conflicting Machine Staging** | Two machines assigned to same siding route | Gate 5 Siding Stabling check detects duplicate machine demands during optimizer validation. |
| **Emergency Collision Hazard** | Broken rail bundled into planned window | Gate 6 Safety Lane strictly excludes `LANE_A` tasks from bundle optimizer. |

---

**Government of India · Ministry of Railways · Smart India Hackathon (SIH 2026)**  
*Architecture Specifications for Problem Statement SIH26027*
