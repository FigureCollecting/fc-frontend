import React, { useState } from 'react';
import { Steps, Button } from '@chakra-ui/react';
import { toaster } from '../ui/toaster';
import { getWebAuthnLoginOptions, verifyWebAuthnLogin } from '../../api';
import { startAuthentication } from '@simplewebauthn/browser';

interface PasskeyLoginButtonProps {
  onSuccess: (data: any) => void;
}

const PasskeyLoginButton: React.FC<PasskeyLoginButtonProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);

  // Check if WebAuthn is supported
  const isSupported = typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined;

  if (!isSupported) return null;

  const handlePasskeyLogin = async () => {
    setLoading(true);
    try {
      const { data: optionsData } = await getWebAuthnLoginOptions();
      const authResponse = await startAuthentication({ optionsJSON: optionsData.options });
      const { data: verifyData } = await verifyWebAuthnLogin(
        optionsData.challengeId,
        authResponse
      );
      onSuccess(verifyData);
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        toaster.create({
          title: 'Passkey login failed',
          description: err.message || 'Unable to authenticate with passkey',
          type: 'error',
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      w="full"
      variant="outline"
      loading={loading}
      onClick={handlePasskeyLogin}
    >Sign in with Passkey
          </Button>
  );
};

export default PasskeyLoginButton;
