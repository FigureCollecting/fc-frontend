import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Image, Text, Badge, Link, Flex, IconButton, useToast, useColorModeValue, HStack } from '@chakra-ui/react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { Figure } from '../types';
import { deleteFigure } from '../api';
import { useMutation, useQueryClient } from 'react-query';
import { getDisplayCompanyName } from '../utils/statsUtils';
import { CardLayout } from './Pagination';

/**
 * Extract MFC item ID from either a full URL or just an ID string.
 * Examples:
 *   "https://myfigurecollection.net/item/2111017" -> "2111017"
 *   "2724644" -> "2724644"
 */
const extractMfcId = (mfcLink: string): string | null => {
  if (!mfcLink) return null;

  // If it's a URL, extract the ID from the path
  const urlMatch = mfcLink.match(/myfigurecollection\.net\/item\/(\d+)/);
  if (urlMatch) return urlMatch[1];

  // If it's just digits, return as-is
  if (/^\d+$/.test(mfcLink.trim())) return mfcLink.trim();

  return null;
};

/**
 * Build the full MFC URL from an ID.
 */
const buildMfcUrl = (mfcId: string): string => {
  return `https://myfigurecollection.net/item/${mfcId}`;
};

interface FigureCardProps {
  figure: Figure;
  searchQuery?: string;
  /** Card layout style */
  layout?: CardLayout;
  /** Maximum height for the image section (viewport constraint) */
  maxImageHeight?: number;
}

// Helper component to highlight matching text
const HighlightedText: React.FC<{ text: string; query?: string; color?: string }> = ({
  text,
  query,
  color = 'yellow.200'
}) => {
  if (!query || !text) return <>{text}</>;

  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  if (terms.length === 0) return <>{text}</>;

  // Build a regex that matches any of the search terms (case-insensitive)
  const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = terms.some(term => part.toLowerCase() === term);
        return isMatch ? (
          <Box
            key={index}
            as="mark"
            display="inline"
            px={0.5}
            borderRadius="sm"
            sx={{
              // Override browser default mark styles with !important
              background: `var(--chakra-colors-${color.replace('.', '-')}) !important`,
              color: 'inherit',
            }}
          >
            {part}
          </Box>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        );
      })}
    </>
  );
};

