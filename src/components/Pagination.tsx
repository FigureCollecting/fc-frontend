/**
 * Pagination Component
 *
 * Provides page navigation with:
 * - Page number buttons with current page highlighting
 * - Previous/Next navigation
 * - Page slider for quick jumping (when > 5 pages)
 * - Configurable items per page with grid-based presets
 * - Card layout selector (text position)
 */
import React from 'react';
import {
  Button,
  Flex,
  Text,
  IconButton,
  HStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Select,
  Box,
  Tooltip,
  useColorModeValue,
  ButtonGroup,
  Icon,
} from '@chakra-ui/react';
import { FaChevronLeft, FaChevronRight, FaTh, FaImage, FaAlignLeft, FaAlignJustify } from 'react-icons/fa';

// Card layout options
export type CardLayout = 'text-bottom' | 'text-left' | 'image-only';

export const CARD_LAYOUT_OPTIONS: { value: CardLayout; label: string; icon: React.ElementType }[] = [
  { value: 'text-bottom', label: 'Text below', icon: FaAlignJustify },
  { value: 'text-left', label: 'Text left', icon: FaAlignLeft },
  { value: 'image-only', label: 'Image only', icon: FaImage },
];

export const DEFAULT_CARD_LAYOUT: CardLayout = 'text-bottom';

// Grid-based page size presets: value -> { cols, rows, label }
// Labels are in cols×rows format (e.g., "1×5" = 1 across, 5 down)
export const PAGE_SIZE_PRESETS = [
  { value: 5, cols: 1, rows: 5, label: '5 (1×5)' },
  { value: 6, cols: 2, rows: 3, label: '6 (2×3)' },
  { value: 12, cols: 3, rows: 4, label: '12 (3×4)' },
  { value: 18, cols: 3, rows: 6, label: '18 (3×6)' },
  { value: 24, cols: 4, rows: 6, label: '24 (4×6)' },
  { value: 36, cols: 4, rows: 9, label: '36 (4×9)' },
  { value: 50, cols: 5, rows: 10, label: '50 (5×10)' },
  { value: 72, cols: 6, rows: 12, label: '72 (6×12)' },
  { value: 96, cols: 8, rows: 12, label: '96 (8×12)' },
] as const;

export type PageSizeValue = typeof PAGE_SIZE_PRESETS[number]['value'];

export const DEFAULT_PAGE_SIZE: PageSizeValue = 12;

/** Controls which sections to render:
 * - 'full': All sections (default, backward compatible)
 * - 'top-controls': Slider, page size, and card layout selectors only
 * - 'page-nav': Page number buttons with prev/next arrows only
 */
