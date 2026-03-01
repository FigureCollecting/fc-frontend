import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Heading, Text, Input, Button, FormControl, FormLabel, Alert, AlertIcon, VStack, Link } from '@chakra-ui/react';
import { forgotPasswordRequest } from '../api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPasswordRequest(email);
    } catch {
      // Always show success to prevent email enumeration
    }
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <Box maxW="md" mx="auto" mt={20} p={8}>
        <VStack spacing={6}>
          <Heading size="lg">Check Your Email</Heading>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            If an account exists with that email, we've sent a password reset link.
          </Alert>
          <Link as={RouterLink} to="/login" color="blue.500">
            Back to Login
          </Link>
        </VStack>
      </Box>
    );
  }

  return (
    <Box maxW="md" mx="auto" mt={20} p={8}>
      <VStack spacing={6} as="form" onSubmit={handleSubmit}>
        <Heading size="lg">Forgot Password</Heading>
        <Text>Enter your email address and we'll send you a link to reset your password.</Text>
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormControl>
        <Button type="submit" colorScheme="blue" w="full" isLoading={loading}>
          Send Reset Link
        </Button>
        <Link as={RouterLink} to="/login" color="blue.500">
          Back to Login
        </Link>
      </VStack>
    </Box>
  );
};

export default ForgotPassword;
