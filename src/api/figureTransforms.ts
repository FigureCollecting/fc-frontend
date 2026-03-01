/**
 * Figure API Transform Layer
 *
 * Converts between frontend form data and API payload formats,
 * handling Schema v3 array fields (companyRoles, artistRoles, releases).
 */

import {
  FigureFormData,
  Figure,
  ICompanyRoleFormData,
  IArtistRoleFormData,
  IReleaseFormData,
  IRelease,
  IDimensions,
  IPurchaseInfo,
  IMerchant,
  ICompanyRole,
  IArtistRole,
} from '../types';

/**
 * Company role for API payload - allows optional IDs for new entries.
 */
interface CompanyRolePayload {
  companyId?: string;
  companyName: string;
  roleId: string;
  roleName?: string;
}

/**
 * Artist role for API payload - allows optional IDs for new entries.
 */
interface ArtistRolePayload {
  artistId?: string;
  artistName: string;
  roleId: string;
  roleName?: string;
}

/**
 * API payload structure for creating/updating figures.
 * This includes nested objects that the API expects.
 */
export interface FigureApiPayload {
  manufacturer: string;
  name: string;
  scale: string;
  mfcLink?: string;
  storageDetail?: string;
  imageUrl?: string;
  mfcId?: number;
  jan?: string;
  releases?: IRelease[];
  dimensions?: IDimensions;
  companyRoles?: CompanyRolePayload[];
  artistRoles?: ArtistRolePayload[];
  collectionStatus?: string;
  purchaseInfo?: IPurchaseInfo;
  merchant?: IMerchant;
  rating?: number;
  wishRating?: number;
  quantity?: number;
  note?: string;
  figureCondition?: string;
  figureConditionNotes?: string;
  boxCondition?: string;
  boxConditionNotes?: string;
}

/**
 * Converts frontend form data to API payload format.
 *
 * Handles:
 * - Flat release fields → releases array
 * - companyRoles/artistRoles with proper formatting
 * - Flat dimension fields → dimensions object
 * - Flat purchase fields → purchaseInfo + merchant objects
 */
export function formDataToApiPayload(formData: FigureFormData): FigureApiPayload {
  const payload: FigureApiPayload = {
    manufacturer: formData.manufacturer,
    name: formData.name,
    scale: formData.scale,
  };

  // Copy optional string fields
  if (formData.mfcLink) payload.mfcLink = formData.mfcLink;
  if (formData.storageDetail) payload.storageDetail = formData.storageDetail;
  if (formData.imageUrl) payload.imageUrl = formData.imageUrl;
  if (formData.jan) payload.jan = formData.jan;
  if (formData.note) payload.note = formData.note;
  if (formData.figureConditionNotes) payload.figureConditionNotes = formData.figureConditionNotes;
  if (formData.boxConditionNotes) payload.boxConditionNotes = formData.boxConditionNotes;

  // Copy optional numeric fields
  if (formData.mfcId !== undefined) payload.mfcId = formData.mfcId;
  if (formData.rating !== undefined) payload.rating = formData.rating;
  if (formData.wishRating !== undefined) payload.wishRating = formData.wishRating;
  if (formData.quantity !== undefined) payload.quantity = formData.quantity;

  // Copy optional enum fields
  if (formData.collectionStatus) payload.collectionStatus = formData.collectionStatus;
  if (formData.figureCondition) payload.figureCondition = formData.figureCondition;
  if (formData.boxCondition) payload.boxCondition = formData.boxCondition;

  // Handle releases: prefer array, fall back to flat fields
  if (formData.releases && formData.releases.length > 0) {
    payload.releases = formData.releases.map(r => ({
      date: r.date,
      price: r.price,
      currency: r.currency,
      jan: r.jan,
      isRerelease: r.isRerelease ?? false,
      variant: r.variant,
    }));
  } else if (formData.releaseDate || formData.releasePrice || formData.releaseCurrency) {
    payload.releases = [
      {
        date: formData.releaseDate,
        price: formData.releasePrice,
        currency: formData.releaseCurrency,
        isRerelease: false,
      },
    ];
  }

  // Handle dimensions
  if (formData.heightMm || formData.widthMm || formData.depthMm) {
    payload.dimensions = {};
    if (formData.heightMm) payload.dimensions.heightMm = formData.heightMm;
    if (formData.widthMm) payload.dimensions.widthMm = formData.widthMm;
    if (formData.depthMm) payload.dimensions.depthMm = formData.depthMm;
  }

  // Handle companyRoles
  if (formData.companyRoles && formData.companyRoles.length > 0) {
    payload.companyRoles = formData.companyRoles.map(cr => ({
      companyId: cr.companyId,
      companyName: cr.companyName,
      roleId: cr.roleId,
      roleName: cr.roleName,
    }));

    // Set manufacturer from first Manufacturer role for backward compatibility
    const manufacturerRole = formData.companyRoles.find(cr => cr.roleName === 'Manufacturer');
    if (manufacturerRole?.companyName) {
      payload.manufacturer = manufacturerRole.companyName;
    }
  }

  // Handle artistRoles
  if (formData.artistRoles && formData.artistRoles.length > 0) {
    payload.artistRoles = formData.artistRoles.map(ar => ({
      artistId: ar.artistId,
      artistName: ar.artistName,
      roleId: ar.roleId,
      roleName: ar.roleName,
    }));
  }

  // Handle purchase info
  if (formData.purchaseDate || formData.purchasePrice || formData.purchaseCurrency) {
    payload.purchaseInfo = {};
    if (formData.purchaseDate) payload.purchaseInfo.date = formData.purchaseDate;
    if (formData.purchasePrice !== undefined) payload.purchaseInfo.price = formData.purchasePrice;
    if (formData.purchaseCurrency) payload.purchaseInfo.currency = formData.purchaseCurrency;
  }

  // Handle merchant
  if (formData.merchantName) {
    payload.merchant = {
      name: formData.merchantName,
      url: formData.merchantUrl,
    };
  }

  return payload;
}

