/**
 * useFigureListState Hook
 *
 * Manages FigureList state with URL search parameter persistence.
 * This ensures state survives navigation (back button, links, etc.)
 * and makes URLs shareable/bookmarkable.
 *
 * URL Parameters:
 * - status: Collection status tab (owned, ordered, wished)
 * - page: Current page number
 * - size: Page size (items per page)
 * - layout: Card layout (text-bottom, text-left, image-only)
 * - sort: Sort field
 * - order: Sort direction (asc, desc)
 * - mfr: Manufacturer filters (comma-separated)
 * - dist: Distributor filters (comma-separated)
 * - scale: Scale filters (comma-separated)
 * - loc: Location filters (comma-separated)
 * - origin: Origin filters (comma-separated)
 * - cat: Category filters (comma-separated)
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CollectionStatus } from '../types';
import { FacetedFilters } from '../components/FacetedFilterSidebar';
import { PageSizeValue, DEFAULT_PAGE_SIZE, PAGE_SIZE_PRESETS, CardLayout, DEFAULT_CARD_LAYOUT } from '../components/Pagination';
import { SortField, SortDirection } from '../components/SortControls';

const EMPTY_FACETED_FILTERS: FacetedFilters = {
  manufacturers: [],
  distributors: [],
  scales: [],
  locations: [],
  origins: [],
  categories: [],
};

// Valid values for type checking
const VALID_STATUSES: CollectionStatus[] = ['owned', 'ordered', 'wished'];
const VALID_LAYOUTS: CardLayout[] = ['text-bottom', 'text-left', 'image-only'];
const VALID_SORT_FIELDS: SortField[] = ['createdAt', 'name', 'manufacturer', 'scale', 'price'];
const VALID_SORT_ORDERS: SortDirection[] = ['asc', 'desc'];
const VALID_PAGE_SIZES = PAGE_SIZE_PRESETS.map(p => p.value);

// localStorage keys for persisting user preferences across fresh navigations
const LS_PAGE_SIZE_KEY = 'fc-figureList-pageSize';
const LS_CARD_LAYOUT_KEY = 'fc-figureList-cardLayout';

function getStoredPageSize(): PageSizeValue | null {
  try {
    const stored = localStorage.getItem(LS_PAGE_SIZE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (VALID_PAGE_SIZES.includes(parsed as PageSizeValue)) {
        return parsed as PageSizeValue;
      }
    }
  } catch { /* localStorage unavailable */ }
  return null;
}

function getStoredCardLayout(): CardLayout | null {
  try {
    const stored = localStorage.getItem(LS_CARD_LAYOUT_KEY) as CardLayout;
    if (stored && VALID_LAYOUTS.includes(stored)) {
      return stored;
    }
  } catch { /* localStorage unavailable */ }
  return null;
}

interface FigureListState {
  // Pagination
  page: number;
  pageSize: PageSizeValue;
  // Layout
  cardLayout: CardLayout;
  // Sorting
  sortBy: SortField;
  sortOrder: SortDirection;
  // Filters
  activeStatus: CollectionStatus;
  facetedFilters: FacetedFilters;
}

interface FigureListActions {
  setPage: (page: number) => void;
  setPageSize: (size: PageSizeValue) => void;
  setCardLayout: (layout: CardLayout) => void;
  setSortBy: (field: SortField) => void;
  setSortOrder: (order: SortDirection) => void;
  setActiveStatus: (status: CollectionStatus) => void;
  setFacetedFilters: (filters: FacetedFilters) => void;
  // Combined setters for convenience
  setSort: (field: SortField, order: SortDirection) => void;
  clearFilters: () => void;
}

