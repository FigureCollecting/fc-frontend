/**
 * FacetedFilterSidebar Component
 *
 * A sidebar component for faceted filtering in the collection view.
 * Displays checkbox-based filters for Manufacturer, Scale, and Location
 * with counts. Supports multi-select within each facet.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  Text,
  Checkbox,
  CheckboxGroup,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
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
  useColorModeValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FaSearch, FaTimes, FaFilter } from 'react-icons/fa';
import { StatsData } from '../types';
import { mergeManufacturerStats } from '../utils/statsUtils';

export interface FacetedFilters {
  manufacturers: string[];
  distributors: string[];
  scales: string[];
  locations: string[];
  origins: string[];
  categories: string[];
}

interface FacetedFilterSidebarProps {
  stats: StatsData | undefined;
  filters: FacetedFilters;
  onFiltersChange: (filters: FacetedFilters) => void;
  isLoading?: boolean;
}

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
 * Individual facet section with search, checkboxes, and "show more"
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

  const textColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const searchBg = useColorModeValue('white', 'gray.800');

  // Filter items by search term
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(item => item._id?.toLowerCase().includes(lower));
  }, [items, searchTerm]);

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
    <AccordionItem border="none">
      <AccordionButton px={0} py={2} _hover={{ bg: 'transparent' }}>
        <HStack flex="1" justify="space-between">
          <Text fontWeight="semibold" fontSize="sm">
            {title}
          </Text>
          <HStack spacing={2}>
            {selectedItems.length > 0 && (
              <Badge colorScheme="brand" borderRadius="full" px={2}>
                {selectedItems.length}
              </Badge>
            )}
            <AccordionIcon />
          </HStack>
        </HStack>
      </AccordionButton>

      <AccordionPanel px={0} pb={4}>
        <VStack spacing={2} align="stretch">
          {/* Search within facet */}
          {items.length > 5 && (
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <FaSearch color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              colorScheme="red"
              leftIcon={<FaTimes />}
              onClick={clearSelection}
              alignSelf="flex-start"
            >
              Clear {title}
            </Button>
          )}

          {/* Checkbox list */}
          {visibleItems.length === 0 ? (
            <Text fontSize="sm" color={textColor} fontStyle="italic">
              {emptyMessage}
            </Text>
          ) : (
            <CheckboxGroup value={selectedItems} onChange={handleCheckboxChange}>
              <VStack spacing={1} align="stretch">
                {visibleItems.map((item) => (
                  <Box
                    key={item._id}
                    px={2}
                    py={1}
                    borderRadius="md"
                    _hover={{ bg: hoverBg }}
                    transition="background 0.2s"
                  >
                    <Checkbox
                      value={item._id}
                      size="sm"
                      width="100%"
                      isChecked={selectedItems.includes(item._id)}
                    >
                      <HStack justify="space-between" width="100%" pr={2}>
                        <Text
                          fontSize="sm"
                          color={item._id === '__unspecified__' ? 'gray.500' : textColor}
                          fontStyle={item._id === '__unspecified__' ? 'italic' : 'normal'}
                          noOfLines={1}
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
                          colorScheme="gray"
                          borderRadius="full"
                          minW="24px"
                          textAlign="center"
                        >
                          {item.count}
                        </Badge>
                      </HStack>
                    </Checkbox>
                  </Box>
                ))}
              </VStack>
            </CheckboxGroup>
          )}

          {/* Show more/less toggle */}
          {hasMore && !showAll && (
            <Button
              size="xs"
              variant="link"
              colorScheme="brand"
              onClick={() => setShowAll(true)}
            >
              Show {filteredItems.length - maxVisibleItems} more
            </Button>
          )}
          {showAll && hasMore && (
            <Button
              size="xs"
              variant="link"
              colorScheme="gray"
              onClick={() => setShowAll(false)}
            >
              Show less
            </Button>
          )}
        </VStack>
      </AccordionPanel>
    </AccordionItem>
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

  const locationItems = useMemo(() => {
    if (!stats?.locationStats) return [];
    return stats.locationStats
      .filter(l => l._id != null && l._id !== '')
      .sort((a, b) => b.count - a.count);
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

  const handleLocationChange = useCallback((items: string[]) => {
    onFiltersChange({ ...filters, locations: items });
  }, [filters, onFiltersChange]);

  const handleOriginChange = useCallback((items: string[]) => {
    onFiltersChange({ ...filters, origins: items });
  }, [filters, onFiltersChange]);

  const handleCategoryChange = useCallback((items: string[]) => {
    onFiltersChange({ ...filters, categories: items });
  }, [filters, onFiltersChange]);

  const clearAllFilters = () => {
    onFiltersChange({
      manufacturers: [],
      distributors: [],
      scales: [],
      locations: [],
      origins: [],
      categories: [],
    });
  };

  const hasActiveFilters =
    filters.manufacturers.length > 0 ||
    filters.distributors.length > 0 ||
    filters.scales.length > 0 ||
    filters.locations.length > 0 ||
    filters.origins.length > 0 ||
    filters.categories.length > 0;

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch" p={4}>
        <Text color="gray.500">Loading filters...</Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
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
              colorScheme="red"
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
          </HStack>
          <Wrap spacing={2}>
            {filters.manufacturers.map((m) => (
              <WrapItem key={`mfr-${m}`}>
                <Tag size="sm" colorScheme="brand" borderRadius="full">
                  <TagLabel>{m}</TagLabel>
                  <TagCloseButton
                    onClick={() =>
                      handleManufacturerChange(filters.manufacturers.filter((x) => x !== m))
                    }
                  />
                </Tag>
              </WrapItem>
            ))}
            {filters.distributors.map((d) => (
              <WrapItem key={`dist-${d}`}>
                <Tag size="sm" colorScheme="cyan" borderRadius="full">
                  <TagLabel>{d}</TagLabel>
                  <TagCloseButton
                    onClick={() =>
                      handleDistributorChange(filters.distributors.filter((x) => x !== d))
                    }
                  />
                </Tag>
              </WrapItem>
            ))}
            {filters.scales.map((s) => (
              <WrapItem key={`scale-${s}`}>
                <Tag size="sm" colorScheme="purple" borderRadius="full">
                  <TagLabel>{s}</TagLabel>
                  <TagCloseButton
                    onClick={() =>
                      handleScaleChange(filters.scales.filter((x) => x !== s))
                    }
                  />
                </Tag>
              </WrapItem>
            ))}
            {filters.locations.map((l) => (
              <WrapItem key={`loc-${l}`}>
                <Tag size="sm" colorScheme="green" borderRadius="full">
                  <TagLabel>{l}</TagLabel>
                  <TagCloseButton
                    onClick={() =>
                      handleLocationChange(filters.locations.filter((x) => x !== l))
                    }
                  />
                </Tag>
              </WrapItem>
            ))}
            {filters.origins.map((o) => (
              <WrapItem key={`origin-${o}`}>
                <Tag size="sm" colorScheme="orange" borderRadius="full">
                  <TagLabel>{o === '__unspecified__' ? 'Not Specified' : o}</TagLabel>
                  <TagCloseButton
                    onClick={() =>
                      handleOriginChange(filters.origins.filter((x) => x !== o))
                    }
                  />
                </Tag>
              </WrapItem>
            ))}
            {filters.categories.map((c) => (
              <WrapItem key={`category-${c}`}>
                <Tag size="sm" colorScheme="teal" borderRadius="full">
                  <TagLabel>{c === '__unspecified__' ? 'Not Specified' : c}</TagLabel>
                  <TagCloseButton
                    onClick={() =>
                      handleCategoryChange(filters.categories.filter((x) => x !== c))
                    }
                  />
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}

      {/* Facet accordions */}
      <Accordion allowMultiple defaultIndex={[0, 1, 2, 3, 4]}>
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

        <Box borderTop="1px" borderColor={borderColor} />

        <FacetSection
          title="Location"
          items={locationItems}
          selectedItems={filters.locations}
          onSelectionChange={handleLocationChange}
          searchPlaceholder="Search locations..."
          emptyMessage="No locations"
        />
      </Accordion>
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const sidebarBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const hasActiveFilters =
    props.filters.manufacturers.length > 0 ||
    props.filters.distributors.length > 0 ||
    props.filters.scales.length > 0 ||
    props.filters.locations.length > 0 ||
    props.filters.origins.length > 0 ||
    props.filters.categories.length > 0;

  const filterCount =
    props.filters.manufacturers.length +
    props.filters.distributors.length +
    props.filters.scales.length +
    props.filters.locations.length +
    props.filters.origins.length +
    props.filters.categories.length;

  // Mobile: Show filter button and drawer
  if (isMobile) {
    return (
      <>
        <Button
          leftIcon={<FaFilter />}
          onClick={onOpen}
          size="sm"
          variant={hasActiveFilters ? 'solid' : 'outline'}
          colorScheme={hasActiveFilters ? 'brand' : 'gray'}
        >
          Filters
          {filterCount > 0 && (
            <Badge ml={2} colorScheme="white" color="white" bg="brand.600" borderRadius="full">
              {filterCount}
            </Badge>
          )}
        </Button>

        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px">Filter Collection</DrawerHeader>
            <DrawerBody py={4}>
              <SidebarContent {...props} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
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
