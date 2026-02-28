/**
 * MFC Sync Modal
 *
 * Simplified wizard for initiating sync with MyFigureCollection.net.
 * Once sync starts, the modal closes and progress is shown in SyncStatusBanner.
 *
 * Steps:
 * 1. Check Cookies - Verify cookies are stored, prompt to set them if not
 * 2. Validating - Validates cookies with MFC
 * 3. Ready - Confirmation to start sync
 *
 * After starting sync, the modal closes and SyncStatusBanner takes over.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Badge,
  Box,
  Alert,
  AlertIcon,
  Icon,
  Spinner,
  Checkbox,
  CheckboxGroup,
  Stack,
} from '@chakra-ui/react';
import {
  FaSync,
  FaCheckCircle,
  FaLock,
  FaUser,
} from 'react-icons/fa';
import {
  validateMfcCookies,
  executeFullSync,
  createSyncJob,
} from '../api/scraper';
import { useAuthStore } from '../stores/authStore';
import { useSyncStore } from '../stores/syncStore';
import {
  MfcCookies,
  MfcCookieValidationResult,
} from '../types';
import { retrieveMfcCookies, hasMfcCookies } from '../utils/crypto';
import { createLogger } from '../utils/logger';

const logger = createLogger('MFC_SYNC');

/**
 * MFC Root Category Types
 * Root categories are virtual groupings computed from item categories.
 * The actual category (e.g., "Prepainted") determines the root ("Figures").
 */
export type MfcRootCategory = 'Figures' | 'Goods' | 'Media';

/**
 * Map MFC item categories to their virtual root category.
 * Based on MFC's collection page structure:
 * - Figures: Prepainted, Trading, Action/Dolls, Prize, etc.
 * - Goods: On Walls, Linens, Stationeries, Plushies, Straps, etc.
 * - Media: Video, Music, Books, Games, etc.
 */
export function getCategoryRoot(category: string | undefined): MfcRootCategory {
  if (!category) return 'Figures'; // Default to Figures if unknown

  const normalized = category.toLowerCase();

  // Figures: Scale figures, trading figures, action figures, etc.
  const figurePatterns = [
    'prepainted', 'scale', 'trading', 'action', 'doll', 'prize',
    'garage', 'kit', 'nendoroid', 'figma', 'statue', 'bust',
    'model', 'figure', 'poseable',
  ];

  // Media: Video, music, books, games
  const mediaPatterns = [
    'video', 'dvd', 'blu-ray', 'bluray', 'cd', 'music', 'soundtrack',
    'book', 'manga', 'artbook', 'novel', 'magazine', 'game', 'software',
  ];

  // Check for figure patterns first (most common)
  if (figurePatterns.some(p => normalized.includes(p))) {
    return 'Figures';
  }

  // Check for media patterns
  if (mediaPatterns.some(p => normalized.includes(p))) {
    return 'Media';
  }

  // Everything else is Goods (plushies, straps, linens, stationeries, walls, misc, etc.)
  return 'Goods';
}

interface MfcSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
  onOpenCookiesModal?: () => void;
}

type SyncStep = 'checking' | 'validating' | 'ready';

/**
 * Parse stored cookie string into MfcCookies object
 */
function parseCookiesFromStored(cookieString: string): MfcCookies | null {
  try {
    const parsed = JSON.parse(cookieString);
    if (parsed.PHPSESSID && parsed.sesUID && parsed.sesDID) {
      // Pass through all cookies from the JSON - scraper's allowlist will filter
      // This ensures any new cookies added to the allowlist are automatically supported
      const cookies: MfcCookies = {
        PHPSESSID: parsed.PHPSESSID,
        sesUID: parsed.sesUID,
        sesDID: parsed.sesDID,
      };
      // Copy any additional string properties (scraper allowlist will filter)
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string' && !(key in cookies)) {
          cookies[key] = value;
        }
      }
      return cookies;
    }
  } catch {
    // Not JSON, try cookie header format
  }

  // Try cookie header format: "PHPSESSID=abc123; sesUID=12345; sesDID=67890; cf_clearance=xyz"
  // Parse all key=value pairs, scraper allowlist will filter
  const result: Record<string, string> = {};
  const cookiePairs = cookieString.split(/[;\n]+/);

  for (const pair of cookiePairs) {
    const match = pair.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*[=:]\s*["']?([^"';\n]+)["']?\s*$/);
    if (match) {
      result[match[1]] = match[2].trim();
    }
  }

  if (result.PHPSESSID && result.sesUID && result.sesDID) {
    // Type assertion is safe - we've verified required fields exist
    return result as unknown as MfcCookies;
  }

  return null;
}

/**
 * Generate a unique session ID for this sync.
 */
function generateSessionId(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  const secureRandom = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  return `sync-${Date.now()}-${secureRandom}`;
}

