import React, { useCallback, useEffect, useState } from 'react';
import {
  Steps,
  Box,
  Heading,
  VStack,
  Spinner,
  Badge,
  Text,
  HStack,
  Separator,
} from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import { useAuthStore } from '../stores/authStore';
import { getUserProfile } from '../api';
import TOTPSetup from '../components/security/TOTPSetup';
import PasskeyManagement from '../components/security/PasskeyManagement';

const Security: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch {
      toaster.create({ title: 'Failed to load security settings', type: 'error', duration: 5000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return <Box textAlign="center" mt={20}><Spinner size="xl" /></Box>;

  return (
    <Box maxW="2xl" mx="auto" p={8}>
      <VStack gap={8} align="stretch">
        <Heading size="lg">Security Settings</Heading>

        {/* Email Verification Status */}
        <Box p={4} borderWidth={1} borderRadius="md">
          <HStack justify="space-between">
            <Box>
              <Heading size="sm">Email Verification</Heading>
              <Text fontSize="sm" mt={1}>{user?.email}</Text>
            </Box>
            <Badge colorPalette={profile?.emailVerified ? 'green' : 'yellow'}>
              {profile?.emailVerified ? 'Verified' : 'Not Verified'}
            </Badge>
          </HStack>
        </Box>

        <Separator />

        {/* TOTP */}
        <Box p={4} borderWidth={1} borderRadius="md">
          <TOTPSetup
            isEnabled={profile?.twoFactorEnabled ?? false}
            onStatusChange={fetchProfile}
          />
        </Box>

        <Separator />

        {/* Passkeys */}
        <Box p={4} borderWidth={1} borderRadius="md">
          <PasskeyManagement
            credentials={profile?.webauthnCredentials || []}
            onUpdate={fetchProfile}
          />
        </Box>
      </VStack>
    </Box>
  );
};

export default Security;
