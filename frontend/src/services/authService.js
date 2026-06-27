import api from './api';

/**
 * Service to manage authentication REST API calls and token storage.
 */

/**
 * Registers a new citizen or admin account.
 *
 * @param {string} name Citizen display name.
 * @param {string} email Citizen email.
 * @param {string} password Password.
 * @param {boolean} admin Whether to register as ROLE_ADMIN.
 * @returns {Promise<Object>} Mapped user login response.
 */
export const register = async (name, email, password, admin = false) => {
  const response = await api.post('/api/auth/register', { name, email, password, admin });
  if (response.success && response.data) {
    saveSession(response.data);
  }
  return response;
};

/**
 * Log in a user with credentials.
 *
 * @param {string} email User email.
 * @param {string} password User password.
 * @returns {Promise<Object>} Mapped user login response.
 */
export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  if (response.success && response.data) {
    saveSession(response.data);
  }
  return response;
};

/**
 * Logs out the user and cleans localStorage tokens.
 */
export const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } catch (error) {
    console.warn('Backend session clearance failed', error);
  } finally {
    clearSession();
  }
};

/**
 * Retrieves the currently logged-in user profile from localStorage.
 */
export const getCurrentUser = () => {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
};

/**
 * Returns if a token exists.
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Returns if the logged-in user is an administrator.
 */
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'ROLE_ADMIN';
};

/**
 * Returns if the logged-in user is a field officer.
 */
export const isOfficer = () => {
  const user = getCurrentUser();
  return user?.role === 'ROLE_OFFICER';
};

const saveSession = (data) => {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify({
    userId: data.userId,
    email: data.email,
    name: data.name,
    role: data.role
  }));
};

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
