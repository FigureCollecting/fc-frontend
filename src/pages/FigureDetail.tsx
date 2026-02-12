import React from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Heading,
  Text,
  Image,
  Button,
  Grid,
  GridItem,
  Badge,
  Flex,
  Divider,
  IconButton,
  useToast,
  Spinner,
  Center,
  Link,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  HStack,
  VStack,
useColorModeValue, } from '@chakra-ui/react';
import { FaEdit, FaTrash, FaArrowLeft, FaExternalLinkAlt } from 'react-icons/fa';
// import { ChevronRightIcon } from '@chakra-ui/icons'; // Temporarily disabled
import { getFigureById, deleteFigure } from '../api';
import { getDisplayCompanies, getDisplayArtists } from '../utils/statsUtils';

const FigureDetail: React.FC = () => {
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
  
  const deleteMutation = useMutation(() => deleteFigure(id!), {
    onSuccess: () => {
      // Invalidate all queries that might contain figure data
      queryClient.invalidateQueries('figures');
      queryClient.invalidateQueries('recentFigures');
      queryClient.invalidateQueries('dashboardStats');
      
      toast({
        title: 'Success',
        description: 'Figure deleted successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/figures');
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete figure',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this figure?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Center>
    );
  }

  if (error || !figure) {
    return (
      <Box textAlign="center" py={10}>
        <Heading size="md" color="red.500" mb={4}>
          Error loading figure details
        </Heading>
        <Button as={RouterLink} to="/figures">
          Back to Figures
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumb spacing="8px" separator=">" mb={5}>
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/figures">Figures</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>{figure.name}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Box bg={cardBg} borderRadius="lg" overflow="hidden" shadow="md">
        <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }}>
          <GridItem>
            <Image
              src={figure.imageUrl || '/placeholder-figure.png'}
              alt={figure.name}
              w="100%"
              h="100%"
              objectFit="cover"
              fallbackSrc="https://via.placeholder.com/500x600?text=No+Image"
            />
          </GridItem>
          
          <GridItem p={6}>
            <Flex justify="space-between" align="flex-start">
              <Heading size="lg" mb={2}>{figure.name}</Heading>
              <Flex>
                <IconButton
                  as={RouterLink}
                  to={`/figures/edit/${figure._id}`}
                  aria-label="Edit figure"
                  icon={<FaEdit />}
                  variant="ghost"
                  colorScheme="brand"
                  mr={2}
                />
                <IconButton
                  aria-label="Delete figure"
                  icon={<FaTrash />}
                  variant="ghost"
                  colorScheme="red"
                  onClick={handleDelete}
                  isLoading={deleteMutation.isLoading}
                />
              </Flex>
            </Flex>
            
            {/* Companies with role badges */}
            <VStack align="flex-start" spacing={1} mb={4}>
              {getDisplayCompanies(figure.companyRoles, figure.manufacturer).map((company, idx) => (
                <HStack key={idx} spacing={2}>
                  <Text fontSize="xl" color="gray.600">
                    {company.name}
                  </Text>
                  {company.role && (
                    <Badge colorScheme="purple" fontSize="sm">
                      {company.role}
                    </Badge>
                  )}
                </HStack>
              ))}
              {getDisplayCompanies(figure.companyRoles, figure.manufacturer).length === 0 && (
                <Text fontSize="xl" color="gray.600">Unknown Manufacturer</Text>
              )}
            </VStack>

            {/* Artists with role badges */}
            {getDisplayArtists(figure.artistRoles).length > 0 && (
              <VStack align="flex-start" spacing={1} mb={4}>
                {getDisplayArtists(figure.artistRoles).map((artist, idx) => (
                  <HStack key={idx} spacing={2}>
                    <Text fontSize="md" color="gray.500">
                      {artist.name}
                    </Text>
                    {artist.role && (
                      <Badge colorScheme="teal" fontSize="xs">
                        {artist.role}
                      </Badge>
                    )}
                  </HStack>
                ))}
              </VStack>
            )}

            <Flex gap={2} mb={4} flexWrap="wrap">
              <Badge colorScheme="brand" fontSize="md" px={2} py={1}>
                {figure.scale}
              </Badge>
            </Flex>
            
            <Divider my={4} />
            
            <Grid templateColumns="auto 1fr" columnGap={4} rowGap={3}>
              <Text fontWeight="bold">Added:</Text>
              <Text>{new Date(figure.createdAt).toLocaleDateString()}</Text>
              
              <Text fontWeight="bold">Storage Location:</Text>
              <Text>{figure.location}</Text>
              
              <Text fontWeight="bold">Box Number:</Text>
              <Text>{figure.boxNumber}</Text>
              
              <Text fontWeight="bold">MFC Link:</Text>
              <Link href={figure.mfcLink} isExternal color="brand.500">
                <Flex align="center">
                  View on MyFigureCollection <FaExternalLinkAlt size="0.8em" style={{ marginLeft: '0.5em' }} />
                </Flex>
              </Link>
            </Grid>
            
            <Divider my={4} />
            
            <Flex justifyContent="space-between" mt={6}>
              <Button
                leftIcon={<FaArrowLeft />}
                as={RouterLink}
                to="/figures"
                variant="outline"
              >
                Back to Figures
              </Button>
              
              <Button
                as={RouterLink}
                to={`/figures/edit/${figure._id}`}
                colorScheme="brand"
                leftIcon={<FaEdit />}
              >
                Edit Figure
              </Button>
            </Flex>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
};

export default FigureDetail;
