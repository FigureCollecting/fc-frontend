import React from 'react';
import { useColorModeValue } from "../components/ui/color-mode";
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Box,
  Heading,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  Spinner,
  Center,
  Alert,
  useDisclosure,
  InputGroup,
  Icon,
  Badge,
  Separator,
  Field,
  Dialog,
  Portal,
} from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import { FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';
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
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = React.useState(false);
  const { open, onOpen, onClose } = useDisclosure();

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
        toaster.create({
          title: 'Success',
          description: 'Profile updated successfully',
          type: 'success',
          duration: 5000,
          closable: true,
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
        toaster.create({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update profile',
          type: 'error',
          duration: 5000,
          closable: true,
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
      toaster.create({
        title: 'Information',
        description: 'No changes to save',
        type: 'info',
        duration: 5000,
        closable: true,
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
        <Spinner size="xl" color="brand.500" borderWidth="4px" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert.Root status="error" borderRadius="md">
        <Alert.Indicator />Failed to load profile. Please try again.
              </Alert.Root>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>Your Profile</Heading>
      <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={6} align="stretch">
            <Field.Root invalid={!!errors.username}>
              <Field.Label>Username</Field.Label>
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
            </Field.Root>
            
            <Field.Root invalid={!!errors.email}>
              <Field.Label>Email Address</Field.Label>
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
            </Field.Root>
            
            <Separator />

            {/* Security Status */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <Heading size="md">Security</Heading>
                <Button asChild size="sm" variant="outline">
                  <RouterLink to="/security"><Icon as={FaShieldAlt} />Security Settings</RouterLink>
                </Button>
              </HStack>
              <HStack gap={4}>
                <HStack>
                  <Text fontSize="sm">Email:</Text>
                  <Badge colorPalette={profile?.emailVerified ? 'green' : 'yellow'}>
                    {profile?.emailVerified ? 'Verified' : 'Not Verified'}
                  </Badge>
                </HStack>
                <HStack>
                  <Text fontSize="sm">2FA:</Text>
                  <Badge colorPalette={profile?.twoFactorEnabled ? 'green' : 'gray'}>
                    {profile?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </HStack>
                {(profile?.webauthnCredentialCount ?? 0) > 0 && (
                  <HStack>
                    <Text fontSize="sm">Passkeys:</Text>
                    <Badge colorPalette="blue">{profile?.webauthnCredentialCount}</Badge>
                  </HStack>
                )}
              </HStack>
            </Box>

            <Separator />

            <Heading size="md">Change Password</Heading>
            
            <Field.Root invalid={!!errors.newPassword}>
              <Field.Label>New Password</Field.Label>
              <InputGroup
                endElement={
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
                }
              >
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
              </InputGroup>
              {errors.newPassword && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.newPassword.message}
                </Text>
              )}
            </Field.Root>
            
            <Field.Root invalid={!!errors.confirmNewPassword}>
              <Field.Label>Confirm New Password</Field.Label>
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
            </Field.Root>
            
            <HStack gap={4} justify="flex-end">
              <Button
                variant="outline"
                colorPalette="red"
                onClick={onOpen}
              >
                Sign Out
              </Button>
              
              <Button
                type="submit"
                colorPalette="brand"
                loading={mutation.isLoading}
                disabled={!isDirty}
              >
                Save Changes
              </Button>
            </HStack>
          </VStack>
        </form>
      </Box>
      {/* Logout Confirmation Modal */}
      <Dialog.Root open={open} onOpenChange={e => {
        if (!e.open) {
          onClose();
        }
      }}>
        <Portal>

          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>Sign Out</Dialog.Header>
              <Dialog.CloseTrigger />
              <Dialog.Body>
                Are you sure you want to sign out?
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  Cancel
                </Button>
                <Button colorPalette="red" onClick={handleLogout}>
                  Sign Out
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>

        </Portal>
      </Dialog.Root>
    </Box>
  );
};

export default Profile;
