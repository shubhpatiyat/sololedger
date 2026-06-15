import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "@/utils/validations";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiService } from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";
import { useOrganizationData } from "@/hooks/useOrganizationData";
import { setAccessTokenInMemory } from "@/lib/secureTokenManager";
import Lottie from "lottie-react";
import loginAnimation from "@/assets/OZZOOANIMATION/ozooWhiteLogo.json";
import { DEMO_MODE } from "@/config/demo";

interface LoginProps {
  onLogin?: (userEmail: string) => void;
  preFilledEmail?: string;
  onForgotPassword?: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
  captcha?: string;
}

const Login: React.FC<LoginProps> = ({
  onLogin,
  preFilledEmail,
  onForgotPassword,
}) => {
  const { toast } = useToast();
  const { data: orgData, isLoading: isOrgLoading } = useOrganizationData();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

  // Default onLogin handler if not provided
  const handleLogin =
    onLogin ||
    ((userEmail: string) => {
      localStorage.setItem("ozoo_logged_in", "true");
      localStorage.setItem("ozoo_user_email", userEmail);
      window.location.href = "/";
    });

  useEffect(() => {
    localStorage.removeItem("ozoo_access_token");
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: "onChange",
  });

  // Handle URL email parameter and preFilledEmail prop
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const emailParam = urlParams.get("email");

    if (emailParam) {
      setValue("email", emailParam);
      // Clean up URL
      urlParams.delete("email");
      const newSearch = urlParams.toString();
      const newUrl = newSearch
        ? `${location.pathname}?${newSearch}`
        : location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else if (preFilledEmail) {
      setValue("email", preFilledEmail);
    }
  }, [location.search, location.pathname, preFilledEmail, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    if (DEMO_MODE) {
      const userEmail = data.email || "avinash@sololedger.app";
      toast({
        title: "Demo Login Successful",
        description: "Signed in with local SoloLedger demo access.",
        className: "bg-green-500 text-white border-green-600",
      });
      handleLogin(userEmail);
      return;
    }

    try {
      const response = await apiService.login({
        email: data.email,
        password: data.password,
      });
      if (response.data?.success) {
        const userEmail = data.email;
        const accessToken = response?.data?.access_token;
        if (accessToken) {
          setAccessTokenInMemory(accessToken);
        }
        toast({
          title: "Login Successful!",
          description: response.data?.message || "Welcome back!",
          className: "bg-green-500 text-white border-green-600",
        });
        handleLogin(userEmail);
      } else {
        const errorMessage =
          response.data?.error ||
          response.data?.message ||
          "Login failed. Please try again.";
        toast({
          title: "Login Failed",
          description: errorMessage,
          className: "bg-red-500 text-white border-red-600",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      toast({
        title: "Login Error",
        description: errorMessage,
        className: "bg-red-500 text-white border-red-600",
      });
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsMicrosoftLoading(true);
    try {
      const response = await apiService.ssoLogin();

      if (response?.data?.auth_url) {
        window.location.href = response.data.auth_url;

        toast({
          title: "Redirecting to Microsoft",
          description:
            "You will be redirected to Microsoft for authentication.",
          className: "bg-blue-500 text-white border-blue-600",
        });
      } else {
        const errorMessage =
          response.data?.error ||
          response.data?.message ||
          "Failed to get authentication URL. Please try again.";
        toast({
          title: "Microsoft Login Failed",
          description: errorMessage,
          className: "bg-red-500 text-white border-red-600",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during Microsoft login. Please try again.";
      toast({
        title: "Microsoft Login Error",
        description: errorMessage,
        className: "bg-red-500 text-white border-red-600",
      });
    } finally {
      setIsMicrosoftLoading(false);
    }
  };

  const isLoading = isSubmitting || isMicrosoftLoading;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {isLoading ||
        (isOrgLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-foreground font-medium">please wait ...</p>
            </div>
          </div>
        ))}
      <div className="relative z-10">
        <Card className="w-full min-w-[410px] bg-card backdrop-blur-xl border-primary/20 shadow-2xl rounded-3xl overflow-hidden">
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
                <Lottie
                  animationData={loginAnimation}
                  loop={true}
                  autoplay={true}
                />
              </div>
            )}
            <div>
              <CardTitle className="text-3xl font-bold text-foreground mb-2">
                {orgData.organization_name}
              </CardTitle>
              <p className="text-foreground/70">
                Sign in to manage invoices, receipts, and reimbursements in one chat workspace.
              </p>
              {DEMO_MODE && (
                <p className="text-sm text-primary mt-2">
                  Demo mode is enabled. Any email and password will sign you in.
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            {/* Email and Password Form */}
            {(!orgData?.showMicrosoftLogin ||
              (orgData?.showMicrosoftLogin &&
                !orgData?.onlyShowMicrosoftLogin)) && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register("email")}
                    className={`bg-card/50 border-primary/30 text-black placeholder-foreground/50 h-12 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.email
                        ? "border-destructive focus:ring-destructive"
                        : ""
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
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...register("password")}
                      className={`pr-12 bg-card/50 border-primary/30 text-black placeholder-foreground/50 h-12 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.password
                          ? "border-destructive focus:ring-destructive"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-3 flex items-center text-black"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
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

                {/* Captcha Field */}
                {orgData?.showCaptcha && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="captcha"
                      className="text-sm font-medium text-white"
                    >
                      Captcha
                    </Label>
                    <div className="flex items-center space-x-3">
                      <div className="bg-slate-700/50 border border-slate-600 rounded-xl px-4 h-12 flex items-center text-white font-mono text-lg tracking-wider">
                        {orgData.captchValue}
                      </div>
                      <Input
                        id="captcha"
                        type="text"
                        placeholder="Enter captcha"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 h-12 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {orgData?.showCaptcha &&
                      captchaInput &&
                      captchaInput !== orgData.captchValue && (
                        <Alert className="border-red-500 bg-red-500/10">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <AlertDescription className="text-red-400 text-sm">
                            Captcha does not match
                          </AlertDescription>
                        </Alert>
                      )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:primary text-white font-semibold py-3 h-12 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    isSubmitting ||
                    !isValid ||
                    (orgData?.showCaptcha &&
                      captchaInput !== orgData.captchValue)
                  }
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-slate-400 transition-colors"
                    onClick={() => {
                      if (onForgotPassword) {
                        onForgotPassword();
                      } else {
                        window.location.href = "/forgot-password";
                      }
                    }}
                  >
                    Forgot your password?
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-slate-400 transition-colors"
                    onClick={() => {
                      window.location.href = "/signup";
                    }}
                  >
                    New here? Create an account
                  </button>
                </div>
              </form>
            )}
            {orgData?.showMicrosoftLogin && (
              <>
                {!orgData?.onlyShowMicrosoftLogin && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-primary" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-slate-400">
                        OR CONTINUE WITH
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleMicrosoftLogin}
                  disabled={isMicrosoftLoading}
                  className="w-full bg-card text-foreground font-medium py-3 h-12 rounded-xl transition-all duration-200 border border-slate-600 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMicrosoftLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 23 23"
                          fill="none"
                        >
                          <path fill="#f25022" d="M1 1h10v10H1z" />
                          <path fill="#00a4ef" d="M12 1h10v10H12z" />
                          <path fill="#7fba00" d="M1 12h10v10H1z" />
                          <path fill="#ffb900" d="M12 12h10v10H12z" />
                        </svg>
                      </div>
                      Continue with Microsoft
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
