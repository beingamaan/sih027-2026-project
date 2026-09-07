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
  
  if (!res.data.tasks) {
    res.data.tasks = [];
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
