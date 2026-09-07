export type LaneType = 'A_EMERGENCY' | 'B1_PLANNED' | 'B2_STATUTORY' | 'LANE_A' | 'LANE_B1' | 'LANE_B2';
export type PriorityType = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'ACKNOWLEDGED' | 'READY' | 'WORK_STARTED' | 'WORK_COMPLETED' | 'LINE_HANDED_BACK' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
export type ReadinessLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type SolverStatus = 'OPTIMAL' | 'FEASIBLE' | 'HEURISTIC' | 'NO_SOLUTION';
export type UserRole = 'FIELD_SUPERVISOR' | 'SECTION_CONTROLLER' | 'DIVISIONAL_OFFICER';

export interface Task {
  id: number;
  task_code: string;
  department: string;
  work_type: string;
  description?: string;
  asset_id?: number | null;
  block_section_id: number;
  elementary_section_id?: number | null;
  interlocking_area_id?: number | null;
  km_from: number;
  km_to: number;
  lane: LaneType;
  safety_class?: string | null;
  priority?: PriorityType | string;
  priority_band?: PriorityType | null;
  priority_score?: number | null;
  requires_line_block: number;
  requires_power_block: number;
  requires_disconnection: number;
  required_block_type?: string | null;
  estimated_duration_minutes: number;
  duration_buffer_minutes: number;
  actual_duration_minutes?: number | null;
  p50_duration_minutes?: number | null;
  p90_duration_minutes?: number | null;
  overrun_probability?: number | null;
  required_machine_type?: string | null;
  required_machine?: string | null;
  required_gang_size?: number | null;
  required_gang?: number | null;
  material_ready: number;
  ptw_ready: number;
  power_ready: number;
  power_permit_ready?: number;
  disconnection_ready: number;
  worksite_ready: number;
  site_ready?: number;
  machine_ready?: number;
  gang_ready?: number;
  weather_suitable: number;
  statutory_due_date?: string | null;
  deadline?: string | null;
  overdue_days: number;
  post_work_tsr_speed_kmph?: number | null;
  post_work_tsr_days?: number | null;
  post_work_tsr_cost?: number | null;
  status: TaskStatus | string;
  task_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskClassification {
  lane: LaneType;
  optimizer_eligible: boolean;
  message: string;
  reason?: string;
}

export interface TaskReadiness {
  status: ReadinessLevel;
  level?: ReadinessLevel;
  reasons: string[];
}

export interface PlannedTask {
  id: number;
  task_id: number;
  task_code?: string;
  department?: string;
  lane?: string;
  block_window_id: number;
  planned_start: string;
  planned_end: string;
  planned_duration_minutes?: number;
  setup_minutes?: number;
  work_minutes?: number;
  clearance_minutes?: number;
  handback_minutes?: number;
  deferred: number;
  defer_reason?: string | null;
  explanation?: string | null;
  km_from?: number;
  km_to?: number;
  readiness_level?: string;
}

export interface Plan {
  id: number;
  plan_code: string;
  version: number;
  plan_type: 'PLAN_A' | 'PLAN_B';
  horizon_start: string;
  horizon_end: string;
  total_cost?: number | null;
  total_estimated_cost?: number | null;
  train_impact_cost?: number | null;
  estimated_train_impact_minutes?: number | null;
  tsr_cost?: number | null;
  estimated_tsr_cost?: number | null;
  failure_risk_cost?: number | null;
  late_completion_cost?: number | null;
  instability_cost?: number | null;
  solver_status: SolverStatus;
  solver_time_seconds?: number | null;
  approval_status: string;
  approved_by?: number | null;
  approved_at?: string | null;
  override_reason?: string | null;
  created_at: string;
  tasks?: PlannedTask[] | any[];
}

export interface BlockWindow {
  id: number;
  window_code: string;
  block_section_id: number;
  start_time: string;
  end_time: string;
  line: string;
  block_type: string;
  valid: number;
  calendar_restriction?: string | null;
  restriction_reason?: string | null;
}

export interface WhatIfRequest {
  scenario: string;
  delay_minutes?: number | null;
  task_id?: number | null;
  resource_id?: number | null;
}

export interface WhatIfResponse {
  affected_tasks: number[];
  added_cost: number;
  conflicts: string[];
  plan_b_recommendation: string;
}

export interface OperationalRisk {
  risk_type: string;
  severity: string;
  task_id: number;
  title?: string;
  detail?: string;
}

export interface DashboardSummary {
  total_tasks: number;
  total_plans: number;
  status: string;
  open_tasks?: number;
  lane_a_count?: number;
  lane_b1_count?: number;
  lane_b2_count?: number;
  generated_plans?: number;
}

export interface Notification {
  id: number;
  notification_code: string;
  block_plan_id?: number | null;
  recipient_user_id: number;
  message: string;
  sent_at: string;
  acknowledged_at?: string | null;
  status: 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'EXPIRED';
  acknowledgement_channel?: string | null;
  plan_version?: number | null;
}

export interface BlockEvent {
  id: number;
  block_plan_id: number;
  block_section_id: number;
  event_type: string;
  event_time: string;
  actor_id: number;
  loss_code?: string | null;
  notes?: string | null;
  client_event_uuid?: string | null;
}

export interface TrainPath {
  id: number;
  train_number: string;
  train_class: string;
  block_section_id: number;
  line: string;
  scheduled_start: string;
  scheduled_end: string;
  direction: string;
  traffic_density_factor?: number;
}

export interface Station {
  id: number;
  station_code: string;
  name: string;
  division: string;
  chainage_km: number;
}

export interface Resource {
  id: number;
  resource_code: string;
  resource_type: string;
  name: string;
  department: string;
  status: string;
}

export interface FieldEvent {
  id?: string;
  task_id: number;
  event_type: string;
  loss_code?: string | null;
  notes?: string | null;
  client_event_uuid: string;
  timestamp: string;
  synced: boolean;
}

export const LOSS_CODES = [
  { value: 'LATE_LINE_CLEAR', label: 'Late Line Clear' },
  { value: 'MACHINE_LATE', label: 'Machine Late' },
  { value: 'MATERIAL_SHORT', label: 'Material Shortage' },
  { value: 'STAFF_SHORT', label: 'Staff Shortage' },
  { value: 'PTW_DELAY', label: 'PTW Delay' },
  { value: 'WEATHER', label: 'Weather' },
  { value: 'EQUIPMENT_FAILURE', label: 'Equipment Failure' },
  { value: 'SCOPE_GROWTH', label: 'Scope Growth' },
  { value: 'TRAFFIC_PRESSURE', label: 'Traffic Pressure' },
  { value: 'OTHER', label: 'Other' },
] as const;