const MfcSyncModal: React.FC<MfcSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
  onOpenCookiesModal,
}) => {
  const [step, setStep] = useState<SyncStep>('checking');
  const [cookies, setCookies] = useState<MfcCookies | null>(null);
  const [validationResult, setValidationResult] = useState<MfcCookieValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCookiesStored, setHasCookiesStored] = useState(false);
  // Status selection (owned/ordered/wished) - default to all (empty = all)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['owned', 'ordered', 'wished']);
  const [syncLists, setSyncLists] = useState(true);

  const toast = useToast();
  const { user } = useAuthStore();
  const userId = user?._id;
  const { startSync, isActive } = useSyncStore();

  // Session counter - increments each time modal opens
  // Only results matching current session are applied to state
  const sessionRef = useRef(0);

  // Check for stored cookies when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Increment session on each open - results from old sessions are ignored
    sessionRef.current += 1;
    const currentSession = sessionRef.current;

    logger.info(`[session=${currentSession}] Modal opened, starting cookie check`);

    const checkCookies = async () => {
      logger.info(`[session=${currentSession}] Setting initial state`);
      setStep('checking');
      setIsLoading(true);
      setError(null);
      setValidationResult(null);
      setCookies(null);
      setHasCookiesStored(false);

      try {
        logger.info(`[session=${currentSession}] Retrieving cookies for userId=${userId}`);
        const storedCookies = await retrieveMfcCookies(userId);
        const hasStoredCookies = hasMfcCookies(userId);

        logger.info(`[session=${currentSession}] storedCookies=${!!storedCookies}, hasStoredCookies=${hasStoredCookies}`);

        // Check if this is still the current session
        if (sessionRef.current !== currentSession) {
          logger.info(`[session=${currentSession}] Stale session (current=${sessionRef.current}), ignoring`);
          return;
        }

        if (!storedCookies || !hasStoredCookies) {
          logger.info(`[session=${currentSession}] No cookies found`);
          setIsLoading(false);
          return;
        }

        const parsed = parseCookiesFromStored(storedCookies);
        logger.info(`[session=${currentSession}] Parsed cookies: ${parsed ? Object.keys(parsed).join(', ') : 'null'}`);

        if (!parsed) {
          logger.info(`[session=${currentSession}] Failed to parse cookies`);
          setError('Stored cookies are invalid. Please update your MFC cookies.');
          setIsLoading(false);
          return;
        }

        // Update state - cookies found and parsed
        setCookies(parsed);
        setHasCookiesStored(true);
        setStep('validating');

        // Validate with the scraper service
        logger.info(`[session=${currentSession}] Calling validateMfcCookies API...`);
        const result = await validateMfcCookies(parsed);

        logger.info(`[session=${currentSession}] API result: valid=${result.valid}, username=${result.username}`);

        // Check if this is still the current session
        if (sessionRef.current !== currentSession) {
          logger.info(`[session=${currentSession}] Stale session after API (current=${sessionRef.current}), ignoring`);
          return;
        }

        setValidationResult(result);

        if (result.valid) {
          logger.info(`[session=${currentSession}] Validation successful`);
          setStep('ready');
          toast({
            title: 'MFC Connected',
            description: `Logged in as ${result.username || 'user'}`,
            status: 'success',
            duration: 3000,
          });
        } else {
          logger.info(`[session=${currentSession}] Validation failed: ${result.error}`);
          setError(result.error || 'Invalid or expired cookies');
          setStep('checking');
          setHasCookiesStored(false);
        }
      } catch (err: unknown) {
        // Check if this is still the current session
        if (sessionRef.current !== currentSession) {
          logger.info(`[session=${currentSession}] Stale session during error, ignoring`);
          return;
        }

        const message = err instanceof Error ? err.message : 'Validation failed';
        logger.error(`[session=${currentSession}] Error: ${message}`, err);
        setError(message);
        setStep('checking');
        setHasCookiesStored(false); // Reset so error is displayed
      } finally {
        // Only update loading if still current session
        if (sessionRef.current === currentSession) {
          setIsLoading(false);
        }
      }
    };

    checkCookies();
  }, [isOpen, userId, toast]);

  // Start the sync and close modal
  const handleStartSync = async () => {
    if (!user?._id || !cookies || !validationResult?.valid) return;
    if (selectedStatuses.length === 0 && !syncLists) {
      toast({
        title: 'Nothing selected',
        description: 'Please select at least one status or enable list sync',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    if (isActive) {
      toast({
        title: 'Sync already in progress',
        description: 'Please wait for the current sync to complete',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Generate session ID
      const sessionId = generateSessionId();

      // Create sync job first (enables SSE tracking)
      await createSyncJob({
        sessionId,
        includeLists: syncLists,
        statusFilter: selectedStatuses as ('owned' | 'ordered' | 'wished')[],
        skipCached: true,
      });

      logger.info(`Sync started with statuses: ${selectedStatuses.join(', ')}${syncLists ? ', including lists' : ''}`);

      // Start sync in global store (triggers SSE connection)
      startSync(sessionId);

      // Close modal - banner will show progress
      handleClose();

      // Execute the sync (this triggers the scraper)
      await executeFullSync({
        cookies,
        userId: user._id,
        sessionId,
        includeLists: syncLists,
        skipCached: true,
        statusFilter: selectedStatuses as ('owned' | 'ordered' | 'wished')[],
      });

      logger.info('Sync initiated successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
      setIsLoading(false);
      logger.error('Sync failed:', err);
    }
  };

  const handleOpenCookiesModal = () => {
    onClose();
    onOpenCookiesModal?.();
  };

  const handleClose = () => {
    setStep('checking');
    setCookies(null);
    setValidationResult(null);
    setError(null);
    setHasCookiesStored(false);
    setIsLoading(false);
    onClose();
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderCheckingStep = () => (
    <VStack spacing={4} align="stretch" py={4}>
      {isLoading ? (
        <VStack spacing={4} py={8}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text>Checking for stored MFC cookies...</Text>
        </VStack>
      ) : !hasCookiesStored ? (
        <>
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">MFC Cookies Required</Text>
              <Text fontSize="sm">
                To sync your MFC collection, you need to provide your MFC session cookies. Use the
                padlock icon in the navbar to set up your cookies.
              </Text>
            </Box>
          </Alert>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <Box textAlign="center" py={4}>
            <Button
              colorScheme="blue"
              leftIcon={<Icon as={FaLock} />}
              onClick={handleOpenCookiesModal}
              size="lg"
            >
              Set Up MFC Cookies
            </Button>
          </Box>

          <Alert status="info" borderRadius="md" size="sm">
            <AlertIcon />
            <Text fontSize="sm">
              Your MFC cookies are stored securely in your browser and are never saved on our
              servers.
            </Text>
          </Alert>
        </>
      ) : (
        <VStack spacing={4} py={8}>
          <Icon as={FaCheckCircle} boxSize={12} color="green.500" />
          <Text>MFC cookies found! Proceeding to validation...</Text>
        </VStack>
      )}
    </VStack>
  );

  const renderValidatingStep = () => (
    <VStack spacing={6} py={8}>
      <Spinner size="xl" color="blue.500" thickness="4px" />
      <Text>Validating cookies with MyFigureCollection...</Text>
    </VStack>
  );

  const renderReadyStep = () => (
    <VStack spacing={6} py={8}>
      <Icon as={FaCheckCircle} boxSize={16} color="green.500" />
      <VStack spacing={2}>
        <Text fontSize="xl" fontWeight="bold">
          Ready to Sync
        </Text>
        <HStack>
          <Icon as={FaUser} color="gray.500" />
          <Text color="gray.500">Logged in as:</Text>
          <Badge colorScheme="green" fontSize="md">
            {validationResult?.username || 'MFC User'}
          </Badge>
        </HStack>
      </VStack>

      {/* Status Selection (Owned/Ordered/Wished) */}
      <Box w="100%" p={4} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
        <Text fontWeight="bold" mb={3}>Collection Status:</Text>
        <CheckboxGroup
          value={selectedStatuses}
          onChange={(values) => setSelectedStatuses(values as string[])}
        >
          <Stack direction="row" spacing={6}>
            <Checkbox value="owned" colorScheme="green">
              <Text fontWeight="semibold" color="green.600">Owned</Text>
            </Checkbox>
            <Checkbox value="ordered" colorScheme="blue">
              <Text fontWeight="semibold" color="blue.600">Ordered</Text>
            </Checkbox>
            <Checkbox value="wished" colorScheme="purple">
              <Text fontWeight="semibold" color="purple.600">Wished</Text>
            </Checkbox>
          </Stack>
        </CheckboxGroup>
      </Box>

      {/* Lists Sync Option */}
      <Box w="100%" p={4} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.700' }}>
        <Checkbox
          isChecked={syncLists}
          onChange={(e) => setSyncLists(e.target.checked)}
          colorScheme="orange"
          data-testid="sync-lists-checkbox"
        >
          <Text fontWeight="semibold" color="orange.600">Sync Lists</Text>
        </Checkbox>
        <Text fontSize="xs" color="gray.500" mt={1} ml={6}>
          Import your MFC lists (wishlists, for-sale, custom lists, etc.)
        </Text>
      </Box>

      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">What happens next?</Text>
          <Text fontSize="sm">
            Your collection will be exported from MFC and items will be queued for processing.
            Progress will be shown in a banner at the top of the page.
          </Text>
        </Box>
      </Alert>
    </VStack>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'checking':
        return renderCheckingStep();
      case 'validating':
        return renderValidatingStep();
      case 'ready':
        return renderReadyStep();
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 'checking':
        return isLoading ? null : (
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
        );
      case 'validating':
        return null;
      case 'ready':
        return (
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleStartSync}
              leftIcon={<Icon as={FaSync} />}
              isLoading={isLoading}
              loadingText="Starting..."
            >
              Start Sync
            </Button>
          </HStack>
        );
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'checking':
        return 'Sync with MFC';
      case 'validating':
        return 'Validating Connection';
      case 'ready':
        return 'Ready to Sync';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FaSync} />
            <Text>{getStepTitle()}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>{renderStepContent()}</ModalBody>
        <ModalFooter>{renderFooter()}</ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MfcSyncModal;
