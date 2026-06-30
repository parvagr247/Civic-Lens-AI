import api from './api';

/**
 * Service to manage REST API interactions with incident analysis endpoints.
 */

/**
 * Fetches structured AI vision analysis details for a specific incident.
 *
 * @param {string} incidentId Incident UUID.
 * @returns {Promise<Object>} The api response envelope containing the IncidentAnalysis.
 */
export const getIncidentAnalysis = (incidentId) => {
  return api.get(`/api/issues/${incidentId}/analysis`);
};

/**
 * Fetches the unified AI Multi-Agent Orchestration findings and execution log records.
 *
 * @param {string} incidentId Incident UUID.
 * @returns {Promise<Object>} The api response envelope containing AgentOrchestrationResult.
 */
export const getIncidentOrchestration = (incidentId) => {
  return api.get(`/api/issues/${incidentId}/orchestration`);
};

