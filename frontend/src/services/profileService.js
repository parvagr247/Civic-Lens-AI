import api from './api';

/**
 * Service to handle profile retrieval and modification.
 */

export const getProfile = (userId) => {
  return api.get(`/api/profile/${userId}`);
};

export const updateProfile = (data) => {
  return api.put('/api/profile', data);
};
