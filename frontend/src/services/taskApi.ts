import { api } from './api';
import type { Task, TaskClassification, TaskReadiness } from '../types';

export const getTasks = async (params?: { department?: string; lane?: string; priority?: string; status?: string }) => {
  const res = await api.get<Task[]>('/api/tasks', { params });
  return res.data;
};

export const getTaskDetails = async (id: number | string) => {
  const res = await api.get<Task>(`/api/tasks/${id}`);
  return res.data;
};

export const classifyTask = async (id: number | string) => {
  const res = await api.post<TaskClassification>(`/api/tasks/${id}/classify`);
  return res.data;
};

export const getTaskReadiness = async (id: number | string) => {
  const res = await api.get<TaskReadiness>(`/api/tasks/${id}/readiness`);
  return res.data;
};
