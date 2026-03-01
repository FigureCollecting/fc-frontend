import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Heading, Input, Button, FormControl, FormLabel, Alert, AlertIcon, VStack, Text } from '@chakra-ui/react';
import { resetPasswordRequest } from '../api';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const userId = searchParams.get('uid');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!token || !userId) {
    return (
      <Box maxW="md" mx="auto" mt={20} p={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Invalid reset link. Please request a new one.
        </Alert>
      </Box>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setStatus('error');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      await resetPasswordRequest(token, password, userId);
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Invalid or expired reset link. Please request a new one.');
    }
  };

  if (status === 'success') {
    return (
      <Box maxW="md" mx="auto" mt={20} p={8}>
        <VStack spacing={6}>
          <Heading size="lg">Password Reset</Heading>
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            Your password has been reset successfully.
          </Alert>
          <Button colorScheme="blue" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box maxW="md" mx="auto" mt={20} p={8}>
      <VStack spacing={6} as="form" onSubmit={handleSubmit}>
        <Heading size="lg">Reset Password</Heading>
        <Text>Enter your new password.</Text>
        {status === 'error' && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {errorMessage}
          </Alert>
        )}
        <FormControl>
          <FormLabel>New Password</FormLabel>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </FormControl>
        <FormControl>
          <FormLabel>Confirm Password</FormLabel>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </FormControl>
        <Button type="submit" colorScheme="blue" w="full" isLoading={status === 'loading'}>
          Reset Password
        </Button>
      </VStack>
    </Box>
  );
};

export default ResetPassword;
