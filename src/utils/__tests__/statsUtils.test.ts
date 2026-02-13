/**
 * Tests for Schema v3 Stats Merging
 *
 * The mergeManufacturerStats function combines legacy manufacturerStats with
 * Schema v3 v3ManufacturerStats to provide a unified manufacturer dropdown.
 */

import {
  mergeManufacturerStats,
  StatEntry,
  getDisplayCompanyName,
  getDisplayCompanies,
  getDisplayArtists,
} from '../statsUtils';
import { ICompanyRole, IArtistRole } from '../../types';

describe('mergeManufacturerStats - Schema v3 Stats Merging', () => {
  it('should return manufacturerStats when v3ManufacturerStats is empty', () => {
    const manufacturerStats: StatEntry[] = [
      { _id: 'Good Smile Company', count: 5 },
      { _id: 'Max Factory', count: 3 },
    ];
    const v3ManufacturerStats: StatEntry[] = [];

    const result = mergeManufacturerStats(manufacturerStats, v3ManufacturerStats);

    expect(result).toEqual([
      { _id: 'Good Smile Company', count: 5 },
      { _id: 'Max Factory', count: 3 },
    ]);
  });

  it('should return v3ManufacturerStats when manufacturerStats is empty', () => {
    const manufacturerStats: StatEntry[] = [];
    const v3ManufacturerStats: StatEntry[] = [
      { _id: 'Good Smile Company', count: 5 },
      { _id: 'Phat Company', count: 2 },
    ];

    const result = mergeManufacturerStats(manufacturerStats, v3ManufacturerStats);

    expect(result).toEqual([
      { _id: 'Good Smile Company', count: 5 },
      { _id: 'Phat Company', count: 2 },
    ]);
  });

  it('should prefer v3ManufacturerStats over manufacturerStats when same company name exists', () => {
    const manufacturerStats: StatEntry[] = [
      { _id: 'Good Smile Company', count: 5 }, // Legacy count
      { _id: 'Max Factory', count: 3 },
    ];
    const v3ManufacturerStats: StatEntry[] = [
      { _id: 'Good Smile Company', count: 8 }, // v3 count
    ];

    const result = mergeManufacturerStats(manufacturerStats, v3ManufacturerStats);

    // Should use v3 data for Good Smile, keep legacy for Max Factory
    expect(result).toEqual([
      { _id: 'Good Smile Company', count: 8 },
      { _id: 'Max Factory', count: 3 },
    ]);
  });

  it('should filter out empty/null manufacturer entries', () => {
    const manufacturerStats: StatEntry[] = [
      { _id: '', count: 12 }, // Empty manufacturer (the "unknown" issue)
      { _id: 'Good Smile Company', count: 5 },
    ];
    const v3ManufacturerStats: StatEntry[] = [
      { _id: 'Kadokawa', count: 12 }, // v3 data
    ];

    const result = mergeManufacturerStats(manufacturerStats, v3ManufacturerStats);

    // Should filter out empty manufacturer, include v3 data
    expect(result).not.toContainEqual(expect.objectContaining({ _id: '' }));
    expect(result).toContainEqual({ _id: 'Good Smile Company', count: 5 });
    expect(result).toContainEqual({ _id: 'Kadokawa', count: 12 });
  });

  it('should sort merged results by count descending', () => {
    const manufacturerStats: StatEntry[] = [
      { _id: 'Small Co', count: 1 },
      { _id: 'Medium Co', count: 5 },
    ];
    const v3ManufacturerStats: StatEntry[] = [
      { _id: 'Big Co', count: 10 },
    ];

    const result = mergeManufacturerStats(manufacturerStats, v3ManufacturerStats);

    expect(result[0]._id).toBe('Big Co');
    expect(result[1]._id).toBe('Medium Co');
    expect(result[2]._id).toBe('Small Co');
  });

  it('should handle null/undefined inputs gracefully', () => {
    expect(mergeManufacturerStats(undefined, undefined)).toEqual([]);
    expect(mergeManufacturerStats(null as any, null as any)).toEqual([]);
    expect(mergeManufacturerStats([], undefined)).toEqual([]);
    expect(mergeManufacturerStats(undefined, [])).toEqual([]);
  });

  it('should filter out null _id entries', () => {
    const manufacturerStats: StatEntry[] = [
      { _id: null as any, count: 3 },
      { _id: 'Valid Co', count: 5 },
    ];
    const v3ManufacturerStats: StatEntry[] = [];

    const result = mergeManufacturerStats(manufacturerStats, v3ManufacturerStats);

    expect(result).toEqual([{ _id: 'Valid Co', count: 5 }]);
  });
});

