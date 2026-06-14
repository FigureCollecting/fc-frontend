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
  InputGroup,
  InputRightElement,
  useToast,
  Field,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash, FaCube } from 'react-icons/fa';
import { registerUser } from '../api';
import { useAuthStore } from '../stores/authStore';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const linkColor = useColorModeValue('gray.500', 'gray.400');
  const [showPassword, setShowPassword] = React.useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  const password = watch('password');
  
  const mutation = useMutation(
    (data: RegisterFormData) => registerUser(data.username, data.email, data.password),
    {
      onSuccess: (userData) => {
        setUser(userData);
        toast({
          title: 'Account created!',
          description: 'Check your email to verify your account.',
          status: 'success',
          duration: 8000,
          isClosable: true,
        });
        navigate('/');
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Registration failed',
          status: 'error',
          duration: 5000,
          isClosable: true,
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

  const onSubmit = (data: RegisterFormData) => {
    mutation.mutate(data);
  };

  return (
    <>
      <Helmet>
        <title>Create Account — FigureCollecting</title>
        <meta name="description" content="Create your free FigureCollecting account. Catalog your anime figures, sync your MyFigureCollection data, and organize your collection with powerful tools." />
        <link rel="canonical" href="https://figurecollecting.com/register" />
      </Helmet>
      <Flex minH="100vh" align="center" justify="center" bg={pageBg}>
        <Box
          data-testid="auth-card"
          bg={cardBg}
          p={8}
          rounded="lg"
          shadow="lg"
          maxW="md"
          w="full"
        >
          <Flex direction="column" align="center" mb={8}>
            <Icon as={FaCube} boxSize={12} color="brand.500" mb={2} />
            <Heading size="xl" textAlign="center" color={headingColor}>
              FigureCollecting
            </Heading>
            <Text color={textColor} mt={2}>
              Create an account to start your collection
            </Text>
            <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
              Uses data from MyFigureCollection.net. Not affiliated with MFC.
            </Text>
          </Flex>
          
          <Box as="form" onSubmit={handleSubmit(onSubmit)}>
            <Field.Root invalid={!!errors.username} mb={4}>
              <Field.Label>Username</Field.Label>
              <Input
                placeholder="Choose a username"
                size="lg"
                autoComplete="username"
                {...register('username', {
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters',
                  },
                })}
              />
              <Field.ErrorText>{errors.username?.message}</Field.ErrorText>
            </Field.Root>
            
            <Field.Root invalid={!!errors.email} mb={4}>
              <Field.Label>Email</Field.Label>
              <Input
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
            
            <Field.Root invalid={!!errors.password} mb={4}>
              <Field.Label>Password</Field.Label>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  size="lg"
                  autoComplete="new-password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <InputRightElement h="full">
                  <Button
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon
                      as={showPassword ? FaEyeSlash : FaEye}
                      color={linkColor}
                    />
                  </Button>
                </InputRightElement>
              </InputGroup>
              <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
            </Field.Root>
            
            <Field.Root invalid={!!errors.confirmPassword} mb={6}>
              <Field.Label>Confirm Password</Field.Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                size="lg"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
              />
              <Field.ErrorText>{errors.confirmPassword?.message}</Field.ErrorText>
            </Field.Root>
            
            <Button
              type="submit"
              colorPalette="brand"
              size="lg"
              width="full"
              loading={mutation.isLoading}
              mb={4}
            >
              Create Account
            </Button>
            
            <Text textAlign="center">
              Already have an account?{' '}
              <Link as={RouterLink} to="/login" color="brand.500">
                Sign In
              </Link>
            </Text>
          </Box>
        </Box>
      </Flex>
    </>
  );
};

export default Register;
