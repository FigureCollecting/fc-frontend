import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createLogger } from '../../utils/logger';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  VStack,
  InputGroup,
  InputRightElement,
  IconButton,
  Text,
  useToast,
  Spinner,
  HStack,
  Grid,
  GridItem,
  Image,
  AspectRatio,
  useColorModeValue,
} from '@chakra-ui/react';
import { useForm, FormProvider } from 'react-hook-form';
import { FaLink } from 'react-icons/fa';
import CoreFieldsSection from './CoreFieldsSection';
import MfcFieldsSection from './MfcFieldsSection';
import CollectionDetailsSection from './CollectionDetailsSection';
import CatalogPurchaseSection from './CatalogPurchaseSection';
import CompanyRolesSection from './CompanyRolesSection';
import ArtistRolesSection from './ArtistRolesSection';
import ReleasesSection from './ReleasesSection';
import { Figure, FigureFormData, CollectionStatus, ICompanyRoleFormData, IArtistRoleFormData, IReleaseFormData } from '../../types';
import { retrieveMfcCookies } from '../../utils/crypto';
import { useAuthStore } from '../../stores/authStore';
import { useLookupData } from '../../hooks/useLookupData';

// Scraped data types from backend
interface IScrapedCompanyEntry {
  name: string;
  role: string;
  mfcId?: number;
}

interface IScrapedArtistEntry {
  name: string;
  role: string;
  mfcId?: number;
}

interface IScrapedRelease {
  date?: string;
  price?: number;
  currency?: string;
  isRerelease?: boolean;
  jan?: string;
}


type SubmitAction = 'save' | 'saveAndAdd' | null;

interface FigureFormProps {
  initialData?: Figure;
  onSubmit: (data: FigureFormData, addAnother?: boolean) => void;
  isLoading: boolean;
  loadingAction?: SubmitAction;  // Which button triggered the loading state
  onResetComplete?: () => void;  // Callback when form reset is complete (for Save & Add Another)
}

const logger = createLogger('FIGURE_FORM');

