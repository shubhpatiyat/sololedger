import { useState } from 'react';
import { useUrlMiddleware } from '@/middleware/urlMiddleware';
import { apiService } from '@/services/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Activate = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const { toast } = useToast();

  const handleActivation = async (activationToken: string, activationEmail: string) => {
    setStatus('loading');
    setToken(activationToken);
    setEmail(activationEmail);
    
    try {
      const response = await apiService.verifyInvitationToken({
        invitation_token: activationToken,
      });
      if (response?.data?.success) {
        setStatus('success');
        setMessage(response.data?.message || 'Invitation token verified successfully!');
        toast({
          title: "Success!",
          description: response.data?.message || 'Invitation token verified successfully!',
          className: "bg-green-500 text-white border-green-600",
        });
      } else {
        setStatus('error');
        setMessage(response.data?.message || response.data?.error || 'Token verification failed');
        toast({
          title: "Verification Failed",
          description: response.data?.error || response.data?.message || 'Token verification failed',
          className: "bg-red-500 text-white border-red-600",
        });
      }
    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessage(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        className: "bg-red-500 text-white border-red-600",
      });
    }
  };

  const handleError = (error: Error) => {
    setStatus('error');
    setMessage(error.message);
    toast({
      title: "Error",
      description: error.message,
      className: "bg-red-500 text-white border-red-600",
    });
  };

  useUrlMiddleware({
    onActivation: handleActivation,
    onError: handleError,
    redirectAfterSuccess: '/',
  });

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className={`${getStatusColor()} transition-colors duration-300`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-2xl font-bold">
              {status === 'loading' && 'Verifying Invitation...'}
              {status === 'success' && 'Invitation Verified!'}
              {status === 'error' && 'Verification Failed'}
              {status === 'idle' && 'Invitation Verification'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Please wait while we verify your invitation token'}
              {status === 'success' && 'Your invitation token has been successfully verified'}
              {status === 'error' && 'There was an issue verifying your invitation token'}
              {status === 'idle' && 'Processing your invitation verification...'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {message && (
              <Alert className={status === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            
            {token && email && (
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Email:</strong> {email}</p>
                <p><strong>Token:</strong> {token.substring(0, 8)}...</p>
              </div>
            )}
            
            {status === 'success' && (
              <Button 
                onClick={() => {
                  const redirectUrl = email ? `/?email=${encodeURIComponent(email)}` : '/';
                  window.location.href = redirectUrl;
                }}
                className="w-full"
              >
                Continue to App
              </Button>
            )}
            
            {status === 'error' && (
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => {
                    const redirectUrl = email ? `/?email=${encodeURIComponent(email)}` : '/';
                    window.location.href = redirectUrl;
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Go to Home
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Activate;
