import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiService } from "@/services/apiService";

type VerifyStatus = "loading" | "success" | "error";

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const response = await apiService.verifyEmail(token);
        if (response.data?.success) {
          setStatus("success");
          setMessage(response.data?.message || "Email verified successfully.");
          return;
        }

        setStatus("error");
        setMessage(response.data?.error || response.data?.message || "Email verification failed.");
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Email verification failed.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-blue-500" />}
            {status === "success" && <CheckCircle className="h-8 w-8 text-green-500" />}
            {status === "error" && <XCircle className="h-8 w-8 text-red-500" />}
          </div>
          <CardTitle>
            {status === "loading" && "Verifying Email"}
            {status === "success" && "Email Verified"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading"
              ? "Please wait while we confirm your email."
              : "You can continue to sign in after verification."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className={status === "error" ? "border-red-500/40 bg-red-500/5" : "border-green-500/40 bg-green-500/5"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          <Button className="w-full" onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
