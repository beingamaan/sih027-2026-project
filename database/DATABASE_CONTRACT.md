# SIH26027 Database Contract

This document outlines the SQLite schema and logic rules for the SIH26027 prototype database (AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations).

**IMPORTANT NOTE**: This is a prototype database for a hackathon. The data is entirely synthetic and mock-up. Do not deploy this in a production Railway system.

## 1. Tables & Fields

### `users`
- `id` (INTEGER PK)
- `employee_id` (TEXT UNIQUE)
- `name` (TEXT)
- `role` (TEXT): `FIELD_SUPERVISOR`, `SECTION_CONTROLLER`, `DIVISIONAL_OFFICER`
- `department` (TEXT)
- `division` (TEXT)
- `password_hash` (TEXT)
- `active` (INTEGER DEFAULT 1): Boolean logic
- `created_at` (DATETIME)

### `stations`
- `id` (INTEGER PK)
- `station_code` (TEXT UNIQUE)
- `name` (TEXT)
- `division` (TEXT)
- `chainage_km` (REAL)

### `block_sections`
- `id` (INTEGER PK)
- `section_code` (TEXT UNIQUE)
- `from_station_id` (INTEGER FK -> stations)
- `to_station_id` (INTEGER FK -> stations)
- `km_start` (REAL)
- `km_end` (REAL)
- `number_of_lines` (INTEGER)

### `elementary_sections`
- `id` (INTEGER PK)
- `block_section_id` (INTEGER FK -> block_sections)
- `section_code` (TEXT)
- `km_start` (REAL)
- `km_end` (REAL)

### `interlocking_areas`
- `id` (INTEGER PK)
- `station_id` (INTEGER FK -> stations)
- `area_name` (TEXT)

### `assets`
- `id` (INTEGER PK)
- `asset_code` (TEXT UNIQUE)
- `asset_type` (TEXT)
- `department` (TEXT)
- `block_section_id` (INTEGER FK -> block_sections)
- `km` (REAL)
- `condition_score` (REAL)
- `last_maintenance_date` (DATETIME)
- `status` (TEXT)

### `defects`
- `id` (INTEGER PK)
- `defect_code` (TEXT UNIQUE)
- `asset_id` (INTEGER FK -> assets)
- `severity` (TEXT)
- `detected_at` (DATETIME)
- `description` (TEXT)
- `tsr_active` (INTEGER): Boolean logic
- `tsr_speed_kmph` (REAL)
- `tsr_start` (REAL)
- `tsr_end` (REAL)
- `protocol_reference` (TEXT)
- `lane` (TEXT): `A_EMERGENCY`, `B1_PLANNED`, `B2_STATUTORY`
- `status` (TEXT)

### `tasks`
- `id` (INTEGER PK)
- `task_code` (TEXT UNIQUE)
- `department` (TEXT): `ENGINEERING`, `TRD`, `S_AND_T`
- `work_type` (TEXT)
- `asset_id` (INTEGER FK -> assets)
- `block_section_id` (INTEGER FK -> block_sections)
- `elementary_section_id` (INTEGER FK -> elementary_sections)
- `interlocking_area_id` (INTEGER FK -> interlocking_areas)
- `km_from` (REAL)
- `km_to` (REAL)
- `lane` (TEXT): `A_EMERGENCY`, `B1_PLANNED`, `B2_STATUTORY`
- `safety_class` (TEXT)
- `priority_band` (TEXT)
- `priority_score` (REAL)
- `requires_line_block` (INTEGER)
- `requires_power_block` (INTEGER)
- `requires_disconnection` (INTEGER)
- `required_block_type` (TEXT)
- `estimated_duration_minutes` (INTEGER): The baseline productive work estimate
- `duration_buffer_minutes` (INTEGER): A conservative prototype allowance for delays
- `actual_duration_minutes` (INTEGER)
- `required_machine_type` (TEXT)
- `required_gang_size` (INTEGER)
- `material_ready` (INTEGER)
- `ptw_ready` (INTEGER)
- `power_ready` (INTEGER)
- `disconnection_ready` (INTEGER)
- `worksite_ready` (INTEGER)
- `weather_suitable` (INTEGER)
- `statutory_due_date` (DATETIME)
- `overdue_days` (INTEGER)
- `post_work_tsr_speed_kmph` (REAL)
- `post_work_tsr_days` (INTEGER)
- `post_work_tsr_cost` (REAL)
- `status` (TEXT)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### `resources`
- `id` (INTEGER PK)
- `resource_code` (TEXT UNIQUE)
- `resource_type` (TEXT)
- `name` (TEXT)
- `department` (TEXT)
- `home_location` (TEXT)
- `available_from` (DATETIME)
- `available_to` (DATETIME)
- `capacity` (INTEGER)
- `status` (TEXT)

### `train_paths`
- `id` (INTEGER PK)
- `train_number` (TEXT)
- `train_class` (TEXT)
- `weight_category` (TEXT)
- `block_section_id` (INTEGER FK -> block_sections)
- `line` (TEXT)
- `scheduled_start` (DATETIME)
- `scheduled_end` (DATETIME)
- `direction` (TEXT)
- `traffic_density_factor` (REAL)

### `block_windows`
- `id` (INTEGER PK)
- `window_code` (TEXT UNIQUE)
- `block_section_id` (INTEGER FK -> block_sections)
- `start_time` (DATETIME)
- `end_time` (DATETIME)
- `line` (TEXT)
- `block_type` (TEXT): `TRAFFIC_LINE`, `POWER`, `TRAFFIC_POWER`, `S_AND_T_DISCONNECTION`, `INTEGRATED`
- `valid` (INTEGER)
- `calendar_restriction` (TEXT)
- `restriction_reason` (TEXT)

