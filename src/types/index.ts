export type ColorProfile = 'light' | 'dark' | 'terminal' | 'tokyonight' | 'nord' | 'dracula' | 'solarized' | 'cyberpunk';

export interface User {
  _id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  colorProfile?: ColorProfile;
  token?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;  // Unix timestamp for when access token expires
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  webauthnCredentialCount?: number;
  webauthnCredentials?: Array<{
    credentialId: string;
    nickname?: string;
    createdAt: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Schema v3.0 Enums and Subdocument Types
// ═══════════════════════════════════════════════════════════════════════════

// Simplified to 3 options: preordered merged into ordered
export type CollectionStatus = 'owned' | 'ordered' | 'wished';

// Merchant info for tracking where figures were purchased
export interface IMerchant {
  name: string;
  url?: string;
}

// Figure condition includes "sealed" since many collectors keep figures unopened
export type FigureCondition = 'sealed' | 'likenew' | 'verygood' | 'good' | 'fair' | 'poor';

// Box condition is separate - figure could be opened but box pristine, or vice versa
export type BoxCondition = 'mint' | 'verygood' | 'good' | 'fair' | 'poor';

export interface IRelease {
  date?: string;
  price?: number;
  currency?: string;
  isRerelease?: boolean;
  jan?: string;  // JAN/EAN/UPC barcode (10-13 digits)
  variant?: string;  // Release variant (e.g., "Standard (Japan)", "Limited (China)")
}

export interface IDimensions {
  heightMm?: number;
  widthMm?: number;
  depthMm?: number;
  scaledHeight?: number;
}

export interface IPurchaseInfo {
  date?: string;
  price?: number;
  currency?: string;
}

export interface ICompanyRole {
  companyId: string;
  companyName?: string; // For display purposes
  roleId: string;
  roleName?: string; // For display purposes
}

export interface IArtistRole {
  artistId: string;
  artistName?: string; // For display purposes
  roleId: string;
  roleName?: string; // For display purposes
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Figure Interface (Schema v3.0)
// ═══════════════════════════════════════════════════════════════════════════

export interface Figure {
  _id: string;
  // Core fields (existing)
  manufacturer: string;
  name: string;
  scale: string;
  mfcLink?: string;
  storageDetail?: string; // Specific location within storage (shelf label, box ID, etc.)
  imageUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  searchScore?: number;

  // Schema v3.0 - Product identification
  mfcId?: number;
  jan?: string; // JAN/UPC/EAN barcode

  // Schema v3.0 - MFC-specific fields
  mfcTitle?: string;        // The figure's specific title from MFC
  origin?: string;          // Series/franchise (e.g., "Original", "Fate/Grand Order")
  version?: string;         // Variant info (e.g., "Little Devil Ver.")
  category?: string;        // Figure category (e.g., "Scale Figure")
  classification?: string;  // Classification (e.g., "Goods")
  materials?: string;       // Materials (e.g., "PVC, ABS")
  tags?: string[];          // Various tags (e.g., "18+", "Castoff", "Limited")

  // Schema v3.0 - Releases (array for rereleases)
  releases?: IRelease[];

  // Schema v3.0 - Physical dimensions
  dimensions?: IDimensions;

  // Schema v3.0 - Company/Artist roles
  companyRoles?: ICompanyRole[];
  artistRoles?: IArtistRole[];

  // Schema v3.0 - User-specific data
  collectionStatus?: CollectionStatus;
  purchaseInfo?: IPurchaseInfo;
  merchant?: IMerchant;
  rating?: number; // 1-10 for owned figures
  wishRating?: number; // 1-5 priority stars for wished figures
  // Community data (enriched from MFCItem at API level)
  communityStats?: {
    ownedCount?: number;
    wishedCount?: number;
    orderedCount?: number;
    listedInCount?: number;
    averageScore?: number;
  };
  relatedItems?: Array<{
    mfcId: number;
    relationType?: string;
    name?: string;
    imageUrl?: string;
  }>;
  quantity?: number; // Number of copies owned (default 1)
  note?: string; // Personal notes/comments about this figure

  // Sorting/ordering
  mfcActivityOrder?: number; // Position in MFC activity-sorted collection

  // Condition tracking (figure and box are separate)
  figureCondition?: FigureCondition;
  figureConditionNotes?: string;
  boxCondition?: BoxCondition;
  boxConditionNotes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Form Data Interface (Schema v3.0)
// ═══════════════════════════════════════════════════════════════════════════

export interface FigureFormData {
  // Core fields (existing)
  manufacturer: string;
  name: string;
  scale: string;
  mfcLink?: string;
  mfcAuth?: string; // Not stored, only used for scraping
  storageDetail?: string; // Specific location within storage (shelf label, box ID, etc.)
  imageUrl?: string;

  // Schema v3.0 - Product identification
  mfcId?: number;
  jan?: string; // JAN/UPC/EAN barcode

  // Schema v3.0 - MFC-specific fields
  mfcTitle?: string;        // The figure's specific title from MFC
  origin?: string;          // Series/franchise (e.g., "Original", "Fate/Grand Order")
  version?: string;         // Variant info (e.g., "Little Devil Ver.")
  category?: string;        // Figure category (e.g., "Scale Figure")
  classification?: string;  // Classification (e.g., "Goods")
  materials?: string;       // Materials (e.g., "PVC, ABS")
  tags?: string[];          // Various tags (e.g., "18+", "Castoff", "Limited")

  // Schema v3.0 - Primary release (simplified for form)
  releaseDate?: string;
  releasePrice?: number;
  releaseCurrency?: string;

  // Schema v3.0 - Physical dimensions
  heightMm?: number;
  widthMm?: number;
  depthMm?: number;

  // Schema v3.0 - User-specific data
  collectionStatus?: CollectionStatus;
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseCurrency?: string;
  merchantName?: string;
  merchantUrl?: string;
  rating?: number; // 1-10 for owned figures
  wishRating?: number; // 1-5 priority stars for wished figures
  quantity?: number; // Number of copies owned (default 1)
  note?: string; // Personal notes/comments about this figure

  // Condition tracking (figure and box are separate)
  figureCondition?: FigureCondition;
  figureConditionNotes?: string;
  boxCondition?: BoxCondition;
  boxConditionNotes?: string;

  // Schema v3.0 - Array sections for form
  companyRoles?: ICompanyRoleFormData[];
  artistRoles?: IArtistRoleFormData[];
  releases?: IReleaseFormData[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Form Array Section Types (Schema v3.0)
// ═══════════════════════════════════════════════════════════════════════════

// For company role editing - companyId is optional for new companies
export interface ICompanyRoleFormData {
  companyId?: string;      // Optional: set when selecting existing company
  companyName: string;     // Required: company name (user can type new)
  roleId: string;          // Required: role type (Manufacturer, Distributor, etc.)
  roleName?: string;       // Display only: resolved role name
}

// For artist role editing - artistId is optional for new artists
export interface IArtistRoleFormData {
  artistId?: string;       // Optional: set when selecting existing artist
  artistName: string;      // Required: artist name (user can type new)
  roleId: string;          // Required: role type (Sculptor, Illustrator, etc.)
  roleName?: string;       // Display only: resolved role name
}

// For release editing - more flexible than IRelease
export interface IReleaseFormData {
  date?: string;           // Release date (YYYY-MM-DD or YYYY-MM)
  price?: number;          // Price amount
  currency?: string;       // Currency code (JPY, USD, EUR)
  jan?: string;            // JAN/UPC/EAN barcode (10-13 digits)
  isRerelease?: boolean;   // True if this is a rerelease
  variant?: string;        // Release variant (e.g., "Standard (Japan)", "Limited (China)")
}

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  page: number;
  pages: number;
  total: number;
  data: T[];
}

export interface SearchResult {
  id: string;
  manufacturer: string;
  name: string;
  scale: string;
  mfcLink: string;
  origin?: string;
  category?: string;
  tags?: string[];
  companyRoles?: Array<{ companyName: string; roleName: string }>;
  artistRoles?: Array<{ artistName: string; roleName: string }>;
  imageUrl?: string;
  searchScore?: number;
}

export interface StatusCounts {
  owned: number;
  ordered: number;
  wished: number;
}

export interface StatsData {
  totalCount: number;
  statusCounts: StatusCounts;
  manufacturerStats: { _id: string; count: number }[];
  scaleStats: { _id: string; count: number }[];
  // Schema v3.0 - Origin/franchise stats
  originStats?: { _id: string; count: number }[];
  // Schema v3.0 - Category/type stats
  categoryStats?: { _id: string; count: number }[];
  // Schema v3.0 - Manufacturer stats from companyRoles array
  v3ManufacturerStats?: { _id: string; count: number }[];
  // Schema v3.0 - Distributor stats from companyRoles array
  distributorStats?: { _id: string; count: number }[];
  // Schema v3.0 - Artist role stats
  sculptorStats?: { _id: string; count: number }[];
  illustratorStats?: { _id: string; count: number }[];
  // Schema v3.0 - Classification stats
  classificationStats?: { _id: string; count: number }[];
  activeStatus: CollectionStatus | null;
}

export interface SystemConfig {
  key: string;
  value: string;
  type: 'string' | 'json' | 'markdown' | 'script';
  description?: string;
  isPublic: boolean;
}

// Bulk Import Types
export type BulkImportItemStatus = 'new' | 'catalog_exists' | 'duplicate';

export interface BulkImportPreviewItem {
  mfcId: number;
  title: string;
  cleanTitle: string;
  manufacturers: string[];
  scale?: string;
  status: BulkImportItemStatus;
  collectionStatus: string;
  rating?: number;
  note?: string;
}

export interface BulkImportPreviewResponse {
  success: boolean;
  totalItems: number;
  summary: {
    new: number;
    catalogExists: number;
    duplicates: number;
  };
  items: BulkImportPreviewItem[];
}

export interface BulkImportExecuteResponse {
  success: boolean;
  totalItems: number;
  imported: number;
  skipped: number;
  errors: Array<{
    mfcId: number;
    title: string;
    error: string;
  }>;
}

// MFC Sync Types (Scraper Service)
export interface MfcCookies {
  PHPSESSID: string;
  sesUID: string;
  sesDID: string;
  // Additional cookies (cf_clearance, etc.) - scraper allowlist filters
  [key: string]: string | undefined;
}

export interface MfcCookieValidationResult {
  valid: boolean;
  username?: string;
  userId?: string;
  error?: string;
}

export interface MfcSyncStats {
  owned: number;
  ordered: number;
  wished: number;
  total: number;
  nsfw: number;
}

export interface MfcSyncResult {
  success: boolean;
  parsedCount: number;
  queuedCount: number;
  skippedCount: number;
  listsFound?: number;
  stats: MfcSyncStats;
  errors: string[];
}

export interface MfcQueueStats {
  queues: {
    hot: number;
    warm: number;
    cold: number;
  };
  total: number;
  processing: number;
  completed: number;
  failed: number;
  rateLimit: {
    active: boolean;
    currentDelayMs: number;
  };
}

export interface MfcParsedItem {
  mfcId: string;
  name: string;
  status: 'owned' | 'ordered' | 'wished';
  category?: string;
  releaseDate?: string;
  price?: string;
  isNsfw: boolean;
}

// ============================================================================
// SSE Sync Events
// ============================================================================

export type SyncPhase =
  | 'validating'
  | 'exporting'
  | 'parsing'
  | 'fetching_lists'
  | 'queueing'
  | 'enriching'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type SyncItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

/** Progress tracking for a single status category (owned/ordered/wished) */
export interface StatusProgress {
  queued: number;
  completed: number;
  failed: number;
}

export interface SyncJobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  skipped: number;
  /** Per-status progress tracking (owned/ordered/wished) */
  byStatus?: {
    owned: StatusProgress;
    ordered: StatusProgress;
    wished: StatusProgress;
  };
}

export interface SyncJobState {
  sessionId: string;
  phase: SyncPhase;
  message?: string;
  stats: SyncJobStats;
}

export interface SseConnectedEvent {
  sessionId: string;
  phase: SyncPhase;
  stats: SyncJobStats;
  message?: string;
}

export interface SseItemUpdateEvent {
  mfcId: string;
  status: SyncItemStatus;
  error?: string;
  stats: SyncJobStats;
  phase: SyncPhase;
}

export interface SsePhaseChangeEvent {
  phase: SyncPhase;
  message?: string;
  stats: SyncJobStats;
}

export interface SseSyncCompleteEvent {
  phase: SyncPhase;
  stats: SyncJobStats;
  message?: string;
}

// ============================================================================
// MFC Lists
// ============================================================================

export type ListPrivacy = 'public' | 'friends' | 'private';

export const MFC_LIST_LIMITS = {
  NAME_MAX: 32,
  TEASER_MAX: 64,
} as const;

export interface MfcListItem {
  mfcId: number;
  name?: string;
  imageUrl?: string;
  scale?: string;
}

export interface MfcList {
  _id: string;
  mfcId: number;
  userId: string;
  name: string;
  teaser?: string;
  description?: string;
  privacy: ListPrivacy;
  iconUrl?: string;
  allowComments: boolean;
  mailOnSales: boolean;
  mailOnHunts: boolean;
  itemCount: number;
  itemMfcIds: number[];
  items?: MfcListItem[];
  mfcCreatedAt?: string;
  mfcLastEditedAt?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MfcListFormData {
  mfcId?: number;
  name: string;
  teaser?: string;
  description?: string;
  privacy?: ListPrivacy;
  iconUrl?: string;
  allowComments?: boolean;
  mailOnSales?: boolean;
  mailOnHunts?: boolean;
  itemMfcIds?: number[];
}

export interface TwoFactorPendingState {
  sessionId: string;
  methods: string[];
}
