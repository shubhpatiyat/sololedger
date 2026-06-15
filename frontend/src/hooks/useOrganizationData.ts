import { useState, useEffect } from 'react';
import { DEMO_MODE } from '@/config/demo';
import { demoOrganization } from '@/data/demoContent';

interface OrganizationData {
  organization_name: string;
  logo: string;
  showMicrosoftLogin: boolean;
  onlyShowMicrosoftLogin?: boolean;
  showCaptcha: boolean;
  captchValue: string,
}

export const useOrganizationData = () => {
  const [data, setData] = useState<OrganizationData>({
    ...demoOrganization,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setData(demoOrganization);
    setLoading(false);
  }, []);

  return { data, isLoading: loading };
};
