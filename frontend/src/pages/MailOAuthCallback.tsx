import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const MailOAuthCallback = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payload = {
      provider: params.get('provider'),
      status: params.get('status'),
      message: params.get('message'),
      email: params.get('email'),
    };

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'mail-oauth-complete', payload }, window.location.origin);
      window.close();
    }
  }, [location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-xl font-semibold">Completing connection</h1>
        <p className="text-sm text-muted-foreground">
          You can close this window if it does not close automatically.
        </p>
      </div>
    </div>
  );
};

export default MailOAuthCallback;
