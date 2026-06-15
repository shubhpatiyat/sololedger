import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { forgotPasswordSchema } from '@/utils/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiService } from '@/services/apiService';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import loginAnimation from '@/assets/OZZOOANIMATION/ozooWhiteLogo.json';
import { useOrganizationData } from '@/hooks/useOrganizationData';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const { data: orgData, isLoading: isOrgLoading } = useOrganizationData();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const response = await apiService.forgotPassword({
        email: data.email,
      });
      if (response.data?.success) {
        setIsSuccess(true);
        toast({
          title: 'Email Sent',
          description: response.data?.message || 'If an account exists, we have sent a reset link.',
          className: 'bg-green-500 text-white border-green-600',
        });
      } else {
        const errorMessage =
          response.data?.error ||
          response.data?.message ||
          'Failed to send reset link. Please try again.';
        toast({
          title: 'Reset Failed',
          description: errorMessage,
          className: 'bg-red-500 text-white border-red-600',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.';
      toast({
        title: 'Reset Error',
        description: errorMessage,
        className: 'bg-red-500 text-white border-red-600',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="relative z-10">
        <Card className="w-full max-w-md bg-card backdrop-blur-xl border-primary/20 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center space-y-6 pb-8">
            {isOrgLoading ? (
              <Skeleton className="mx-auto w-20 h-20 rounded-2xl" />
            ) : orgData?.logo ? (
              <div className="mx-auto h-auto overflow-hidden w-[200px]">
                <img
                  src={orgData.logo}
                  alt={`${orgData.organization_name} Logo`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
              </div>
            ) : (
              <div className="mx-auto w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                <Lottie animationData={loginAnimation} loop={true} autoplay={true} />
              </div>
            )}
            <div>
              <CardTitle className="text-3xl font-bold text-foreground mb-2">
                {isSuccess ? 'Check Your Email' : 'Forgot Password'}
              </CardTitle>
              <p className="text-foreground/70">
                {isSuccess
                  ? 'Please check your email inbox for the reset link.'
                  : 'Enter your email address and we\'ll send a secure reset link.'}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            {!isSuccess ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    {...register('email')}
                    className={`bg-card/50 border-primary/30 text-black placeholder-foreground/50 h-12 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.email ? 'border-destructive focus:ring-destructive' : ''
                    }`}
                    style={{
                      '--tw-ring-color': errors.email ? undefined : 'var(--input-border)'
                    } as React.CSSProperties}
                  />
                  {errors.email && (
                    <Alert className="border-destructive bg-destructive/10">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive text-sm">
                        {errors.email.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button
                  type="submit"
                  className={`w-full bg-primary hover:bg-primary/90 font-semibold py-3 h-12 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'light' ? '!text-white' : 'text-primary-foreground'}`}
                  disabled={isSubmitting || !isValid}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending Email...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                  <p className="text-success text-sm">
                    If an account with that email exists, a password reset link has been sent.
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="w-full text-foreground/70 hover:text-foreground hover:bg-muted hover:border-primary py-3 h-12 rounded-xl transition-all duration-200 border border-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
