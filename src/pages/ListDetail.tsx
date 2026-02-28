import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Center,
  Badge,
  Flex,
  IconButton,
  Divider,
  Wrap,
  WrapItem,
  Tag,
  Tooltip,
  Image,
  SimpleGrid,
  LinkBox,
  LinkOverlay,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FaArrowLeft, FaComments, FaBell, FaSearch, FaEdit } from 'react-icons/fa';
import { getListById, updateList } from '../api';
import { MfcListFormData } from '../types';
import ListFormModal from '../components/ListFormModal';
import { handleMfcImageError } from '../utils/imageUtils';

const PRIVACY_COLORS: Record<string, string> = {
  public: 'green',
  friends: 'blue',
  private: 'red',
};

const ListDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  const { data: list, isLoading, isError } = useQuery(
    ['list', id],
    () => getListById(id!),
    { enabled: !!id }
  );

  const updateMutation = useMutation(
    (formData: MfcListFormData) => updateList(id!, formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['list', id]);
        queryClient.invalidateQueries('lists');
        toast({ title: 'List updated', status: 'success', duration: 3000 });
        onEditClose();
      },
      onError: () => {
        toast({ title: 'Failed to update list', status: 'error', duration: 3000 });
      },
    }
  );

  if (isLoading) {
    return (
      <Center py={12}>
        <Spinner size="xl" data-testid="list-detail-spinner" />
      </Center>
    );
  }

  if (isError || !list) {
    return (
      <Center py={12}>
        <Text color="red.500">Error loading list details.</Text>
      </Center>
    );
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box p={4}>
      {/* Header */}
      <Flex align="center" mb={4} gap={3}>
        <Tooltip label="Back to lists">
          <IconButton
            aria-label="Back to lists"
            icon={<FaArrowLeft />}
            variant="ghost"
            size="sm"
            onClick={() => navigate('/lists')}
          />
        </Tooltip>
        <Heading size="lg">{list.name}</Heading>
        <Badge colorScheme={PRIVACY_COLORS[list.privacy] || 'gray'} fontSize="sm">
          {list.privacy}
        </Badge>
        <Tooltip label="Edit list">
          <IconButton
            aria-label="Edit list"
            icon={<FaEdit />}
            variant="ghost"
            size="sm"
            colorScheme="brand"
            onClick={onEditOpen}
            data-testid="edit-list-btn"
          />
        </Tooltip>
      </Flex>

      {/* Teaser */}
      {list.teaser && (
        <Text color="gray.600" mb={3} fontSize="md">
          {list.teaser}
        </Text>
      )}

      {/* Item count + dates */}
      <Flex gap={4} mb={4} flexWrap="wrap" fontSize="sm" color="gray.500">
        <Text>{list.itemCount} items</Text>
        {list.mfcCreatedAt && (
          <Text>Created on MFC: {formatDate(list.mfcCreatedAt)}</Text>
        )}
        {list.lastSyncedAt && (
          <Text>Last synced: {formatDate(list.lastSyncedAt)}</Text>
        )}
      </Flex>

      {/* Settings flags */}
      <Wrap spacing={2} mb={4}>
        {list.allowComments && (
          <WrapItem>
            <Tag size="sm" colorScheme="teal" variant="subtle">
              <FaComments style={{ marginRight: 4 }} /> Comments enabled
            </Tag>
          </WrapItem>
        )}
        {list.mailOnSales && (
          <WrapItem>
            <Tag size="sm" colorScheme="orange" variant="subtle">
              <FaBell style={{ marginRight: 4 }} /> Sale notifications
            </Tag>
          </WrapItem>
        )}
        {list.mailOnHunts && (
          <WrapItem>
            <Tag size="sm" colorScheme="purple" variant="subtle">
              <FaSearch style={{ marginRight: 4 }} /> Hunt notifications
            </Tag>
          </WrapItem>
        )}
      </Wrap>

      <Divider mb={4} />

      {/* Description (HTML, sanitized for XSS defense-in-depth) */}
      {list.description && (
        <Box mb={4}>
          <Heading size="sm" mb={2}>Description</Heading>
          <Box
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(list.description) }}
            sx={{
              'p': { mb: 2 },
              'b, strong': { fontWeight: 'bold' },
              'i, em': { fontStyle: 'italic' },
              'a': { color: 'brand.500', textDecoration: 'underline' },
            }}
          />
        </Box>
      )}

      {/* Items */}
      <Box>
        <Heading size="sm" mb={3}>Items ({list.items?.length ?? list.itemMfcIds.length})</Heading>
        {(list.items?.length ?? list.itemMfcIds.length) === 0 ? (
          <Text color="gray.500" fontSize="sm">No items in this list.</Text>
        ) : list.items && list.items.length > 0 ? (
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing={3}>
            {list.items.map((item) => (
              <LinkBox
                key={item.mfcId}
                borderWidth="1px"
                borderRadius="md"
                overflow="hidden"
                _hover={{ shadow: 'md', borderColor: 'brand.300' }}
                transition="all 0.2s"
              >
                <Box bg="gray.50" _dark={{ bg: 'gray.700' }}>
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name || `MFC #${item.mfcId}`}
                      w="100%"
                      h="140px"
                      objectFit="contain"
                      loading="lazy"
                      onError={handleMfcImageError}
                    />
                  ) : (
                    <Center h="140px" color="gray.400" fontSize="sm">
                      No image
                    </Center>
                  )}
                </Box>
                <Box p={2}>
                  <LinkOverlay
                    href={`https://myfigurecollection.net/item/${item.mfcId}`}
                    isExternal
                  >
                    <Text fontSize="xs" noOfLines={2} fontWeight="medium">
                      {item.name || `#${item.mfcId}`}
                    </Text>
                  </LinkOverlay>
                  {item.scale && (
                    <Text fontSize="xs" color="gray.500">{item.scale}</Text>
                  )}
                </Box>
              </LinkBox>
            ))}
          </SimpleGrid>
        ) : (
          <Wrap spacing={2}>
            {list.itemMfcIds.map((mfcId) => (
              <WrapItem key={mfcId}>
                <Tag size="sm" variant="outline">
                  #{mfcId}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        )}
      </Box>

      <ListFormModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        onSubmit={(data) => updateMutation.mutate(data)}
        isLoading={updateMutation.isLoading}
        list={list}
      />
    </Box>
  );
};

export default ListDetail;
