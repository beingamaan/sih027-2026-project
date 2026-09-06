# Railway Block Planning Decision Support Frontend (SIH26027)

> **Problem Statement:** SIH26027 — AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways.

This React + TypeScript + Tailwind CSS application serves as the operational decision-support console for railway section controllers, planning engineers, and field supervisors. It communicates directly and exclusively with the FastAPI backend REST APIs.

---

## 1. Prerequisites

- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher
- **FastAPI Backend**: Running concurrently on `http://127.0.0.1:8000`

---

## 2. Installation

From the project root:

```bash
cd frontend
npm install
```

---

## 3. Environment Variables

Create a `.env` file inside the `frontend/` folder (or copy from `.env.example`):

```bash
cp .env.example .env
```

Default configuration:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 4. How to Start

Run the Vite development server:

```bash
npm run dev
```

The frontend will start at:
👉 **`http://localhost:5173`**

To produce an optimized production build:

```bash
npm run build
npm run preview
```

---

## 5. Backend URL & Health Verification

The frontend makes requests to:
`http://127.0.0.1:8000`

Verify backend status before starting:
- API Health Check: `http://127.0.0.1:8000/health`
- SQLite Database Health: `http://127.0.0.1:8000/health/database`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`

---

## 6. Application Pages & Routes

| Route | Page | Purpose |
|---|---|---|
| `/login` | **Login Portal** | Prototype authentication selecting role (Admin, Planner, Supervisor, Field User, Viewer). |
| `/dashboard` | **Operational Overview** | Real-time KPI counters (Tasks, Lanes, Readiness), active operational risks, train delay chart, resource utilization, upcoming work items. |
| `/tasks` | **Task Registry** | Complete catalog of corridor maintenance tasks with filters by Department, Lane, Priority, and Status. |
| `/tasks/:id` | **Task Diagnostic & Readiness** | Deep inspection of asset parameters, P50/P90 duration estimates, AI Lane classification trigger, and 6-point prerequisite readiness checklist. |
| `/planning` | **Optimization Console** | One-click 7-day corridor schedule generation using Google OR-Tools CP-SAT. Displays Plan A (optimal) vs Plan B (alternative), allocation timeline, and task-by-task decision explanations. |
| `/plans/:id` | **Plan Authorization Gate** | Formal human review screen allowing Controller Approval, Rejection with reason, or Manual Override. |
| `/what-if` | **What-If Sandbox** | Interactive disruption simulation (machine breakdown, bad weather, window cancellations, delay spikes) comparing baseline vs revised plans in real time. |
| `/field` | **Field Execution Desk** | Step-by-step operational lifecycle handshake (`PLANNED` → `ACKNOWLEDGED` → `READY` → `STARTED` → `COMPLETED` → `HANDBACK`). |
| `/analytics` | **Corridor Analytics** | Recharts visualizations for planned vs actual block adherence, diurnal detention curves, machine utilization rates, and departmental output. |

---

## 7. API Integration Mapping

All communication is strictly handled by `src/services/api.ts` using Axios:

- **Tasks**: `GET /api/tasks`, `GET /api/tasks/{id}`, `POST /api/tasks/{id}/classify`, `GET /api/tasks/{id}/readiness`
- **Planning**: `POST /api/plans/generate`, `GET /api/plans`, `GET /api/plans/{id}`, `POST /api/plans/{id}/approve`, `POST /api/plans/{id}/reject`, `POST /api/plans/{id}/override`, `POST /api/plans/{id}/what-if`
- **Field Operations**: `GET /api/field/tasks`, `POST /api/field/tasks/{id}/acknowledge`, `POST /api/field/tasks/{id}/ready`, `POST /api/field/tasks/{id}/start`, `POST /api/field/tasks/{id}/complete`, `POST /api/field/tasks/{id}/handback`
- **Dashboard & Analytics**: `GET /api/dashboard/summary`, `GET /api/dashboard/tasks`, `GET /api/dashboard/plans`, `GET /api/dashboard/risks`, `GET /api/dashboard/train-impact`, `GET /api/analytics/planned-vs-actual`, `GET /api/analytics/train-impact`, `GET /api/analytics/resource-utilization`, `GET /api/analytics/task-completion`

---

## 8. Ideal Hackathon Demonstration Flow

For a live demonstration to SIH evaluators:

1. **Dashboard (`/dashboard`)**:
   - Highlight the real-time operational status, KPI counters (Lane A emergency count vs Lane B1 & B2), active operational risks (e.g. machine breakdown warnings), and train impact graphs.
2. **Task Registry (`/tasks`)**:
   - Filter by Department (TRD, Engineering, S&T) and Lane (`LANE_A`, `LANE_B1`, `LANE_B2`).
3. **Task Diagnostic (`/tasks/:id`)**:
   - Open a task. Show the P50/P90 statistical duration distribution and the 6-point readiness checklist (Machine, Gang, Material, Power permit, Site, Weather).
   - Click **"Run AI Classification"** to show instant ruleset verification.
4. **Planning Engine (`/planning`)**:
   - Click **"Generate Optimal Plan"**. Observe the live multi-step status indicator as Google OR-Tools CP-SAT solves the 7-day corridor window allocation.
   - Contrast **Plan A (Recommended)** against **Plan B (Alternative Heuristic)**.
   - Inspect the visual section timeline. Click any scheduled block to display the **"Why was this task scheduled here?"** decision explanation panel.
5. **Plan Authorization (`/plans/:id`)**:
   - Demonstrate the mandatory human controller gate. Approve or apply a controller override with audit remarks.
6. **What-If Scenario Simulation (`/what-if`)**:
   - Trigger disruptions like **"Machine Unavailable"** or **"Block Window Removed"**.
   - Show how the decision-support engine instantly calculates downstream train detention minutes and cost variance.
7. **Field Handshake (`/field`)**:
   - Demonstrate the transition of scheduled blocks through the safety lifecycle (`PLANNED` → `ACKNOWLEDGED` → `READY` → `IN_PROGRESS` → `COMPLETED` → `HANDBACK`).
8. **Corridor Analytics (`/analytics`)**:
   - Review planned vs actual performance curves and departmental resource utilization.

---

## 9. Safety & Prototype Limitations

- **Synthetic Data**: All train schedules, section block windows, defect logs, and resource inventories are realistic synthetic datasets modeled after Indian Railways operational patterns.
- **Decision Support Only**: Optimization outputs and heuristic suggestions are strictly advisory and require verified human authorization by the Section Controller.
- **Safety Precedence**: Emergency work (`LANE_A`) bypasses automatic optimization and must follow manual operating guidelines.
- **No Direct Live Integration**: This prototype does not interface with live Indian Railways FOIS / COA production databases.