import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/apiService';
const GmailIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
  </svg>
);

const OutlookIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.154-.352.23-.58.23h-8.547v-6.959l1.6 1.229c.077.058.168.088.273.088.104 0 .195-.03.273-.088l6.98-5.354c.058-.038.12-.067.188-.084.067-.02.13-.028.186-.028h.03c.164 0 .32.06.468.18.148.12.248.253.3.398a.727.727 0 0 1 .067.334zM24 5.28c0 .296-.104.603-.312.924-.21.32-.44.555-.694.703l-7.46 5.752c-.037.02-.09.047-.157.083a.625.625 0 0 1-.16.054l-.083.03h-.03c-.028 0-.074-.01-.14-.03a.625.625 0 0 1-.16-.054c-.067-.036-.12-.063-.156-.083l-1.012-.773V6.67c0-.23.08-.424.238-.58.158-.156.352-.234.58-.234h8.547c.235 0 .432.08.59.24.16.158.24.352.24.585v.6zM14.635 6.67v12h-1.27V7.062L7.363 2.2h6.692c.228 0 .422.078.58.234.158.156.237.35.237.58v3.656zM9.238 8.06c-.834 0-1.56.208-2.18.626a4.098 4.098 0 0 0-1.46 1.703c-.344.72-.516 1.52-.516 2.4 0 .92.175 1.75.524 2.49.35.74.842 1.32 1.477 1.74.636.42 1.366.63 2.192.63.82 0 1.54-.213 2.162-.64.622-.425 1.104-1.01 1.447-1.752.344-.743.516-1.572.516-2.487 0-.9-.17-1.71-.508-2.428a4.033 4.033 0 0 0-1.43-1.67c-.616-.41-1.34-.613-2.174-.613h-.05zm.044 1.625c.577 0 1.038.267 1.383.8.345.535.518 1.282.518 2.242 0 .972-.173 1.735-.52 2.29-.347.555-.81.832-1.39.832-.586 0-1.054-.272-1.405-.815-.35-.544-.525-1.3-.525-2.267 0-.978.174-1.737.52-2.277.348-.54.82-.81 1.418-.81v.005zM0 3.397l7.363 1.17v14.862L0 20.6V3.397z" fill="#0078D4"/>
  </svg>
);

