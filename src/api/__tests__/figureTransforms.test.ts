/**
 * Tests for Figure API Transform Layer
 *
 * These transforms convert between frontend form data and API payload formats,
 * handling Schema v3 array fields (companyRoles, artistRoles, releases).
 */

import {
  formDataToApiPayload,
  apiResponseToFormData,
} from '../figureTransforms';
import { FigureFormData, Figure } from '../../types';

describe('formDataToApiPayload - Form to API Transform', () => {
  it('should convert basic form data to API payload', () => {
    const formData: FigureFormData = {
      manufacturer: 'Good Smile Company',
      name: 'Test Figure',
      scale: '1/7',
      location: 'Display Case A',
    };

    const result = formDataToApiPayload(formData);

    expect(result.manufacturer).toBe('Good Smile Company');
    expect(result.name).toBe('Test Figure');
    expect(result.scale).toBe('1/7');
    expect(result.location).toBe('Display Case A');
  });

  it('should convert flat release fields to releases array', () => {
    const formData: FigureFormData = {
      manufacturer: 'Test',
      name: 'Test',
      scale: '1/7',
      releaseDate: '2024-06-15',
      releasePrice: 15800,
      releaseCurrency: 'JPY',
    };

    const result = formDataToApiPayload(formData);

    expect(result.releases).toEqual([
      {
        date: '2024-06-15',
        price: 15800,
        currency: 'JPY',
        isRerelease: false,
      },
    ]);
  });

  it('should preserve releases array when provided', () => {
    const formData: FigureFormData = {
      manufacturer: 'Test',
      name: 'Test',
      scale: '1/7',
      releases: [
        { date: '2023-01-15', price: 12000, currency: 'JPY', isRerelease: false },
        { date: '2024-06-15', price: 15800, currency: 'JPY', isRerelease: true, jan: '4545784066355' },
      ],
    };

    const result = formDataToApiPayload(formData);

    expect(result.releases).toHaveLength(2);
    expect(result.releases[0].isRerelease).toBe(false);
    expect(result.releases[1].isRerelease).toBe(true);
    expect(result.releases[1].jan).toBe('4545784066355');
  });

  it('should convert companyRoles form data to API format', () => {
    const formData: FigureFormData = {
      manufacturer: 'Legacy', // Will be overwritten
      name: 'Test',
      scale: '1/7',
      companyRoles: [
        { companyId: '123', companyName: 'Good Smile Company', roleId: '1', roleName: 'Manufacturer' },
        { companyName: 'Max Factory', roleId: '2', roleName: 'Distributor' }, // No companyId
      ],
    };

    const result = formDataToApiPayload(formData);

    expect(result.companyRoles).toHaveLength(2);
    expect(result.companyRoles[0]).toEqual({
      companyId: '123',
      companyName: 'Good Smile Company',
      roleId: '1',
      roleName: 'Manufacturer',
    });
    // Manufacturer should be set from first Manufacturer role
    expect(result.manufacturer).toBe('Good Smile Company');
  });

  it('should convert artistRoles form data to API format', () => {
    const formData: FigureFormData = {
      manufacturer: 'Test',
      name: 'Test',
      scale: '1/7',
      artistRoles: [
        { artistId: '456', artistName: 'John Sculptor', roleId: '3', roleName: 'Sculptor' },
        { artistName: 'Jane Painter', roleId: '4', roleName: 'Painter' },
      ],
    };

    const result = formDataToApiPayload(formData);

    expect(result.artistRoles).toHaveLength(2);
    expect(result.artistRoles[0]).toEqual({
      artistId: '456',
      artistName: 'John Sculptor',
      roleId: '3',
      roleName: 'Sculptor',
    });
  });

  it('should convert dimensions form fields to nested object', () => {
    const formData: FigureFormData = {
      manufacturer: 'Test',
      name: 'Test',
      scale: '1/7',
      heightMm: 250,
      widthMm: 150,
      depthMm: 120,
    };

    const result = formDataToApiPayload(formData);

    expect(result.dimensions).toEqual({
      heightMm: 250,
      widthMm: 150,
      depthMm: 120,
    });
  });

  it('should convert purchase info to nested object', () => {
    const formData: FigureFormData = {
      manufacturer: 'Test',
      name: 'Test',
      scale: '1/7',
      purchaseDate: '2024-01-15',
      purchasePrice: 12000,
      purchaseCurrency: 'JPY',
      merchantName: 'AmiAmi',
      merchantUrl: 'https://amiami.com',
    };

    const result = formDataToApiPayload(formData);

    expect(result.purchaseInfo).toEqual({
      date: '2024-01-15',
      price: 12000,
      currency: 'JPY',
    });
    expect(result.merchant).toEqual({
      name: 'AmiAmi',
      url: 'https://amiami.com',
    });
  });
});