export type PaginationVariant = 'full' | 'top-controls' | 'page-nav';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Current items per page */
  pageSize?: PageSizeValue;
  /** Callback when page size changes */
  onPageSizeChange?: (size: PageSizeValue) => void;
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Current card layout */
  cardLayout?: CardLayout;
  /** Callback when card layout changes */
  onCardLayoutChange?: (layout: CardLayout) => void;
  /** Show card layout selector */
  showCardLayoutSelector?: boolean;
  /** Which sections to render */
  variant?: PaginationVariant;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageSizeChange,
  showPageSizeSelector = true,
  cardLayout = DEFAULT_CARD_LAYOUT,
  onCardLayoutChange,
  showCardLayoutSelector = true,
  variant = 'full',
}) => {
  const activeBg = useColorModeValue('brand.600', 'brand.400');
  const activeColor = 'white';
  const activeRing = useColorModeValue('brand.200', 'brand.700');
  const sliderTrackBg = useColorModeValue('gray.200', 'gray.600');
  const sliderFilledBg = useColorModeValue('brand.200', 'brand.600');

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleSliderChange = (value: number) => {
    if (value !== currentPage) {
      onPageChange(value);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10) as PageSizeValue;
    onPageSizeChange?.(newSize);
  };

  // Generate page buttons with enhanced current page styling
  const renderPageButtons = () => {
    const buttons = [];

    // Always show first page
    const isFirstActive = currentPage === 1;
    buttons.push(
      <Button
        key={1}
        onClick={() => onPageChange(1)}
        size="sm"
        variant={isFirstActive ? 'solid' : 'outline'}
        bg={isFirstActive ? activeBg : undefined}
        color={isFirstActive ? activeColor : undefined}
        colorScheme={isFirstActive ? 'brand' : 'gray'}
        fontWeight={isFirstActive ? 'bold' : 'medium'}
        boxShadow={isFirstActive ? `0 0 0 3px ${activeRing}` : undefined}
        transform={isFirstActive ? 'scale(1.1)' : undefined}
        _hover={isFirstActive ? { bg: activeBg } : undefined}
        mx={0.5}
        minW="36px"
      >
        1
      </Button>
    );

    // If there are many pages, add ellipsis
    if (currentPage > 3) {
      buttons.push(
        <Text key="ellipsis1" mx={1} color="gray.400">
          ···
        </Text>
      );
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i >= 2 && i <= totalPages - 1) {
        const isActive = currentPage === i;
        buttons.push(
          <Button
            key={i}
            onClick={() => onPageChange(i)}
            size="sm"
            variant={isActive ? 'solid' : 'outline'}
            bg={isActive ? activeBg : undefined}
            color={isActive ? activeColor : undefined}
            colorScheme={isActive ? 'brand' : 'gray'}
            fontWeight={isActive ? 'bold' : 'medium'}
            boxShadow={isActive ? `0 0 0 3px ${activeRing}` : undefined}
            transform={isActive ? 'scale(1.1)' : undefined}
            _hover={isActive ? { bg: activeBg } : undefined}
            mx={0.5}
            minW="36px"
          >
            {i}
          </Button>
        );
      }
    }

    // If there are many pages, add ellipsis
    if (currentPage < totalPages - 2) {
      buttons.push(
        <Text key="ellipsis2" mx={1} color="gray.400">
          ···
        </Text>
      );
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      const isLastActive = currentPage === totalPages;
      buttons.push(
        <Button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          size="sm"
          variant={isLastActive ? 'solid' : 'outline'}
          bg={isLastActive ? activeBg : undefined}
          color={isLastActive ? activeColor : undefined}
          colorScheme={isLastActive ? 'brand' : 'gray'}
          fontWeight={isLastActive ? 'bold' : 'medium'}
          boxShadow={isLastActive ? `0 0 0 3px ${activeRing}` : undefined}
          transform={isLastActive ? 'scale(1.1)' : undefined}
          _hover={isLastActive ? { bg: activeBg } : undefined}
          mx={0.5}
          minW="36px"
        >
          {totalPages}
        </Button>
      );
    }

    return buttons;
  };

  // Don't render pagination if there's only one page and no page size selector
  if (totalPages <= 1 && !showPageSizeSelector && variant !== 'top-controls') return null;

  const showPageNav = variant === 'full' || variant === 'page-nav';
  const showControls = variant === 'full' || variant === 'top-controls';

  return (
    <Flex direction="column" align="center" mt={showPageNav ? 8 : 0} mb={4} gap={showControls && showPageNav ? 4 : 2}>
      {/* Top controls: slider, page size, card layout */}
      {showControls && (
        <>
          {/* Page slider (when > 5 pages) */}
          {totalPages > 5 && (
            <Box w="100%" maxW="300px" px={4}>
              <Slider
                aria-label="Page slider"
                value={currentPage}
                min={1}
                max={totalPages}
                step={1}
                onChange={handleSliderChange}
                focusThumbOnChange={false}
              >
                <SliderTrack bg={sliderTrackBg} h="6px" borderRadius="full">
                  <SliderFilledTrack bg={sliderFilledBg} />
                </SliderTrack>
                <Tooltip
                  label={`Page ${currentPage}`}
                  placement="top"
                  hasArrow
                  isOpen={undefined}
                >
                  <SliderThumb boxSize={5} bg={activeBg} />
                </Tooltip>
              </Slider>
            </Box>
          )}

          {/* Page info, page size selector, and card layout */}
          <HStack spacing={4} fontSize="sm" color="gray.600" flexWrap="wrap" justify="center">
            <Text fontWeight="medium">
              Page {currentPage} of {totalPages}
            </Text>

            {showPageSizeSelector && onPageSizeChange && (
              <>
                <Text color="gray.400">•</Text>
                <HStack spacing={2}>
                  <FaTh size={12} />
                  <Select
                    size="sm"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    width="auto"
                    minW="110px"
                    variant="filled"
                    borderRadius="md"
                  >
                    {PAGE_SIZE_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </Select>
                </HStack>
              </>
            )}

            {showCardLayoutSelector && onCardLayoutChange && (
              <>
                <Text color="gray.400">•</Text>
                <ButtonGroup size="sm" isAttached variant="outline">
                  {CARD_LAYOUT_OPTIONS.map((option) => (
                    <Tooltip key={option.value} label={option.label} placement="top" hasArrow>
                      <IconButton
                        aria-label={option.label}
                        icon={<Icon as={option.icon} />}
                        onClick={() => onCardLayoutChange(option.value)}
                        variant={cardLayout === option.value ? 'solid' : 'outline'}
                        colorScheme={cardLayout === option.value ? 'brand' : 'gray'}
                      />
                    </Tooltip>
                  ))}
                </ButtonGroup>
              </>
            )}
          </HStack>
        </>
      )}

      {/* Page navigation: prev/next arrows and page number buttons */}
      {showPageNav && totalPages > 1 && (
        <Flex justify="center" align="center">
          <IconButton
            aria-label="Previous page"
            icon={<FaChevronLeft />}
            onClick={handlePrevious}
            isDisabled={currentPage === 1}
            size="sm"
            variant="ghost"
            mr={2}
          />

          {renderPageButtons()}

          <IconButton
            aria-label="Next page"
            icon={<FaChevronRight />}
            onClick={handleNext}
            isDisabled={currentPage === totalPages}
            size="sm"
            variant="ghost"
            ml={2}
          />
        </Flex>
      )}
    </Flex>
  );
};

export default Pagination;
