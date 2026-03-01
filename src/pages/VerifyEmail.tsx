import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Heading, Spinner, Alert, AlertIcon, Button, VStack } from '@chakra-ui/react';
import { verifyEmailToken } from '../api';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');
  const userId = searchParams.get('uid');

  useEffect(() => {
    if (!token || !userId) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmailToken(token, userId)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      })
      .catch(() => {
        setStatus('error');
        setMessage('Invalid or expired verification link. Please request a new one.');
      });
  }, [token, userId]);

  return (
    <Box maxW="md" mx="auto" mt={20} p={8}>
      <VStack spacing={6}>
        <Heading size="lg">Email Verification</Heading>
        {status === 'loading' && <Spinner size="xl" />}
        {status === 'success' && (
          <>
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              {message}
            </Alert>
            <Button colorScheme="blue" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {message}
            </Alert>
            <Button colorScheme="blue" variant="outline" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default VerifyEmail;
