import { useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface UrlParams {
  [key: string]: string;
}

interface MiddlewareConfig {
  onActivation?: (token: string, email: string) => Promise<void>;
  onError?: (error: Error) => void;
  redirectAfterSuccess?: string;
  redirectAfterError?: string;
}

export const useUrlMiddleware = (config: MiddlewareConfig = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const processedTokenRef = useRef<string | null>(null);

  const parseUrlParams = useCallback((): UrlParams => {
    const params = new URLSearchParams(location.search);
    const result: UrlParams = {};
    
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    
    return result;
  }, [location.search]);

  const handleActivation = useCallback(async (token: string, email: string) => {
    try {
      if (config.onActivation) {
        await config.onActivation(token, email);
      }
      
      if (config.redirectAfterSuccess) {
        const redirectUrl = email ? `${config.redirectAfterSuccess}?email=${encodeURIComponent(email)}` : config.redirectAfterSuccess;
        navigate(redirectUrl);
      }
    } catch (error) {
      console.error('Activation failed:', error);
      
      if (config.onError) {
        config.onError(error as Error);
      }
      
      if (config.redirectAfterError) {
        navigate(config.redirectAfterError);
      }
    }
  }, [config, navigate]);

  useEffect(() => {
    const params = parseUrlParams();
    
    const isActivatePath = location.pathname === '/activate' || location.pathname === '/activate/';
    const currentToken = params['invitation-token'];
    
    if (isActivatePath && currentToken && processedTokenRef.current !== currentToken) {
      processedTokenRef.current = currentToken;
      handleActivation(currentToken, params['email'] || '');
    }
    
    // Reset when not on activate path
    if (!isActivatePath) {
      processedTokenRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  return {
    parseUrlParams,
    handleActivation
  };
};

export default useUrlMiddleware;
