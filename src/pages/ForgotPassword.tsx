import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link as RouterLink } from 'react-router-dom';
import { Steps, Box, Heading, Text, Input, Button, Alert, VStack, Link, Field } from '@chakra-ui/react';
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
      <>
        <Helmet>
          <title>Forgot Password — FigureCollecting</title>
          <meta name="description" content="Reset your FigureCollecting password. Enter your email to receive a password reset link." />
          <link rel="canonical" href="https://figurecollecting.com/forgot-password" />
        </Helmet>
        <Box maxW="md" mx="auto" mt={20} p={8}>
          <VStack gap={6}>
            <Heading size="lg">Check Your Email</Heading>
            <Alert.Root status="info" borderRadius="md">
              <Alert.Indicator />
              If an account exists with that email, we've sent a password reset link.
            </Alert.Root>
            <Link color="blue.500" asChild><RouterLink to="/login">Back to Login
                          </RouterLink></Link>
          </VStack>
        </Box>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Forgot Password — FigureCollecting</title>
        <meta name="description" content="Reset your FigureCollecting password. Enter your email to receive a password reset link." />
        <link rel="canonical" href="https://figurecollecting.com/forgot-password" />
      </Helmet>
      <Box maxW="md" mx="auto" mt={20} p={8}>
        <VStack gap={6} asChild><form onSubmit={handleSubmit}>
            <Heading size="lg">Forgot Password</Heading>
            <Text>Enter your email address and we'll send you a link to reset your password.</Text>
            <Field.Root>
              <Field.Label>Email</Field.Label>
              <Input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </Field.Root>
            <Button type="submit" colorPalette="blue" w="full" loading={loading}>
              Send Reset Link
            </Button>
            <Link color="blue.500" asChild><RouterLink to="/login">Back to Login
                        </RouterLink></Link>
          </form></VStack>
      </Box>
    </>
  );
};

export default ForgotPassword;
