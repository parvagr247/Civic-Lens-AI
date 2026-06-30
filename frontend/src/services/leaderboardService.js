import api from './api';

/**
 * Service to manage REST API interactions with the community leaderboard.
 */

/**
 * Fetches the paginated and filtered community leaderboard.
 * @param {Object} params Filter specifications (page, size, city, timeframe, sortBy, query).
 * @returns {Promise<Object>} API response payload containing podium and paginated contributors list.
 */
export const getLeaderboard = (params = {}) => {
  const { page = 0, size = 10, city = '', timeframe = 'all', sortBy = 'points', query = '' } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('size', size);
  if (city && city !== 'all') queryParams.append('city', city);
  queryParams.append('timeframe', timeframe);
  queryParams.append('sortBy', sortBy);
  if (query) queryParams.append('query', query);

  return api.get(`/api/leaderboard?${queryParams.toString()}`);
};