export function useFigureListState(): FigureListState & FigureListActions {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse state from URL with defaults
  const state = useMemo((): FigureListState => {
    // Parse page
    const pageParam = searchParams.get('page');
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

    // Parse page size — URL param > localStorage > default
    const sizeParam = searchParams.get('size');
    const parsedSize = sizeParam ? parseInt(sizeParam, 10) : null;
    const pageSize = parsedSize !== null && VALID_PAGE_SIZES.includes(parsedSize as PageSizeValue)
      ? (parsedSize as PageSizeValue)
      : (getStoredPageSize() ?? DEFAULT_PAGE_SIZE);

    // Parse card layout — URL param > localStorage > default
    const layoutParam = searchParams.get('layout') as CardLayout;
    const cardLayout = VALID_LAYOUTS.includes(layoutParam)
      ? layoutParam
      : (getStoredCardLayout() ?? DEFAULT_CARD_LAYOUT);

    // Parse sort
    const sortParam = searchParams.get('sort') as SortField;
    const sortBy = VALID_SORT_FIELDS.includes(sortParam) ? sortParam : 'createdAt';

    const orderParam = searchParams.get('order') as SortDirection;
    const sortOrder = VALID_SORT_ORDERS.includes(orderParam) ? orderParam : 'desc';

    // Parse status
    const statusParam = searchParams.get('status') as CollectionStatus;
    const activeStatus = VALID_STATUSES.includes(statusParam) ? statusParam : 'owned';

    // Parse faceted filters (comma-separated lists)
    const parseFilterList = (key: string): string[] => {
      const value = searchParams.get(key);
      return value ? value.split(',').filter(Boolean) : [];
    };

    const facetedFilters: FacetedFilters = {
      manufacturers: parseFilterList('mfr'),
      distributors: parseFilterList('dist'),
      scales: parseFilterList('scale'),
      locations: parseFilterList('loc'),
      origins: parseFilterList('origin'),
      categories: parseFilterList('cat'),
    };

    return {
      page,
      pageSize,
      cardLayout,
      sortBy,
      sortOrder,
      activeStatus,
      facetedFilters,
    };
  }, [searchParams]);

  // Helper to update URL params while preserving others
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      return next;
    }, { replace: true }); // Use replace to avoid polluting browser history
  }, [setSearchParams]);

  // Actions
  const setPage = useCallback((page: number) => {
    updateParams({ page: page === 1 ? null : String(page) });
  }, [updateParams]);

  const setPageSize = useCallback((size: PageSizeValue) => {
    try { localStorage.setItem(LS_PAGE_SIZE_KEY, String(size)); } catch { /* noop */ }
    updateParams({
      size: size === DEFAULT_PAGE_SIZE ? null : String(size),
      page: null, // Reset to page 1 when changing page size
    });
  }, [updateParams]);

  const setCardLayout = useCallback((layout: CardLayout) => {
    try { localStorage.setItem(LS_CARD_LAYOUT_KEY, layout); } catch { /* noop */ }
    updateParams({ layout: layout === DEFAULT_CARD_LAYOUT ? null : layout });
  }, [updateParams]);

  const setSortBy = useCallback((field: SortField) => {
    updateParams({
      sort: field === 'createdAt' ? null : field,
      page: null, // Reset to page 1 when changing sort
    });
  }, [updateParams]);

  const setSortOrder = useCallback((order: SortDirection) => {
    updateParams({
      order: order === 'desc' ? null : order,
      page: null, // Reset to page 1 when changing sort
    });
  }, [updateParams]);

  const setSort = useCallback((field: SortField, order: SortDirection) => {
    updateParams({
      sort: field === 'createdAt' ? null : field,
      order: order === 'desc' ? null : order,
      page: null,
    });
  }, [updateParams]);

  const setActiveStatus = useCallback((status: CollectionStatus) => {
    updateParams({
      status: status === 'owned' ? null : status,
      page: null, // Reset to page 1 when changing status
    });
  }, [updateParams]);

  const setFacetedFilters = useCallback((filters: FacetedFilters) => {
    const serializeFilter = (arr: string[]): string | null =>
      arr.length > 0 ? arr.join(',') : null;

    updateParams({
      mfr: serializeFilter(filters.manufacturers),
      dist: serializeFilter(filters.distributors),
      scale: serializeFilter(filters.scales),
      loc: serializeFilter(filters.locations),
      origin: serializeFilter(filters.origins),
      cat: serializeFilter(filters.categories),
      page: null, // Reset to page 1 when changing filters
    });
  }, [updateParams]);

  const clearFilters = useCallback(() => {
    updateParams({
      mfr: null,
      dist: null,
      scale: null,
      loc: null,
      origin: null,
      cat: null,
      page: null,
    });
  }, [updateParams]);

  return {
    ...state,
    setPage,
    setPageSize,
    setCardLayout,
    setSortBy,
    setSortOrder,
    setSort,
    setActiveStatus,
    setFacetedFilters,
    clearFilters,
  };
}

export { EMPTY_FACETED_FILTERS };
