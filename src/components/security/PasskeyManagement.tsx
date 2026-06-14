import React, { useState } from 'react';
import {
  Steps,
  VStack,
  Heading,
  Text,
  Button,
  HStack,
  Box,
  Input,
  Alert,
  IconButton,
} from '@chakra-ui/react';
import { toaster } from '../ui/toaster';
import { getWebAuthnRegisterOptions, verifyWebAuthnRegistration, deleteWebAuthnCredential } from '../../api';
import { startRegistration } from '@simplewebauthn/browser';
import { LuTrash2 } from 'react-icons/lu';

interface Credential {
  credentialId: string;
  nickname?: string;
  createdAt: string;
}

interface PasskeyManagementProps {
  credentials: Credential[];
  onUpdate: () => void;
}

const PasskeyManagement: React.FC<PasskeyManagementProps> = ({ credentials, onUpdate }) => {
  const [adding, setAdding] = useState(false);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const isSupported = typeof window !== 'undefined' && window.PublicKeyCredential !== undefined;

  const handleAdd = async () => {
    setLoading(true);
    try {
      const { data: optionsData } = await getWebAuthnRegisterOptions(nickname || undefined);
      const regResponse = await startRegistration({ optionsJSON: optionsData.options });
      await verifyWebAuthnRegistration(optionsData.challengeId, regResponse);
      toaster.create({ title: 'Passkey added', type: 'success', duration: 3000 });
      setAdding(false);
      setNickname('');
      onUpdate();
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        toaster.create({ title: 'Failed to add passkey', description: err.message, type: 'error', duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (credentialId: string) => {
    try {
      await deleteWebAuthnCredential(credentialId);
      toaster.create({ title: 'Passkey removed', type: 'info', duration: 3000 });
      onUpdate();
    } catch {
      toaster.create({ title: 'Failed to remove passkey', type: 'error', duration: 5000 });
    }
  };

  return (
    <VStack gap={4} align="stretch">
      <Heading size="sm">Passkeys</Heading>
      <Text fontSize="sm">Use passkeys for passwordless login.</Text>
      {!isSupported && (
        <Alert.Root status="info" borderRadius="md">
          <Alert.Indicator />
          Your browser doesn't support passkeys.
        </Alert.Root>
      )}
      {credentials.map((cred) => (
        <HStack key={cred.credentialId} p={3} borderWidth={1} borderRadius="md" justify="space-between">
          <Box>
            <Text fontWeight="bold">{cred.nickname || 'Passkey'}</Text>
            <Text fontSize="xs" color="gray.500">
              Added {new Date(cred.createdAt).toLocaleDateString()}
            </Text>
          </Box>
          <IconButton
            aria-label="Remove passkey"
            size="sm"
            colorPalette="red"
            variant="ghost"
            onClick={() => handleDelete(cred.credentialId)}><LuTrash2 /></IconButton>
        </HStack>
      ))}
      {adding ? (
        <VStack gap={3}>
          <Input
            placeholder="Passkey nickname (optional)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
          />
          <HStack>
            <Button colorPalette="blue" onClick={handleAdd} loading={loading}>
              Register Passkey
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </HStack>
        </VStack>
      ) : (
        isSupported && (
          <Button colorPalette="blue" variant="outline" onClick={() => setAdding(true)}>
            Add Passkey
          </Button>
        )
      )}
    </VStack>
  );
};

export default PasskeyManagement;
