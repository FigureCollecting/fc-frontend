import React, { useState } from 'react';
import {
  VStack, Heading, Text, Button, HStack, Box, Input, Alert, AlertIcon,
  useToast, IconButton
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { getWebAuthnRegisterOptions, verifyWebAuthnRegistration, deleteWebAuthnCredential } from '../../api';
import { startRegistration } from '@simplewebauthn/browser';

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
  const toast = useToast();

  const isSupported = typeof window !== 'undefined' && window.PublicKeyCredential !== undefined;

  const handleAdd = async () => {
    setLoading(true);
    try {
      const { data: optionsData } = await getWebAuthnRegisterOptions(nickname || undefined);
      const regResponse = await startRegistration({ optionsJSON: optionsData.options });
      await verifyWebAuthnRegistration(optionsData.challengeId, regResponse);
      toast({ title: 'Passkey added', status: 'success', duration: 3000 });
      setAdding(false);
      setNickname('');
      onUpdate();
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        toast({ title: 'Failed to add passkey', description: err.message, status: 'error', duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (credentialId: string) => {
    try {
      await deleteWebAuthnCredential(credentialId);
      toast({ title: 'Passkey removed', status: 'info', duration: 3000 });
      onUpdate();
    } catch {
      toast({ title: 'Failed to remove passkey', status: 'error', duration: 5000 });
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="sm">Passkeys</Heading>
      <Text fontSize="sm">Use passkeys for passwordless login.</Text>

      {!isSupported && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Your browser doesn't support passkeys.
        </Alert>
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
            icon={<DeleteIcon />}
            size="sm"
            colorScheme="red"
            variant="ghost"
            onClick={() => handleDelete(cred.credentialId)}
          />
        </HStack>
      ))}

      {adding ? (
        <VStack spacing={3}>
          <Input
            placeholder="Passkey nickname (optional)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
          />
          <HStack>
            <Button colorScheme="blue" onClick={handleAdd} isLoading={loading}>
              Register Passkey
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </HStack>
        </VStack>
      ) : (
        isSupported && (
          <Button colorScheme="blue" variant="outline" onClick={() => setAdding(true)}>
            Add Passkey
          </Button>
        )
      )}
    </VStack>
  );
};

export default PasskeyManagement;
