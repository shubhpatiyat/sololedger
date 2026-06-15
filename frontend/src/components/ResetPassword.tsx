import React, { useState } from 'react';
import { useForm, SubmitHandler, FieldValues } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { resetPasswordSchema } from '@/utils/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/apiService';
import { useNavigate } from 'react-router-dom';
import { clearAccessTokenFromMemory } from '@/lib/secureTokenManager';
import { useTheme } from '@/contexts/ThemeContext';


const ResetPassword: React.FC = () => {
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const { theme } = useTheme()
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isValid, isSubmitting } } = useForm<FieldValues>({
    resolver: yupResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleLogout = () => {
    clearAccessTokenFromMemory();
    logout();
    setTimeout(() => {
      
      window.location.href = '/';
    }, 1000)
  };

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    try {
      const response = await apiService.resetPassword({
        old_password: data.oldPassword,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      });
      if (response.data?.success) {
        toast({
          title: 'Password Reset Successful!',
          description: response.data?.message || 'Your password has been updated successfully. Please log in again.',
          className: 'bg-green-500 text-white border-green-600',
        });
        handleLogout();
      } else {
        const errorMessage = response.data?.error || response.data?.message || 'Password reset failed. Please try again.';
        toast({
          title: 'Password Reset Failed',
          description: errorMessage,
          className: 'bg-red-500 text-white border-red-600',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      toast({
        title: 'Password Reset Error',
        description: errorMessage,
        className: 'bg-red-500 text-white border-red-600',
      });
    }
  };

  return (
    <Card className="bg-card border-border shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Lock className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">Change Password</CardTitle>
            <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {['oldPassword', 'newPassword', 'confirmPassword'].map((field, idx) => (
            <div key={idx} className="space-y-2">
              <Label htmlFor={field} className="text-sm text-foreground capitalize">
                {field.replace(/([A-Z])/g, ' $1')}
              </Label>
              <div className="relative">
                <Input
                  id={field}
                  type={showPassword[field as keyof typeof showPassword] ? 'text' : 'password'}
                  {...register(field)}
                  placeholder={`Enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                  className={`bg-muted/50 border-border placeholder-muted-foreground h-11 rounded-lg pr-10 focus:ring-2 focus:ring-offset-0 text-black ${
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
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors[field] && (
                <p className="text-destructive text-xs mt-1">{String(errors[field]?.message)}</p>
              )}
            </div>
          ))}

          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11 rounded-lg mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'light' ? '!text-white' : 'text-primary-foreground'}`}
            
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" /> Update Password
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResetPassword;
