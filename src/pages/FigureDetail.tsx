import React from 'react';
import { useColorModeValue } from "../components/ui/color-mode";
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Steps,
  Box,
  Heading,
  Text,
  Image,
  Button,
  Grid,
  GridItem,
  Badge,
  Flex,
  IconButton,
  useToast,
  Spinner,
  Center,
  Link,
  Breadcrumb,
  HStack,
  VStack,
  Wrap,
  WrapItem,
  Tag,
  SimpleGrid,
  Stat,
  useDisclosure,
  Separator,
} from '@chakra-ui/react';
import { FaEdit, FaTrash, FaArrowLeft, FaExternalLinkAlt, FaListUl, FaStar, FaUsers } from 'react-icons/fa';
import { getFigureById, deleteFigure, getListsByItem } from '../api';
import { getDisplayCompanies, getDisplayArtists } from '../utils/statsUtils';
import ListMembershipModal from '../components/ListMembershipModal';
import { handleMfcImageError } from '../utils/imageUtils';

const FigureDetail: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  const { open: isListsOpen, onOpen: onListsOpen, onClose: onListsClose } = useDisclosure();

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
  
  // Fetch lists this figure belongs to (only if figure has mfcId)
  const { data: memberLists } = useQuery(
    ['listsByItem', figure?.mfcId],
    () => getListsByItem(figure!.mfcId!),
    { enabled: !!figure?.mfcId }
  );

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
        <Spinner size="xl" color="brand.500" borderWidth="4px" />
      </Center>
    );
  }

  if (error || !figure) {
    return (
      <Box textAlign="center" py={10}>
        <Heading size="md" color="red.500" mb={4}>
          Error loading figure details
        </Heading>
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
          <Breadcrumb.Separator>{'>'}</Breadcrumb.Separator><Breadcrumb.Item>
            <Breadcrumb.Link asChild><RouterLink to="/figures">Figures</RouterLink></Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator>{'>'}</Breadcrumb.Separator><Breadcrumb.Item>
            <Breadcrumb.Link>{figure.name}</Breadcrumb.Link>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
      <Box bg={cardBg} borderRadius="lg" overflow="hidden" shadow="md">
        <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }}>
          <GridItem>
            <Image
              src={figure.imageUrl || '/placeholder-figure.svg'}
              alt={figure.name}
              w="100%"
              h="100%"
              objectFit="cover"
              onError={handleMfcImageError}
            />
          </GridItem>
          
          <GridItem p={6}>
            <Flex justify="space-between" align="flex-start">
              <Heading size="lg" mb={2}>{figure.name}</Heading>
              <Flex>
                <IconButton
                  aria-label="Edit figure"
                  variant="ghost"
                  colorPalette="brand"
                  mr={2}
                  asChild><RouterLink to={`/figures/edit/${figure._id}`}><FaEdit /></RouterLink></IconButton>
                <IconButton
                  aria-label="Delete figure"
                  variant="ghost"
                  colorPalette="red"
                  onClick={handleDelete}
                  loading={deleteMutation.isLoading}><FaTrash /></IconButton>
              </Flex>
            </Flex>
            
            {/* Companies with role badges */}
            <VStack align="flex-start" gap={1} mb={4}>
              {getDisplayCompanies(figure.companyRoles, figure.manufacturer).map((company, idx) => (
                <HStack key={idx} gap={2}>
                  <Text fontSize="xl" color="gray.600">
                    {company.name}
                  </Text>
                  {company.role && (
                    <Badge colorPalette="purple" fontSize="sm">
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
              <VStack align="flex-start" gap={1} mb={4}>
                {getDisplayArtists(figure.artistRoles).map((artist, idx) => (
                  <HStack key={idx} gap={2}>
                    <Text fontSize="md" color="gray.500">
                      {artist.name}
                    </Text>
                    {artist.role && (
                      <Badge colorPalette="teal" fontSize="xs">
                        {artist.role}
                      </Badge>
                    )}
                  </HStack>
                ))}
              </VStack>
            )}

            <Flex gap={2} mb={4} flexWrap="wrap">
              <Badge colorPalette="brand" fontSize="md" px={2} py={1}>
                {figure.scale}
              </Badge>
            </Flex>
            
            <Separator my={4} />
            
            <Grid templateColumns="auto 1fr" columnGap={4} rowGap={3}>
              <Text fontWeight="bold">Added:</Text>
              <Text>{new Date(figure.createdAt).toLocaleDateString()}</Text>
              
              {figure.origin && (
                <>
                  <Text fontWeight="bold">Origin:</Text>
                  <Text>{figure.origin}</Text>
                </>
              )}

              {figure.category && (
                <>
                  <Text fontWeight="bold">Category:</Text>
                  <Text>{figure.category}</Text>
                </>
              )}

              {figure.rating && (
                <>
                  <Text fontWeight="bold">My Rating:</Text>
                  <Text>{figure.rating}/10</Text>
                </>
              )}

              {figure.wishRating && (
                <>
                  <Text fontWeight="bold">Wish Priority:</Text>
                  <HStack gap={0}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        color={star <= figure.wishRating! ? '#ECC94B' : '#E2E8F0'}
                        size="14px"
                      />
                    ))}
                  </HStack>
                </>
              )}

              <Text fontWeight="bold">MFC Link:</Text>
              <Link
                href={figure.mfcLink}
                color="brand.500"
                target='_blank'
                rel='noopener noreferrer'>
                <Flex align="center">
                  View on MyFigureCollection <FaExternalLinkAlt size="0.8em" style={{ marginLeft: '0.5em' }} />
                </Flex>
              </Link>
            </Grid>

            {/* Community Stats */}
            {figure.communityStats && (
              Object.values(figure.communityStats).some(v => v !== undefined && v !== null)
            ) && (
              <>
                <Separator my={4} />
                <Box>
                  <HStack gap={2} mb={3}>
                    <FaUsers />
                    <Heading size="sm">Community</Heading>
                  </HStack>
                  <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
                    {figure.communityStats.ownedCount !== undefined && (
                      <Stat.Root size="sm">
                        <Stat.Label>Owned</Stat.Label>
                        <Stat.ValueText fontSize="lg">
                          {figure.communityStats.ownedCount.toLocaleString()}
                        </Stat.ValueText>
                      </Stat.Root>
                    )}
                    {figure.communityStats.wishedCount !== undefined && (
                      <Stat.Root size="sm">
                        <Stat.Label>Wished</Stat.Label>
                        <Stat.ValueText fontSize="lg">
                          {figure.communityStats.wishedCount.toLocaleString()}
                        </Stat.ValueText>
                      </Stat.Root>
                    )}
                    {figure.communityStats.orderedCount !== undefined && (
                      <Stat.Root size="sm">
                        <Stat.Label>Ordered</Stat.Label>
                        <Stat.ValueText fontSize="lg">
                          {figure.communityStats.orderedCount.toLocaleString()}
                        </Stat.ValueText>
                      </Stat.Root>
                    )}
                    {figure.communityStats.listedInCount !== undefined && (
                      <Stat.Root size="sm">
                        <Stat.Label>Listed In</Stat.Label>
                        <Stat.ValueText fontSize="lg">
                          {figure.communityStats.listedInCount.toLocaleString()}
                        </Stat.ValueText>
                      </Stat.Root>
                    )}
                    {figure.communityStats.averageScore !== undefined && (
                      <Stat.Root size="sm">
                        <Stat.Label>MFC Score</Stat.Label>
                        <Stat.ValueText fontSize="lg">
                          {figure.communityStats.averageScore.toFixed(1)}/10
                        </Stat.ValueText>
                      </Stat.Root>
                    )}
                  </SimpleGrid>
                </Box>
              </>
            )}

            {/* Related Items */}
            {figure.relatedItems && figure.relatedItems.length > 0 && (
              <>
                <Separator my={4} />
                <Box>
                  <HStack gap={2} mb={3}>
                    <FaExternalLinkAlt size="14px" />
                    <Heading size="sm">Related Items</Heading>
                  </HStack>
                  <Flex gap={3} overflowX="auto" pb={2}>
                    {figure.relatedItems.slice(0, 6).map((item) => (
                      <Link
                        key={item.mfcId}
                        href={`https://myfigurecollection.net/item/${item.mfcId}`}
                        _hover={{ textDecoration: 'none' }}
                        flexShrink={0}
                        target='_blank'
                        rel='noopener noreferrer'>
                        <Box
                          w="120px"
                          borderWidth="1px"
                          borderRadius="md"
                          overflow="hidden"
                          _hover={{ shadow: 'md', borderColor: 'brand.300' }}
                          transition="all 0.2s"
                        >
                          {item.imageUrl && (
                            <Image
                              src={item.imageUrl}
                              alt={item.name || `Item ${item.mfcId}`}
                              w="100%"
                              h="120px"
                              objectFit="cover"
                              onError={handleMfcImageError}
                            />
                          )}
                          <Box p={2}>
                            <Text fontSize="xs" lineClamp={2}>
                              {item.name || `MFC #${item.mfcId}`}
                            </Text>
                            {item.relationType && (
                              <Badge fontSize="2xs" colorPalette="gray" mt={1}>
                                {item.relationType}
                              </Badge>
                            )}
                          </Box>
                        </Box>
                      </Link>
                    ))}
                    {figure.relatedItems.length > 6 && (
                      <Flex
                        w="120px"
                        h="100%"
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        <Text fontSize="sm" color="gray.500">
                          +{figure.relatedItems.length - 6} more
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                </Box>
              </>
            )}

            {/* Lists section */}
            {figure.mfcId && (
              <>
                <Separator my={4} />
                <Box>
                  <Flex align="center" justify="space-between" mb={2}>
                    <HStack gap={2}>
                      <FaListUl />
                      <Heading size="sm">Lists</Heading>
                    </HStack>
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="brand"
                      onClick={onListsOpen}
                      data-testid="manage-lists-btn"
                    >
                      Manage Lists
                    </Button>
                  </Flex>
                  {memberLists && memberLists.length > 0 ? (
                    <Wrap gap={2}>
                      {memberLists.map((list) => (
                        <WrapItem key={list._id}>
                          <Tag.Root
                            size="sm"
                            colorPalette="brand"
                            cursor="pointer"
                            onClick={() => navigate(`/lists/${list._id}`)}
                          >
                            {list.name}
                          </Tag.Root>
                        </WrapItem>
                      ))}
                    </Wrap>
                  ) : (
                    <Text fontSize="sm" color="gray.500">
                      Not in any lists yet.
                    </Text>
                  )}
                </Box>
              </>
            )}

            <Separator my={4} />

            <Flex justifyContent="space-between" mt={6}>
              <Button variant="outline" asChild><RouterLink to="/figures"><FaArrowLeft />Back to Figures
                                                </RouterLink></Button>

              <Button colorPalette="brand" asChild><RouterLink to={`/figures/edit/${figure._id}`}><FaEdit />Edit Figure
                                                </RouterLink></Button>
            </Flex>
          </GridItem>
        </Grid>
      </Box>
      {/* List membership modal */}
      {figure.mfcId && (
        <ListMembershipModal
          isOpen={isListsOpen}
          onClose={onListsClose}
          figureMfcId={figure.mfcId}
          figureName={figure.name}
        />
      )}
    </Box>
  );
};

export default FigureDetail;
