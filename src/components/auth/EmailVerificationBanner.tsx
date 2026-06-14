import React, { useState, useEffect } from 'react';
import { Steps, Alert, Button, HStack, Text, useToast } from '@chakra-ui/react';
import { useAuthStore } from '../../stores/authStore';
import { resendVerificationEmail, getUserProfile } from '../../api';

const EmailVerificationBanner: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const toast = useToast();

  // Sync emailVerified from backend if store shows unverified (handles stale localStorage)
  useEffect(() => {
    if (!user || user.emailVerified === true || checked) return;
    let cancelled = false;
    getUserProfile().then((profile) => {
      if (cancelled) return;
      if (profile.emailVerified === true) {
        setUser({ ...user, emailVerified: true });
      }
      setChecked(true);
    }).catch(() => {
      setChecked(true);
    });
    return () => { cancelled = true; };
  }, [user, checked, setUser]);

  // Don't render until the backend check completes to avoid a flash of the banner
  if (!user || user.emailVerified === true || !checked) return null;

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerificationEmail(user.email);
      toast({
        title: 'Verification email sent',
        description: 'Check your inbox for the verification link.',
        status: 'success',
        duration: 5000,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send verification email. Please try again.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Alert.Root status="warning" variant="subtle">
      <Alert.Indicator />
      <HStack justify="space-between" w="full">
        <Text>Your email is not verified. Please check your inbox.</Text>
        <Button size="sm" colorPalette="orange" variant="outline" loading={loading} onClick={handleResend}>
          Resend
        </Button>
      </HStack>
    </Alert.Root>
  );
};

export default EmailVerificationBanner;
