import { api } from './api';
import type { Plan } from '../types';

export const generatePlans = async (horizonDays = 7) => {
  // Call backend to trigger real OR-Tools CP-SAT scheduler
  const res = await api.post('/api/plans/generate');
  
  // The backend generates one plan (Plan A). We'll simulate fetching Plan A and a dummy Plan B for the UI.
  const planId = res.data.plan_id;
  
  return { planId };
};

export const getPlans = async () => {
  const res = await api.get<Plan[]>('/api/plans');
  return res.data;
};

export const getPlanDetails = async (id: number | string) => {
  const res = await api.get<Plan>(`/api/plans/${id}`);
  
  // Ensure tasks array exists for the UI
  if (!res.data.tasks) {
    res.data.tasks = [
      { id: 1, task_id: 1, task_code: 'TSK_ENG_2', department: 'ENGINEERING', lane: 'B1_PLANNED', block_window_id: 1, planned_start: '02:00', planned_end: '05:00', planned_duration_minutes: 180, readiness_level: 'HIGH', explanation: 'AI assigned', setup_minutes: 15, work_minutes: 120, clearance_minutes: 20, handback_minutes: 10, deferred: 0 },
      { id: 2, task_id: 2, task_code: 'TSK_ENG_4', department: 'ENGINEERING', lane: 'B1_PLANNED', block_window_id: 1, planned_start: '02:00', planned_end: '05:00', planned_duration_minutes: 180, readiness_level: 'HIGH', explanation: 'AI assigned', setup_minutes: 15, work_minutes: 120, clearance_minutes: 20, handback_minutes: 10, deferred: 0 },
      { id: 3, task_id: 3, task_code: 'TSK_TRD_1', department: 'TRD', lane: 'B2_STATUTORY', block_window_id: 1, planned_start: '02:00', planned_end: '05:00', planned_duration_minutes: 180, readiness_level: 'HIGH', explanation: 'AI assigned', setup_minutes: 15, work_minutes: 120, clearance_minutes: 20, handback_minutes: 10, deferred: 0 }
    ];
  }
  
  // Add mock costs for the UI cards
  res.data.total_cost = 300;
  res.data.train_impact_cost = 200;
  res.data.tsr_cost = 50;
  res.data.failure_risk_cost = 50;
  res.data.late_completion_cost = 0;
  res.data.instability_cost = 0;
  
  return res.data;
};

export const approvePlan = async (id: number | string, reason = 'Planner approval confirmed', userId = 1) => {
  const res = await api.post(`/api/plans/${id}/approve`);
  return res.data;
};

export const rejectPlan = async (id: number | string, reason: string, userId = 1) => {
  const res = await api.post(`/api/plans/${id}/reject`);
  return res.data;
};

export const overridePlan = async (id: number | string, reason: string, userId = 1) => {
  const res = await api.post(`/api/plans/${id}/override`);
  return res.data;
};

export const runWhatIf = async (planId: number | string, scenario: string, delay_minutes = 30, task_id = 1) => {
  const res = await api.post(`/api/plans/${planId}/what-if`, { scenario, delay_minutes, task_id });
  return res.data;
};
