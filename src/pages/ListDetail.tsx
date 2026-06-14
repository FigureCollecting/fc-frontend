import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Box,
  Heading,
  Text,
  Spinner,
  Center,
  Badge,
  Flex,
  IconButton,
  Wrap,
  WrapItem,
  Tag,
  Image,
  SimpleGrid,
  LinkBox,
  LinkOverlay,
  useDisclosure,
  Separator,
} from '@chakra-ui/react';
import { Tooltip } from '../components/ui/tooltip';
import { toaster } from '../components/ui/toaster';
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
  const queryClient = useQueryClient();
  const { open: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

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
        toaster.create({ title: 'List updated', type: 'success', duration: 3000 });
        onEditClose();
      },
      onError: () => {
        toaster.create({ title: 'Failed to update list', type: 'error', duration: 3000 });
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
        <Tooltip content="Back to lists">
          <IconButton
            aria-label="Back to lists"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/lists')}><FaArrowLeft /></IconButton>
        </Tooltip>
        <Heading size="lg">{list.name}</Heading>
        <Badge colorPalette={PRIVACY_COLORS[list.privacy] || 'gray'} fontSize="sm">
          {list.privacy}
        </Badge>
        <Tooltip content="Edit list">
          <IconButton
            aria-label="Edit list"
            variant="ghost"
            size="sm"
            colorPalette="brand"
            onClick={onEditOpen}
            data-testid="edit-list-btn"><FaEdit /></IconButton>
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
      <Wrap gap={2} mb={4}>
        {list.allowComments && (
          <WrapItem>
            <Tag.Root size="sm" colorPalette="teal" variant="subtle">
              <FaComments style={{ marginRight: 4 }} /> Comments enabled
            </Tag.Root>
          </WrapItem>
        )}
        {list.mailOnSales && (
          <WrapItem>
            <Tag.Root size="sm" colorPalette="orange" variant="subtle">
              <FaBell style={{ marginRight: 4 }} /> Sale notifications
            </Tag.Root>
          </WrapItem>
        )}
        {list.mailOnHunts && (
          <WrapItem>
            <Tag.Root size="sm" colorPalette="purple" variant="subtle">
              <FaSearch style={{ marginRight: 4 }} /> Hunt notifications
            </Tag.Root>
          </WrapItem>
        )}
      </Wrap>
      <Separator mb={4} />
      {/* Description (HTML, sanitized for XSS defense-in-depth) */}
      {list.description && (
        <Box mb={4}>
          <Heading size="sm" mb={2}>Description</Heading>
          <Box
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(list.description) }}
            css={{
              '& p': { mb: 2 },
              '& b, strong': { fontWeight: 'bold' },
              '& i, em': { fontStyle: 'italic' },
              '& a': { color: 'brand.500', textDecoration: 'underline' }
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
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} gap={3}>
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
                    target='_blank'
                    rel='noopener noreferrer'>
                    <Text fontSize="xs" lineClamp={2} fontWeight="medium">
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
          <Wrap gap={2}>
            {list.itemMfcIds.map((mfcId) => (
              <WrapItem key={mfcId}>
                <Tag.Root size="sm" variant="outline">
                  #{mfcId}
                </Tag.Root>
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
