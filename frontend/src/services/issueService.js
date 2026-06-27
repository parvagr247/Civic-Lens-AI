import api from './api';

/**
 * Service to manage REST API interactions with the /api/issues endpoints.
 */

/**
 * Reports a new civic incident, uploading the file and meta-parameters.
 *
 * @param {FormData} formData Multipart form containing image, title, description, and location.
 * @param {Function} onUploadProgress Axios callback function to track file upload progress.
 * @returns {Promise<Object>} The api response envelope containing the created Incident.
 */
export const createIncident = (formData, onUploadProgress) => {
  return api.post('/api/issues', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    // Track file upload progress using Axios config
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });
};

/**
 * Fetches all registered incidents.
 * @returns {Promise<Object>} List of incidents.
 */
export const getAllIncidents = () => {
  return api.get('/api/issues');
};

/**
 * Fetches detail information of a specific incident.
 * @param {string} id Unique incident UUID.
 * @returns {Promise<Object>} Incident details.
 */
export const getIncidentById = (id) => {
  return api.get(`/api/issues/${id}`);
};
