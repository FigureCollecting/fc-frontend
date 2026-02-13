/**
 * useCardSize Hook
 *
 * Calculates viewport-aware card sizing to prevent clipping when the
 * calculated width-based card height exceeds the available viewport height.
 *
 * The hook ensures that:
 * 1. Cards use width-based sizing when viewport height is ample
 * 2. Cards constrain to viewport height when it's the limiting factor
 * 3. Text-left layout accounts for the 56% image width ratio
 *
 * Layout calculations:
 * - text-bottom/image-only: Full card width is available for the square image
 * - text-left: Image gets 56% of card width, so effective image width is smaller
 */

import { useState, useEffect, useMemo } from 'react';
import { CardLayout } from '../components/Pagination';

// Approximate heights for UI elements (in pixels)
const HEADER_HEIGHT = 64; // Main header
const TABS_HEIGHT = 48; // Collection status tabs
const CONTROLS_HEIGHT = 60; // Sort controls, filter info
const PAGINATION_HEIGHT = 160; // Pagination controls
const VERTICAL_PADDING = 48; // Top/bottom margins and gaps

// Total height reserved for non-card UI elements
const RESERVED_HEIGHT = HEADER_HEIGHT + TABS_HEIGHT + CONTROLS_HEIGHT + PAGINATION_HEIGHT + VERTICAL_PADDING;

// Maximum image display size to prevent over-scaling
// MFC images are typically ~550-600px native, so 140% = ~770-840px
// Using 800px as a reasonable max to prevent blurry images
const MAX_IMAGE_SIZE_PX = 800;

interface CardSizeResult {
  /** Maximum card height in pixels (use as maxHeight style) */
  maxCardHeight: number;
  /** Whether height (or scale limit) is the constraining dimension */
  isHeightConstrained: boolean;
  /** The constraining dimension for debugging */
  constrainingDimension: 'width' | 'height' | 'scale-limit';
}

interface UseCardSizeOptions {
  /** Number of columns in the grid */
  columns: number;
  /** Current card layout type */
  layout: CardLayout;
  /** Percentage of viewport width used for card area (0-1) */
  cardAreaWidthPercent?: number;
  /** Whether sidebar is visible (reduces available width) */
  hasSidebar?: boolean;
}

/**
 * Hook to calculate viewport-aware card sizing
 *
 * @param options Configuration for card size calculation
 * @returns Card size constraints including maxCardHeight
 */
export function useCardSize(options: UseCardSizeOptions): CardSizeResult {
  const {
    columns,
    layout,
    cardAreaWidthPercent = 0.95,
    hasSidebar = false,
  } = options;

  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  // Track viewport size changes
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return useMemo(() => {
    // Calculate available width for cards
    // Account for sidebar if present (approximately 280px)
    const sidebarWidth = hasSidebar ? 280 : 0;
    const availableWidth = (viewportSize.width - sidebarWidth) * cardAreaWidthPercent;

    // Calculate card width based on columns
    const cardWidth = availableWidth / columns;

    // For text-left layout, image only gets 56% of the card width
    // For other layouts, image uses full card width
    const imageWidthRatio = layout === 'text-left' ? 0.56 : 1;
    const imageWidth = cardWidth * imageWidthRatio;

    // With square aspect ratio (1:1), image height equals image width
    const widthBasedImageHeight = imageWidth;

    // Calculate available height for cards
    const availableHeight = viewportSize.height - RESERVED_HEIGHT;

    // For a single row of cards, the max image height should not exceed available height
    // Use the minimum of width-based and height-based constraints
    const heightBasedImageHeight = availableHeight;

    // Apply constraints in order of restrictiveness:
    // 1. MAX_IMAGE_SIZE_PX (prevents blurry over-scaling, ~140% of typical MFC images)
    // 2. heightBasedImageHeight (prevents viewport overflow)
    // 3. widthBasedImageHeight (natural width-based sizing)

    // Find the most restrictive constraint
    const constraints = [MAX_IMAGE_SIZE_PX, heightBasedImageHeight, widthBasedImageHeight];
    const effectiveMaxHeight = Math.min(...constraints);

    // Determine which dimension is constraining
    const isHeightConstrained = effectiveMaxHeight < widthBasedImageHeight;
    const constrainingDimension =
      effectiveMaxHeight === MAX_IMAGE_SIZE_PX ? 'scale-limit' as const :
      effectiveMaxHeight === heightBasedImageHeight ? 'height' as const : 'width' as const;

    // Always return a max height to prevent over-scaling
    // The constraint is the minimum of: max scale limit, viewport height, or width-based
    const maxCardHeight = effectiveMaxHeight;

    return {
      maxCardHeight,
      isHeightConstrained,
      constrainingDimension,
    };
  }, [viewportSize, columns, layout, cardAreaWidthPercent, hasSidebar]);
}

/**
 * CSS variable names for card sizing
 * Can be used to pass dimensions to child components via CSS custom properties
 */
export const CARD_SIZE_CSS_VARS = {
  maxCardHeight: '--card-max-height',
  imageAspectRatio: '--card-image-aspect-ratio',
} as const;