/**
 * Converts API response to frontend form data format.
 *
 * Handles:
 * - releases array → flat fields (for first release) + full array
 * - dimensions object → flat fields
 * - purchaseInfo + merchant → flat fields
 * - companyRoles/artistRoles preserved as arrays
 */
export function apiResponseToFormData(figure: Figure): FigureFormData {
  const formData: FigureFormData = {
    manufacturer: figure.manufacturer,
    name: figure.name,
    scale: figure.scale,
  };

  // Copy optional string fields
  if (figure.mfcLink) formData.mfcLink = figure.mfcLink;
  if (figure.storageDetail) formData.storageDetail = figure.storageDetail;
  if (figure.imageUrl) formData.imageUrl = figure.imageUrl;
  if (figure.jan) formData.jan = figure.jan;
  if (figure.note) formData.note = figure.note;
  if (figure.figureConditionNotes) formData.figureConditionNotes = figure.figureConditionNotes;
  if (figure.boxConditionNotes) formData.boxConditionNotes = figure.boxConditionNotes;

  // Copy optional numeric fields
  if (figure.mfcId !== undefined) formData.mfcId = figure.mfcId;
  if (figure.rating !== undefined) formData.rating = figure.rating;
  if (figure.wishRating !== undefined) formData.wishRating = figure.wishRating;
  if (figure.quantity !== undefined) formData.quantity = figure.quantity;

  // Copy optional enum fields
  if (figure.collectionStatus) formData.collectionStatus = figure.collectionStatus;
  if (figure.figureCondition) formData.figureCondition = figure.figureCondition;
  if (figure.boxCondition) formData.boxCondition = figure.boxCondition;

  // Handle releases: extract first release to flat fields + preserve array
  if (figure.releases && figure.releases.length > 0) {
    const firstRelease = figure.releases[0];
    formData.releaseDate = firstRelease.date;
    formData.releasePrice = firstRelease.price;
    formData.releaseCurrency = firstRelease.currency;

    // Also preserve full releases array for form editing
    formData.releases = figure.releases.map(r => ({
      date: r.date,
      price: r.price,
      currency: r.currency,
      jan: r.jan,
      isRerelease: r.isRerelease,
      variant: r.variant,
    }));
  }

  // Handle dimensions: flatten to form fields
  if (figure.dimensions) {
    if (figure.dimensions.heightMm !== undefined) formData.heightMm = figure.dimensions.heightMm;
    if (figure.dimensions.widthMm !== undefined) formData.widthMm = figure.dimensions.widthMm;
    if (figure.dimensions.depthMm !== undefined) formData.depthMm = figure.dimensions.depthMm;
  }

  // Handle companyRoles: preserve as form data format (filter out entries without names)
  if (figure.companyRoles && figure.companyRoles.length > 0) {
    formData.companyRoles = figure.companyRoles
      .filter(cr => cr.companyName) // Only include entries with names
      .map(cr => ({
        companyId: cr.companyId,
        companyName: cr.companyName!, // Safe after filter
        roleId: cr.roleId,
        roleName: cr.roleName,
      }));
  }

  // Handle artistRoles: preserve as form data format (filter out entries without names)
  if (figure.artistRoles && figure.artistRoles.length > 0) {
    formData.artistRoles = figure.artistRoles
      .filter(ar => ar.artistName) // Only include entries with names
      .map(ar => ({
        artistId: ar.artistId,
        artistName: ar.artistName!, // Safe after filter
        roleId: ar.roleId,
        roleName: ar.roleName,
      }));
  }

  // Handle purchaseInfo: flatten to form fields
  if (figure.purchaseInfo) {
    if (figure.purchaseInfo.date) formData.purchaseDate = figure.purchaseInfo.date;
    if (figure.purchaseInfo.price !== undefined) formData.purchasePrice = figure.purchaseInfo.price;
    if (figure.purchaseInfo.currency) formData.purchaseCurrency = figure.purchaseInfo.currency;
  }

  // Handle merchant: flatten to form fields
  if (figure.merchant) {
    if (figure.merchant.name) formData.merchantName = figure.merchant.name;
    if (figure.merchant.url) formData.merchantUrl = figure.merchant.url;
  }

  return formData;
}
