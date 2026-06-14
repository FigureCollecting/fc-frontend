import React, { useState } from 'react';
import {
  Steps,
  Box,
  Heading,
  VStack,
  Input,
  Button,
  Text,
  Alert,
  Tabs,
  PinInput,
  HStack,
} from '@chakra-ui/react';
import { verify2FA } from '../../api';

interface TwoFactorVerifyProps {
  sessionId: string;
  methods: string[];
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
  sessionId, methods, onSuccess, onCancel
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (method: string, verifyCode: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await verify2FA(sessionId, method, verifyCode);
      onSuccess(result.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={10} p={8}>
      <VStack gap={6}>
        <Heading size="lg">Two-Factor Authentication</Heading>
        <Text>Enter your verification code to continue.</Text>

        {error && (
          <Alert.Root status="error" borderRadius="md">
            <Alert.Indicator />
            {error}
          </Alert.Root>
        )}

        <Tabs.Root w="full" variant='enclosed' defaultValue={methods.includes('totp') ? 'totp' : 'backup'}>
          <Tabs.List>
            {methods.includes('totp') && <Tabs.Trigger value="totp">Authenticator</Tabs.Trigger>}
            {methods.includes('backup') && <Tabs.Trigger value="backup">Backup Code</Tabs.Trigger>}
          </Tabs.List>
          {methods.includes('totp') && (
            <Tabs.Content value="totp">
              <VStack gap={4}>
                <Text fontSize="sm">Enter the 6-digit code from your authenticator app.</Text>
                <HStack>
                  <PinInput.Root otp size="lg" onValueComplete={(e) => handleVerify('totp', e.valueAsString)}>
                    <PinInput.HiddenInput />
                    <PinInput.Control>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <PinInput.Input key={i} index={i} />
                      ))}
                    </PinInput.Control>
                  </PinInput.Root>
                </HStack>
              </VStack>
            </Tabs.Content>
          )}
          {methods.includes('backup') && (
            <Tabs.Content value="backup">
              <VStack gap={4}>
                <Text fontSize="sm">Enter one of your backup codes (format: xxxx-xxxx).</Text>
                <Input
                  placeholder="xxxx-xxxx"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={9}
                />
                <Button
                  colorPalette="blue"
                  w="full"
                  loading={loading}
                  onClick={() => handleVerify('backup', code)}
                  disabled={code.length < 8}
                >
                  Verify
                </Button>
              </VStack>
            </Tabs.Content>
          )}
        </Tabs.Root>

        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </VStack>
    </Box>
  );
};

export default TwoFactorVerify;