const FigureForm: React.FC<FigureFormProps> = ({ initialData, onSubmit, isLoading, loadingAction, onResetComplete }) => {
  const [isScrapingMFC, setIsScrapingMFC] = useState(false);
  const [pendingAction, setPendingAction] = useState<SubmitAction>(null);
  const [imageError, setImageError] = useState(false);

  // Get current user for scoped cookie storage
  const user = useAuthStore((state) => state.user);
  const userId = user?._id;

  // Color mode values for image preview styling
  const previewBorderColor = useColorModeValue('gray.200', 'gray.600');
  const previewBg = useColorModeValue('gray.50', 'gray.700');
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');

  // Get role types for mapping scraped data to form fields
  const { roleTypes } = useLookupData();

  // Helper to map scraped companies to form company roles
  const mapScrapedCompaniesToFormData = useCallback((
    companies: IScrapedCompanyEntry[]
  ): ICompanyRoleFormData[] => {
    return companies.map(company => {
      // Find matching role type by name
      const roleType = roleTypes.find(
        rt => rt.kind === 'company' && rt.name.toLowerCase() === company.role.toLowerCase()
      );
      return {
        companyId: undefined, // New company - no existing ID
        companyName: company.name,
        roleId: roleType?._id || '',
        roleName: roleType?.name || company.role,
      };
    });
  }, [roleTypes]);

  // Helper to map scraped artists to form artist roles
  const mapScrapedArtistsToFormData = useCallback((
    artists: IScrapedArtistEntry[]
  ): IArtistRoleFormData[] => {
    return artists.map(artist => {
      // Find matching role type by name
      const roleType = roleTypes.find(
        rt => rt.kind === 'artist' && rt.name.toLowerCase() === artist.role.toLowerCase()
      );
      return {
        artistId: undefined, // New artist - no existing ID
        artistName: artist.name,
        roleId: roleType?._id || '',
        roleName: roleType?.name || artist.role,
      };
    });
  }, [roleTypes]);

  // Helper to map scraped releases to form releases
  const mapScrapedReleasesToFormData = useCallback((
    releases: IScrapedRelease[]
  ): IReleaseFormData[] => {
    return releases.map(release => ({
      date: release.date ? new Date(release.date).toISOString().slice(0, 7) : '', // YYYY-MM format
      price: release.price,
      currency: release.currency || 'JPY',
      jan: release.jan || '',
      isRerelease: release.isRerelease || false,
    }));
  }, []);

  const methods = useForm<FigureFormData>({
    defaultValues: initialData ? {
      ...initialData,
      // Generate mfcLink from mfcId if mfcLink is empty
      mfcLink: initialData.mfcLink || (initialData.mfcId ? `https://myfigurecollection.net/item/${initialData.mfcId}` : ''),
      // Map nested Figure fields to flat form fields
      releaseDate: initialData.releases?.[0]?.date || '',
      releasePrice: initialData.releases?.[0]?.price,
      releaseCurrency: initialData.releases?.[0]?.currency || 'JPY',
      heightMm: initialData.dimensions?.heightMm,
      widthMm: initialData.dimensions?.widthMm,
      depthMm: initialData.dimensions?.depthMm,
      purchaseDate: initialData.purchaseInfo?.date || '',
      purchasePrice: initialData.purchaseInfo?.price,
      purchaseCurrency: initialData.purchaseInfo?.currency || 'USD',
      merchantName: initialData.merchant?.name || '',
      merchantUrl: initialData.merchant?.url || '',
      // Schema v3 array fields
      companyRoles: initialData.companyRoles?.map(cr => ({
        companyId: cr.companyId,
        companyName: cr.companyName || '',
        roleId: cr.roleId,
        roleName: cr.roleName,
      })) || [],
      artistRoles: initialData.artistRoles?.map(ar => ({
        artistId: ar.artistId,
        artistName: ar.artistName || '',
        roleId: ar.roleId,
        roleName: ar.roleName,
      })) || [],
      releases: initialData.releases?.map(r => ({
        date: r.date,
        price: r.price,
        currency: r.currency,
        jan: r.jan,
        isRerelease: r.isRerelease,
      })) || [],
    } : {
      manufacturer: '',
      name: '',
      scale: '',
      mfcLink: '',
      mfcAuth: '',
      storageDetail: '',
      imageUrl: '',
      // Schema v3.0 defaults
      jan: '',
      collectionStatus: 'owned' as CollectionStatus,
      releaseDate: '',
      releasePrice: undefined,
      releaseCurrency: 'JPY',
      heightMm: undefined,
      widthMm: undefined,
      depthMm: undefined,
      purchaseDate: '',
      purchasePrice: undefined,
      purchaseCurrency: 'USD',
      merchantName: '',
      merchantUrl: '',
      rating: undefined,
      wishRating: undefined,
      quantity: 1,
      note: '',
      figureCondition: undefined,
      figureConditionNotes: '',
      boxCondition: undefined,
      boxConditionNotes: '',
      // Schema v3 array fields
      companyRoles: [],
      artistRoles: [],
      releases: [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
    reset,
  } = methods;

  const toast = useToast();
  const mfcLink = watch('mfcLink');
  const imageUrl = watch('imageUrl');

  // Optimized refs for stable references and operation management
  const previousMfcLink = useRef<string>('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentScrapeController = useRef<AbortController | null>(null);
  const isScrapingRef = useRef(false);
  const lastScrapePromise = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  const openMfcLink = () => {
    if (mfcLink) {
      // Normalize to full URL before opening
      const urlToOpen = normalizeMfcLink(mfcLink);
      window.open(urlToOpen, '_blank');
    }
  };

  const openImageLink = () => {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  const validateUrl = (value: string | undefined) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return 'URL must use http or https';
      }
      // Ensure the URL has a domain with at least two parts
      const hostParts = url.hostname.split('.');
      if (hostParts.length < 2 || hostParts.some(part => part.length === 0)) {
        return 'Please enter a valid URL with a domain';
      }
      return true;
    } catch (e) {
      logger.debug('URL validation failed:', e);
      return 'Please enter a valid URL';
    }
  };

  const validateMfcUrl = (value: string | undefined) => {
    if (!value) return true;

    // Accept just the item number (MFC IDs can be 1+ digits)
    const numericPattern = /^\d+$/;
    if (numericPattern.test(value.trim())) {
      return true;
    }

    // First check if it's a valid URL
    const urlValidation = validateUrl(value);
    if (urlValidation !== true) return urlValidation;

    // Accept http/https and optional trailing slash or minor path/query fragments after the numeric id
    const mfcPattern = /^https?:\/\/(?:www\.)?myfigurecollection\.net\/item\/\d+(?:\/.*)?$/i;
    if (!mfcPattern.test(value)) {
      return 'Enter MFC item number (e.g., 123456) or full URL';
    }

    return true;
  };

  // Extract MFC item ID from URL or raw number
  const extractMfcItemId = (value: string | undefined): string | null => {
    if (!value) return null;
    const trimmed = value.trim();

    // If it's just a number, return it (MFC IDs can be 1+ digits)
    if (/^\d+$/.test(trimmed)) {
      return trimmed;
    }

    // Extract from URL
    const match = trimmed.match(/\/item\/(\d+)/);
    return match ? match[1] : null;
  };

  // Normalize MFC input to full URL for scraping
  const normalizeMfcLink = (value: string): string => {
    if (!value) return '';
    const trimmed = value.trim();

    // If it's just a number, convert to full URL (MFC IDs can be 1+ digits)
    if (/^\d+$/.test(trimmed)) {
      return `https://myfigurecollection.net/item/${trimmed}`;
    }

    return trimmed;
  };

  // Conditional validation for name and manufacturer based on mfcLink presence
  const validateName = (value: string | undefined) => {
    const mfcLinkValue = getValues('mfcLink');
    if (mfcLinkValue && mfcLinkValue.trim()) {
      // If MFC link is present, name can be empty (will be populated from scraping)
      return true;
    }
    // Otherwise, name is required
    if (!value || !value.trim()) {
      return 'Figure name is required';
    }
    return true;
  };

  // Note: validateManufacturer removed - Schema v3 uses companyRoles instead
  const formatScale = (input: string) => {
    // Convert to fraction format (e.g., 1/8, 1/7, etc.)
    if (!input.includes('/')) {
      const num = parseFloat(input);
      if (!isNaN(num) && num > 0 && num <= 1) {
        return `1/${Math.round(1 / num)}`;
      }
      // Preserve non-numeric inputs like 'Nendoroid'
      if (isNaN(num)) {
        return input;
      }
    }
    return input;
  };

  const handleScaleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formattedScale = formatScale(e.target.value);
    setValue('scale', formattedScale);
  };

  // Optimized function to scrape MFC data with proper async queuing and cleanup
  const handleMFCLinkBlur = useCallback(async (targetMfcLink?: string) => {
    const currentMfcLink = targetMfcLink || getValues('mfcLink');
    if (!currentMfcLink?.trim()) return;

    // Normalize the input (accept item number or full URL)
    const normalizedLink = normalizeMfcLink(currentMfcLink);
    const mfcPattern = /^https?:\/\/(?:www\.)?myfigurecollection\.net\/item\/\d+(?:\/.*)?$/i;
    if (!mfcPattern.test(normalizedLink)) return;

    if (currentScrapeController.current) {
      currentScrapeController.current.abort();
    }

    if (isScrapingRef.current && lastScrapePromise.current) {
      try { await lastScrapePromise.current; } catch {}
    }

    setIsScrapingMFC(true);
    isScrapingRef.current = true;

    const controller = new AbortController();
    currentScrapeController.current = controller;

    const scrapePromise = (async () => {
      try {
        const currentMfcAuth = getValues('mfcAuth');
        const requestBody = {
          mfcLink: normalizedLink,
          ...(currentMfcAuth && { mfcAuth: currentMfcAuth })
        };
        logger.debug('Making request to /api/figures/scrape-mfc');

        const response = await fetch('/api/figures/scrape-mfc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        if (controller.signal.aborted) return;
        const result = await response.json();
        
        if (!response.ok) {
          if (mountedRef.current) {
            toast({
              title: 'Error',
              description: result.message || 'Failed to scrape MFC data',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
          return;
        }

        if (result.success && result.data) {
          let fieldsPopulated = 0;
          const currentValues = getValues();
          
          if (!currentValues.imageUrl && result.data.imageUrl) {
            setValue('imageUrl', result.data.imageUrl, { shouldValidate: true, shouldDirty: true });
            fieldsPopulated++;
          }
          // Note: Legacy manufacturer field removed - now using companyRoles (Schema v3)
          if (!currentValues.name && result.data.name) {
            setValue('name', result.data.name, { shouldValidate: true, shouldDirty: true });
            fieldsPopulated++;
          }
          if (!currentValues.scale && result.data.scale) {
            setValue('scale', result.data.scale, { shouldValidate: true, shouldDirty: true });
            fieldsPopulated++;
          }

          // Schema v3: Populate MFC-specific fields
          if (!currentValues.mfcTitle && result.data.mfcTitle) {
            setValue('mfcTitle', result.data.mfcTitle, { shouldValidate: true, shouldDirty: true });
            fieldsPopulated++;
          }
          if (!currentValues.origin && result.data.origin) {
            setValue('origin', result.data.origin, { shouldValidate: true, shouldDirty: true });
            fieldsPopulated++;
          }
          if (!currentValues.version && result.data.version) {
            setValue('version', result.data.version, { shouldValidate: true, shouldDirty: true });
            fieldsPopulated++;
          }
          if (!currentValues.category && result.data.category) {
            setValue('category', result.data.category, { shouldValidate: true, shouldDirty: true });
            fieldsPopulated++;
          }
          if (!currentValues.classification && result.data.classification) {
            setValue('classification', result.data.classification, { shouldValidate: true, shouldDirty: true });
            fieldsPopulated++;
          }
          if (!currentValues.materials && result.data.materials) {
            setValue('materials', result.data.materials, { shouldValidate: true, shouldDirty: true });
            fieldsPopulated++;
          }
          // Tags field disabled — MFC extraction needs refinement (future release)
          // if ((!currentValues.tags || currentValues.tags.length === 0) && result.data.tags && result.data.tags.length > 0) {
          //   setValue('tags', result.data.tags, { shouldValidate: true, shouldDirty: true });
          //   fieldsPopulated++;
          // }

          // Schema v3: Populate company roles from scraped data
          if (result.data.companies && result.data.companies.length > 0) {
            const existingCompanyRoles = currentValues.companyRoles || [];
            if (existingCompanyRoles.length === 0) {
              const mappedCompanies = mapScrapedCompaniesToFormData(result.data.companies);
              setValue('companyRoles', mappedCompanies, { shouldValidate: true, shouldDirty: true });
              fieldsPopulated += mappedCompanies.length;
              logger.debug('Populated company roles:', mappedCompanies.length);
            }
          }

          // Schema v3: Populate artist roles from scraped data
          if (result.data.artists && result.data.artists.length > 0) {
            const existingArtistRoles = currentValues.artistRoles || [];
            if (existingArtistRoles.length === 0) {
              const mappedArtists = mapScrapedArtistsToFormData(result.data.artists);
              setValue('artistRoles', mappedArtists, { shouldValidate: true, shouldDirty: true });
              fieldsPopulated += mappedArtists.length;
              logger.debug('Populated artist roles:', mappedArtists.length);
            }
          }

          // Schema v3: Populate releases from scraped data
          if (result.data.releases && result.data.releases.length > 0) {
            const existingReleases = currentValues.releases || [];
            if (existingReleases.length === 0) {
              const mappedReleases = mapScrapedReleasesToFormData(result.data.releases);
              setValue('releases', mappedReleases, { shouldValidate: true, shouldDirty: true });
              fieldsPopulated += mappedReleases.length;
              logger.debug('Populated releases:', mappedReleases.length);
            }
          }

          if (mountedRef.current) {
            toast({
              title: fieldsPopulated > 0 ? 'Success' : 'Info',
              description: fieldsPopulated > 0
                ? `Auto-populated ${fieldsPopulated} fields from MFC!`
                : 'No new data found to populate (fields may already be filled)',
              status: fieldsPopulated > 0 ? 'success' : 'info',
              duration: 3000,
              isClosable: true,
            });
          }
        } else if (mountedRef.current) {
          toast({
            title: 'Warning',
            description: 'No data could be extracted from MFC link',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        if (mountedRef.current) {
          toast({
            title: 'Error',
            description: 'Network error while contacting server',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } finally {
        if (mountedRef.current) {
          setIsScrapingMFC(false);
        }
        isScrapingRef.current = false;
        if (currentScrapeController.current === controller) {
          currentScrapeController.current = null;
        }
      }
    })();

    lastScrapePromise.current = scrapePromise;
    return scrapePromise;
  }, [getValues, setValue, toast, mapScrapedCompaniesToFormData, mapScrapedArtistsToFormData, mapScrapedReleasesToFormData]);

  // Optimized useEffect for MFC link changes with stable dependencies
  useEffect(() => {
    const currentMfcLink = mfcLink || '';

    // Skip if no actual change
    if (currentMfcLink === previousMfcLink.current) {
      return;
    }


    // Clear any existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    // Only trigger if the link is valid and non-empty (accepts item number or full URL)
    const mfcPattern = /^https?:\/\/(?:www\.)?myfigurecollection\.net\/item\/(\d+)(?:\/.*)?$/i;
    const numericPattern = /^\d+$/;
    const trimmedLink = currentMfcLink?.trim() || '';
    const urlMatch = mfcPattern.exec(currentMfcLink || '');
    const isNumeric = numericPattern.test(trimmedLink);

    if (typeof currentMfcLink === 'string' && trimmedLink && (urlMatch || isNumeric)) {
      // Extract item ID to determine delay
      const itemId = urlMatch ? urlMatch[1] : trimmedLink;
      // Double delay for short IDs (< 5 digits) to allow more typing time
      const delay = itemId.length < 5 ? 2000 : 1000;

      // Use optimized debounce with stable timer management
      debounceTimer.current = setTimeout(async () => {
        logger.verbose(`Debounce timer executed (delay: ${delay}ms, itemId: ${itemId})`);
        // Capture current values to avoid stale closure
        const linkToScrape = currentMfcLink;
        const currentFormValues = getValues();

        // Only proceed if the link hasn't changed since timer was set
        if (linkToScrape === currentFormValues.mfcLink) {
          logger.verbose('Link unchanged, calling handleMFCLinkBlur');
          await handleMFCLinkBlur(linkToScrape);
        } else {
          logger.verbose('Link changed during debounce, skipping scrape');
        }
        debounceTimer.current = null;
      }, delay);
    }

    previousMfcLink.current = currentMfcLink;

    // Cleanup function
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [mfcLink, handleMFCLinkBlur, getValues]); // Include dependencies for stable behavior

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        // Generate mfcLink from mfcId if mfcLink is empty
        mfcLink: initialData.mfcLink || (initialData.mfcId ? `https://myfigurecollection.net/item/${initialData.mfcId}` : ''),
        // Map nested Figure fields to flat form fields
        releaseDate: initialData.releases?.[0]?.date || '',
        releasePrice: initialData.releases?.[0]?.price,
        releaseCurrency: initialData.releases?.[0]?.currency || 'JPY',
        heightMm: initialData.dimensions?.heightMm,
        widthMm: initialData.dimensions?.widthMm,
        depthMm: initialData.dimensions?.depthMm,
        purchaseDate: initialData.purchaseInfo?.date || '',
        purchasePrice: initialData.purchaseInfo?.price,
        purchaseCurrency: initialData.purchaseInfo?.currency || 'USD',
        merchantName: initialData.merchant?.name || '',
        merchantUrl: initialData.merchant?.url || '',
      });
    } else {
      reset({
        manufacturer: '',
        name: '',
        scale: '',
        mfcLink: '',
        mfcAuth: '',
        storageDetail: '',
        imageUrl: '',
        // Schema v3.0 defaults
        jan: '',
        collectionStatus: 'owned' as CollectionStatus,
        releaseDate: '',
        releasePrice: undefined,
        releaseCurrency: 'JPY',
        heightMm: undefined,
        widthMm: undefined,
        depthMm: undefined,
        purchaseDate: '',
        purchasePrice: undefined,
        purchaseCurrency: 'USD',
        merchantName: '',
        merchantUrl: '',
        rating: undefined,
        wishRating: undefined,
        quantity: 1,
        note: '',
        figureCondition: undefined,
        figureConditionNotes: '',
        boxCondition: undefined,
        boxConditionNotes: '',
      });
    }
  }, [initialData, reset]);

  // Cleanup effect for component unmount and pending operations
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cancel any pending scrape operations
      if (currentScrapeController.current) {
        currentScrapeController.current.abort();
      }

      // Clear any pending debounce timers
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Reset refs
      isScrapingRef.current = false;
      currentScrapeController.current = null;
      debounceTimer.current = null;
      lastScrapePromise.current = null;
    };
  }, []);

  // Load stored MFC cookies silently on mount (for scraping operations)
  useEffect(() => {
    const loadStoredCookies = async () => {
      const storedCookies = await retrieveMfcCookies(userId);
      if (storedCookies && mountedRef.current) {
        setValue('mfcAuth', storedCookies);
      }
    };
    loadStoredCookies();
  }, [setValue, userId]);

  // Reset image error state when imageUrl changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  // Handle form submission - delegates to parent with addAnother flag
  const handleFormSubmit = (data: FigureFormData) => {
    const isAddAnother = pendingAction === 'saveAndAdd';

    // Clear rating fields that don't apply to the current collection status
    // - 'owned': only rating applies (1-10)
    // - 'wished': only wishRating applies (1-5 stars)
    // - 'ordered': neither rating applies
    const cleanedData = { ...data };

    if (cleanedData.collectionStatus === 'owned') {
      delete cleanedData.wishRating;
    } else if (cleanedData.collectionStatus === 'wished') {
      delete cleanedData.rating;
    } else {
      // 'ordered' - clear both ratings
      delete cleanedData.rating;
      delete cleanedData.wishRating;
    }

    // Pass the addAnother flag to parent so it can decide whether to navigate
    onSubmit(cleanedData, isAddAnother);
  };

  // Reset form for "Save & Add Another" - called by parent after successful save
  const resetFormForAddAnother = useCallback(() => {
    // Reset form fields but preserve MFC cookies
    const currentMfcAuth = getValues('mfcAuth');
    reset({
      manufacturer: '',
      name: '',
      scale: '',
      mfcLink: '',
      mfcAuth: currentMfcAuth, // Preserve MFC auth cookies
      storageDetail: '',
      imageUrl: '',
      // Schema v3.0 defaults - preserve collection status
      jan: '',
      collectionStatus: 'owned' as CollectionStatus,
      releaseDate: '',
      releasePrice: undefined,
      releaseCurrency: 'JPY',
      heightMm: undefined,
      widthMm: undefined,
      depthMm: undefined,
      purchaseDate: '',
      purchasePrice: undefined,
      purchaseCurrency: 'USD',
      merchantName: '',
      merchantUrl: '',
      rating: undefined,
      wishRating: undefined,
      quantity: 1,
      note: '',
      figureCondition: undefined,
      figureConditionNotes: '',
      boxCondition: undefined,
      boxConditionNotes: '',
    });
    // Reset pending action
    setPendingAction(null);
    // Notify parent that reset is complete
    onResetComplete?.();
  }, [getValues, reset, onResetComplete]);

  // Effect to reset form when parent signals success for "Save & Add Another"
  useEffect(() => {
    // When loading finishes after a saveAndAdd action, reset the form
    if (!isLoading && loadingAction === 'saveAndAdd' && pendingAction === 'saveAndAdd') {
      resetFormForAddAnother();
    }
  }, [isLoading, loadingAction, pendingAction, resetFormForAddAnother]);

  return (
    <FormProvider {...methods}>
    <Box as="form" onSubmit={handleSubmit(handleFormSubmit)} role="form" aria-labelledby="figure-form-title">
      <Text id="figure-form-title" fontSize="xl" fontWeight="bold" className="sr-only">
        {initialData ? 'Edit Item Form' : 'Add Item Form'}
      </Text>
      <Text fontSize="sm" color="gray.600" mb={4} aria-describedby="form-instructions">
        Fill out the form below to {initialData ? 'update' : 'add'} an item to your collection.
        {mfcLink ? ' The form will auto-populate data from the MFC link.' : ''}
      </Text>
      <Text id="form-instructions" className="sr-only">
        Required fields are marked with an asterisk. You can provide an MFC link to auto-populate figure data.
      </Text>

      {/* Two-column layout: Form fields on left, Image preview on right */}
      <Grid
        templateColumns={{ base: '1fr', lg: '1fr 280px' }}
        gap={6}
        alignItems="start"
      >
        {/* Left Column: Form Fields */}
        <GridItem>
          <VStack spacing={6} align="stretch">
            {/* MFC Link at top */}
            <FormControl isInvalid={!!errors.mfcLink}>
              <FormLabel>
                MFC Item
                {extractMfcItemId(mfcLink) && (
                  <Text as="span" color="brand.500" fontWeight="semibold" ml={2}>
                    #{extractMfcItemId(mfcLink)}
                  </Text>
                )}
              </FormLabel>
              <InputGroup>
                <Input
                  {...register('mfcLink', {
                    validate: validateMfcUrl
                  })}
                  placeholder="Enter item # (e.g., 123456) or full MFC URL"
                  data-invalid={!!errors.mfcLink}
                />
                <InputRightElement>
                  {isScrapingMFC ? (
                    <Spinner size="sm" data-testid="mfc-scraping-spinner" />
                  ) : (
                    <IconButton
                      aria-label="Open MFC link"
                      icon={<FaLink />}
                      size="sm"
                      variant="ghost"
                      onClick={openMfcLink}
                      isDisabled={!mfcLink}
                    />
                  )}
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage data-testid="form-error-message">{errors.mfcLink?.message}</FormErrorMessage>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Enter just the item number or paste the full MFC URL • Click link icon to open page
              </Text>
            </FormControl>

            {/* Core Fields Section - Extracted Component */}
            <CoreFieldsSection
              register={register}
              getValues={getValues}
              errors={errors}
              mfcLink={mfcLink}
              imageUrl={imageUrl}
              handleScaleBlur={handleScaleBlur}
              validateName={validateName}
              validateUrl={validateUrl}
              openImageLink={openImageLink}
            />

            {/* Schema v3: Company & Artist Roles - Primary data from MFC */}
            <Box mt={6}>
              <CompanyRolesSection />
            </Box>
            <Box mt={4}>
              <ArtistRolesSection />
            </Box>

            {/* Schema v3: MFC-specific fields */}
            <Box mt={6} pt={4} borderTopWidth="1px" borderColor="gray.200">
              <MfcFieldsSection register={register} watch={watch} />
            </Box>

            {/* Collection Details Section - Extracted Component */}
            <CollectionDetailsSection
              register={register}
              setValue={setValue}
              watch={watch}
            />

            {/* Catalog & Purchase Sections - Extracted Component */}
            <CatalogPurchaseSection
              register={register}
              setValue={setValue}
              watch={watch}
            />

            {/* Schema v3: Release Information */}
            <Box mt={6} pt={6} borderTopWidth="1px" borderColor="gray.200">
              <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.700">
                Release Information
              </Text>
              <ReleasesSection />
            </Box>

            <HStack mt={4} spacing={4}>
              <Button
                colorScheme="brand"
                isLoading={isLoading && (loadingAction === 'save' || pendingAction === 'save')}
                type="submit"
                size="lg"
                onClick={() => setPendingAction('save')}
                isDisabled={isLoading}
              >
                {initialData ? 'Update Figure' : 'Save'}
              </Button>

              {!initialData && (
                <Button
                  colorScheme="green"
                  isLoading={isLoading && (loadingAction === 'saveAndAdd' || pendingAction === 'saveAndAdd')}
                  type="submit"
                  size="lg"
                  onClick={() => setPendingAction('saveAndAdd')}
                  isDisabled={isLoading}
                >
                  Save & Add Another
                </Button>
              )}
            </HStack>
          </VStack>
        </GridItem>

        {/* Right Column: Image Preview (sticky on large screens) */}
        <GridItem
          display={{ base: 'none', lg: 'block' }}
          position="sticky"
          top="20px"
        >
          <Box
            border="1px"
            borderColor={previewBorderColor}
            borderRadius="md"
            overflow="hidden"
            bg={previewBg}
          >
            <Text
              fontSize="sm"
              fontWeight="semibold"
              p={2}
              borderBottom="1px"
              borderColor={previewBorderColor}
            >
              Image Preview
            </Text>
            {/* 9:16 aspect ratio container for vertical figure images */}
            <AspectRatio ratio={9 / 16} maxH="500px">
              {imageUrl && !imageError ? (
                <Image
                  src={imageUrl}
                  alt="Figure preview"
                  objectFit="contain"
                  onError={() => setImageError(true)}
                  cursor="pointer"
                  onClick={openImageLink}
                  title="Click to open full image"
                />
              ) : (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexDirection="column"
                  color={placeholderColor}
                >
                  {imageError ? (
                    <Text fontSize="sm">Failed to load image</Text>
                  ) : (
                    <>
                      <Text fontSize="sm">No image</Text>
                      <Text fontSize="xs" mt={1}>
                        Enter URL or fetch from MFC
                      </Text>
                    </>
                  )}
                </Box>
              )}
            </AspectRatio>
          </Box>
        </GridItem>
      </Grid>
    </Box>
    </FormProvider>
  );
};

export default FigureForm;
