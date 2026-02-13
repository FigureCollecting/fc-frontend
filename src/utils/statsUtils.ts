/**
 * Stats Utility Functions for Schema v3
 *
 * Provides helper functions for merging legacy manufacturerStats
 * with Schema v3 v3ManufacturerStats from the companyRoles array.
 */

import { ICompanyRole, IArtistRole } from '../types';

export interface StatEntry {
  _id: string;
  count: number;
  roleName?: string;
}

export interface CompanyStatEntry {
  _id: string;
  count: number;
  roleName?: string;
}

export type MergedStatEntry = StatEntry | CompanyStatEntry;

/**
 * Merges legacy manufacturerStats with Schema v3 v3ManufacturerStats.
 *
 * Priority rules:
 * 1. When same company exists in both, prefer v3ManufacturerStats (from companyRoles)
 * 2. Filter out empty/null manufacturer entries
 * 3. Deduplicate entries with same company name
 * 4. Sort by count descending
 *
 * @param manufacturerStats Legacy manufacturer stats (from Figure.manufacturer field)
 * @param v3ManufacturerStats Schema v3 manufacturer stats (from Figure.companyRoles where roleName='Manufacturer')
 * @returns Merged, deduplicated, sorted array of stats
 */
export function mergeManufacturerStats(
  manufacturerStats?: StatEntry[] | null,
  v3ManufacturerStats?: StatEntry[] | null
): StatEntry[] {
  // Handle null/undefined inputs
  const legacyStats = manufacturerStats ?? [];
  const v3Stats = v3ManufacturerStats ?? [];

  // If both empty, return empty array
  if (legacyStats.length === 0 && v3Stats.length === 0) {
    return [];
  }

  // If only legacy stats, filter and return
  if (v3Stats.length === 0) {
    return legacyStats
      .filter(s => s._id != null && s._id !== '')
      .sort((a, b) => b.count - a.count);
  }

  // If only v3 stats, filter and return
  if (legacyStats.length === 0) {
    return v3Stats
      .filter(s => s._id != null && s._id !== '')
      .sort((a, b) => b.count - a.count);
  }

  // Merge both: v3 stats takes precedence
  const companyNameMap = new Map<string, StatEntry>();

  // First, add all v3 stats (from companyRoles, preferred)
  for (const v3 of v3Stats) {
    if (v3._id == null || v3._id === '') continue;
    companyNameMap.set(v3._id, { ...v3 });
  }

  // Then, add legacy stats that aren't already in v3 stats
  for (const legacy of legacyStats) {
    if (legacy._id == null || legacy._id === '') continue;

    if (!companyNameMap.has(legacy._id)) {
      companyNameMap.set(legacy._id, { ...legacy });
    }
    // If company already exists from v3 stats, skip (prefer v3 data)
  }

  // Convert to array and sort by count descending
  return Array.from(companyNameMap.values()).sort((a, b) => b.count - a.count);
}

/**
 * Gets the primary company name for display.
 * Prefers companyRoles (v3) over manufacturer (legacy).
 *
 * @param companyRoles Schema v3 company roles array
 * @param manufacturer Legacy manufacturer string
 * @returns Company name for display, or empty string if none
 */
export function getDisplayCompanyName(
  companyRoles?: ICompanyRole[],
  manufacturer?: string
): string {
  // Prefer v3 companyRoles if available
  if (companyRoles && companyRoles.length > 0) {
    // Find the Manufacturer role first, fall back to first company
    const manufacturerRole = companyRoles.find(cr => cr.roleName === 'Manufacturer');
    if (manufacturerRole?.companyName) {
      return manufacturerRole.companyName;
    }
    // Fall back to first company with a name
    const firstWithName = companyRoles.find(cr => cr.companyName);
    if (firstWithName?.companyName) {
      return firstWithName.companyName;
    }
  }

  // Fall back to legacy manufacturer
  return manufacturer || '';
}

/**
 * Gets all companies with their roles for detailed display.
 *
 * @param companyRoles Schema v3 company roles array
 * @param manufacturer Legacy manufacturer string (used if no v3 data)
 * @returns Array of {name, role} objects for display
 */
export function getDisplayCompanies(
  companyRoles?: ICompanyRole[],
  manufacturer?: string
): Array<{ name: string; role?: string }> {
  if (companyRoles && companyRoles.length > 0) {
    return companyRoles
      .filter(cr => cr.companyName)
      .map(cr => ({
        name: cr.companyName!,
        role: cr.roleName,
      }));
  }

  // Fall back to legacy manufacturer
  if (manufacturer) {
    return [{ name: manufacturer }];
  }

  return [];
}

/**
 * Gets all artists with their roles for display.
 *
 * @param artistRoles Schema v3 artist roles array
 * @returns Array of {name, role} objects for display
 */
export function getDisplayArtists(
  artistRoles?: IArtistRole[]
): Array<{ name: string; role?: string }> {
  if (!artistRoles || artistRoles.length === 0) {
    return [];
  }

  return artistRoles
    .filter(ar => ar.artistName)
    .map(ar => ({
      name: ar.artistName!,
      role: ar.roleName,
    }));
}
