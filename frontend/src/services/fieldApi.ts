import { api } from './api';
import type { Task } from '../types';

export const getFieldTasks = async () => {
  const res = await api.get<{ tasks: Task[] }>('/api/field/tasks');
  return res.data.tasks || res.data;
};

export const acknowledgeFieldTask = async (taskId: number, reason = 'Task acknowledged by supervisor') => {
  const res = await api.post<any>(`/api/field/tasks/${taskId}/acknowledge`, { reason, user_id: 1 });
  return res.data;
};

export const readyFieldTask = async (taskId: number, reason = 'Site, gang & machinery ready at location') => {
  const res = await api.post<any>(`/api/field/tasks/${taskId}/ready`, { reason, user_id: 1 });
  return res.data;
};

export const startFieldTask = async (taskId: number, reason = 'Block acquired, maintenance work started') => {
  const res = await api.post<any>(`/api/field/tasks/${taskId}/start`, { reason, user_id: 1 });
  return res.data;
};

export const completeFieldTask = async (taskId: number, reason = 'Work completed and track inspected') => {
  const res = await api.post<any>(`/api/field/tasks/${taskId}/complete`, { reason, user_id: 1 });
  return res.data;
};

export const handbackFieldTask = async (taskId: number, reason = 'TSR applied, block handed back to controller') => {
  const res = await api.post<any>(`/api/field/tasks/${taskId}/handback`, { reason, user_id: 1 });
  return res.data;
};
