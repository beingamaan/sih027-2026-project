import { api } from './api';

export const getNotifications = async () => {
  // Backend doesn't have a dedicated GET notifications endpoint yet,
  // so we return empty and let the page use mock data for demo
  return [];
};

export const acknowledgeNotification = async (notificationId: number) => {
  return api.post('/api/field/events/sync', {
    task_id: notificationId,
    event_type: 'ACKNOWLEDGED',
  });
};
