import api from './api';

/**
 * Service to orchestrate municipal dispatches, task dispatches, and internal messaging.
 */

export const createOfficer = (name, email, password, department) => {
  return api.post('/api/officers', { name, email, password, department });
};

export const getAllOfficers = () => {
  return api.get('/api/officers');
};

export const assignIncident = (incidentId, officerId, deadline, priority, instructions) => {
  return api.post('/api/assignments', { incidentId, officerId, deadline, priority, instructions });
};

export const getAssignmentsForOfficer = () => {
  return api.get('/api/assignments/officer');
};

export const getAssignmentForIncident = (incidentId) => {
  return api.get(`/api/assignments/incident/${incidentId}`);
};

export const updateAssignmentStatus = (assignmentId, status, internalNotes = '', completionImageUrl = '', completionReport = '') => {
  return api.patch(`/api/assignments/${assignmentId}/status`, {
    status,
    internalNotes,
    completionImageUrl,
    completionReport
  });
};

export const sendChatMessage = (roomId, text) => {
  return api.post(`/api/chat/${roomId}`, { text });
};

export const getChatMessages = (roomId) => {
  return api.get(`/api/chat/${roomId}`);
};
