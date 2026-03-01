import React, { useState } from 'react';
import {
  Box, Heading, VStack, Input, Button, Text, Alert, AlertIcon,
  Tabs, TabList, TabPanels, Tab, TabPanel, PinInput, PinInputField, HStack
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
      <VStack spacing={6}>
        <Heading size="lg">Two-Factor Authentication</Heading>
        <Text>Enter your verification code to continue.</Text>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Tabs w="full" variant="enclosed">
          <TabList>
            {methods.includes('totp') && <Tab>Authenticator</Tab>}
            {methods.includes('backup') && <Tab>Backup Code</Tab>}
          </TabList>
          <TabPanels>
            {methods.includes('totp') && (
              <TabPanel>
                <VStack spacing={4}>
                  <Text fontSize="sm">Enter the 6-digit code from your authenticator app.</Text>
                  <HStack>
                    <PinInput otp size="lg" onComplete={(value) => handleVerify('totp', value)}>
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                    </PinInput>
                  </HStack>
                </VStack>
              </TabPanel>
            )}
            {methods.includes('backup') && (
              <TabPanel>
                <VStack spacing={4}>
                  <Text fontSize="sm">Enter one of your backup codes (format: xxxx-xxxx).</Text>
                  <Input
                    placeholder="xxxx-xxxx"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={9}
                  />
                  <Button
                    colorScheme="blue"
                    w="full"
                    isLoading={loading}
                    onClick={() => handleVerify('backup', code)}
                    isDisabled={code.length < 8}
                  >
                    Verify
                  </Button>
                </VStack>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>

        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </VStack>
    </Box>
  );
};

export default TwoFactorVerify;
