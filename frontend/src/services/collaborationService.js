import api from './api';

/**
 * Service to handle community collaboration (comments, follows, bookmarks, shares).
 */

export const addComment = (incidentId, content, parentId = null) => {
  return api.post('/api/comments', { incidentId, content, parentId });
};

export const getComments = (incidentId) => {
  return api.get(`/api/comments/${incidentId}`);
};

export const likeComment = (commentId) => {
  return api.post(`/api/comments/${commentId}/like`);
};

export const followUser = (targetEmail) => {
  return api.post(`/api/follow?targetEmail=${targetEmail}`);
};

export const unfollowUser = (targetEmail) => {
  return api.delete(`/api/follow?targetEmail=${targetEmail}`);
};

export const getFollowing = () => {
  return api.get('/api/follow/following');
};

export const saveReport = (incidentId) => {
  return api.post(`/api/save/${incidentId}`);
};

export const unsaveReport = (incidentId) => {
  return api.delete(`/api/save/${incidentId}`);
};

export const getSavedReportIds = () => {
  return api.get('/api/save/saved');
};

export const logShare = (incidentId) => {
  return api.post(`/api/share/${incidentId}`);
};
