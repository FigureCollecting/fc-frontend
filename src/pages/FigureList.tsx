import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import {
  Steps,
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
  Icon,
  Spacer,
  useBreakpointValue,
  Portal,
} from '@chakra-ui/react';
import { FaPlus, FaSync, FaChevronDown } from 'react-icons/fa';
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
  const { open: isImportOpen, onClose: onImportClose } = useDisclosure();
  const { open: isSyncOpen, onOpen: onSyncOpen, onClose: onSyncClose } = useDisclosure();
  const { open: isCookiesOpen, onOpen: onCookiesOpen, onClose: onCookiesClose } = useDisclosure();

  // Responsive layout
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Calculate grid columns based on selected page size preset
  // Each breakpoint allows progressively more columns to honor the preset intent
  const gridColumns = useMemo(() => {
    const preset = PAGE_SIZE_PRESETS.find(p => p.value === pageSize);
    const cols = preset?.cols ?? 4;
    return {
      base: 1,
      sm: Math.min(cols, 2),
      md: Math.min(cols, 3),
      lg: Math.min(cols, 5),
      xl: Math.min(cols, 6),
      '2xl': Math.min(cols, 8),
    };
  }, [pageSize]);

  // Get the actual column count at current breakpoint for card sizing
  const currentColumns = useBreakpointValue(gridColumns) ?? gridColumns['2xl'];

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

  // Also refresh immediately when sync completes (figures + lists)
  useEffect(() => {
    if (phase === 'completed') {
      queryClient.invalidateQueries(['figures']);
      queryClient.invalidateQueries(['lists']);
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
    facetedFilters.origins.length > 0 ||
    facetedFilters.categories.length > 0 ||
    facetedFilters.sculptors.length > 0 ||
    facetedFilters.illustrators.length > 0 ||
    facetedFilters.classifications.length > 0;

  // Use pipe delimiter to avoid collision with commas in values (e.g., "Kanojo, Okarishimasu")
  const joinFilter = (arr: string[]) => arr.join('|');

  const apiFilters = hasActiveFilters
    ? {
        ...(facetedFilters.manufacturers.length > 0 && {
          manufacturer: joinFilter(facetedFilters.manufacturers),
        }),
        ...(facetedFilters.distributors.length > 0 && {
          distributor: joinFilter(facetedFilters.distributors),
        }),
        ...(facetedFilters.scales.length > 0 && {
          scale: joinFilter(facetedFilters.scales),
        }),
        ...(facetedFilters.origins.length > 0 && {
          origin: joinFilter(facetedFilters.origins),
        }),
        ...(facetedFilters.categories.length > 0 && {
          category: joinFilter(facetedFilters.categories),
        }),
        ...(facetedFilters.sculptors.length > 0 && {
          sculptor: joinFilter(facetedFilters.sculptors),
        }),
        ...(facetedFilters.illustrators.length > 0 && {
          illustrator: joinFilter(facetedFilters.illustrators),
        }),
        ...(facetedFilters.classifications.length > 0 && {
          classification: joinFilter(facetedFilters.classifications),
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
        <Spinner size="xl" color="brand.500" borderWidth="4px" />
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
        <HStack gap={3}>
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
          <Button colorPalette="brand" asChild><RouterLink to="/figures/add"><FaPlus />Add Item
                                    </RouterLink></Button>
          {/* Sync with MFC dropdown */}
          <Menu.Root>
            <Menu.Trigger asChild><Button colorPalette="purple" variant="outline"><FaSync />Sync with MFC
                            <Icon asChild><FaChevronDown /></Icon></Button></Menu.Trigger>
            <Portal><Menu.Positioner><Menu.Content>
                  <Menu.Item icon={<Icon asChild><FaSync /></Icon>} onSelect={onSyncOpen} value='item-0'>
                    Sync MFC Account
                  </Menu.Item>
                  {/* CSV import hidden until fully implemented
                  <MenuItem icon={<Icon as={FaFileImport} />} onClick={onImportOpen}>
                    Import CSV File
                  </MenuItem>
                  */}
                </Menu.Content></Menu.Positioner></Portal>
          </Menu.Root>
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

          {/* Top controls: slider, page size, card layout (above grid) */}
          {data && data.total > 0 && (
            <Pagination
              variant="top-controls"
              currentPage={page}
              totalPages={data?.pages || 1}
              onPageChange={handlePageChange}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              cardLayout={cardLayout}
              onCardLayoutChange={handleCardLayoutChange}
            />
          )}

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
              <SimpleGrid columns={gridColumns} gap={6}>
                {data?.data.map((figure) => (
                  <FigureCard key={figure._id} figure={figure} layout={cardLayout} maxImageHeight={maxCardHeight} />
                ))}
              </SimpleGrid>

              {/* Bottom navigation: page number arrows only */}
              <Pagination
                variant="page-nav"
                currentPage={page}
                totalPages={data?.pages || 1}
                onPageChange={handlePageChange}
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
