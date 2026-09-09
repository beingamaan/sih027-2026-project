import { api } from './api';
import { 
  DashboardSummary, Task, TrainPath, Resource, CorridorState, 
  Plan, DualPlanResponse, WhatIfResponse, AuditLog 
} from '../types';

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await api.get('/api/dashboard/summary');
  return res.data;
};

export const getDashboardRisks = async (): Promise<any[]> => {
  const res = await api.get('/api/dashboard/risks');
  return res.data;
};

export const getDashboardTrainImpact = async (): Promise<any> => {
  const res = await api.get('/api/dashboard/train-impact');
  return res.data;
};

export const getTasks = async (): Promise<Task[]> => {
  const res = await api.get('/api/tasks');
  return res.data;
};

export const getFieldTasks = async (): Promise<Task[]> => {
  const res = await api.get('/api/tasks/field');
  return res.data;
};

export const getTask = async (id: number): Promise<Task> => {
  const res = await api.get(`/api/tasks/${id}`);
  return res.data;
};

export const createTask = async (payload: any): Promise<Task> => {
  const res = await api.post('/api/tasks', payload);
  return res.data;
};

export const ingestDefect = async (payload: {
  description: string;
  km_from: number;
  km_to: number;
  severity: string;
  department?: string;
  safety_protocol_acknowledged?: boolean;
  estimated_duration_minutes?: number;
}): Promise<any> => {
  const res = await api.post('/api/tasks/ingest/defect', payload);
  return res.data;
};

export const calculateReadiness = async (payload: {
  machine: number;
  gang: number;
  material: number;
  ptw: number;
  site_weather: number;
}): Promise<any> => {
  const res = await api.post('/api/tasks/calculate-readiness', payload);
  return res.data;
};

export const getTrains = async (): Promise<TrainPath[]> => {
  const res = await api.get('/api/trains');
  return res.data;
};

export const getResources = async (): Promise<Resource[]> => {
  const res = await api.get('/api/resources');
  return res.data;
};

export const getCorridorState = async (): Promise<CorridorState> => {
  const res = await api.get('/api/corridor/state');
  return res.data;
};

export const generateDualPlans = async (): Promise<DualPlanResponse> => {
  const res = await api.post('/api/plans/generate');
  return res.data;
};

export const getPlans = async (): Promise<Plan[]> => {
  const res = await api.get('/api/plans');
  return res.data;
};

export const getPlan = async (id: number): Promise<Plan> => {
  const res = await api.get(`/api/plans/${id}`);
  return res.data;
};

export const approvePlan = async (id: number): Promise<{ success: boolean; message: string }> => {
  const res = await api.post(`/api/plans/${id}/approve`);
  return res.data;
};

export const overridePlan = async (id: number, reason: string): Promise<{ success: boolean; message: string }> => {
  const res = await api.post(`/api/plans/${id}/override?reason=${encodeURIComponent(reason)}`);
  return res.data;
};

export const replanPlan = async (id: number, reason: string): Promise<any> => {
  const res = await api.post(`/api/plans/${id}/replan?reason=${encodeURIComponent(reason)}`);
  return res.data;
};

export const evaluateWhatIf = async (scenario: string, delayMinutes: number = 30): Promise<WhatIfResponse> => {
  const res = await api.post('/api/what-if', {
    scenario,
    delay_minutes: delayMinutes
  });
  return res.data;
};

export const recordBlockEvent = async (payload: {
  task_id?: number;
  block_plan_id?: number;
  block_section_id?: number;
  event_type: string;
  loss_code?: string;
  notes?: string;
  client_event_uuid?: string;
}): Promise<{ success: boolean; message: string }> => {
  const res = await api.post('/api/block-events', payload);
  return res.data;
};

export const submitFieldEvent = async (payload: {
  block_id: number;
  task_id: number;
  event_type: string;
  plan_version: number;
  loss_code?: string;
  remarks?: string;
}): Promise<{ success: boolean; message: string; event_id?: number; plan_version?: number; safety_disclaimer?: string }> => {
  const res = await api.post('/api/field/events', payload);
  return res.data;
};

export const getPartnerStatus = async (blockId: number): Promise<any[]> => {
  const res = await api.get(`/api/field/blocks/${blockId}/partner-status`);
  return res.data;
};

export const getAnalytics = async (): Promise<any> => {
  const res = await api.get('/api/analytics');
  return res.data;
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  const res = await api.get('/api/audit');
  return res.data;
};
