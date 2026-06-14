import React from 'react';
import { useColorModeValue } from "../components/ui/color-mode";
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Steps,
  Box,
  Heading,
  Button,
  Flex,
  useToast,
  Breadcrumb,
  Spinner,
  Center,
  Alert,
  Icon,
} from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa';
import { getFigureById, updateFigure } from '../api';
import FigureForm from '../components/FigureForm';
import { FigureFormData } from '../types';
import { LuChevronRight } from 'react-icons/lu';

const EditFigure: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  const { data: figure, isLoading, error } = useQuery(
    ['figure', id],
    () => getFigureById(id!),
    {
      enabled: !!id,
      onError: (err: any) => {
        toast({
          title: 'Error',
          description: err.response?.data?.message || 'Failed to load figure details',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  ) || { data: null, isLoading: false, error: null };
  
  const mutation = useMutation(
    (data: FigureFormData) => updateFigure(id!, data),
    {
      onSuccess: () => {
        // Invalidate all queries that might contain figure data
        queryClient.invalidateQueries(['figure', id]);
        queryClient.invalidateQueries('figures');
        queryClient.invalidateQueries('recentFigures');
        queryClient.invalidateQueries('dashboardStats');
        
        toast({
          title: 'Success',
          description: 'Figure updated successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate(`/figures/${id}`);
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update figure',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  // Note: addAnother is ignored for EditFigure (only applicable in AddFigure)
  const handleSubmit = (data: FigureFormData, _addAnother?: boolean) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="brand.500" borderWidth="4px" />
      </Center>
    );
  }

  if (error || !figure) {
    return (
      <Box>
        <Alert.Root status="error" borderRadius="md" mb={4}>
          <Alert.Indicator />
          Failed to load figure details. Please try again.
        </Alert.Root>
        <Button asChild><RouterLink to="/figures">Back to Figures
                  </RouterLink></Button>
      </Box>
    );
  }

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
            <Breadcrumb.Link asChild><RouterLink to={`/figures/${id}`}>{figure.name}</RouterLink></Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator>{<Icon color="gray.500" asChild><LuChevronRight /></Icon>}</Breadcrumb.Separator><Breadcrumb.Item>
            <Breadcrumb.Link>Edit</Breadcrumb.Link>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Edit Figure</Heading>
        <Button variant="outline" asChild><RouterLink to={`/figures/${id}`}><FaArrowLeft />Cancel
                              </RouterLink></Button>
      </Flex>
      <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
        <FigureForm
          initialData={figure}
          onSubmit={handleSubmit}
          isLoading={mutation.isLoading}
          loadingAction={mutation.isLoading ? 'save' : null}
        />
      </Box>
    </Box>
  );
};

export default EditFigure;
