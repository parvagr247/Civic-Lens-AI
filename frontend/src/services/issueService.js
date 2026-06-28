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

/**
 * Request OTP code for anonymous report filing.
 * @param {string} emailOrPhone Email address or phone contact.
 * @returns {Promise<Object>} Session credentials (trackingId, otpCode).
 */
export const requestOtp = (emailOrPhone) => {
  return api.post('/api/issues/anonymous/request-otp', { emailOrPhone });
};

/**
 * Verify OTP code.
 * @param {string} emailOrPhone Contact detail.
 * @param {string} otpCode Verification code.
 * @returns {Promise<Object>} Verification status.
 */
export const verifyOtp = (emailOrPhone, otpCode) => {
  return api.post('/api/issues/anonymous/verify-otp', { emailOrPhone, otpCode });
};

/**
 * Submit anonymous incident report.
 * @param {FormData} formData Report specifications.
 * @param {string} trackingId Verified tracking ID.
 * @returns {Promise<Object>} Filed report results.
 */
export const submitAnonymous = (formData, trackingId) => {
  return api.post(`/api/issues/anonymous/submit?trackingId=${trackingId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Track an incident report's status via tracking ID.
 * @param {string} trackingId Anonymous tracking ID.
 * @returns {Promise<Object>} Report details.
 */
export const trackIncident = (trackingId) => {
  return api.get(`/api/issues/track/${trackingId}`);
};

/**
 * Allows admins to override incident parameter overrides.
 * @param {string} id Incident UUID.
 * @param {Object} payload Overridden priority/category/status/officer specifications.
 * @returns {Promise<Object>} Edited report results.
 */
export const overrideIncident = (id, payload) => {
  return api.put(`/api/issues/${id}/override`, payload);
};

