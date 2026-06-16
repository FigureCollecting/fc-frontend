import React, { useState, useCallback, useRef } from 'react';
import { useColorModeValue } from "../components/ui/color-mode";
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { Box, Heading, Button, Flex, Breadcrumb, Icon } from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import { FaArrowLeft } from 'react-icons/fa';
import { createFigure } from '../api';
import FigureForm from '../components/FigureForm';
import { FigureFormData } from '../types';
import { LuChevronRight } from 'react-icons/lu';

type SubmitAction = 'save' | 'saveAndAdd' | null;

const AddFigure: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentAction, setCurrentAction] = useState<SubmitAction>(null);
  // Use ref for synchronous access in callbacks (state updates are async)
  const currentActionRef = useRef<SubmitAction>(null);

  const mutation = useMutation(createFigure, {
    onSuccess: () => {
      // Invalidate all queries that might contain figure data
      queryClient.invalidateQueries('figures');
      queryClient.invalidateQueries('recentFigures');
      queryClient.invalidateQueries('dashboardStats');

      // Only navigate if NOT "Save & Add Another"
      // Use ref for synchronous value (state may not have updated yet)
      if (currentActionRef.current !== 'saveAndAdd') {
        toaster.create({
          title: 'Success',
          description: 'Figure added successfully',
          type: 'success',
          duration: 5000,
          closable: true,
        });
        navigate('/figures');
      } else {
        // For "Save & Add Another", show a different toast
        toaster.create({
          title: 'Figure added!',
          description: 'Form cleared for next entry.',
          type: 'success',
          duration: 2000,
          closable: true,
        });
        // Form will be reset by FigureForm's useEffect when it detects loading finished
      }
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add figure',
        type: 'error',
        duration: 5000,
        closable: true,
      });
      // Reset action on error so user can try again
      setCurrentAction(null);
    },
  });

  const handleSubmit = (data: FigureFormData, addAnother?: boolean) => {
    const action: SubmitAction = addAnother ? 'saveAndAdd' : 'save';
    // Set ref immediately (synchronous) for use in callbacks
    currentActionRef.current = action;
    // Set state for UI updates (async)
    setCurrentAction(action);
    mutation.mutate(data);
  };

  const handleResetComplete = useCallback(() => {
    // Reset action after form has been reset
    currentActionRef.current = null;
    setCurrentAction(null);
  }, []);

  return (
    <Box>
      <Breadcrumb.Root mb={5}>
        <Breadcrumb.List gap="8px">
          <Breadcrumb.Item>
            <Breadcrumb.Link asChild><RouterLink to="/">Dashboard</RouterLink></Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator>{<Icon color="gray.500" asChild><LuChevronRight /></Icon>}</Breadcrumb.Separator><Breadcrumb.Item>
            <Breadcrumb.Link asChild><RouterLink to="/figures">Figures</RouterLink></Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator>{<Icon color="gray.500" asChild><LuChevronRight /></Icon>}</Breadcrumb.Separator><Breadcrumb.Item>
            <Breadcrumb.Link>Add New Figure</Breadcrumb.Link>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Add New Figure</Heading>
        <Button variant="outline" asChild><RouterLink to="/figures"><FaArrowLeft />Back to Figures
                              </RouterLink></Button>
      </Flex>
      <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
        <FigureForm
          onSubmit={handleSubmit}
          isLoading={mutation.isLoading}
          loadingAction={currentAction}
          onResetComplete={handleResetComplete}
        />
      </Box>
    </Box>
  );
};

export default AddFigure;