describe('apiResponseToFormData - API to Form Transform', () => {
  const baseFigure: Figure = {
    _id: '123',
    manufacturer: 'Good Smile Company',
    name: 'Test Figure',
    scale: '1/7',
    userId: 'user1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  it('should convert basic API response to form data', () => {
    const result = apiResponseToFormData(baseFigure);

    expect(result.manufacturer).toBe('Good Smile Company');
    expect(result.name).toBe('Test Figure');
    expect(result.scale).toBe('1/7');
  });

  it('should convert releases array to flat fields for first release', () => {
    const figure: Figure = {
      ...baseFigure,
      releases: [
        { date: '2024-06-15', price: 15800, currency: 'JPY', isRerelease: false },
      ],
    };

    const result = apiResponseToFormData(figure);

    expect(result.releaseDate).toBe('2024-06-15');
    expect(result.releasePrice).toBe(15800);
    expect(result.releaseCurrency).toBe('JPY');
    // Also preserve releases array
    expect(result.releases).toHaveLength(1);
  });

  it('should convert companyRoles to form data format', () => {
    const figure: Figure = {
      ...baseFigure,
      companyRoles: [
        { companyId: '123', companyName: 'Good Smile Company', roleId: '1', roleName: 'Manufacturer' },
      ],
    };

    const result = apiResponseToFormData(figure);

    expect(result.companyRoles).toHaveLength(1);
    expect(result.companyRoles![0]).toEqual({
      companyId: '123',
      companyName: 'Good Smile Company',
      roleId: '1',
      roleName: 'Manufacturer',
    });
  });

  it('should convert artistRoles to form data format', () => {
    const figure: Figure = {
      ...baseFigure,
      artistRoles: [
        { artistId: '456', artistName: 'John Sculptor', roleId: '3', roleName: 'Sculptor' },
      ],
    };

    const result = apiResponseToFormData(figure);

    expect(result.artistRoles).toHaveLength(1);
    expect(result.artistRoles![0]).toEqual({
      artistId: '456',
      artistName: 'John Sculptor',
      roleId: '3',
      roleName: 'Sculptor',
    });
  });

  it('should convert nested dimensions to flat fields', () => {
    const figure: Figure = {
      ...baseFigure,
      dimensions: {
        heightMm: 250,
        widthMm: 150,
        depthMm: 120,
      },
    };

    const result = apiResponseToFormData(figure);

    expect(result.heightMm).toBe(250);
    expect(result.widthMm).toBe(150);
    expect(result.depthMm).toBe(120);
  });

  it('should convert nested purchaseInfo and merchant to flat fields', () => {
    const figure: Figure = {
      ...baseFigure,
      purchaseInfo: {
        date: '2024-01-15',
        price: 12000,
        currency: 'JPY',
      },
      merchant: {
        name: 'AmiAmi',
        url: 'https://amiami.com',
      },
    };

    const result = apiResponseToFormData(figure);

    expect(result.purchaseDate).toBe('2024-01-15');
    expect(result.purchasePrice).toBe(12000);
    expect(result.purchaseCurrency).toBe('JPY');
    expect(result.merchantName).toBe('AmiAmi');
    expect(result.merchantUrl).toBe('https://amiami.com');
  });

  it('should handle empty/missing optional fields', () => {
    const result = apiResponseToFormData(baseFigure);

    expect(result.companyRoles).toBeUndefined();
    expect(result.artistRoles).toBeUndefined();
    expect(result.releases).toBeUndefined();
    expect(result.heightMm).toBeUndefined();
  });
});
