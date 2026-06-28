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

export const markAsRead = (id) => {
  return api.post(`/api/notifications/${id}/read`);
};

export const deleteNotification = (id) => {
  return api.delete(`/api/notifications/${id}`);
};

export const deleteAllNotifications = () => {
  return api.delete('/api/notifications');
};
