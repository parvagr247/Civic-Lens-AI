import api from './api';

/**
 * Service to manage REST API interactions for the Incident Management System (Admin Console).
 */

/**
 * Fetches paginated, filtered, and sorted incidents for the management queue.
 * @param {Object} params Filter & paging specifications.
 */
export const getIncidentQueue = (params = {}) => {
  const {
    page = 0,
    size = 25,
    sort = 'createdAt',
    direction = 'desc',
    status = '',
    priority = '',
    department = '',
    category = '',
    city = '',
    search = '',
    resolved = false,
    unassigned = false,
    duplicate = false,
    requiresReview = false,
    highRisk = false
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('size', size);
  queryParams.append('sort', sort);
  queryParams.append('direction', direction);
  if (status) queryParams.append('status', status);
  if (priority) queryParams.append('priority', priority);
  if (department) queryParams.append('department', department);
  if (category) queryParams.append('category', category);
  if (city) queryParams.append('city', city);
  if (search) queryParams.append('search', search);
  if (resolved) queryParams.append('resolved', resolved);
  if (unassigned) queryParams.append('unassigned', unassigned);
  if (duplicate) queryParams.append('duplicate', duplicate);
  if (requiresReview) queryParams.append('requiresReview', requiresReview);
  if (highRisk) queryParams.append('highRisk', highRisk);

  return api.get(`/api/issues/queue?${queryParams.toString()}`);
};

/**
 * Bulk assigns a department to multiple incidents.
 */
export const bulkAssignDepartment = (incidentIds, department) => {
  return api.post('/api/issues/bulk/assign-department', { incidentIds, department });
};

/**
 * Bulk dispatches incidents to a specific field officer.
 */
export const bulkAssignOfficer = (incidentIds, officerId) => {
  return api.post('/api/issues/bulk/assign-officer', { incidentIds, officerId });
};

/**
 * Bulk transitions status for multiple incidents.
 */
export const bulkChangeStatus = (incidentIds, status) => {
  return api.post('/api/issues/bulk/change-status', { incidentIds, status });
};

/**
 * Bulk closes multiple incidents.
 */
export const bulkCloseIncidents = (incidentIds) => {
  return api.post('/api/issues/bulk/close', { incidentIds });
};

/**
 * Bulk merges duplicate reports into a master incident.
 */
export const bulkMergeDuplicates = (incidentIds) => {
  return api.post('/api/issues/bulk/merge-duplicates', { incidentIds });
};

/**
 * Bulk marks reports as verified resolutions.
 */
export const bulkMarkVerified = (incidentIds) => {
  return api.post('/api/issues/bulk/mark-verified', { incidentIds });
};
