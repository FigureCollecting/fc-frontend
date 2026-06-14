/**
 * FacetedFilterSidebar Component
 *
 * A sidebar component for faceted filtering in the collection view.
 * Displays checkbox-based filters for Manufacturer, Scale, Origin, and Category
 * with counts. Supports multi-select within each facet.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useColorModeValue } from "./ui/color-mode";
import {
  Steps,
  Box,
  VStack,
  Text,
  Checkbox,
  CheckboxGroup,
  Accordion,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Drawer,
  IconButton,
  Icon,
  useDisclosure,
  useBreakpointValue,
  Portal,
} from '@chakra-ui/react';
import { Tooltip } from 'ui/tooltip';
import { FaSearch, FaTimes, FaFilter, FaSortAmountDown, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import { StatsData } from '../types';
import { mergeManufacturerStats } from '../utils/statsUtils';

export interface FacetedFilters {
  manufacturers: string[];
  distributors: string[];
  scales: string[];
  origins: string[];
  categories: string[];
  sculptors: string[];
  illustrators: string[];
  classifications: string[];
}

interface FacetedFilterSidebarProps {
  stats: StatsData | undefined;
  filters: FacetedFilters;
  onFiltersChange: (filters: FacetedFilters) => void;
  isLoading?: boolean;
}

type FacetSortMode = 'count-desc' | 'alpha-asc' | 'alpha-desc';

interface FacetSectionProps {
  title: string;
  items: { _id: string; count: number; roleName?: string }[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxVisibleItems?: number;
}

/**
 * Individual facet section with search, checkboxes, sort toggle, and "show more"
 */
