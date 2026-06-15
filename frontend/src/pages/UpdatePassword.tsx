import React, { useState } from 'react';
import { useForm, SubmitHandler, FieldValues } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { updatePasswordSchema } from '@/utils/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { apiService } from '@/services/apiService';
import { useTheme } from '@/contexts/ThemeContext';

import Lottie from 'lottie-react';
import loginAnimation from '@/assets/OZZOOANIMATION/ozooWhiteLogo.json';
import { useOrganizationData } from '@/hooks/useOrganizationData';


const UpdatePassword: React.FC = () => {
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const { theme } = useTheme()
  const { data: orgData, isLoading: isOrgLoading } = useOrganizationData();

  const { toast } = useToast();
  const { token } = useParams<{ token: string }>();

  const { register, handleSubmit, formState: { errors, isValid, isSubmitting } } = useForm<FieldValues>({
    resolver: yupResolver(updatePasswordSchema),
    mode: 'onChange',
  });

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    if (!token) return;
    
    try {
      const response = await apiService.updatePassword(token, {
        new_password: data.password,
        confirm_password: data.confirmPassword,
      });

      if (response.data?.success) {
        toast({
          title: 'Password Updated Successfully!',
          description: response.data?.message || 'Your password has been updated. Please log in with your new password.',
          className: 'bg-green-500 text-white border-green-600',
        });
        setTimeout(() => {
          
          window.location.href = '/';
        }, 1000)
      } else {
        toast({
          title: 'Password Update Failed',
          description: response.data?.message || 'Failed to update password. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-lg">
        <CardHeader className="text-center">
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
          <CardTitle className="text-2xl font-bold text-foreground">Update Password</CardTitle>
          <p className="text-muted-foreground">Enter your new password</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {['password', 'confirmPassword'].map((field, idx) => (
              <div key={idx} className="space-y-2">
                <Label htmlFor={field} className="text-sm text-foreground">
                  {field === 'password' ? 'New Password' : 'Confirm Password'}
                </Label>
                <div className="relative">
                  <Input
                    id={field}
                    type={showPassword[field as keyof typeof showPassword] ? 'text' : 'password'}
                    {...register(field)}
                    placeholder={`Enter your ${field === 'password' ? 'new password' : 'password again'}`}
                    className={`bg-muted/50 border-border placeholder-muted-foreground pr-10 focus:ring-2 focus:ring-offset-0 text-black ${
                      errors[field] ? 'border-destructive focus:ring-destructive' : ''
                    }`}
                    style={{
                      '--tw-ring-color': errors[field] ? undefined : 'var(--input-border)'
                    } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field as keyof typeof showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
                  >
                    {showPassword[field as keyof typeof showPassword] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors[field] && (
                  <p className="text-destructive text-xs">{String(errors[field]?.message)}</p>
                )}
              </div>
            ))}
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`w-full bg-primary hover:bg-primary/90 ${theme === 'light' ? '!text-white' : 'text-primary-foreground'}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePassword;