import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Steps, Box, Heading, Input, Button, Alert, VStack, Text, Field } from '@chakra-ui/react';
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

  const helmet = (
    <Helmet>
      <title>Reset Password — FigureCollecting</title>
      <meta name="description" content="Set a new password for your FigureCollecting account." />
      <link rel="canonical" href="https://figurecollecting.com/reset-password" />
    </Helmet>
  );

  if (!token || !userId) {
    return (
      <>
        {helmet}
        <Box maxW="md" mx="auto" mt={20} p={8}>
          <Alert.Root status="error" borderRadius="md">
            <Alert.Indicator />
            Invalid reset link. Please request a new one.
          </Alert.Root>
        </Box>
      </>
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
      <>
        {helmet}
        <Box maxW="md" mx="auto" mt={20} p={8}>
          <VStack gap={6}>
            <Heading size="lg">Password Reset</Heading>
            <Alert.Root status="success" borderRadius="md">
              <Alert.Indicator />
              Your password has been reset successfully.
            </Alert.Root>
            <Button colorPalette="blue" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </VStack>
        </Box>
      </>
    );
  }

  return (
    <>
      {helmet}
      <Box maxW="md" mx="auto" mt={20} p={8}>
        <VStack gap={6} asChild><form onSubmit={handleSubmit}>
            <Heading size="lg">Reset Password</Heading>
            <Text>Enter your new password.</Text>
            {status === 'error' && (
              <Alert.Root status="error" borderRadius="md">
                <Alert.Indicator />
                {errorMessage}
              </Alert.Root>
            )}
            <Field.Root>
              <Field.Label>New Password</Field.Label>
              <Input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required minLength={6} />
            </Field.Root>
            <Field.Root>
              <Field.Label>Confirm Password</Field.Label>
              <Input type="password" value={confirmPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} required />
            </Field.Root>
            <Button type="submit" colorPalette="blue" w="full" loading={status === 'loading'}>
              Reset Password
            </Button>
          </form></VStack>
      </Box>
    </>
  );
};

export default ResetPassword;
