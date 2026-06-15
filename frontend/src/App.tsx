import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Activate from "./pages/Activate";
import MicrosoftCallback from "./pages/MicrosoftCallback";
import MailOAuthCallback from "./pages/MailOAuthCallback";
import ResetPassword from "./components/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";
import UpdatePassword from "./pages/UpdatePassword";
import Login from "./components/Login";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Categories from "./pages/Categories";
import Invoices from "./pages/Invoices";
import Bills from "./pages/Bills";
import InvoiceTemplateDesigner from "./pages/InvoiceTemplateDesigner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <UserProfileProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* <Route  element={<Index />} /> */}
              <Route index element={<Navigate to="/library" replace />} />
              <Route path="library" element={<Index />} />
              <Route path="clients" element={<Clients />} />
              <Route path="projects" element={<Projects />} />
              <Route path="categories" element={<Categories />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/template-designer" element={<InvoiceTemplateDesigner />} />
              <Route path="bills" element={<Bills />} />
              <Route path="chat/:chatId" element={<Index />} />
              <Route path="chat/:projectId/conversations" element={<Index />} />
              <Route path="chat/:projectId/:chatId" element={<Index />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:projectId" element={<Profile />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/activate" element={<Activate />} />
            <Route path="/microsoft-callback" element={<MicrosoftCallback />} />
            <Route path="/mail-oauth/callback" element={<MailOAuthCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password/:token" element={<UpdatePassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UserProfileProvider>
        </BrowserRouter>
        </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
