import api from './api';

/**
 * Service to retrieve and clear user notification center logs.
 */

export const getNotifications = () => {
  return api.get('/api/notifications');
};

export const markAllAsRead = () => {
  return api.post('/api/notifications/read');
};
