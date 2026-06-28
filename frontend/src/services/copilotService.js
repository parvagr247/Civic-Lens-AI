import api from './api';

/**
 * Service to manage REST API interactions with autonomous AI agents,
 * RAG copilots, duplicate checks, predictions, and timelines.
 */

/**
 * Send query message to the central Grounded RAG Copilot.
 * @param {string} message Query text.
 * @returns {Promise<Object>} Generated markdown reply message envelope.
 */
export const sendCopilotMessage = (message) => {
  return api.post('/api/copilot/chat', { message });
};

/**
 * Fetch conversational context log memory for the active user.
 * @returns {Promise<Object>} Messages history payload.
 */
export const getCopilotHistory = () => {
  return api.get('/api/copilot/history');
};

/**
 * Clear conversational session memory logs.
 * @returns {Promise<Object>} API feedback envelope.
 */
export const clearCopilotHistory = () => {
  return api.delete('/api/copilot/history');
};

/**
 * Execute automated visual and spatial duplicate analysis on an incident report.
 * @param {string} id Incident UUID.
 * @returns {Promise<Object>} Duplicate check score and list matching indicators.
 */
export const getDuplicateCheck = (id) => {
  return api.post(`/api/incidents/${id}/duplicate-check`);
};

/**
 * Fetch structural repair forecasts (cost, SLA difficulty, travel times).
 * @param {string} id Incident UUID.
 * @returns {Promise<Object>} Predictions payload.
 */
export const getIncidentPredictions = (id) => {
  return api.get(`/api/predictions/${id}`);
};

/**
 * Fetch dispatch suggestions, required gear lists, and detour actions.
 * @param {string} id Incident UUID.
 * @returns {Promise<Object>} Recommendations details.
 */
export const getAIRecommendationDetails = (id) => {
  return api.post(`/api/incidents/${id}/recommendation`);
};

/**
 * Fetch execution timestamps for AI Agents processing this incident.
 * @param {string} id Incident UUID.
 * @returns {Promise<Object>} List of timeline steps.
 */
export const getAiTimeline = (id) => {
  return api.get(`/api/incidents/${id}/timeline`);
};

/**
 * Fetch global AI agent accuracy precision indexes.
 * @returns {Promise<Object>} Analytics data.
 */
export const getAiAnalytics = () => {
  return api.get('/api/analytics/ai');
};
