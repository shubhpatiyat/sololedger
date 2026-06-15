import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setAccessTokenInMemory } from '@/lib/secureTokenManager';

const MicrosoftCallback = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleAuthentication = useCallback(async (token: string, email: string) => {
    setStatus('loading');
    setAccessToken(token);
    setUserEmail(email);
    
    try {
      // Store the access token
      setAccessTokenInMemory(token);
      
      // Store authentication data in localStorage for the main app
      localStorage.setItem('ozoo_logged_in', 'true');
      localStorage.setItem('ozoo_user_email', email);
      
      setStatus('success');
      setMessage('Microsoft authentication successful! Redirecting to the app...');
      
      toast({
        title: "Microsoft Login Successful!",
        description: "Welcome! You're now signed in with Microsoft.",
        className: "bg-green-500 text-white border-green-600",
      });
      
      // Redirect to main app after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1000);
      
    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessage(errorMessage);
      toast({
        title: "Authentication Error",
        description: errorMessage,
        className: "bg-red-500 text-white border-red-600",
      });
    }
  }, [toast, navigate]);

  const handleError = useCallback((error: Error) => {
    setStatus('error');
    setMessage(error.message);
    toast({
      title: "Authentication Failed",
      description: error.message,
      className: "bg-red-500 text-white border-red-600",
    });
  }, [toast]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('access_token');
    const email = params.get('user_email') || params.get('email') || 'user@microsoft.com';
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    // Check for error parameters first
    if (error) {
      if (error === 'SSODisabled') {
        const errorMessage = 'Single Sign-On (SSO) is not enabled for your organization. Please contact your administrator to enable SSO first, then try logging in again.';
        setStatus('error');
        setMessage(errorMessage);
        toast({
          title: "SSO Not Enabled",
          description: errorMessage,
          className: "bg-orange-500 text-white border-orange-600",
        });
        return;
      } else if (error === 'TenantNotRegistered') {
        const errorMessage = 'Your tenant is not registered. Please register it in the admin panel first, then try logging in again.';
        setStatus('error');
        setMessage(errorMessage);
        toast({
          title: "Tenant Not Registered",
          description: errorMessage,
          className: "bg-yellow-500 text-white border-yellow-600",
        });
        return;
      } else {
        // Handle other OAuth errors
        const errorMessage = errorDescription || `Authentication error: ${error}`;
        handleError(new Error(errorMessage));
        return;
      }
    }
    
    if (token) {
      handleAuthentication(token, email);
    } else {
      handleError(new Error('No access token found in URL parameters'));
    }
  }, [location.search, handleAuthentication, handleError, toast]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-10 w-10 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-10 w-10 text-green-600" />;
      case 'error':
        return <XCircle className="h-10 w-10 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50';
      case 'error':
        // Use orange color scheme for SSO disabled errors
        if (message.includes('SSO is not enabled')) {
          return 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50';
        }
        // Use yellow color scheme for tenant not registered errors
        if (message.includes('tenant is not registered')) {
          return 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50';
        }
        return 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <Card className={`${getStatusColor()} transition-all duration-500 shadow-2xl border-0 backdrop-blur-sm`}>
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-white shadow-lg">
                {getStatusIcon()}
              </div>
            </div>
            <CardTitle className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
              {status === 'loading' && 'Authenticating...'}
              {status === 'success' && 'Authentication Successful!'}
              {status === 'error' && 'Authentication Failed'}
              {status === 'idle' && 'Microsoft Authentication'}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 leading-relaxed">
              {status === 'loading' && 'Please wait while we complete your Microsoft authentication'}
              {status === 'success' && 'You have been successfully authenticated with Microsoft'}
              {status === 'error' && 'There was an issue with your Microsoft authentication'}
              {status === 'idle' && 'Processing your Microsoft authentication...'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8 pb-8">
            {message && (
              <Alert className={`${
                status === 'error' 
                  ? message.includes('SSO is not enabled') 
                    ? 'border-orange-200 bg-orange-50' 
                    : message.includes('tenant is not registered')
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-red-200 bg-red-50'
                  : 'border-green-200 bg-green-50'
              } shadow-sm`}>
                <AlertDescription className="text-gray-700 font-medium">{message}</AlertDescription>
              </Alert>
            )}
            
            {accessToken && userEmail && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Authentication Details</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">Email:</span>
                    <span className="text-blue-600 font-medium">{userEmail}</span>
                  </div>
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <Button 
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Continue to App
              </Button>
            )}
            
            {status === 'error' && (
              <div className="space-y-3">
                {message.includes('SSO is not enabled') ? (
                  <>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-orange-800 mb-2">What to do next:</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Contact your organization's IT administrator</li>
                        <li>• Request them to enable Single Sign-On (SSO)</li>
                        <li>• Once enabled, try logging in again</li>
                      </ul>
                    </div>
                    <Button 
                      onClick={() => navigate('/login')}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      Back to Login
                    </Button>
                  </>
                ) : message.includes('tenant is not registered') ? (
                  <>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-yellow-800 mb-2">What to do next:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Contact your system administrator</li>
                        <li>• Request them to register your tenant in the admin panel</li>
                        <li>• Once registered, try logging in again</li>
                      </ul>
                    </div>
                    <Button 
                      onClick={() => navigate('/')}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      Back to Login
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={() => window.location.reload()}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      Try Again
                    </Button>
                    <Button 
                      onClick={() => navigate('/')}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      Go to Home
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MicrosoftCallback;
