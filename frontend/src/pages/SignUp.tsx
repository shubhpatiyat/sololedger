import React, { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useOrganizationData } from "@/hooks/useOrganizationData";
import { apiService } from "@/services/apiService";
import { signupSchema } from "@/utils/validations";
import loginAnimation from "@/assets/OZZOOANIMATION/ozooWhiteLogo.json";
import { DEMO_MODE } from "@/config/demo";

interface SignUpFormData {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: orgData, isLoading: isOrgLoading } = useOrganizationData();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignUpFormData>({
    resolver: yupResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleDemoSignupSuccess = (email: string) => {
    localStorage.setItem("ozoo_logged_in", "true");
    localStorage.setItem("ozoo_user_email", email);
    navigate("/");
  };

  const onSubmit = async (data: SignUpFormData) => {
    if (DEMO_MODE) {
      toast({
        title: "Demo Signup Successful",
        description: "Signed in with local SoloLedger demo access.",
        className: "bg-green-500 text-white border-green-600",
      });
      handleDemoSignupSuccess(data.email);
      return;
    }

    try {
      const response = await apiService.signup({
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
        first_name: data.firstName?.trim() || null,
        last_name: data.lastName?.trim() || null,
      });

      if (response.data?.success) {
        toast({
          title: "Signup Successful",
          description:
            response.data?.message ||
            "Please verify your email address before signing in.",
          className: "bg-green-500 text-white border-green-600",
        });
        navigate(`/login?email=${encodeURIComponent(data.email)}`);
        return;
      }

      toast({
        title: "Signup Failed",
        description: response.data?.error || response.data?.message || "Please try again.",
        className: "bg-red-500 text-white border-red-600",
      });
    } catch (error) {
      toast({
        title: "Signup Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        className: "bg-red-500 text-white border-red-600",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {(isSubmitting || isOrgLoading) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-foreground font-medium">please wait ...</p>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <Card className="w-full max-w-2xl bg-card backdrop-blur-xl border-primary/20 shadow-2xl rounded-3xl overflow-hidden">
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
                Create your account
              </CardTitle>
              <p className="text-foreground/70">
                Join {orgData.organization_name} to manage invoices, bills, and reimbursements.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    {...register("firstName")}
                    className="bg-card/50 border-primary/30 text-black placeholder-foreground/50 h-12 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.firstName && (
                    <Alert className="border-red-500 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-400 text-sm">
                        {errors.firstName.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    {...register("lastName")}
                    className="bg-card/50 border-primary/30 text-black placeholder-foreground/50 h-12 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.lastName && (
                    <Alert className="border-red-500 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-400 text-sm">
                        {errors.lastName.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                  className={`bg-card/50 border-primary/30 text-black placeholder-foreground/50 h-12 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.email ? "border-destructive focus:ring-destructive" : ""
                  }`}
                />
                {errors.email && (
                  <Alert className="border-red-500 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-400 text-sm">
                      {errors.email.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    {...register("password")}
                    className={`pr-12 bg-card/50 border-primary/30 text-black placeholder-foreground/50 h-12 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.password ? "border-destructive focus:ring-destructive" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-3 flex items-center text-black"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <Alert className="border-red-500 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-400 text-sm">
                      {errors.password.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    className={`pr-12 bg-card/50 border-primary/30 text-black placeholder-foreground/50 h-12 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.confirmPassword ? "border-destructive focus:ring-destructive" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute inset-y-0 right-3 flex items-center text-black"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <Alert className="border-red-500 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-400 text-sm">
                      {errors.confirmPassword.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 h-12 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-slate-400 transition-colors"
                onClick={() => navigate("/login")}
              >
                Already have an account? Sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
