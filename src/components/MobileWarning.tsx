import React, { useState, useEffect } from 'react';
import { Steps, Box, Button, Heading, Text, VStack, Icon } from '@chakra-ui/react';
import { FaDesktop } from 'react-icons/fa';

const MOBILE_BREAKPOINT = 768; // px — matches Chakra's "md" breakpoint
const DISMISS_KEY = 'fc-mobile-warning-dismissed';

/**
 * Full-screen interstitial shown on narrow viewports (< 768px).
 * Dismissible — remembers the user's choice for the browser session.
 *
 * Uses window.innerWidth rather than CSS media queries so the overlay
 * can be completely removed from the DOM after dismissal.
 */
const MobileWarning: React.FC = () => {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    // Check if already dismissed this session
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch { /* sessionStorage unavailable */ }

    // Only show on narrow viewports
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* noop */ }
    setDismissed(true);
  };

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={9999}
      bg="gray.900"
      color="white"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={8}
    >
      <VStack gap={6} textAlign="center" maxW="sm">
        <Icon boxSize={16} color="brand.300" asChild><FaDesktop /></Icon>
        <Heading size="lg">Desktop Experience</Heading>
        <Text fontSize="md" color="whiteAlpha.800">
          FigureCollecting is designed for desktop browsers.
          The mobile experience is coming soon.
        </Text>
        <Text fontSize="sm" color="whiteAlpha.600">
          For the best experience, please visit on a desktop or laptop computer.
        </Text>
        <Button
          onClick={handleDismiss}
          variant="outline"
          colorPalette="whiteAlpha"
          size="lg"
          mt={4}
        >
          Continue anyway
        </Button>
      </VStack>
    </Box>
  );
};

export default MobileWarning;
