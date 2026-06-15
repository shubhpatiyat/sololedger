/**
 * Token Manager - For API Requests
 * Access tokens are stored in localStorage and sent with API requests
 * Backend may also use HTTP-only cookies for additional security
 */

/**
 * Token management functions for API requests
 * Access token is stored in localStorage and sent with API requests
 */
export const setAccessTokenInMemory = (token: string): void => {
  localStorage.setItem('ozoo_access_token', token);
};

export const getAccessTokenFromMemory = (): string | null => {
  return localStorage.getItem('ozoo_access_token');
};

export const clearAccessTokenFromMemory = (): void => {
  localStorage.removeItem('ozoo_access_token');
};
