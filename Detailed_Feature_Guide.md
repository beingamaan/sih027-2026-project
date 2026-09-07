# Comprehensive Feature Guide: Railway Block Optimization System (SIH26027)

## 1. Project Overview & Architecture
This project is an AI-powered advisory decision support system designed to optimize railway maintenance schedules (block planning). It aims to balance the need for essential track maintenance with the goal of minimizing train detention (delays).

**Technology Stack:**
*   **Backend:** FastAPI (Python) - High performance, asynchronous REST API.
*   **Frontend:** React (TypeScript) Progressive Web App (PWA) with Tailwind CSS.
*   **Database:** SQLite - Relational database storing tasks, train schedules, and blocks.
*   **AI/Optimization Engine:** Google OR-Tools (CP-SAT Solver) - Advanced constraint programming.

---

## 2. Role-Based Access Control
The application offers specialized interfaces based on the user's role in the railway operation:
*   **Section Controller / Divisional Officer:** Access to the full desktop-class dashboard for strategic planning, analytics, what-if simulations, and train graph visualization.
*   **Field Supervisor:** Access to a mobile-first Progressive Web App (PWA) for execution, tracking, and handback on the ground.

---

## 3. Smart Task Management & Classification
All pending maintenance tasks (Engineering, Traction Distribution (TRD), Signal & Telecom (S&T)) are centralized.
*   **Dynamic Lane Classification:** 
    *   **Lane A (Emergency):** Critical issues like rail fractures. Bypasses the AI and demands immediate manual intervention.
    *   **Lane B1 (Planned):** Routine maintenance. Sent to the AI optimizer to find the best time.
    *   **Lane B2 (Statutory):** Mandatory inspections with hard deadlines. Act as hard constraints for the AI optimizer.
*   **Pre-execution Readiness Check:** Ensures material, machine, gang, and Power Block (PTW) are ready before allowing a task to proceed.

---

## 4. AI Block Planning Engine (The Core)
Instead of manual scheduling, the controller uses the AI engine to generate optimal plans.
*   **Google OR-Tools CP-SAT Solver:** Solves the complex mathematical problem of scheduling.
*   **Task Bundling:** Automatically identifies compatible tasks (e.g., track work and overhead wire work in the same section) and bundles them into a single track-shutdown window.
*   **Constraint Handling:** Strictly enforces safety logic, maximum machine capacities, and statutory deadlines (B2 tasks).
*   **Plan Generation:** Produces a primary optimal schedule ("Plan A") and alternatives ("Plan B"), calculating the exact train impact (delay in minutes).

---

## 5. Visual Train Graph (Time-Distance Map)
A custom-built, highly performant SVG visualization of the entire railway section.
*   **Y-Axis:** Shows physical track distance (Stations A to D mapped by kilometer).
*   **X-Axis:** Shows time of day (6h, 12h, or 24h selectable ranges).
*   **Train Plotting:** Live plotting of Express, Freight, and Passenger trains as diagonal lines based on speed and direction.
*   **Block Overlays:** Maintenance windows are drawn as blue rectangles, proving visually that the scheduled shutdown safely avoids conflicting train movements.
*   **TSR Zones:** Highlights Temporary Speed Restriction zones in red.

---

## 6. What-If Scenario Analysis
A simulation dashboard that allows controllers to test disruptions before they cause chaos.
*   **Simulate Emergencies:** Test scenarios like "Tamping Machine Breakdown," "Bad Weather," or "Track Gang Delayed."
*   **Instant Recalculation:** The backend instantly re-runs the OR-Tools model excluding the affected resources.
*   **Impact Comparison:** Displays a side-by-side comparison of the Original Plan vs. the Recalculated Plan, showing the exact difference in train detention minutes and financial cost.

---

## 7. Field Execution (Mobile PWA)
A mobile-friendly application for supervisors physically on the tracks.
*   **Offline Support:** Uses IndexedDB. If the worker is in a remote area without a network, they can still record timestamps. Data syncs automatically once the network is restored.
*   **5-Tap Execution Flow:** A foolproof sequence to execute a block: Acknowledge ➔ Ready ➔ Start Work ➔ Complete ➔ Hand Back.
*   **Loss Reason Tracking:** If a block overruns its scheduled time, the worker must log a reason (e.g., Late Line Clear, Machine Failure) from a standardized Indian Railways code list.

---

## 8. Analytics & Reporting
Data-driven insights for long-term improvement.
*   **Train Impact Analytics:** Charts showing the total hours of train detention caused by blocks.
*   **Planned vs. Actual:** Identifies if specific gangs or machines consistently overrun their allotted time.
*   **Resource Utilization:** Tracks the efficiency and usage percentage of expensive track machines.
*   **Department Performance:** Completion rates across Engineering, TRD, and S&T.
