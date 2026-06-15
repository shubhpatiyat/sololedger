import { useState, useCallback, useEffect } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  userEmail: string | null;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    userEmail: null,
    isLoading: true,
  });
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const isLoggedInStorage = localStorage.getItem('ozoo_logged_in') === 'true';
        
        if (isLoggedInStorage) {
          setAuthState(prev => ({
            ...prev,
            isLoggedIn: true,
            userEmail: localStorage.getItem('ozoo_user_email') || null,
            isLoading: false,
          }));
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error checking existing authentication:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    checkExistingAuth();
  }, []);

  const login = useCallback((userEmail: string) => {
    localStorage.setItem('ozoo_logged_in', 'true');
    localStorage.setItem('ozoo_user_email', userEmail);
    
    setAuthState({
      isLoggedIn: true,
      userEmail,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    // Clear authentication state from localStorage
    localStorage.removeItem('ozoo_logged_in');
    localStorage.removeItem('ozoo_user_email');
    localStorage.removeItem('ozoo_access_token');
    
    setAuthState({
      isLoggedIn: false,
      userEmail: null,
      isLoading: false,
    });
  }, []);


  // Get current user email (read-only)
  const getUserEmail = useCallback((): string | null => {
    return authState.userEmail;
  }, [authState.userEmail]);
  // Check if user is authenticated (read-only)
  const checkIsAuthenticated = useCallback((): boolean => {
    return authState.isLoggedIn;
  }, [authState.isLoggedIn]);

  return {
    ...authState,
    login,
    logout,
    getUserEmail,
    checkIsAuthenticated,
  };
};
