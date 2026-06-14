import React from 'react';
import { useColorModeValue } from "../components/ui/color-mode";
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useMutation } from 'react-query';
import {
  Steps,
  Box,
  Button,
  Input,
  Heading,
  Text,
  Flex,
  Link,
  Icon,
  IconButton,
  InputGroup,
  VStack,
  Field,
} from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash, FaCube } from 'react-icons/fa';
import { loginUser } from '../api';
import { useAuthStore } from '../stores/authStore';
import TwoFactorVerify from '../components/auth/TwoFactorVerify';
import PasskeyLoginButton from '../components/auth/PasskeyLoginButton';
import { User } from '../types';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.85)', 'rgba(26, 32, 44, 0.75)');
  const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.08)');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const [showPassword, setShowPassword] = React.useState(false);
  const [twoFactorPending, setTwoFactorPending] = React.useState<{ sessionId: string; methods: string[] } | null>(null);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    toaster.create({
      title: 'Success',
      description: 'You are now logged in!',
      type: 'success',
      duration: 5000,
      closable: true,
    });
    navigate('/');
  };

  const mutation = useMutation(
    (data: LoginFormData) => loginUser(data.email, data.password),
    {
      onSuccess: (result) => {
        if ('requiresTwoFactor' in result && result.requiresTwoFactor) {
          setTwoFactorPending({ sessionId: result.sessionId, methods: result.methods });
          return;
        }
        handleLoginSuccess(result as User);
      },
      onError: (error: any) => {
        toaster.create({
          title: 'Error',
          description: error.response?.data?.message || 'Invalid email or password',
          type: 'error',
          duration: 5000,
          closable: true,
        });
      },
    }
  ) || {
    // Fallback for when useMutation returns undefined in tests
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
    status: 'idle' as const,
    isPending: false,
    isIdle: true,
    mutate: () => {},
    mutateAsync: () => Promise.resolve({}),
    reset: () => {}
  };

  const onSubmit = (data: LoginFormData) => {
    mutation.mutate(data);
  };

  const splashBackground = (
    <>
      <Box
        position="absolute"
        inset={0}
        backgroundImage="url('/splash-bg.png')"
        backgroundSize="cover"
        backgroundPosition="center"
      />
      <Box position="absolute" inset={0} bg="blackAlpha.700" />
    </>
  );

  // Show 2FA verification screen if login requires it
  if (twoFactorPending) {
    return (
      <Flex minH="100vh" position="relative" align="center" justify="center">
        {splashBackground}
        <Box
          position="relative"
          zIndex={1}
          bg={cardBg}
          backdropFilter="blur(12px)"
          border="1px solid"
          borderColor={cardBorder}
          p={8}
          rounded="xl"
          shadow="2xl"
          maxW="md"
          w="full"
          mx={4}
        >
          <TwoFactorVerify
            sessionId={twoFactorPending.sessionId}
            methods={twoFactorPending.methods}
            onSuccess={(data) => {
              const tokenExpiresAt = Date.now() + (14 * 60 * 1000);
              handleLoginSuccess({
                _id: data._id,
                username: data.username,
                email: data.email,
                isAdmin: data.isAdmin,
                token: data.accessToken,
                refreshToken: data.refreshToken,
                tokenExpiresAt,
                emailVerified: data.emailVerified ?? false,
                twoFactorEnabled: data.twoFactorEnabled ?? false,
                webauthnCredentialCount: data.webauthnCredentialCount ?? 0,
              });
            }}
            onCancel={() => setTwoFactorPending(null)}
          />
        </Box>
      </Flex>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sign In — FigureCollecting</title>
        <meta name="description" content="Sign in to FigureCollecting — your personal figure collection catalog. Sync with MyFigureCollection, search in milliseconds, and organize with flexible layouts." />
        <link rel="canonical" href="https://figurecollecting.com/login" />
      </Helmet>
      <Flex minH="100vh" position="relative" overflow="hidden">
        {splashBackground}

        <Flex
          position="relative"
          zIndex={1}
          w="full"
          minH="100vh"
          align="center"
          justify="center"
          gap={8}
          px={{ base: 4, md: 8 }}
          py={8}
          direction={{ base: 'column', lg: 'row' }}
        >
          {/* About panel */}
          <Box
            maxW="lg"
            flex="1"
            color="white"
            bg="blackAlpha.400"
            backdropFilter="blur(8px)"
            p={6}
            rounded="xl"
          >
            <Icon as={FaCube} boxSize={8} color="brand.300" mb={2} />
            <Heading size="md" mb={2}>FigureCollecting</Heading>
            <Text mb={2} fontSize="sm">
              Your personal collection catalog, built by collectors, for collectors.
            </Text>
            <Text mb={1} fontSize="xs" color="whiteAlpha.800">
              MFC is superb. We look to enhance that experience through your MFC
              collection data as well as beyond what MFC allows. We seek to enhance
              your Figure Collecting experience with a strong reliance on MFC, itself.
            </Text>
            <Text mb={3} fontSize="xs" color="whiteAlpha.800">
              We sync your owned, ordered, and wished items, plus your MFC lists and
              their contents directly into your catalog. But we don't stop where MFC
              stops. Unlicensed statues, GKs, custom pieces — if it's on your shelf,
              it belongs in your catalog.
            </Text>
            <VStack align="start" gap={1} mb={3} display={{ base: 'none', md: 'flex' }}>
              <Text fontSize="xs">&#x2022; Lightning-fast search across your collection</Text>
              <Text fontSize="xs">&#x2022; Filter by manufacturer, origin, scale, category, and more</Text>
              <Text fontSize="xs">&#x2022; Flexible layouts and color themes with specialty profiles</Text>
              <Text fontSize="xs">&#x2022; Gallery features coming soon: preorders, pickups, curated shelves</Text>
              <Text fontSize="xs">&#x2022; Full MFC sync: owned, ordered, wished, and all your lists</Text>
            </VStack>
            <Text fontSize="xs" fontStyle="italic" color="whiteAlpha.700">
              Your collection. Your way. No figure left behind.
            </Text>
            <Text fontSize="2xs" color="whiteAlpha.500" mt={2}>
              Uses data from MyFigureCollection.net. Not affiliated with MFC.
            </Text>
          </Box>

          {/* Login card */}
          <Box
            data-testid="auth-card"
            bg={cardBg}
            backdropFilter="blur(12px)"
            border="1px solid"
            borderColor={cardBorder}
            p={8}
            rounded="xl"
            shadow="2xl"
            maxW="md"
            w="full"
          >
            <Heading size="lg" textAlign="center" color={headingColor} mb={6}>
              Sign In
            </Heading>

            <Box as="form" role="form" onSubmit={handleSubmit(onSubmit)}>
              <Field.Root invalid={!!errors.email} mb={4}>
                <Field.Label htmlFor="email">Email</Field.Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email address"
                  size="lg"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.password} mb={6}>
                <Flex justify="space-between" align="baseline">
                  <Field.Label htmlFor="password">Password</Field.Label>
                  <Link asChild color="brand.500" fontSize="sm">
                    <RouterLink to="/forgot-password">Forgot password?</RouterLink>
                  </Link>
                </Flex>
                <InputGroup
                  endElement={
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Icon
                        as={showPassword ? FaEyeSlash : FaEye}
                        color="gray.500"
                      />
                    </IconButton>
                  }
                >
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    size="lg"
                    autoComplete="current-password"
                    {...register('password', {
                      required: 'Password is required',
                    })}
                  />
                </InputGroup>
                <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
              </Field.Root>

              <Button
                type="submit"
                colorPalette="brand"
                size="lg"
                width="full"
                loading={mutation.isLoading}
                mb={4}
              >
                Sign In
              </Button>

              <PasskeyLoginButton
                onSuccess={(data) => {
                  const tokenExpiresAt = Date.now() + (14 * 60 * 1000);
                  handleLoginSuccess({
                    _id: data._id,
                    username: data.username,
                    email: data.email,
                    isAdmin: data.isAdmin,
                    token: data.accessToken,
                    refreshToken: data.refreshToken,
                    tokenExpiresAt,
                    emailVerified: data.emailVerified ?? false,
                    twoFactorEnabled: data.twoFactorEnabled ?? false,
                    webauthnCredentialCount: data.webauthnCredentialCount ?? 0,
                  });
                }}
              />

              <Text textAlign="center" mt={4}>
                Don't have an account?{' '}
                <Link asChild color="brand.500">
                  <RouterLink to="/register">Register</RouterLink>
                </Link>
              </Text>
            </Box>
          </Box>
        </Flex>
      </Flex>
    </>
  );
};

export default Login;
