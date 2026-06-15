import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-12 text-center space-y-8">
            {/* 404 Number with Animation */}
            <div className="relative">
              <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse">
                404
              </div>
              <div className="absolute inset-0 text-9xl font-bold text-slate-700/20 blur-sm">
                404
              </div>
            </div>

            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Main Message */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-white">
                Oops! Page Not Found
              </h1>
              <p className="text-slate-400 text-lg max-w-md mx-auto">
                The page you're looking for seems to have wandered off into the digital void. 
                Don't worry, even the best explorers sometimes take a wrong turn.
              </p>
            </div>

            {/* Current Path Display */}
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
              <div className="flex items-center justify-center gap-2 text-slate-300">
                <Search className="w-4 h-4" />
                <span className="text-sm font-mono">
                  {location.pathname}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGoHome}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Home className="w-5 h-5" />
                Go Home
              </Button>
              
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </Button>
            </div>

            {/* Helpful Links */}
            <div className="pt-6 border-t border-slate-700/50">
              <p className="text-slate-500 text-sm mb-4">
                Need help? Try these popular pages:
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => navigate('/library')}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
                >
                  Library
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={() => navigate('/')}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
                >
                  Chat
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={() => navigate('/activate')}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
                >
                  Activate
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-blue-400/30 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-purple-400/30 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-32 left-32 w-5 h-5 bg-pink-400/30 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-blue-400/30 rounded-full animate-bounce delay-500"></div>
      </div>
    </div>
  );
};

export default NotFound;