const FacetSection: React.FC<FacetSectionProps> = ({
  title,
  items,
  selectedItems,
  onSelectionChange,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items',
  maxVisibleItems = 5,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [sortMode, setSortMode] = useState<FacetSortMode>('count-desc');

  const textColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const searchBg = useColorModeValue('white', 'gray.800');

  const cycleSortMode = useCallback(() => {
    setSortMode(prev => {
      if (prev === 'count-desc') return 'alpha-asc';
      if (prev === 'alpha-asc') return 'alpha-desc';
      return 'count-desc';
    });
  }, []);

  const sortIcon = sortMode === 'count-desc' ? FaSortAmountDown
    : sortMode === 'alpha-asc' ? FaSortAlphaDown
    : FaSortAlphaUp;

  const sortLabel = sortMode === 'count-desc' ? 'Sorted by count'
    : sortMode === 'alpha-asc' ? 'Sorted A→Z'
    : 'Sorted Z→A';

  // Sort items by current mode
  const sortedItems = useMemo(() => {
    const sorted = [...items];
    if (sortMode === 'count-desc') {
      sorted.sort((a, b) => b.count - a.count);
    } else if (sortMode === 'alpha-asc') {
      sorted.sort((a, b) => (a._id || '').localeCompare(b._id || ''));
    } else {
      sorted.sort((a, b) => (b._id || '').localeCompare(a._id || ''));
    }
    return sorted;
  }, [items, sortMode]);

  // Filter items by search term
  const filteredItems = useMemo(() => {
    if (!searchTerm) return sortedItems;
    const lower = searchTerm.toLowerCase();
    return sortedItems.filter(item => item._id?.toLowerCase().includes(lower));
  }, [sortedItems, searchTerm]);

  // Limit visible items unless "show all" is clicked or searching
  const visibleItems = useMemo(() => {
    if (showAll || searchTerm) return filteredItems;
    return filteredItems.slice(0, maxVisibleItems);
  }, [filteredItems, showAll, searchTerm, maxVisibleItems]);

  const hasMore = filteredItems.length > maxVisibleItems && !searchTerm;

  const handleCheckboxChange = (values: string[]) => {
    onSelectionChange(values);
  };

  const clearSelection = () => {
    onSelectionChange([]);
    setSearchTerm(''); // Also clear search when clearing selection
  };

  // Clear search when selection is externally cleared (e.g., Clear All button)
  React.useEffect(() => {
    if (selectedItems.length === 0) {
      setSearchTerm('');
    }
  }, [selectedItems.length]);

  return (
    <Accordion.Item border="none" value='item-0'>
      <HStack px={0} py={2} gap={0}>
        <Accordion.ItemTrigger px={0} py={0} _hover={{ bg: 'transparent' }} flex="1">
          <HStack flex="1" justify="space-between">
            <Text fontWeight="semibold" fontSize="sm">
              {title}
            </Text>
            <HStack gap={2}>
              {selectedItems.length > 0 && (
                <Badge colorPalette="brand" borderRadius="full" px={2}>
                  {selectedItems.length}
                </Badge>
              )}
              <Accordion.ItemIndicator />
            </HStack>
          </HStack>
        </Accordion.ItemTrigger>
        <Tooltip content={sortLabel} showArrow positioning={{
          placement: "top"
        }}>
          <IconButton
            aria-label={sortLabel}
            size="xs"
            variant="ghost"
            colorPalette="gray"
            onClick={cycleSortMode}
            ml={1}><Icon as={sortIcon} /></IconButton>
        </Tooltip>
      </HStack>
      <Accordion.ItemContent px={0} pb={4}><Accordion.ItemBody>
          <VStack gap={2} align="stretch">
            {/* Search within facet */}
            {items.length > 5 && (
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onValueChange={(e) => setSearchTerm(e.target.value)}
                  bg={searchBg}
                  borderRadius="md"
                />
              </InputGroup>
            )}

            {/* Clear selection button */}
            {selectedItems.length > 0 && (
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={clearSelection}
                alignSelf="flex-start"><FaTimes />
                Clear {title}</Button>
            )}

            {/* Checkbox list */}
            {visibleItems.length === 0 ? (
              <Text fontSize="sm" color={textColor} fontStyle="italic">
                {emptyMessage}
              </Text>
            ) : (
              <CheckboxGroup value={selectedItems} onValueChange={handleCheckboxChange}>
                <VStack gap={1} align="stretch">
                  {visibleItems.map((item) => (
                    <Box
                      key={item._id}
                      px={2}
                      py={1}
                      borderRadius="md"
                      _hover={{ bg: hoverBg }}
                      transition="background 0.2s"
                    >
                      <Checkbox.Root
                        value={item._id}
                        size="sm"
                        width="100%"
                        checked={selectedItems.includes(item._id)}
                      ><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Label>
                        <HStack justify="space-between" width="100%" pr={2}>
                          <Text
                            fontSize="sm"
                            color={item._id === '__unspecified__' ? 'gray.500' : textColor}
                            fontStyle={item._id === '__unspecified__' ? 'italic' : 'normal'}
                            lineClamp={1}
                            title={item._id === '__unspecified__' ? 'Not Specified' : item._id + (item.roleName ? ` (${item.roleName})` : '')}
                          >
                            {item._id === '__unspecified__' ? 'Not Specified' : (item._id || '(empty)')}
                            {item.roleName && (
                              <Text as="span" fontSize="xs" color="gray.500">
                                {' '}· {item.roleName}
                              </Text>
                            )}
                          </Text>
                          <Badge
                            size="sm"
                            variant="subtle"
                            colorPalette="gray"
                            borderRadius="full"
                            minW="24px"
                            textAlign="center"
                          >
                            {item.count}
                          </Badge>
                        </HStack>
                      </Checkbox.Label></Checkbox.Root>
                    </Box>
                  ))}
                </VStack>
              </CheckboxGroup>
            )}

            {/* Show more/less toggle */}
            {hasMore && !showAll && (
              <Button
                size="xs"
                variant='plain'
                colorPalette="brand"
                onClick={() => setShowAll(true)}
              >
                Show {filteredItems.length - maxVisibleItems} more
              </Button>
            )}
            {showAll && hasMore && (
              <Button
                size="xs"
                variant='plain'
                colorPalette="gray"
                onClick={() => setShowAll(false)}
              >
                Show less
              </Button>
            )}
          </VStack>
        </Accordion.ItemBody></Accordion.ItemContent>
    </Accordion.Item>
  );
};

/**
 * Main sidebar content (used by both desktop sidebar and mobile drawer)
 */
const SidebarContent: React.FC<FacetedFilterSidebarProps> = ({
  stats,
  filters,
  onFiltersChange,
  isLoading = false,
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const sectionBg = useColorModeValue('gray.50', 'gray.800');

  // Merge legacy manufacturer stats with v3 manufacturer stats
  const manufacturerItems = useMemo(() => {
    if (!stats) return [];
    return mergeManufacturerStats(stats.manufacturerStats, stats.v3ManufacturerStats);
  }, [stats]);

  // Distributor items from v3 distributor stats
  const distributorItems = useMemo(() => {
    if (!stats?.distributorStats) return [];
    return stats.distributorStats
      .filter(d => d._id != null && d._id !== '')
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  // Include scales with a "Not Specified" option for null/empty values
  const scaleItems = useMemo(() => {
    if (!stats?.scaleStats) return [];

    // Find count of unspecified scales (null or empty)
    const unspecifiedCount = stats.scaleStats
      .filter(s => s._id == null || s._id === '')
      .reduce((sum, s) => sum + s.count, 0);

    // Get valid scales sorted by count
    const validScales = stats.scaleStats
      .filter(s => s._id != null && s._id !== '')
      .sort((a, b) => b.count - a.count);

    // Add "Not Specified" option at the end if there are unspecified items
    if (unspecifiedCount > 0) {
      return [...validScales, { _id: '__unspecified__', count: unspecifiedCount }];
    }

    return validScales;
  }, [stats]);

  // Origin/franchise items with "Not Specified" option
  const originItems = useMemo(() => {
    if (!stats?.originStats) return [];

    // Find count of unspecified origins (null or empty)
    const unspecifiedCount = stats.originStats
      .filter(o => o._id == null || o._id === '')
      .reduce((sum, o) => sum + o.count, 0);

    // Get valid origins sorted by count
    const validOrigins = stats.originStats
      .filter(o => o._id != null && o._id !== '')
      .sort((a, b) => b.count - a.count);

    // Add "Not Specified" option at the end if there are unspecified items
    if (unspecifiedCount > 0) {
      return [...validOrigins, { _id: '__unspecified__', count: unspecifiedCount }];
    }

    return validOrigins;
  }, [stats]);

  // Category/type items with "Not Specified" option
  const categoryItems = useMemo(() => {
    if (!stats?.categoryStats) return [];

    // Find count of unspecified categories (null or empty)
    const unspecifiedCount = stats.categoryStats
      .filter(c => c._id == null || c._id === '')
      .reduce((sum, c) => sum + c.count, 0);

    // Get valid categories sorted by count
    const validCategories = stats.categoryStats
      .filter(c => c._id != null && c._id !== '')
      .sort((a, b) => b.count - a.count);

    // Add "Not Specified" option at the end if there are unspecified items
    if (unspecifiedCount > 0) {
      return [...validCategories, { _id: '__unspecified__', count: unspecifiedCount }];
    }

    return validCategories;
  }, [stats]);

  // Handler factories
  const handleManufacturerChange = useCallback((items: string[]) => {
    onFiltersChange({ ...filters, manufacturers: items });
  }, [filters, onFiltersChange]);

  const handleDistributorChange = useCallback((items: string[]) => {
    onFiltersChange({ ...filters, distributors: items });
  }, [filters, onFiltersChange]);

  const handleScaleChange = useCallback((items: string[]) => {
    onFiltersChange({ ...filters, scales: items });
  }, [filters, onFiltersChange]);

  const handleOriginChange = useCallback((items: string[]) => {
    onFiltersChange({ ...filters, origins: items });
  }, [filters, onFiltersChange]);

  const handleCategoryChange = useCallback((items: string[]) => {
    onFiltersChange({ ...filters, categories: items });
  }, [filters, onFiltersChange]);

  // Sculptor items from artist roles
  const sculptorItems = useMemo(() => {
    if (!stats?.sculptorStats) return [];
    return stats.sculptorStats
      .filter(s => s._id != null && s._id !== '')
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  // Illustrator items from artist roles
  const illustratorItems = useMemo(() => {
    if (!stats?.illustratorStats) return [];
    return stats.illustratorStats
      .filter(i => i._id != null && i._id !== '')
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  // Classification items with "Not Specified" option
  const classificationItems = useMemo(() => {
    if (!stats?.classificationStats) return [];

    const unspecifiedCount = stats.classificationStats
      .filter(c => c._id == null || c._id === '')
      .reduce((sum, c) => sum + c.count, 0);

    const validClassifications = stats.classificationStats
      .filter(c => c._id != null && c._id !== '')
      .sort((a, b) => b.count - a.count);

    if (unspecifiedCount > 0) {
      return [...validClassifications, { _id: '__unspecified__', count: unspecifiedCount }];
    }

    return validClassifications;
  }, [stats]);

  const handleSculptorChange = useCallback((items: string[]) => {
    onFiltersChange({ ...filters, sculptors: items });
  }, [filters, onFiltersChange]);

  const handleIllustratorChange = useCallback((items: string[]) => {
    onFiltersChange({ ...filters, illustrators: items });
  }, [filters, onFiltersChange]);

  const handleClassificationChange = useCallback((items: string[]) => {
    onFiltersChange({ ...filters, classifications: items });
  }, [filters, onFiltersChange]);

  const clearAllFilters = () => {
    onFiltersChange({
      manufacturers: [],
      distributors: [],
      scales: [],
      origins: [],
      categories: [],
      sculptors: [],
      illustrators: [],
      classifications: [],
    });
  };

  const hasActiveFilters =
    filters.manufacturers.length > 0 ||
    filters.distributors.length > 0 ||
    filters.scales.length > 0 ||
    filters.origins.length > 0 ||
    filters.categories.length > 0 ||
    filters.sculptors.length > 0 ||
    filters.illustrators.length > 0 ||
    filters.classifications.length > 0;

  if (isLoading) {
    return (
      <VStack gap={4} align="stretch" p={4}>
        <Text color="gray.500">Loading filters...</Text>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Active filters summary */}
      {hasActiveFilters && (
        <Box p={3} bg={sectionBg} borderRadius="md">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="semibold">
              Active Filters
            </Text>
            <Button
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
          </HStack>
          <Wrap gap={2}>
            {filters.manufacturers.map((m) => (
              <WrapItem key={`mfr-${m}`}>
                <Tag.Root size="sm" colorPalette="brand" borderRadius="full">
                  <Tag.Label>{m}</Tag.Label>
                  <Tag.CloseTrigger
                    onClick={() =>
                      handleManufacturerChange(filters.manufacturers.filter((x) => x !== m))
                    }
                  />
                </Tag.Root>
              </WrapItem>
            ))}
            {filters.distributors.map((d) => (
              <WrapItem key={`dist-${d}`}>
                <Tag.Root size="sm" colorPalette="cyan" borderRadius="full">
                  <Tag.Label>{d}</Tag.Label>
                  <Tag.CloseTrigger
                    onClick={() =>
                      handleDistributorChange(filters.distributors.filter((x) => x !== d))
                    }
                  />
                </Tag.Root>
              </WrapItem>
            ))}
            {filters.scales.map((s) => (
              <WrapItem key={`scale-${s}`}>
                <Tag.Root size="sm" colorPalette="purple" borderRadius="full">
                  <Tag.Label>{s}</Tag.Label>
                  <Tag.CloseTrigger
                    onClick={() =>
                      handleScaleChange(filters.scales.filter((x) => x !== s))
                    }
                  />
                </Tag.Root>
              </WrapItem>
            ))}
            {filters.origins.map((o) => (
              <WrapItem key={`origin-${o}`}>
                <Tag.Root size="sm" colorPalette="orange" borderRadius="full">
                  <Tag.Label>{o === '__unspecified__' ? 'Not Specified' : o}</Tag.Label>
                  <Tag.CloseTrigger
                    onClick={() =>
                      handleOriginChange(filters.origins.filter((x) => x !== o))
                    }
                  />
                </Tag.Root>
              </WrapItem>
            ))}
            {filters.categories.map((c) => (
              <WrapItem key={`category-${c}`}>
                <Tag.Root size="sm" colorPalette="teal" borderRadius="full">
                  <Tag.Label>{c === '__unspecified__' ? 'Not Specified' : c}</Tag.Label>
                  <Tag.CloseTrigger
                    onClick={() =>
                      handleCategoryChange(filters.categories.filter((x) => x !== c))
                    }
                  />
                </Tag.Root>
              </WrapItem>
            ))}
            {filters.sculptors.map((s) => (
              <WrapItem key={`sculptor-${s}`}>
                <Tag.Root size="sm" colorPalette="pink" borderRadius="full">
                  <Tag.Label>{s}</Tag.Label>
                  <Tag.CloseTrigger
                    onClick={() =>
                      handleSculptorChange(filters.sculptors.filter((x) => x !== s))
                    }
                  />
                </Tag.Root>
              </WrapItem>
            ))}
            {filters.illustrators.map((i) => (
              <WrapItem key={`illustrator-${i}`}>
                <Tag.Root size="sm" colorPalette="yellow" borderRadius="full">
                  <Tag.Label>{i}</Tag.Label>
                  <Tag.CloseTrigger
                    onClick={() =>
                      handleIllustratorChange(filters.illustrators.filter((x) => x !== i))
                    }
                  />
                </Tag.Root>
              </WrapItem>
            ))}
            {filters.classifications.map((cl) => (
              <WrapItem key={`classification-${cl}`}>
                <Tag.Root size="sm" colorPalette="red" borderRadius="full">
                  <Tag.Label>{cl === '__unspecified__' ? 'Not Specified' : cl}</Tag.Label>
                  <Tag.CloseTrigger
                    onClick={() =>
                      handleClassificationChange(filters.classifications.filter((x) => x !== cl))
                    }
                  />
                </Tag.Root>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}
      {/* Facet accordions */}
      <Accordion.Root multiple defaultValue={['0', '1', '2', '3', '4']}>
        <FacetSection
          title="Category"
          items={categoryItems}
          selectedItems={filters.categories}
          onSelectionChange={handleCategoryChange}
          searchPlaceholder="Search categories..."
          emptyMessage="No categories"
        />

        <Box borderTop="1px" borderColor={borderColor} />

        <FacetSection
          title="Manufacturer"
          items={manufacturerItems}
          selectedItems={filters.manufacturers}
          onSelectionChange={handleManufacturerChange}
          searchPlaceholder="Search manufacturers..."
          emptyMessage="No manufacturers"
        />

        <Box borderTop="1px" borderColor={borderColor} />

        {distributorItems.length > 0 && (
          <>
            <FacetSection
              title="Distributor"
              items={distributorItems}
              selectedItems={filters.distributors}
              onSelectionChange={handleDistributorChange}
              searchPlaceholder="Search distributors..."
              emptyMessage="No distributors"
            />

            <Box borderTop="1px" borderColor={borderColor} />
          </>
        )}

        <FacetSection
          title="Origin"
          items={originItems}
          selectedItems={filters.origins}
          onSelectionChange={handleOriginChange}
          searchPlaceholder="Search origins..."
          emptyMessage="No origins"
        />

        <Box borderTop="1px" borderColor={borderColor} />

        <FacetSection
          title="Scale"
          items={scaleItems}
          selectedItems={filters.scales}
          onSelectionChange={handleScaleChange}
          searchPlaceholder="Search scales..."
          emptyMessage="No scales"
        />

        {sculptorItems.length > 0 && (
          <>
            <Box borderTop="1px" borderColor={borderColor} />

            <FacetSection
              title="Sculptor"
              items={sculptorItems}
              selectedItems={filters.sculptors}
              onSelectionChange={handleSculptorChange}
              searchPlaceholder="Search sculptors..."
              emptyMessage="No sculptors"
            />
          </>
        )}

        {illustratorItems.length > 0 && (
          <>
            <Box borderTop="1px" borderColor={borderColor} />

            <FacetSection
              title="Illustrator"
              items={illustratorItems}
              selectedItems={filters.illustrators}
              onSelectionChange={handleIllustratorChange}
              searchPlaceholder="Search illustrators..."
              emptyMessage="No illustrators"
            />
          </>
        )}

        {classificationItems.length > 0 && (
          <>
            <Box borderTop="1px" borderColor={borderColor} />

            <FacetSection
              title="Classification"
              items={classificationItems}
              selectedItems={filters.classifications}
              onSelectionChange={handleClassificationChange}
              searchPlaceholder="Search classifications..."
              emptyMessage="No classifications"
            />
          </>
        )}
      </Accordion.Root>
    </VStack>
  );
};

/**
 * FacetedFilterSidebar - Responsive component that shows:
 * - Desktop: Sticky sidebar
 * - Mobile: Button that opens a drawer
 */
const FacetedFilterSidebar: React.FC<FacetedFilterSidebarProps & {
  /** For mobile: control drawer externally if needed */
  isDrawerOpen?: boolean;
  onDrawerOpen?: () => void;
  onDrawerClose?: () => void;
}> = (props) => {
  const { open, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const sidebarBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const hasActiveFilters =
    props.filters.manufacturers.length > 0 ||
    props.filters.distributors.length > 0 ||
    props.filters.scales.length > 0 ||
    props.filters.origins.length > 0 ||
    props.filters.categories.length > 0 ||
    props.filters.sculptors.length > 0 ||
    props.filters.illustrators.length > 0 ||
    props.filters.classifications.length > 0;

  const filterCount =
    props.filters.manufacturers.length +
    props.filters.distributors.length +
    props.filters.scales.length +
    props.filters.origins.length +
    props.filters.categories.length +
    props.filters.sculptors.length +
    props.filters.illustrators.length +
    props.filters.classifications.length;

  // Mobile: Show filter button and drawer
  if (isMobile) {
    return (
      <>
        <Button
          onClick={onOpen}
          size="sm"
          variant={hasActiveFilters ? 'solid' : 'outline'}
          colorPalette={hasActiveFilters ? 'brand' : 'gray'}><FaFilter />
            Filters
            {filterCount > 0 && (
          <Badge ml={2} colorPalette="white" color="white" bg="brand.600" borderRadius="full">
            {filterCount}
          </Badge>
        )}</Button>
        <Drawer.Root open={isOpen} placement='start' size='sm' onOpenChange={e => {
          if (!e.open) {
            onClose();
          }
        }}>
          <Portal>

            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content>
                <Drawer.CloseTrigger />
                <Drawer.Header borderBottomWidth="1px">Filter Collection</Drawer.Header>
                <Drawer.Body py={4}>
                  <SidebarContent {...props} />
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>

          </Portal>
        </Drawer.Root>
      </>
    );
  }

  // Desktop: Show sticky sidebar
  return (
    <Box
      w="280px"
      minW="280px"
      bg={sidebarBg}
      borderRight="1px"
      borderColor={borderColor}
      p={4}
      position="sticky"
      top="80px"
      maxH="calc(100vh - 100px)"
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': {
          background: 'var(--chakra-colors-gray-300)',
          borderRadius: '4px',
        },
      }}
    >
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Filters
      </Text>
      <SidebarContent {...props} />
    </Box>
  );
};

export default FacetedFilterSidebar;
export { SidebarContent };
