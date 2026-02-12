import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  Divider,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  InputGroup,
  InputRightElement,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { getUserProfile, updateUserProfile } from '../api';
import { useAuthStore } from '../stores/authStore';

interface ProfileFormData {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const Profile: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.800');

  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = React.useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data: profile, isLoading, error } = useQuery('userProfile', getUserProfile) || { data: null, isLoading: false, error: null };
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      username: profile?.username || user?.username || '',
      email: profile?.email || user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });
  
  React.useEffect(() => {
    if (profile) {
      reset({
        username: profile.username,
        email: profile.email,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    }
  }, [profile, reset]);
  
  const newPassword = watch('newPassword');
  
  const mutation = useMutation(
    (data: Partial<ProfileFormData>) => updateUserProfile({
      username: data.username,
      email: data.email,
      ...(data.newPassword ? { password: data.newPassword } : {}),
    }),
    {
      onSuccess: (userData) => {
        setUser({
          ...user!,
          username: userData.username,
          email: userData.email,
        });
        queryClient.invalidateQueries('userProfile');
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        reset({
          username: userData.username,
          email: userData.email,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update profile',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  const onSubmit = (data: ProfileFormData) => {
    // Only include fields that have changed
    const updateData: Partial<ProfileFormData> = {};
    
    if (data.username !== profile?.username) {
      updateData.username = data.username;
    }
    
    if (data.email !== profile?.email) {
      updateData.email = data.email;
    }
    
    if (data.newPassword) {
      updateData.newPassword = data.newPassword;
    }
    
    if (Object.keys(updateData).length > 0) {
      mutation.mutate(updateData);
    } else {
      toast({
        title: 'Information',
        description: 'No changes to save',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        Failed to load profile. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>Your Profile</Heading>
      
      <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={6} align="stretch">
            <FormControl isInvalid={!!errors.username}>
              <FormLabel>Username</FormLabel>
              <Input
                autoComplete="username"
                {...register('username', {
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters',
                  },
                })}
              />
              {errors.username && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.username.message}
                </Text>
              )}
            </FormControl>
            
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.email.message}
                </Text>
              )}
            </FormControl>
            
            <Divider />
            
            <Heading size="md">Change Password</Heading>
            
            <FormControl isInvalid={!!errors.newPassword}>
              <FormLabel>New Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('newPassword', {
                    minLength: {
                      value: 6,
                      message: 'New password must be at least 6 characters',
                    },
                  })}
                />
                <InputRightElement>
                  <Button
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon
                      as={showPassword ? FaEyeSlash : FaEye}
                      color="gray.500"
                    />
                  </Button>
                </InputRightElement>
              </InputGroup>
              {errors.newPassword && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.newPassword.message}
                </Text>
              )}
            </FormControl>
            
            <FormControl isInvalid={!!errors.confirmNewPassword}>
              <FormLabel>Confirm New Password</FormLabel>
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmNewPassword', {
                  validate: (value) =>
                    !newPassword || value === newPassword || 'Passwords do not match',
                })}
              />
              {errors.confirmNewPassword && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.confirmNewPassword.message}
                </Text>
              )}
            </FormControl>
            
            <HStack spacing={4} justify="flex-end">
              <Button
                variant="outline"
                colorScheme="red"
                onClick={onOpen}
              >
                Sign Out
              </Button>
              
              <Button
                type="submit"
                colorScheme="brand"
                isLoading={mutation.isLoading}
                isDisabled={!isDirty}
              >
                Save Changes
              </Button>
            </HStack>
          </VStack>
        </form>
      </Box>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sign Out</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to sign out?
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleLogout}>
              Sign Out
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Profile;
