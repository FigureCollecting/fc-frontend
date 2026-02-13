/**
 * Lookup Data Hook
 *
 * Fetches role types, companies, and artists for form autocomplete.
 * Uses React Query for caching and deduplication.
 */

import { useQuery } from 'react-query';
import { useAuthStore } from '../stores/authStore';

interface RoleType {
  _id: string;
  name: string;
  kind: 'company' | 'artist';
}

interface Company {
  _id: string;
  name: string;
  subType?: { _id: string; name: string; kind: string };
}

interface Artist {
  _id: string;
  name: string;
}

interface UseLookupDataResult {
  roleTypes: RoleType[];
  companies: Company[];
  artists: Artist[];
  isLoading: boolean;
  isError: boolean;
}

const API_BASE = '/api';

async function fetchWithAuth<T>(url: string, token: string | null): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

export function useLookupData(): UseLookupDataResult {
  const user = useAuthStore((state) => state.user);
  const token = user?.token || null;

  // react-query v3 API: useQuery(key, fetcher, options)
  const roleTypesQuery = useQuery(
    ['lookup', 'role-types'],
    () => fetchWithAuth<RoleType[]>(`${API_BASE}/lookup/role-types`, token),
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      enabled: !!token,
    }
  );

  const companiesQuery = useQuery(
    ['lookup', 'companies'],
    () => fetchWithAuth<Company[]>(`${API_BASE}/lookup/companies`, token),
    {
      staleTime: 5 * 60 * 1000,
      enabled: !!token,
    }
  );

  const artistsQuery = useQuery(
    ['lookup', 'artists'],
    () => fetchWithAuth<Artist[]>(`${API_BASE}/lookup/artists`, token),
    {
      staleTime: 5 * 60 * 1000,
      enabled: !!token,
    }
  );

  return {
    roleTypes: roleTypesQuery.data || [],
    companies: companiesQuery.data || [],
    artists: artistsQuery.data || [],
    isLoading: roleTypesQuery.isLoading || companiesQuery.isLoading || artistsQuery.isLoading,
    isError: roleTypesQuery.isError || companiesQuery.isError || artistsQuery.isError,
  };
}
