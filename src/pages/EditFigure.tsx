import React from 'react';
import { useColorModeValue } from "../components/ui/color-mode";
import { useParams, useNavigate, Link as RouterLink } from 'react-router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Box,
  Heading,
  Button,
  Flex,
  Breadcrumb,
  Spinner,
  Center,
  Alert,
  Icon,
} from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import { FaArrowLeft } from 'react-icons/fa';
import { getFigureById, updateFigure } from '../api';
import FigureForm from '../components/FigureForm';
import { FigureFormData } from '../types';
import { LuChevronRight } from 'react-icons/lu';

const EditFigure: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: figure, isLoading, error } = useQuery(
    ['figure', id],
    () => getFigureById(id!),
    {
      enabled: !!id,
      onError: (err: any) => {
        toaster.create({
          title: 'Error',
          description: err.response?.data?.message || 'Failed to load figure details',
          type: 'error',
          duration: 5000,
          closable: true,
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
        
        toaster.create({
          title: 'Success',
          description: 'Figure updated successfully',
          type: 'success',
          duration: 5000,
          closable: true,
        });
        navigate(`/figures/${id}`);
      },
      onError: (error: any) => {
        toaster.create({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update figure',
          type: 'error',
          duration: 5000,
          closable: true,
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
