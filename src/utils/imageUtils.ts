import React from 'react';

/**
 * onError handler for MFC image URLs.
 * MFC stores images at /upload/items/2/ (full-res) and /upload/items/1/ (medium).
 * Fallback chain: /items/2/ → /items/1/ → placeholder image.
 *
 * NOTE: Chakra UI's Image `fallbackSrc` must NOT be used alongside this handler.
 * Chakra's internal `useImage` hook intercepts errors before the DOM `onError` fires,
 * replacing the src with `fallbackSrc` and preventing this handler from attempting
 * the /items/1/ fallback.
 */
export const handleMfcImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.src.includes('/items/2/')) {
    // First fallback: try medium-resolution variant
    img.src = img.src.replace('/items/2/', '/items/1/');
  } else {
    // Final fallback: generic placeholder
    img.src = '/placeholder-figure.svg';
  }
};
