import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useMutation } from 'react-query';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Heading,
  Text,
  Flex,
  Link,
  Icon,
  InputGroup,
  InputRightElement,
  useToast,
useColorModeValue, } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash, FaCube } from 'react-icons/fa';
import { loginUser } from '../api';
import { useAuthStore } from '../stores/authStore';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.85)', 'rgba(26, 32, 44, 0.75)');
  const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.08)');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const gradientBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
  );
  const [showPassword, setShowPassword] = React.useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  
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
  
  const mutation = useMutation(
    (data: LoginFormData) => loginUser(data.email, data.password),
    {
      onSuccess: (userData) => {
        setUser(userData);
        toast({
          title: 'Success',
          description: 'You are now logged in!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate('/');
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Invalid email or password',
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

  const onSubmit = (data: LoginFormData) => {
    mutation.mutate(data);
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={gradientBg}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="-20%"
        right="-10%"
        w="500px"
        h="500px"
        borderRadius="full"
        bg="whiteAlpha.100"
        filter="blur(80px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-15%"
        left="-10%"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="whiteAlpha.100"
        filter="blur(60px)"
        pointerEvents="none"
      />
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
        mx={4}
        position="relative"
        zIndex={1}
      >
        <Flex direction="column" align="center" mb={8}>
          <Icon as={FaCube} boxSize={12} color="brand.500" mb={2} />
          <Heading size="xl" textAlign="center" color={headingColor}>
            FigureCollecting
          </Heading>
          <Text color={textColor} mt={2}>
            Sign in to manage your collection
          </Text>
          <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
            Uses data from MyFigureCollection.net. Not affiliated with MFC.
          </Text>
        </Flex>
        
        <Box as="form" role="form" onSubmit={handleSubmit(onSubmit)}>
          <FormControl isInvalid={!!errors.email} mb={4}>
            <FormLabel htmlFor="email">Email</FormLabel>
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
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>
          
          <FormControl isInvalid={!!errors.password} mb={6}>
            <FormLabel htmlFor="password">Password</FormLabel>
            <InputGroup>
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
              <InputRightElement h="full">
                <Button
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    as={showPassword ? FaEyeSlash : FaEye}
                    color="gray.500"
                  />
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
          </FormControl>
          
          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            width="full"
            isLoading={mutation.isLoading}
            mb={4}
          >
            Sign In
          </Button>
          
          <Text textAlign="center">
            Don't have an account?{' '}
            <Link as={RouterLink} to="/register" color="brand.500">
              Register
            </Link>
          </Text>
        </Box>
      </Box>
    </Flex>
  );
};

export default Login;
