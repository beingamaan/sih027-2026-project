export type LaneType = 'A_EMERGENCY' | 'B1_PLANNED' | 'B2_STATUTORY' | 'LANE_A' | 'LANE_B1' | 'LANE_B2';
export type PriorityBand = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'ACKNOWLEDGED' | 'READY' | 'WORK_STARTED' | 'WORK_COMPLETED' | 'LINE_HANDED_BACK' | 'CLOSED' | 'REPORTED' | 'VERIFIED' | 'ELIGIBLE' | 'SCHEDULED' | 'EXECUTED' | 'DEFERRED' | 'LANE_A_MANUAL' | 'CANCELLED';
export type DepartmentType = 'ENGINEERING' | 'TRD' | 'S_AND_T' | 'ENG' | 'SNT';
export type SolverStatus = 'OPTIMAL' | 'FEASIBLE' | 'HEURISTIC' | 'NO_SOLUTION';

export interface Station {
  id: number;
  station_code: string;
  name: string;
  chainage_km: number;
}

export interface PhysicalLine {
  id: number;
  line_code: 'UP' | 'DOWN' | 'ALL';
  line_name: string;
  line_type: 'DOUBLE_MAIN' | 'SINGLE_MAIN';
  speed_limit_kmph: number;
}

export interface BlockSection {
  id: number;
  section_code: string;
  from_station_id: number;
  to_station_id: number;
  km_start: number;
  km_end: number;
  number_of_lines: number;
  lines: PhysicalLine[];
}

export interface TSR {
  id: number;
  defect_code: string;
  speed_kmph: number;
  km_start: number;
  km_end: number;
  severity: string;
  description: string;
}

export interface CorridorState {
  corridor_name: string;
  total_km: number;
  km_start: number;
  km_end: number;
  stations: Station[];
  sections: BlockSection[];
  active_tsrs: TSR[];
  block_windows: any[];
}

export interface Task {
  id: number;
  task_code: string;
  department: DepartmentType;
  work_type: string;
  block_section_id: number;
  km_from: number;
  km_to: number;
  lane: LaneType;
  safety_class?: string;
  priority_band?: PriorityBand;
  priority_score?: number;
  readiness_score?: number;
  readiness_status?: 'HIGH' | 'MEDIUM' | 'LOW';
  readiness_reasons?: string[];
  requires_line_block: number;
  requires_power_block: number;
  requires_disconnection: number;
  estimated_duration_minutes: number;
  duration_buffer_minutes: number;
  material_ready: number;
  ptw_ready: number;
  power_ready: number;
  disconnection_ready: number;
  worksite_ready: number;
  weather_suitable: number;
  statutory_due_date?: string;
  overdue_days: number;
  status: TaskStatus;
  read_only?: boolean;
  co_block_partner?: boolean;
  is_co_block_partner?: boolean;
  can_edit?: boolean;
  can_verify?: boolean;
  edit_actions?: string[];
  created_at?: string;
  dept?: string;
  workflow_lane?: string;
  start_km?: number;
  end_km?: number;
  duration_min?: number;
  priority_pts?: number;
  readiness_pts?: number;
}

export interface TrainPath {
  id: number;
  train_number: string;
  train_name?: string;
  train_class: string;
  train_type?: string;
  max_speed_kmph?: number;
  weight_category?: string;
  block_section_id: number;
  line: string;
  scheduled_start: string;
  scheduled_end: string;
  start_km: number;
  end_km: number;
  direction: 'UP' | 'DOWN';
  traffic_density_factor: number;
  priority_weight: number;
}

export interface Resource {
  id: number;
  resource_code: string;
  resource_type: string;
  name: string;
  department: string;
  home_location?: string;
  capacity?: number;
  status: string;
}

export interface PlannedAssignment {
  id?: number;
  task_id: number;
  task_code: string;
  department: string;
  work_type: string;
  km_from: number;
  km_to: number;
  section_name: string;
  lane: string;
  block_window_id: number;
  planned_start: string;
  planned_end: string;
  setup_minutes: number;
  work_minutes: number;
  clearance_minutes: number;
  handback_minutes: number;
  readiness_score: number;
  readiness_level?: string;
  priority_score?: number;
  explanation: string;
  deferred?: number;
}

export interface Plan {
  id: number;
  plan_code: string;
  version?: number;
  plan_version?: number;
  plan_type: 'PLAN_A' | 'PLAN_B';
  horizon_start: string;
  horizon_end: string;
  total_cost?: number;
  train_impact_cost?: number;
  tsr_cost?: number;
  total_duration_minutes?: number;
  total_delay_cost_wtm?: number;
  solver_status?: SolverStatus;
  approval_status?: string;
  status?: string;
  override_reason?: string;
  created_at: string;
  tasks?: PlannedAssignment[];
}

export interface DualPlanResponse {
  message: string;
  plan_a_id: number;
  plan_b_id: number;
  solver_status: string;
  plan_a: {
    id: number;
    plan_code: string;
    plan_type: string;
    total_cost: number;
    train_impact_cost: number;
    approval_status: string;
    assignments: PlannedAssignment[];
  };
  plan_b: {
    id: number;
    plan_code: string;
    plan_type: string;
    total_cost: number;
    train_impact_cost: number;
    approval_status: string;
    assignments: PlannedAssignment[];
  };
}

export interface DashboardSummary {
  total_tasks: number;
  open_tasks: number;
  lane_a_count: number;
  lane_b1_count: number;
  lane_b2_count: number;
  high_readiness_pct: number;
  generated_plans: number;
  active_track_blocks: number;
  active_tsrs: number;
  total_corridor_km: number;
  solver_status: string;
  operational_mode: string;
  status: string;
}

export interface WhatIfResponse {
  scenario: string;
  delay_minutes: number;
  additional_weighted_train_minutes: number;
  train_impact_change: string;
  plan_b_recommended: boolean;
  risks: string[];
  explanation: string;
  affected_tasks: number[];
  original_schedule: string;
  revised_schedule: string;
}

export interface AuditLog {
  id: number;
  actor_id: number | string;
  role: string;
  division?: string;
  division_id?: string;
  action: string;
  plan_id?: number;
  plan_version?: number;
  reason_code?: string;
  reason_text?: string;
  rules_version?: string;
  created_at: string;
}

export const LOSS_CODES = [
  { value: 'LATE_LINE_CLEAR', label: 'Late Line Clear Sanction (Operating regulation)' },
  { value: 'MACHINE_LATE', label: 'Machine / Tower Wagon Transit Delay' },
  { value: 'MATERIAL_SHORT', label: 'Material & Fitting Shortage at Site' },
  { value: 'STAFF_SHORT', label: 'P-Way / S&T Maintenance Crew Shortage' },
  { value: 'PTW_DELAY', label: 'OHE Isolation Permit / PTW Issue Delay' },
  { value: 'WEATHER', label: 'Adverse Monsoon / Gale Weather Conditions' },
  { value: 'EQUIPMENT_FAILURE', label: 'On-site Machinery Breakdown (Tamping/Wagon)' },
  { value: 'TRAFFIC_PRESSURE', label: 'Heavy Traffic Pressure / Urgent Train Passing' },
  { value: 'OTHER', label: 'Other Operational Cause' },
] as const;