const ConnectedAccountsCard: React.FC = () => {
  const { theme } = useTheme();
  const { profile, refetch } = useUserProfile();

  const { toast } = useToast();
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [outlookConnecting, setOutlookConnecting] = useState(false);
  const [gmailDisconnecting, setGmailDisconnecting] = useState(false);
  const [outlookDisconnecting, setOutlookDisconnecting] = useState(false);

  const isGmailConnected = profile?.is_gmail_connected ?? false;
  const isOutlookConnected = profile?.is_outlook_connected ?? false;
  const gmailAccountEmail = profile?.gmailAccountEmail;
  const outlookAccountEmail = profile?.outlookAccountEmail;

  const openAuthPopup = (authUrl: string, name: string, onClose: () => void) => {
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const windowName = `${name}Auth_${Date.now()}`;

    const authWindow = window.open(
      authUrl,
      windowName,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    const timer = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(timer);
        onClose();
      }
    }, 500);
  };

  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data?.type !== 'mail-oauth-complete') {
        return;
      }

      void refetch();
      const status = event.data?.payload?.status;
      const provider = event.data?.payload?.provider;
      const message = event.data?.payload?.message;
      toast({
        title: status === 'success' ? 'Connection complete' : 'Connection failed',
        description: message || `${provider || 'Mail'} connection flow completed.`,
        variant: status === 'success' ? 'default' : 'destructive',
        className: status === 'success' ? 'bg-blue-500 text-white border-blue-600' : undefined,
      });
      setGmailConnecting(false);
      setOutlookConnecting(false);
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [refetch, toast]);

  const handleGmailConnect = async () => {
    setGmailConnecting(true);
    try {
      const response = await apiService.connectGmail();
      const authUrl = response.data?.auth_url || response.data?.authorization_url;

      if (!authUrl) {
        toast({
          title: 'Gmail Connection',
          description: response.data?.message || 'Unable to start Gmail connection.',
          variant: 'destructive',
        });
        setGmailConnecting(false);
        return;
      }

      openAuthPopup(authUrl, 'Gmail', () => {
        setGmailConnecting(false);
        void refetch();
        toast({
          title: 'Gmail Connected',
          description: 'Gmail connection flow completed.',
          className: 'bg-blue-500 text-white border-blue-600',
        });
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to initiate Gmail connection.',
        variant: 'destructive',
      });
      setGmailConnecting(false);
      
    }
  };

  const handleOutlookConnect = async () => {
    setOutlookConnecting(true);
    try {
      const response = await apiService.connectOutlook();
      const authUrl = response.data?.auth_url || response.data?.authorization_url;

      if (!authUrl) {
        toast({
          title: 'Outlook Connection',
          description: response.data?.message || 'Unable to start Outlook connection.',
          variant: 'destructive',
        });
        setOutlookConnecting(false);
        return;
      }

      openAuthPopup(authUrl, 'Outlook', () => {
        setOutlookConnecting(false);
        void refetch();
        toast({
          title: 'Outlook Connected',
          description: 'Outlook connection flow completed.',
          className: 'bg-blue-500 text-white border-blue-600',
        });
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to initiate Outlook connection.',
        variant: 'destructive',
      });
      setOutlookConnecting(false);
    }
  };

  const handleGmailDisconnect = async () => {
    setGmailDisconnecting(true);
    try {
      await apiService.disconnectGmail();
      await refetch();
      toast({
        title: 'Gmail disconnected',
        description: 'Your Google account has been disconnected.',
        className: 'bg-blue-500 text-white border-blue-600',
      });
    } catch {
      toast({
        title: 'Disconnect failed',
        description: 'Could not disconnect Gmail. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGmailDisconnecting(false);
    }
  };

  const handleOutlookDisconnect = async () => {
    setOutlookDisconnecting(true);
    try {
      await apiService.disconnectOutlook();
      await refetch();
      toast({
        title: 'Outlook disconnected',
        description: 'Your Microsoft account has been disconnected.',
        className: 'bg-blue-500 text-white border-blue-600',
      });
    } catch {
      toast({
        title: 'Disconnect failed',
        description: 'Could not disconnect Outlook. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setOutlookDisconnecting(false);
    }
  };

  return (
    <Card className="bg-card border-border shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Connected Accounts</CardTitle>
        <p className="text-sm text-muted-foreground">
          Link your email accounts to enable seamless integrations
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Gmail Connection */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-sm border border-border">
              <GmailIcon />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Gmail</h3>
              <p className="text-xs text-muted-foreground">
                {isGmailConnected
                  ? gmailAccountEmail || 'Your Google account is connected'
                  : 'Connect your Google account'}
              </p>
            </div>
          </div>
          <Button
            onClick={isGmailConnected ? handleGmailDisconnect : handleGmailConnect}
            disabled={gmailConnecting || gmailDisconnecting}
            variant="outline"
            className={
              isGmailConnected
                ? 'border-border text-destructive hover:bg-destructive/10 hover:text-destructive'
                : `border-border hover:bg-primary hover:text-primary-foreground transition-colors ${
                    theme === 'light' ? 'hover:text-white' : ''
                  }`
            }
          >
            {gmailConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : gmailDisconnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Disconnecting...
              </>
            ) : isGmailConnected ? (
              'Disconnect'
            ) : (
              'Connect'
            )}
          </Button>
        </div>

        {/* Outlook Connection */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-sm border border-border">
              <OutlookIcon />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Outlook</h3>
              <p className="text-xs text-muted-foreground">
                {isOutlookConnected
                  ? outlookAccountEmail || 'Your Microsoft account is connected'
                  : 'Connect your Microsoft account'}
              </p>
            </div>
          </div>
          <Button
            onClick={isOutlookConnected ? handleOutlookDisconnect : handleOutlookConnect}
            disabled={outlookConnecting || outlookDisconnecting}
            variant="outline"
            className={
              isOutlookConnected
                ? 'border-border text-destructive hover:bg-destructive/10 hover:text-destructive'
                : `border-border hover:bg-primary hover:text-primary-foreground transition-colors ${
                    theme === 'light' ? 'hover:text-white' : ''
                  }`
            }
          >
            {outlookConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : outlookDisconnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Disconnecting...
              </>
            ) : isOutlookConnected ? (
              'Disconnect'
            ) : (
              'Connect'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectedAccountsCard;
