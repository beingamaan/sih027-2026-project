import { api } from './api';
import type { DashboardSummary, OperationalRisk, Task, Plan } from '../types';

export const getSummary = async () => {
  const res = await api.get<DashboardSummary>('/api/dashboard/summary');
  return res.data;
};

export const getDashboardTasks = async () => {
  const res = await api.get<{ tasks: Task[] }>('/api/dashboard/tasks');
  return res.data.tasks || res.data;
};

export const getDashboardPlans = async () => {
  const res = await api.get<{ plans: Plan[] }>('/api/dashboard/plans');
  return res.data.plans || res.data;
};

export const getDashboardRisks = async () => {
  const res = await api.get<{ risks: OperationalRisk[] }>('/api/dashboard/risks');
  return res.data.risks || res.data;
};

export const getTrainImpact = async () => {
  const res = await api.get<{
    baseline: number;
    plan_a: number;
    plan_b: number;
    chart_data: Array<{ section: string; baseline: number; plan_a: number; plan_b: number }>;
  }>('/api/dashboard/train-impact');
  return res.data;
};
