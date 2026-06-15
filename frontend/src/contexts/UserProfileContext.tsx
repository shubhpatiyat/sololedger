import React, { createContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_MODE } from '@/config/demo';
import { demoProfile } from '@/data/demoContent';
interface UserProfile {
  fullName: string;
  email: string;
  profilePhoto: string | null;
  firstName: string;
  address: string;
  pincode: string;
  is_gmail_connected: boolean;
  is_outlook_connected: boolean;
  gmailAccountEmail?: string | null;
  outlookAccountEmail?: string | null;
  lastName: string;
}
export interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
  refetch: () => Promise<void>;
}

export const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // Check for access token availability
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('ozoo_access_token');
      setHasToken(!!token);
    };
    
    checkToken();
    
    // Listen for token changes
    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchProfile = useCallback(async () => {
    if (DEMO_MODE) {
      setProfile(demoProfile);
      return;
    }

    const isLoggedInStorage = localStorage.getItem('ozoo_logged_in') === 'true';
    const accessToken = localStorage.getItem('ozoo_access_token');
    
    if (!isLoggedInStorage || !accessToken) {
      setProfile(null);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiService.getUserProfile();
      if (response?.data?.success && response.data.profile) {
        const profileData = response.data.profile;
        setProfile({
          fullName: `${profileData.first_name} ${profileData.last_name}`.trim(),
          email: profileData.email,
          profilePhoto: profileData.profile_image_url,
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          address: profileData.address || '',
          pincode: profileData.pincode || '',
          is_gmail_connected: Boolean(profileData.is_gmail_connected),
          is_outlook_connected: Boolean(profileData.is_outlook_connected),
          gmailAccountEmail: profileData.gmail_account_email,
          outlookAccountEmail: profileData.outlook_account_email,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setProfile(prev => prev ? { ...prev, ...newProfile } : null);
  };

  // Main effect to fetch profile when conditions are met
  useEffect(() => {
    if (isLoggedIn && !authLoading && hasToken) {
      fetchProfile();
    } else if (!isLoggedIn) {
      setProfile(null);
    }
  }, [isLoggedIn, authLoading, hasToken, fetchProfile]);

  // Listen for storage changes to handle login from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ozoo_logged_in' || e.key === 'ozoo_access_token') {
        const isLoggedInStorage = localStorage.getItem('ozoo_logged_in') === 'true';
        const accessToken = localStorage.getItem('ozoo_access_token');
        
        if (isLoggedInStorage && accessToken && !profile) {
          setTimeout(() => fetchProfile(), 100);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [profile, fetchProfile]);

  return (
    <UserProfileContext.Provider value={{
      profile,
      isLoading,
      updateProfile,
      refetch: fetchProfile,
    }}>
      {children}
    </UserProfileContext.Provider>
  );
};
