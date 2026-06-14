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
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  PinInput,
  PinInputField,
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

        <Tabs.Root w="full" variant='enclosed'>
          <Tabs.List>
            {methods.includes('totp') && <Tab>Authenticator</Tab>}
            {methods.includes('backup') && <Tab>Backup Code</Tab>}
          </Tabs.List>
          <TabPanels>
            {methods.includes('totp') && (
              <TabPanel>
                <VStack gap={4}>
                  <Text fontSize="sm">Enter the 6-digit code from your authenticator app.</Text>
                  <HStack>
                    <PinInput.Root otp size="lg" onValueComplete={(value) => handleVerify('totp', value)}><PinInput.HiddenInput />






                      <PinInput.Control><PinInput.Input index={0} /><PinInput.Input index={1} /><PinInput.Input index={2} /><PinInput.Input index={3} /><PinInput.Input index={4} /><PinInput.Input index={5} /></PinInput.Control></PinInput.Root>
                  </HStack>
                </VStack>
              </TabPanel>
            )}
            {methods.includes('backup') && (
              <TabPanel>
                <VStack gap={4}>
                  <Text fontSize="sm">Enter one of your backup codes (format: xxxx-xxxx).</Text>
                  <Input
                    placeholder="xxxx-xxxx"
                    value={code}
                    onValueChange={(e) => setCode(e.target.value)}
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
              </TabPanel>
            )}
          </TabPanels>
        </Tabs.Root>

        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </VStack>
    </Box>
  );
};

export default TwoFactorVerify;
