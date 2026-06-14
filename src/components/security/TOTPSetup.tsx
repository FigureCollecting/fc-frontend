import React, { useState } from 'react';
import {
  Steps,
  Box,
  VStack,
  Heading,
  Text,
  Image,
  Input,
  Button,
  Alert,
  Code,
  useToast,
  HStack,
  PinInput,
  PinInputField,
} from '@chakra-ui/react';
import { setupTOTP, verifyTOTPSetup, disableTOTP } from '../../api';
import BackupCodesDisplay from './BackupCodesDisplay';

interface TOTPSetupProps {
  isEnabled: boolean;
  onStatusChange: () => void;
}

const TOTPSetup: React.FC<TOTPSetupProps> = ({ isEnabled, onStatusChange }) => {
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'backup' | 'disable'>('idle');
  const [setupData, setSetupData] = useState<any>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disableCode, setDisableCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await setupTOTP();
      setSetupData(result.data);
      setStep('setup');
    } catch {
      setError('Failed to set up TOTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await verifyTOTPSetup(code);
      setBackupCodes(result.data.backupCodes);
      setStep('backup');
      onStatusChange();
      toast({ title: '2FA enabled', status: 'success', duration: 3000 });
    } catch {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setError('');
    try {
      await disableTOTP(disableCode);
      setStep('idle');
      setDisableCode('');
      onStatusChange();
      toast({ title: '2FA disabled', status: 'info', duration: 3000 });
    } catch {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'backup') {
    return (
      <Box>
        <BackupCodesDisplay codes={backupCodes} />
        <Button mt={4} onClick={() => setStep('idle')}>Done</Button>
      </Box>
    );
  }

  if (step === 'setup') {
    return (
      <VStack gap={4} align="stretch">
        <Heading size="sm">Scan QR Code</Heading>
        <Text fontSize="sm">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</Text>
        {setupData?.qrCodeDataURL && (
          <Box textAlign="center">
            <Image src={setupData.qrCodeDataURL} alt="TOTP QR Code" mx="auto" boxSize="200px" />
          </Box>
        )}
        <Text fontSize="xs" color="gray.500">
          Or enter manually: <Code fontSize="xs">{setupData?.secret}</Code>
        </Text>
        <Text fontSize="sm" mt={4}>Enter the 6-digit code from your app:</Text>
        <HStack justify="center">
          <PinInput.Root otp size="lg" onValueComplete={handleVerify}><PinInput.HiddenInput />






            <PinInput.Control><PinInput.Input index={0} /><PinInput.Input index={1} /><PinInput.Input index={2} /><PinInput.Input index={3} /><PinInput.Input index={4} /><PinInput.Input index={5} /></PinInput.Control></PinInput.Root>
        </HStack>
        {error && <Alert.Root status="error" borderRadius="md"><Alert.Indicator />{error}</Alert.Root>}
        <Button variant="ghost" onClick={() => setStep('idle')}>Cancel</Button>
      </VStack>
    );
  }

  if (step === 'disable') {
    return (
      <VStack gap={4} align="stretch">
        <Heading size="sm">Disable 2FA</Heading>
        <Text fontSize="sm">Enter your authenticator code to disable two-factor authentication.</Text>
        <Input
          placeholder="Enter 6-digit code"
          value={disableCode}
          onValueChange={(e) => setDisableCode(e.target.value)}
          maxLength={6}
        />
        {error && <Alert.Root status="error" borderRadius="md"><Alert.Indicator />{error}</Alert.Root>}
        <HStack>
          <Button colorPalette="red" onClick={handleDisable} loading={loading} disabled={disableCode.length !== 6}>
            Disable
          </Button>
          <Button variant="ghost" onClick={() => { setStep('idle'); setError(''); }}>Cancel</Button>
        </HStack>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      <Heading size="sm">Authenticator App (TOTP)</Heading>
      <Text fontSize="sm">
        {isEnabled
          ? 'Two-factor authentication is enabled.'
          : 'Add an extra layer of security to your account.'}
      </Text>
      {isEnabled ? (
        <Button colorPalette="red" variant="outline" onClick={() => setStep('disable')}>
          Disable 2FA
        </Button>
      ) : (
        <Button colorPalette="blue" onClick={handleSetup} loading={loading}>
          Set Up 2FA
        </Button>
      )}
    </VStack>
  );
};

export default TOTPSetup;
