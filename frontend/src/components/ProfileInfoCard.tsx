import React, { useEffect, useState } from 'react';
import { Mail, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/apiService';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTheme } from '@/contexts/ThemeContext';

interface UserData {
  fullName: string;
  email: string;
  profilePhoto: string | null;
  address: string;
  pincode: string;
}

const ProfileInfoCard: React.FC = () => {
  const { theme } = useTheme()
  const { profile, isLoading, refetch, updateProfile } = useUserProfile();
  const [userData, setUserData] = useState<UserData>({
    fullName: '',
    email: '',
    profilePhoto: null,
    address: '',
    pincode: '',
  });
  const [originalData, setOriginalData] = useState<UserData>({
    fullName: '',
    email: '',
    profilePhoto: null,
    address: '',
    pincode: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      const profileData = {
        fullName: profile.fullName,
        email: profile.email,
        profilePhoto: profile.profilePhoto,
        address: profile.address || '',
        pincode: profile.pincode || '',
      };
      setUserData(profileData);
      setOriginalData(profileData);
    }
  }, [profile]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserData(prev => ({
          ...prev,
          profilePhoto: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const hasChanges = () => {
    const fileInput = document.getElementById('profile-upload') as HTMLInputElement;
    return (
      userData.fullName !== originalData.fullName ||
      userData.address !== originalData.address ||
      userData.pincode !== originalData.pincode ||
      Boolean(fileInput?.files?.[0])
    );
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      const [firstName, ...lastNameParts] = userData.fullName.split(' ');
      formData.append('first_name', firstName || '');
      formData.append('last_name', lastNameParts.join(' ') || '');
      formData.append('address', userData.address || '');
      formData.append('pincode', userData.pincode || '');

      
      const fileInput = document.getElementById('profile-upload') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append('profile_image', fileInput.files[0]);
      }

      const response = await apiService.updateProfile(formData);
      if (response?.data?.success) {
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully.',
          className: 'bg-green-500 text-white border-green-600',
        });
        // Update profile in context immediately
        const updatedProfile = {
          fullName: userData.fullName,
          profilePhoto: userData.profilePhoto,
          address: userData.address,
          pincode: userData.pincode,
        };
        updateProfile(updatedProfile);
        // Also refetch to get server data
        await refetch();
      } else {
        toast({
          title: 'Update Failed',
          description: response.data?.message || 'Failed to update profile.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border shadow-lg rounded-2xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Profile Information</CardTitle>
        <p className="text-sm text-muted-foreground">Update your personal details and profile picture</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-primary">
              {userData.profilePhoto ? (
                <AvatarImage src={userData.profilePhoto} alt="Profile" />
              ) : (
                <AvatarFallback className="text-2xl" style={{ backgroundColor: 'var(--profile-avatar-bg)', color: 'var(--profile-avatar-text)' }}>
                  {userData.fullName.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <label
              htmlFor="profile-upload"
              className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-primary-foreground p-1 rounded-full cursor-pointer"
            >
              <Camera className={`w-4 h-4 ${ theme === 'light' ? 'text-white' : 'text-primary-foreground'
          }`}/>
              <input 
                id="profile-upload" 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden" 
              />
            </label>
          </div>

          <div>
            <h3 className="text-lg font-medium text-foreground">{userData.fullName}</h3>
            <p className="text-muted-foreground text-sm">{userData.email}</p>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm text-foreground">Full Name</Label>
            <Input
              id="fullName"
              value={userData.fullName}
              onChange={(e) => setUserData(prev => ({ ...prev, fullName: e.target.value }))}
              className="bg-muted/50 border-border focus:ring-2 focus:ring-offset-0 text-black"
              style={{
                '--tw-ring-color': 'var(--input-border)'
              } as React.CSSProperties}
            />
          </div>
          <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{userData.email}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm text-foreground">Address</Label>
            <Textarea
              id="address"
              value={userData.address}
              onChange={(e) => setUserData(prev => ({ ...prev, address: e.target.value }))}
              className="bg-muted/50 border-border focus:ring-2 focus:ring-offset-0 text-black"
              style={{
                '--tw-ring-color': 'var(--input-border)'
              } as React.CSSProperties}
              rows={3}
              placeholder="Enter your full business address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode" className="text-sm text-foreground">Pincode</Label>
            <Input
              id="pincode"
              value={userData.pincode}
              onChange={(e) => setUserData(prev => ({ ...prev, pincode: e.target.value }))}
              className="bg-muted/50 border-border focus:ring-2 focus:ring-offset-0 text-black"
              style={{
                '--tw-ring-color': 'var(--input-border)'
              } as React.CSSProperties}
              placeholder="Enter pincode"
            />
          </div>
        </div>

        <Button 
          onClick={handleSaveProfile}
          disabled={isSaving || !hasChanges()}
          className={`bg-primary hover:bg-primary/90 text-primary-foreground mt-4 ${ theme === 'light' ? 'text-white' : 'text-primary-foreground'
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileInfoCard;