describe('getDisplayCompanyName - Schema v3 Display Helper', () => {
  it('should return manufacturer when no companyRoles', () => {
    expect(getDisplayCompanyName(undefined, 'Good Smile Company')).toBe('Good Smile Company');
    expect(getDisplayCompanyName([], 'Max Factory')).toBe('Max Factory');
  });

  it('should return empty string when neither exists', () => {
    expect(getDisplayCompanyName(undefined, undefined)).toBe('');
    expect(getDisplayCompanyName([], '')).toBe('');
  });

  it('should prefer Manufacturer role from companyRoles', () => {
    const companyRoles: ICompanyRole[] = [
      { companyId: '1', companyName: 'Phat Company', roleId: '2', roleName: 'Distributor' },
      { companyId: '2', companyName: 'Good Smile Company', roleId: '1', roleName: 'Manufacturer' },
    ];

    expect(getDisplayCompanyName(companyRoles, 'Old Manufacturer')).toBe('Good Smile Company');
  });

  it('should fall back to first company if no Manufacturer role', () => {
    const companyRoles: ICompanyRole[] = [
      { companyId: '1', companyName: 'Phat Company', roleId: '2', roleName: 'Distributor' },
      { companyId: '2', companyName: 'Kadokawa', roleId: '3', roleName: 'Publisher' },
    ];

    expect(getDisplayCompanyName(companyRoles, 'Legacy')).toBe('Phat Company');
  });

  it('should skip entries without companyName', () => {
    const companyRoles: ICompanyRole[] = [
      { companyId: '1', roleId: '1' }, // No companyName
      { companyId: '2', companyName: 'Good Smile Company', roleId: '1', roleName: 'Manufacturer' },
    ];

    expect(getDisplayCompanyName(companyRoles, 'Fallback')).toBe('Good Smile Company');
  });
});

describe('getDisplayCompanies - Schema v3 Display Helper', () => {
  it('should return all companies from companyRoles', () => {
    const companyRoles: ICompanyRole[] = [
      { companyId: '1', companyName: 'Good Smile Company', roleId: '1', roleName: 'Manufacturer' },
      { companyId: '2', companyName: 'Max Factory', roleId: '2', roleName: 'Distributor' },
    ];

    const result = getDisplayCompanies(companyRoles);

    expect(result).toEqual([
      { name: 'Good Smile Company', role: 'Manufacturer' },
      { name: 'Max Factory', role: 'Distributor' },
    ]);
  });

  it('should fall back to manufacturer when no companyRoles', () => {
    expect(getDisplayCompanies(undefined, 'Legacy Manufacturer')).toEqual([
      { name: 'Legacy Manufacturer' },
    ]);
    expect(getDisplayCompanies([], 'Legacy')).toEqual([{ name: 'Legacy' }]);
  });

  it('should return empty array when nothing exists', () => {
    expect(getDisplayCompanies(undefined, undefined)).toEqual([]);
    expect(getDisplayCompanies([], '')).toEqual([]);
  });

  it('should filter out entries without companyName', () => {
    const companyRoles: ICompanyRole[] = [
      { companyId: '1', companyName: 'Good Smile Company', roleId: '1', roleName: 'Manufacturer' },
      { companyId: '2', roleId: '2', roleName: 'Distributor' }, // No name
    ];

    const result = getDisplayCompanies(companyRoles);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Good Smile Company');
  });
});

describe('getDisplayArtists - Schema v3 Display Helper', () => {
  it('should return all artists from artistRoles', () => {
    const artistRoles: IArtistRole[] = [
      { artistId: '1', artistName: 'John Sculptor', roleId: '1', roleName: 'Sculptor' },
      { artistId: '2', artistName: 'Jane Painter', roleId: '2', roleName: 'Painter' },
    ];

    const result = getDisplayArtists(artistRoles);

    expect(result).toEqual([
      { name: 'John Sculptor', role: 'Sculptor' },
      { name: 'Jane Painter', role: 'Painter' },
    ]);
  });

  it('should return empty array when no artistRoles', () => {
    expect(getDisplayArtists(undefined)).toEqual([]);
    expect(getDisplayArtists([])).toEqual([]);
  });

  it('should filter out entries without artistName', () => {
    const artistRoles: IArtistRole[] = [
      { artistId: '1', artistName: 'John Sculptor', roleId: '1', roleName: 'Sculptor' },
      { artistId: '2', roleId: '2', roleName: 'Painter' }, // No name
    ];

    const result = getDisplayArtists(artistRoles);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('John Sculptor');
  });
});
