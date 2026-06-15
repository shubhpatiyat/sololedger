import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useOrganizationData } from "@/hooks/useOrganizationData";
import { useUserProfile } from "@/hooks/useUserProfile";
import { themes as allThemes } from "@/themes";
import { useProjectIdFromRoute } from "@/hooks/useProjectIdFromRoute";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Palette, User, LogOut, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HeaderProps {
  onLogout: () => void;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, onToggleSidebar }) => {
  const { theme, setTheme } = useTheme();
  const { data: orgData } = useOrganizationData();
  const { profile } = useUserProfile();
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const projectId = useProjectIdFromRoute();
  const themes = [
    {
      value: "dark",
      label: "Dark",
      color: allThemes.dark.primary.main,
      lightColor: allThemes.dark.primary.light,
    },
    {
      value: "light",
      label: "Light",
      color: allThemes.light.primary.main,
      lightColor: allThemes.light.primary.light,
    },
    {
      value: "blue",
      label: "Blue",
      color: allThemes.blue.primary.main,
      lightColor: allThemes.blue.primary.light,
    },
    {
      value: "green",
      label: "Green",
      color: allThemes.green.primary.main,
      lightColor: allThemes.green.primary.light,
    },
    {
      value: "gray",
      label: "Gray",
      color: allThemes.gray.primary.main,
      lightColor: allThemes.gray.primary.light,
    },
    {
      value: "orange",
      label: "Orange",
      color: allThemes.orange.primary.main,
      lightColor: allThemes.orange.primary.light,
    },
  ];

  return (
    <>
      <header className="h-16 bg-gradient-header border-b border-border px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Menu */}
          {isMobile && onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <Link to="/" className="flex items-center">
            {orgData.logo ? (
              <>
                <img
                  src={orgData.logo}
                  alt={`${orgData.organization_name} Logo`}
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "block";
                  }}
                />
              </>
            ) : (
              <div className="flex flex-col leading-none">
                <span className="text-xl font-bold text-foreground">
                  SoloLedger
                </span>
                <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Billing AI
                </span>
              </div>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Selector */}
          <DropdownMenu
            open={showThemeDropdown}
            onOpenChange={setShowThemeDropdown}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <Palette className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="grid grid-cols-2 gap-2 p-2">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => {
                      setTheme(
                        themeOption.value as
                          | "light"
                          | "dark"
                          | "blue"
                          | "green"
                          | "gray"
                          | "orange"
                      );
                      setShowThemeDropdown(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      theme === themeOption.value
                        ? "text-primary-foreground border-primary"
                        : "hover:bg-muted border-border"
                    }`}
                    style={{
                      backgroundColor:
                        theme === themeOption.value
                          ? themeOption.lightColor
                          : undefined,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: themeOption.color }}
                    ></div>
                    <span className="text-sm font-medium">
                      {themeOption.label}
                    </span>
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10 border-2 border-primary">
                  {profile?.profilePhoto && (
                    <AvatarImage
                      src={profile.profilePhoto}
                      alt={profile.fullName || profile.email || "Profile"}
                    />
                  )}
                  <AvatarFallback
                    style={{
                      backgroundColor: "var(--profile-avatar-bg)",
                      color: "var(--profile-avatar-text)",
                    }}
                  >
                    {profile?.fullName ? (
                      profile.fullName.charAt(0).toUpperCase()
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem
                onClick={() => navigate(projectId ? `/profile/${projectId}` : `/profile`)}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowLogoutDialog(true)}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to log out?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out of your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLogoutDialog(false);
                onLogout();
              }}
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Header;
