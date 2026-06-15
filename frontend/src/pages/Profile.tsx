import React, { useEffect } from 'react';
import ProfileInfoCard from '@/components/ProfileInfoCard';
import ChangePasswordCard from '@/components/ResetPassword';
import ConnectedAccountsCard from '@/components/ConnectedAccountsCard';
import { useUserProfile } from '@/hooks/useUserProfile';
const Profile: React.FC = () => {
  const { profile, refetch } = useUserProfile();

  // Ensure profile is loaded when accessing the profile page
  useEffect(() => {
    if (!profile) {
      refetch();
    }
  }, [profile, refetch]);


  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-8">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mb-6">Manage your account settings and preferences</p>
        
        <div className="space-y-8">
          <ProfileInfoCard />
          <ConnectedAccountsCard />
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
};

export default Profile;
