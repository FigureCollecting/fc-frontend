import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import {
  Box,
  Heading,
  SimpleGrid,
  Button,
  Flex,
  Text,
  Spinner,
  Center,
  useToast,
  useDisclosure,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Icon,
  Spacer,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FaPlus, FaFileImport, FaSync, FaChevronDown } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { getFigures, filterFigures, getFigureStats } from '../api';
import FigureCard from '../components/FigureCard';
import { FacetedFilters } from '../components/FacetedFilterSidebar';
import FacetedFilterSidebar from '../components/FacetedFilterSidebar';
import Pagination, { PAGE_SIZE_PRESETS } from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import BulkImportModal from '../components/BulkImportModal';
import MfcSyncModal from '../components/MfcSyncModal';
import MfcCookiesModal from '../components/MfcCookiesModal';
import SortControls, { SortParams } from '../components/SortControls';
import CollectionStatusTabs from '../components/CollectionStatusTabs';
import { useSyncStore } from '../stores/syncStore';
import { CollectionStatus } from '../types';
import { useFigureListState, EMPTY_FACETED_FILTERS } from '../hooks/useFigureListState';
import { useCardSize } from '../hooks/useCardSize';
import { PageSizeValue, CardLayout } from '../components/Pagination';

const FigureList: React.FC = () => {
  // URL-persisted state
  const {
    page,
    pageSize,
    cardLayout,
    facetedFilters,
    sortBy,
    sortOrder,
    activeStatus,
    setPage,
    setPageSize,
    setCardLayout,
    setFacetedFilters,
    setSort,
    setActiveStatus,
  } = useFigureListState();

  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  const { isOpen: isSyncOpen, onOpen: onSyncOpen, onClose: onSyncClose } = useDisclosure();
  const { isOpen: isCookiesOpen, onOpen: onCookiesOpen, onClose: onCookiesClose } = useDisclosure();

  // Responsive layout
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Calculate grid columns based on selected page size preset
  const gridColumns = useMemo(() => {
    const preset = PAGE_SIZE_PRESETS.find(p => p.value === pageSize);
    const cols = preset?.cols ?? 4;
    // Cap columns at 6 for lg, use preset cols for xl, but always responsive on smaller screens
    return {
      base: 1,
      sm: 2,
      md: Math.min(cols, 3),
      lg: Math.min(cols, 4),
      xl: Math.min(cols, 6),
    };
  }, [pageSize]);

  // Get the actual column count at current breakpoint for card sizing
  const currentColumns = useBreakpointValue(gridColumns) ?? gridColumns.xl;

  // Calculate viewport-aware card sizing to prevent clipping
  const { maxCardHeight } = useCardSize({
    columns: currentColumns,
    layout: cardLayout,
    hasSidebar: !isMobile,
  });

  // Subscribe to sync store for auto-refresh
  const { stats: syncStats, phase, isActive } = useSyncStore();
  const lastCompletedCountRef = useRef<number>(0);

  // Fetch stats to get status counts for tabs
  const { data: statsData, isLoading: isStatsLoading } = useQuery(
    ['figureListStats', activeStatus],
    () => getFigureStats(activeStatus)
  );

  // Auto-refresh figures when sync completes items
  useEffect(() => {
    if (!syncStats) {
      lastCompletedCountRef.current = 0;
      return;
    }

    const currentCompleted = syncStats.completed;
    const lastCompleted = lastCompletedCountRef.current;

    // Refresh when completed count increases (new items processed)
    // Use a threshold to batch refreshes (every 5 items or on completion)
    if (currentCompleted > lastCompleted) {
      const delta = currentCompleted - lastCompleted;
      const shouldRefresh = delta >= 5 || phase === 'completed' || !isActive;

      if (shouldRefresh) {
        queryClient.invalidateQueries(['figures']);
        queryClient.invalidateQueries(['figureListStats']);
        lastCompletedCountRef.current = currentCompleted;
      }
    }
  }, [syncStats, phase, isActive, queryClient]);

  // Also refresh immediately when sync completes
  useEffect(() => {
    if (phase === 'completed') {
      queryClient.invalidateQueries(['figures']);
    }
  }, [phase, queryClient]);

  const handleImportComplete = () => {
    // Invalidate the figures query to refresh the list
    queryClient.invalidateQueries(['figures']);
  };

  const handleSyncComplete = () => {
    // Invalidate the figures query to refresh the list
    queryClient.invalidateQueries(['figures']);
  };

  // Convert faceted filters to API filter format
  const hasActiveFilters =
    facetedFilters.manufacturers.length > 0 ||
    facetedFilters.distributors.length > 0 ||
    facetedFilters.scales.length > 0 ||
    facetedFilters.locations.length > 0 ||
    facetedFilters.origins.length > 0 ||
    facetedFilters.categories.length > 0;

  const apiFilters = hasActiveFilters
    ? {
        ...(facetedFilters.manufacturers.length > 0 && {
          manufacturer: facetedFilters.manufacturers.join(','),
        }),
        ...(facetedFilters.distributors.length > 0 && {
          distributor: facetedFilters.distributors.join(','),
        }),
        ...(facetedFilters.scales.length > 0 && {
          scale: facetedFilters.scales.join(','),
        }),
        ...(facetedFilters.locations.length > 0 && {
          location: facetedFilters.locations.join(','),
        }),
        ...(facetedFilters.origins.length > 0 && {
          origin: facetedFilters.origins.join(','),
        }),
        ...(facetedFilters.categories.length > 0 && {
          category: facetedFilters.categories.join(','),
        }),
      }
    : {};

  const { data, isLoading, error } = useQuery(
    ['figures', page, pageSize, facetedFilters, sortBy, sortOrder, activeStatus],
    () => hasActiveFilters
      ? filterFigures({ ...apiFilters, page, limit: pageSize, sortBy, sortOrder, status: activeStatus })
      : getFigures(page, pageSize, sortBy, sortOrder, activeStatus),
    {
      keepPreviousData: true,
      onError: (err: any) => {
        toast({
          title: 'Error',
          description: err.response?.data?.message || 'Failed to load figures',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  ) || { data: null, isLoading: false, error: null };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  }, [setPage]);

  const handlePageSizeChange = useCallback((newSize: PageSizeValue) => {
    setPageSize(newSize);
    // Page reset handled by hook
  }, [setPageSize]);

  const handleCardLayoutChange = useCallback((newLayout: CardLayout) => {
    setCardLayout(newLayout);
  }, [setCardLayout]);

  const handleFacetedFiltersChange = useCallback((newFilters: FacetedFilters) => {
    setFacetedFilters(newFilters);
    // Page reset handled by hook
  }, [setFacetedFilters]);

  const handleStatusChange = useCallback((status: CollectionStatus) => {
    setActiveStatus(status);
    // Page reset handled by hook
  }, [setActiveStatus]);

  const handleSortChange = useCallback((params: SortParams) => {
    setSort(params.sortBy, params.sortOrder);
    // Page reset handled by hook
  }, [setSort]);

  if (isLoading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Center>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Heading size="md" color="red.500" mb={4}>
          Error loading figures
        </Heading>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with title and action buttons */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Your Collectibles</Heading>
        <HStack spacing={3}>
          {/* Mobile: Filter button (shows on mobile only) */}
          {isMobile && (
            <FacetedFilterSidebar
              stats={statsData}
              filters={facetedFilters}
              onFiltersChange={handleFacetedFiltersChange}
              isLoading={isStatsLoading}
            />
          )}
          {/* Add Item button */}
          <Button
            as={RouterLink}
            to="/figures/add"
            leftIcon={<FaPlus />}
            colorScheme="brand"
          >
            Add Item
          </Button>
          {/* Sync with MFC dropdown */}
          <Menu>
            <MenuButton
              as={Button}
              leftIcon={<FaSync />}
              rightIcon={<Icon as={FaChevronDown} />}
              colorScheme="purple"
              variant="outline"
            >
              Sync with MFC
            </MenuButton>
            <MenuList>
              <MenuItem icon={<Icon as={FaSync} />} onClick={onSyncOpen}>
                Sync MFC Account
              </MenuItem>
              <MenuItem icon={<Icon as={FaFileImport} />} onClick={onImportOpen}>
                Import CSV File
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Collection Status Tabs - filter by Owned/Ordered/Wished */}
      <CollectionStatusTabs
        activeStatus={activeStatus}
        statusCounts={statsData?.statusCounts || { owned: 0, ordered: 0, wished: 0 }}
        onStatusChange={handleStatusChange}
        isLoading={isStatsLoading}
      />

      {/* Main content area with sidebar */}
      <Flex gap={6}>
        {/* Desktop: Sidebar (hidden on mobile) */}
        {!isMobile && (
          <FacetedFilterSidebar
            stats={statsData}
            filters={facetedFilters}
            onFiltersChange={handleFacetedFiltersChange}
            isLoading={isStatsLoading}
          />
        )}

        {/* Main content */}
        <Box flex="1" minW="0">
          {/* Sort controls and count */}
          <Flex mb={4} align="center" wrap="wrap" gap={4}>
            <Text color="gray.600">
              {isLoading ? 'Loading...' : `Showing ${data?.data?.length || 0} of ${data?.total || 0} items`}
            </Text>
            <Spacer />
            <SortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
            />
          </Flex>

          {/* Figure grid or empty state */}
          {data?.total === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                type="filter"
                onClearFilters={() => handleFacetedFiltersChange(EMPTY_FACETED_FILTERS)}
              />
            ) : (
              <EmptyState type="collection" />
            )
          ) : (
            <>
              <SimpleGrid columns={gridColumns} spacing={6}>
                {data?.data.map((figure) => (
                  <FigureCard key={figure._id} figure={figure} layout={cardLayout} maxImageHeight={maxCardHeight} />
                ))}
              </SimpleGrid>

              <Pagination
                currentPage={page}
                totalPages={data?.pages || 1}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                cardLayout={cardLayout}
                onCardLayoutChange={handleCardLayoutChange}
              />
            </>
          )}
        </Box>
      </Flex>

      {/* Modals */}
      <BulkImportModal
        isOpen={isImportOpen}
        onClose={onImportClose}
        onImportComplete={handleImportComplete}
      />

      <MfcSyncModal
        isOpen={isSyncOpen}
        onClose={onSyncClose}
        onSyncComplete={handleSyncComplete}
        onOpenCookiesModal={onCookiesOpen}
      />

      <MfcCookiesModal
        isOpen={isCookiesOpen}
        onClose={onCookiesClose}
        onCookiesChanged={() => {
          // Cookies were updated - if sync modal was open, it will re-check on reopen
        }}
      />
    </Box>
  );
};

export default FigureList;