const FigureCard: React.FC<FigureCardProps> = ({ figure, searchQuery, layout = 'text-bottom', maxImageHeight }) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const cardBg = useColorModeValue('white', 'gray.800');
  const imageBg = useColorModeValue('gray.50', 'gray.700');

  const deleteMutation = useMutation(() => deleteFigure(figure._id), {
    onSuccess: () => {
      // Invalidate all queries that might contain figure data
      queryClient.invalidateQueries('figures');
      queryClient.invalidateQueries('recentFigures');
      queryClient.invalidateQueries('dashboardStats');

      toast({
        title: 'Item deleted',
        description: `${figure.name} has been removed from your collection.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete item',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${figure.name}?`)) {
      deleteMutation.mutate();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Shared image component with square aspect ratio
  // For text-bottom/image-only: square image fills card width
  // For text-left: image is 56% of card width, still square within that space
  // Uses objectFit="cover" to fill the container, cropping edges if needed
  // When maxImageHeight is provided, constrains WIDTH to prevent viewport clipping
  const ImageSection = () => (
    <Box
      // Use min(100%, maxImageHeight) for width - this allows aspect-ratio to work correctly
      // When viewport height is the constraint, width shrinks to match, keeping square shape
      w={maxImageHeight ? `min(100%, ${maxImageHeight}px)` : '100%'}
      sx={{
        aspectRatio: '1/1',
      }}
      bg={imageBg}
      overflow="hidden"
      flexShrink={0}
      mx="auto" // Center when constrained
    >
      <Image
        src={figure.imageUrl || '/placeholder-figure.png'}
        alt={figure.name}
        w="100%"
        h="100%"
        objectFit="cover"
        fallbackSrc="https://via.placeholder.com/300x200?text=No+Image"
      />
    </Box>
  );

  // Shared text content component
  const TextContent = ({ compact = false }: { compact?: boolean }) => (
    <Box p={compact ? 2 : 4} flex="1" minW="0">
      {figure.mfcLink && extractMfcId(figure.mfcLink) && (
        <Link
          href={buildMfcUrl(extractMfcId(figure.mfcLink)!)}
          isExternal
          fontSize="xs"
          color="blue.500"
          display="block"
          mb={compact ? 1 : 2}
          onClick={(e) => e.stopPropagation()}
        >
          MFC: {extractMfcId(figure.mfcLink)}
        </Link>
      )}
      <Text
        fontWeight="semibold"
        fontSize={compact ? 'md' : 'lg'}
        lineHeight="tight"
        noOfLines={compact ? 2 : 1}
        mb={1}
      >
        <HighlightedText text={figure.name} query={searchQuery} />
      </Text>
      <Text fontSize="sm" color="gray.600" mb={compact ? 1 : 2} noOfLines={1}>
        <HighlightedText
          text={getDisplayCompanyName(figure.companyRoles, figure.manufacturer)}
          query={searchQuery}
        />
      </Text>
      <HStack spacing={2} mb={compact ? 1 : 2} flexWrap="wrap">
        <Badge colorScheme="brand" fontSize="xs">
          {figure.scale}
        </Badge>
        {figure.location && (
          <Text fontSize="xs" color="gray.500" noOfLines={1}>
            <HighlightedText text={figure.location} query={searchQuery} />
          </Text>
        )}
      </HStack>

      <Flex justify="flex-start" gap={1}>
        <Link
          as={RouterLink}
          to={`/figures/edit/${figure._id}`}
          onClick={handleEdit}
        >
          <IconButton
            aria-label="Edit item"
            icon={<FaEdit />}
            size="xs"
            variant="ghost"
            colorScheme="brand"
          />
        </Link>
        <IconButton
          aria-label="Delete item"
          icon={<FaTrash />}
          size="xs"
          variant="ghost"
          colorScheme="red"
          onClick={handleDelete}
          isLoading={deleteMutation.isLoading}
        />
      </Flex>
    </Box>
  );

  // Image-only layout - uses 16:9 aspect ratio
  if (layout === 'image-only') {
    return (
      <Link
        as={RouterLink}
        to={`/figures/${figure._id}`}
        display="block"
        cursor="pointer"
        _hover={{ textDecoration: 'none' }}
      >
        <Box
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          bg={cardBg}
          shadow="md"
          transition="all 0.3s"
          _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
          position="relative"
        >
          <ImageSection />
          {/* Minimal overlay with name on hover */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            bg="blackAlpha.700"
            color="white"
            p={2}
            opacity={0}
            transition="opacity 0.2s"
            _groupHover={{ opacity: 1 }}
            sx={{ '.chakra-link:hover &': { opacity: 1 } }}
          >
            <Text fontSize="xs" noOfLines={1} fontWeight="medium">
              {figure.name}
            </Text>
          </Box>
        </Box>
      </Link>
    );
  }

  // Text-left layout (horizontal) - text on left (44%), image on right (56%) with 16:9 aspect ratio
  if (layout === 'text-left') {
    return (
      <Link
        as={RouterLink}
        to={`/figures/${figure._id}`}
        display="block"
        cursor="pointer"
        _hover={{ textDecoration: 'none' }}
      >
        <Flex
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          bg={cardBg}
          shadow="md"
          transition="all 0.3s"
          _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
          direction="row"
        >
          {/* Text on left - 44% width */}
          <Box w="44%" flexShrink={0}>
            <TextContent compact />
          </Box>
          {/* Image on right - 56% width with 16:9 aspect ratio */}
          <Box w="56%" flexShrink={0}>
            <ImageSection />
          </Box>
        </Flex>
      </Link>
    );
  }

  // Default: text-bottom layout (vertical) - uses 16:9 aspect ratio for image
  return (
    <Link
      as={RouterLink}
      to={`/figures/${figure._id}`}
      display="block"
      cursor="pointer"
      _hover={{ textDecoration: 'none' }}
    >
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg={cardBg}
        shadow="md"
        transition="all 0.3s"
        _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
      >
        <ImageSection />
        <TextContent />
      </Box>
    </Link>
  );
};

export default FigureCard;
