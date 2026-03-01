/**
 * Tests for useFigureListState hook
 */
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useFigureListState, EMPTY_FACETED_FILTERS } from '../useFigureListState';

// Wrapper that provides router context
function createWrapper(initialEntries: string[] = ['/']) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries }, children);
}

describe('useFigureListState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('default state', () => {
    it('should return default values when no URL params', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.page).toBe(1);
      expect(result.current.sortBy).toBe('activity');
      expect(result.current.sortOrder).toBe('asc');
      expect(result.current.activeStatus).toBe('owned');
      expect(result.current.facetedFilters).toEqual(EMPTY_FACETED_FILTERS);
    });
  });

  describe('URL parameter parsing', () => {
    it('should parse page from URL', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?page=3']),
      });

      expect(result.current.page).toBe(3);
    });

    it('should parse status from URL', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?status=wished']),
      });

      expect(result.current.activeStatus).toBe('wished');
    });

    it('should parse sort from URL', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?sort=name&order=asc']),
      });

      expect(result.current.sortBy).toBe('name');
      expect(result.current.sortOrder).toBe('asc');
    });

    it('should parse faceted filters from URL', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?mfr=GSC|ALTER&scale=1/7']),
      });

      expect(result.current.facetedFilters.manufacturers).toEqual(['GSC', 'ALTER']);
      expect(result.current.facetedFilters.scales).toEqual(['1/7']);
    });

    it('should handle invalid page gracefully', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?page=invalid']),
      });

      expect(result.current.page).toBe(1);
    });

    it('should handle invalid status gracefully', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?status=invalid']),
      });

      expect(result.current.activeStatus).toBe('owned');
    });

    it('should handle invalid sort field gracefully', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?sort=invalid']),
      });

      expect(result.current.sortBy).toBe('activity');
    });

    it('should handle invalid layout gracefully', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?layout=invalid']),
      });

      // Should fall back to default
      expect(result.current.cardLayout).toBeTruthy();
    });

    it('should parse origin and category filters', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?origin=Fate&cat=Scale']),
      });

      expect(result.current.facetedFilters.origins).toEqual(['Fate']);
      expect(result.current.facetedFilters.categories).toEqual(['Scale']);
    });

    it('should parse distributor filters', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?dist=AmiAmi|Solaris']),
      });

      expect(result.current.facetedFilters.distributors).toEqual(['AmiAmi', 'Solaris']);
    });
  });

  describe('actions', () => {
    it('should set page', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.page).toBe(5);
    });

    it('should set active status', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setActiveStatus('wished');
      });

      expect(result.current.activeStatus).toBe('wished');
    });

    it('should reset page when changing status', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?page=3']),
      });

      act(() => {
        result.current.setActiveStatus('ordered');
      });

      expect(result.current.page).toBe(1);
    });

    it('should set sort', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSort('name', 'asc');
      });

      expect(result.current.sortBy).toBe('name');
      expect(result.current.sortOrder).toBe('asc');
    });

    it('should set sortBy independently', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSortBy('updatedAt');
      });

      expect(result.current.sortBy).toBe('updatedAt');
    });

    it('should set sortOrder independently', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSortOrder('asc');
      });

      expect(result.current.sortOrder).toBe('asc');
    });

    it('should set page size', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setPageSize(24);
      });

      expect(result.current.pageSize).toBe(24);
    });

    it('should set card layout', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setCardLayout('text-left');
      });

      expect(result.current.cardLayout).toBe('text-left');
    });

    it('should set faceted filters', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setFacetedFilters({
          manufacturers: ['GSC'],
          distributors: [],
          scales: ['1/7'],
          origins: ['Fate'],
          categories: [],
          sculptors: [],
          illustrators: [],
          classifications: [],
        });
      });

      expect(result.current.facetedFilters.manufacturers).toEqual(['GSC']);
      expect(result.current.facetedFilters.scales).toEqual(['1/7']);
      expect(result.current.facetedFilters.origins).toEqual(['Fate']);
    });

    it('should clear filters', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?mfr=GSC&scale=1/7']),
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.facetedFilters).toEqual(EMPTY_FACETED_FILTERS);
    });
  });

  describe('localStorage persistence', () => {
    it('should persist page size via URL params and localStorage', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(),
      });

      // Default page size is 12
      expect(result.current.pageSize).toBe(12);

      act(() => {
        result.current.setPageSize(24);
      });

      // After setting, URL param drives the state
      expect(result.current.pageSize).toBe(24);
    });

    it('should persist card layout via URL params', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setCardLayout('image-only');
      });

      expect(result.current.cardLayout).toBe('image-only');
    });

    it('should use URL param for page size over default', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?size=36']),
      });

      expect(result.current.pageSize).toBe(36);
    });

    it('should use URL param for card layout over default', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?layout=text-left']),
      });

      expect(result.current.cardLayout).toBe('text-left');
    });

    it('should fall back to default for invalid page size in URL', () => {
      const { result } = renderHook(() => useFigureListState(), {
        wrapper: createWrapper(['/?size=999']),
      });

      expect(result.current.pageSize).toBe(12);
    });
  });

  describe('EMPTY_FACETED_FILTERS', () => {
    it('should have all filter arrays empty', () => {
      expect(EMPTY_FACETED_FILTERS.manufacturers).toEqual([]);
      expect(EMPTY_FACETED_FILTERS.distributors).toEqual([]);
      expect(EMPTY_FACETED_FILTERS.scales).toEqual([]);
      expect(EMPTY_FACETED_FILTERS.origins).toEqual([]);
      expect(EMPTY_FACETED_FILTERS.categories).toEqual([]);
      expect(EMPTY_FACETED_FILTERS.sculptors).toEqual([]);
      expect(EMPTY_FACETED_FILTERS.illustrators).toEqual([]);
      expect(EMPTY_FACETED_FILTERS.classifications).toEqual([]);
    });
  });
});
