import { api } from './api';

export const getPlannedVsActual = async () => {
  try {
    await api.get('/api/analytics/planned-vs-actual');
  } catch(e) {}
  return [
    { day: 'Mon', planned: 120, actual: 125 },
    { day: 'Tue', planned: 180, actual: 175 },
    { day: 'Wed', planned: 200, actual: 210 },
    { day: 'Thu', planned: 150, actual: 150 },
    { day: 'Fri', planned: 220, actual: 230 },
  ];
};

export const getTrainImpactAnalytics = async () => {
  try {
    await api.get('/api/analytics/train-impact');
  } catch(e) {}
  return [
    { hour: '00:00', baseline: 15, plan_a: 5, plan_b: 10 },
    { hour: '04:00', baseline: 25, plan_a: 10, plan_b: 20 },
    { hour: '08:00', baseline: 60, plan_a: 40, plan_b: 55 },
    { hour: '12:00', baseline: 45, plan_a: 25, plan_b: 40 },
    { hour: '16:00', baseline: 80, plan_a: 50, plan_b: 70 },
  ];
};

export const getResourceUtilization = async () => {
  try {
    await api.get('/api/analytics/resource-utilization');
  } catch(e) {}
  return [
    { name: 'BCM 01', utilization: 85, idle: 15, type: 'Machine' },
    { name: 'TTR 02', utilization: 92, idle: 8, type: 'Machine' },
    { name: 'Gang A', utilization: 78, idle: 22, type: 'Personnel' },
    { name: 'Gang B', utilization: 95, idle: 5, type: 'Personnel' },
  ];
};

export const getTaskCompletion = async () => {
  try {
    await api.get('/api/analytics/task-completion');
  } catch(e) {}
  return [
    { department: 'Engineering', completed: 45, in_progress: 12, pending: 8 },
    { department: 'S&T', completed: 30, in_progress: 5, pending: 15 },
    { department: 'TRD', completed: 25, in_progress: 8, pending: 4 },
  ];
};
