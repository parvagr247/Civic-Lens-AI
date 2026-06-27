import api from './api';

/**
 * Service to manage REST API interactions with risk intelligence endpoints.
 */

/**
 * Fetches the risk assessment scorecard associated with an incident.
 *
 * @param {string} incidentId Incident UUID.
 * @returns {Promise<Object>} The api response envelope containing the RiskAssessmentResponse.
 */
export const getRiskByIncidentId = (incidentId) => {
  return api.get(`/api/issues/${incidentId}/risk`);
};

/**
 * Triggers AI risk re-analysis for a specific incident.
 *
 * @param {string} incidentId Incident UUID.
 * @returns {Promise<Object>} The api response envelope containing the updated RiskAssessmentResponse.
 */
export const reanalyzeRisk = (incidentId) => {
  return api.post(`/api/issues/${incidentId}/risk/reanalyze`);
};

/**
 * Fetches all high risk assessments across the city.
 *
 * @returns {Promise<Object>} The api response envelope containing a list of RiskAssessmentResponse.
 */
export const getHighRiskIncidents = () => {
  return api.get('/api/risk/high');
};

/**
 * Fetches city-wide aggregated risk statistics and distribution maps.
 *
 * @returns {Promise<Object>} The api response envelope containing the RiskStatisticsResponse.
 */
export const getRiskStatistics = () => {
  return api.get('/api/risk/statistics');
};