### `block_plans`
- `id` (INTEGER PK)
- `plan_code` (TEXT UNIQUE)
- `version` (INTEGER)
- `plan_type` (TEXT): `PLAN_A`, `PLAN_B`
- `horizon_start` (DATETIME)
- `horizon_end` (DATETIME)
- `total_cost` (REAL)
- `train_impact_cost` (REAL)
- `tsr_cost` (REAL)
- `failure_risk_cost` (REAL)
- `late_completion_cost` (REAL)
- `instability_cost` (REAL)
- `solver_status` (TEXT): `OPTIMAL`, `FEASIBLE`, `HEURISTIC`, `NO_SOLUTION`
- `solver_time_seconds` (REAL)
- `approval_status` (TEXT)
- `approved_by` (INTEGER FK -> users)
- `approved_at` (DATETIME)
- `override_reason` (TEXT)
- `created_at` (DATETIME)

### `planned_tasks`
- `id` (INTEGER PK)
- `block_plan_id` (INTEGER FK -> block_plans)
- `task_id` (INTEGER FK -> tasks)
- `block_window_id` (INTEGER FK -> block_windows)
- `planned_start` (DATETIME)
- `planned_end` (DATETIME)
- `setup_minutes` (INTEGER)
- `work_minutes` (INTEGER)
- `clearance_minutes` (INTEGER)
- `handback_minutes` (INTEGER)
- `deferred` (INTEGER)
- `defer_reason` (TEXT)
- `explanation` (TEXT)

### `block_events`
- `id` (INTEGER PK)
- `block_plan_id` (INTEGER FK -> block_plans)
- `block_section_id` (INTEGER FK -> block_sections)
- `event_type` (TEXT): `BLOCK_REQUESTED`, `BLOCK_SANCTIONED`, `LINE_CLEAR_RECEIVED`, `PTW_ISSUED`, `WORK_STARTED`, `WORK_COMPLETED`, `PTW_CANCELLED`, `LINE_HANDED_BACK`
- `event_time` (DATETIME)
- `actor_id` (INTEGER FK -> users)
- `loss_code` (TEXT): `LATE_LINE_CLEAR`, `MACHINE_LATE`, `MATERIAL_SHORT`, `STAFF_SHORT`, `PTW_DELAY`, `WEATHER`, `EQUIPMENT_FAILURE`, `SCOPE_GROWTH`, `TRAFFIC_PRESSURE`, `OTHER`
- `notes` (TEXT)
- `client_event_uuid` (TEXT)
- `created_at` (DATETIME)

### `notifications`
- `id` (INTEGER PK)
- `notification_code` (TEXT UNIQUE)
- `block_plan_id` (INTEGER FK -> block_plans)
- `recipient_user_id` (INTEGER FK -> users)
- `message` (TEXT)
- `sent_at` (DATETIME)
- `acknowledged_at` (DATETIME)
- `status` (TEXT): `PENDING`, `SENT`, `ACKNOWLEDGED`, `EXPIRED`
- `acknowledgement_channel` (TEXT)
- `plan_version` (INTEGER)

### `audit_logs`
- `id` (INTEGER PK)
- `actor_id` (INTEGER FK -> users)
- `role` (TEXT)
- `division` (TEXT)
- `action` (TEXT): `RECOMMEND`, `APPROVE`, `REJECT`, `MODIFY`, `OVERRIDE`
- `plan_id` (INTEGER FK -> block_plans)
- `plan_version` (INTEGER)
- `reason_code` (TEXT)
- `reason_text` (TEXT)
- `input_snapshot_reference` (TEXT)
- `rules_version` (TEXT)
- `cost_breakdown_json` (TEXT)
- `created_at` (DATETIME)

## 2. Lane Rules

The system classifies tasks into "Lanes" based on urgency and flexibility:

- **A_EMERGENCY**: Emergency / safety-critical tasks. These must NOT be scheduled by the optimizer. The existing authorized Railway emergency procedure handles it. The optimizer considers this lane visible but ineligible for scheduling.
- **B1_PLANNED**: Normal planned / preventive maintenance tasks. These are highly flexible and can be fully optimized within windows.
- **B2_STATUTORY**: Statutory-due work tasks. These can be optimized for scheduling but *cannot* silently be deferred beyond their deadline.

## 3. Demo Scale Parameters

This prototype data uses the following simulated scale:
- **4 Stations** (Station A, B, C, D)
- **3 Block Sections** (~58 km total corridor length):
  - 2 double-line sections
  - 1 single-line section
- **22 Planned Tasks** (13 Engineering, 5 TRD, 4 S&T)
- **Train Traffic**: ~96 simulated trains per day across the corridor
- **Resources**: 1 Tamping machine, 1 OHE tower resource, 4 gangs
- **TSR Scenarios**: 2 active Temporary Speed Restrictions (TSR) scenarios
- **Planning Horizon**: 7-day lookahead
- **Granularity**: 15-minute scheduling slots

## 4. Priority vs. Train Cost

Priority is NOT directly added to the train-minute cost. Instead, Priority is utilized for UI sorting, priority bands mapping, greedy fallback logic, and risk/late-completion selection during solver phases. Cost fields directly map to impact factors (e.g. train impact, instability).
