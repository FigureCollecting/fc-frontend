/**
 * MFC Cookies Modal Component
 *
 * Two-field UX for managing MFC session cookies:
 * 1. Console Output field - for cookies extractable by JavaScript
 * 2. cf_clearance field - for HttpOnly cookies that require manual copy
 *
 * The extraction script is dynamically generated based on the scraper's
 * cookie allowlist, ensuring the UI stays in sync with backend requirements.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Input,
  Button,
  Text,
  HStack,
  VStack,
  Badge,
  Tooltip,
  Collapse,
  Code,
  RadioGroup,
  Radio,
  Stack,
  Alert,
  AlertIcon,
  Box,
  Divider,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FaLock, FaChevronUp, FaChevronDown, FaTrash, FaSave, FaCopy } from 'react-icons/fa';
import { useAuthStore } from '../stores/authStore';
import { getMfcCookieAllowlist, CookieAllowlistResponse } from '../api/scraper';
import {
  storeMfcCookies,
  retrieveMfcCookies,
  clearMfcCookies,
  getStorageType,
} from '../utils/crypto';

export type StorageType = 'session' | 'persistent';

interface MfcCookiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCookiesChanged?: () => void;
}

/**
 * Generate a cookie extraction script based on the allowlist.
 * The script extracts only cookies that JavaScript can read (not HttpOnly).
 */
function generateExtractionScript(scriptReadable: string[]): string {
  const cookieList = scriptReadable.map(c => `"${c}"`).join(', ');
  return `(() => { const cookies = [${cookieList}]; const result = {}; cookies.forEach(name => { const match = document.cookie.split(';').find(c => c.trim().startsWith(name + '=')); if (match) result[name] = match.split('=')[1]; }); console.log(JSON.stringify(result, null, 2)); })()`;
}

/**
 * Parse the console output from the extraction script.
 * Returns a map of cookie name -> value.
 */
function parseScriptOutput(output: string): Record<string, string> | null {
  if (!output.trim()) return null;

  try {
    const parsed = JSON.parse(output);
    if (typeof parsed === 'object' && parsed !== null) {
      // Filter to only string values
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') {
          result[key] = value;
        }
      }
      return result;
    }
  } catch {
    // Not valid JSON
  }

  return null;
}

/**
 * Assemble final cookie object from script output + manual entries.
 */
function assembleCookies(
  scriptOutput: string,
  manualEntries: Record<string, string>
): Record<string, string> | null {
  const parsed = parseScriptOutput(scriptOutput);
  if (!parsed) return null;

  // Merge script output with manual entries
  return { ...parsed, ...manualEntries };
}

/**
 * Convert cookies object to storage format (JSON string).
 */
function cookiesToStorageFormat(cookies: Record<string, string>): string {
  return JSON.stringify(cookies, null, 2);
}

/**
 * Parse stored cookies back into object format.
 */
function parseStoredCookies(stored: string): { scriptCookies: Record<string, string>; manualCookies: Record<string, string> } | null {
  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) return null;

    // We'll separate into script-readable and manual based on allowlist later
    return { scriptCookies: parsed, manualCookies: {} };
  } catch {
    return null;
  }
}

const MfcCookiesModal: React.FC<MfcCookiesModalProps> = ({
  isOpen,
  onClose,
  onCookiesChanged,
}) => {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const userId = user?._id;

  // Input state
  const [consoleOutput, setConsoleOutput] = useState('');
  const [cfClearance, setCfClearance] = useState('');
  const [storageType, setStorageType] = useState<StorageType>('session');

  // UI state
  const [cookiesStored, setCookiesStored] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  // Allowlist state
  const [allowlist, setAllowlist] = useState<CookieAllowlistResponse | null>(null);
  const [allowlistLoading, setAllowlistLoading] = useState(false);
  const [allowlistError, setAllowlistError] = useState<string | null>(null);


  // Color mode values
  const codeBg = useColorModeValue('gray.100', 'gray.600');
  const warningColor = useColorModeValue('red.600', 'red.400');
  const storageTextColor = useColorModeValue('blue.600', 'blue.300');

  // Fetch cookie allowlist when modal opens
  const fetchAllowlist = useCallback(async () => {
    setAllowlistLoading(true);
    setAllowlistError(null);
    try {
      const result = await getMfcCookieAllowlist();
      setAllowlist(result);
    } catch (err) {
      console.error('Failed to fetch cookie allowlist:', err);
      setAllowlistError('Failed to load cookie configuration');
      // Use defaults if fetch fails
      setAllowlist({
        allowedCookies: ['PHPSESSID', 'sesUID', 'sesDID', 'cf_clearance'],
        scriptReadable: ['PHPSESSID', 'sesUID', 'sesDID'],
        manualCopy: ['cf_clearance'],
      });
    } finally {
      setAllowlistLoading(false);
    }
  }, []);

  // Load stored cookies and fetch allowlist when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllowlist();

      const loadStoredCookies = async () => {
        const storedCookies = await retrieveMfcCookies(userId);
        if (storedCookies) {
          const parsed = parseStoredCookies(storedCookies);
          if (parsed) {
            // Extract cf_clearance (or other manual cookies) from stored data
            const { cf_clearance: storedCf, ...scriptCookies } = parsed.scriptCookies;
            setConsoleOutput(JSON.stringify(scriptCookies, null, 2));
            setCfClearance(storedCf || '');
            setCookiesStored(true);

            const currentType = getStorageType(userId);
            if (currentType === 'session' || currentType === 'persistent') {
              setStorageType(currentType);
            } else {
              setStorageType('session');
            }
          }
        } else {
          setConsoleOutput('');
          setCfClearance('');
          setCookiesStored(false);
          setStorageType('session');
        }
        setHasChanges(false);
      };
      loadStoredCookies();
    }
  }, [isOpen, userId, fetchAllowlist]);

  // Derived values
  const extractionScript = allowlist
    ? generateExtractionScript(allowlist.scriptReadable)
    : '';

  const parsedOutput = parseScriptOutput(consoleOutput);
  const isValidOutput = parsedOutput !== null;

  // Check if all required cookies are present
  const requiredCookies = ['PHPSESSID', 'sesUID', 'sesDID'];
  const hasRequiredCookies = isValidOutput && requiredCookies.every(c => c in parsedOutput!);
  const hasCfClearance = cfClearance.trim().length > 0;

  const handleConsoleOutputChange = (value: string) => {
    setConsoleOutput(value);
    setHasChanges(true);
  };

  const handleCfClearanceChange = (value: string) => {
    setCfClearance(value);
    setHasChanges(true);
  };

  const handleStorageTypeChange = (value: StorageType) => {
    setStorageType(value);
    setHasChanges(true);
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(extractionScript);
      setScriptCopied(true);
      setTimeout(() => setScriptCopied(false), 2000);
      toast({
        title: 'Script copied!',
        description: 'Paste it in the MFC Console tab',
        status: 'success',
        duration: 2000,
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please select and copy manually',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleSave = async () => {
    if (!isValidOutput || !hasRequiredCookies) {
      toast({
        title: 'Invalid cookies',
        description: 'Please paste the JSON output from running the script',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Assemble all cookies
    const manualEntries: Record<string, string> = {};
    if (cfClearance.trim()) {
      manualEntries.cf_clearance = cfClearance.trim();
    }

    const allCookies = assembleCookies(consoleOutput, manualEntries);
    if (!allCookies) return;

    const storageFormat = cookiesToStorageFormat(allCookies);
    await storeMfcCookies(storageFormat, storageType, userId);
    setCookiesStored(true);
    setHasChanges(false);

    toast({
      title: 'Cookies Saved',
      description: `MFC cookies stored (${storageType === 'session' ? 'session' : 'persistent'})`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    onCookiesChanged?.();
  };

  const handleClear = () => {
    clearMfcCookies(userId);
    setConsoleOutput('');
    setCfClearance('');
    setCookiesStored(false);
    setStorageType('session');
    setHasChanges(false);
    toast({
      title: 'Cookies Cleared',
      description: 'MFC cookies have been removed from storage',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    onCookiesChanged?.();
  };

  const handleClose = () => {
    setShowSecurity(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={2}>
            <FaLock />
            <Text>MFC Session Cookies</Text>
            {cookiesStored && (
              <Badge colorScheme="green" fontSize="xs">
                <HStack spacing={1}>
                  <FaLock size={10} />
                  <Text>Stored</Text>
                </HStack>
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Description */}
            <Text fontSize="sm" color="gray.500">
              Required for accessing NSFW/Private content from MyFigureCollection
            </Text>

            {allowlistError && (
              <Alert status="warning" borderRadius="md" size="sm">
                <AlertIcon />
                <Text fontSize="sm">{allowlistError} - using defaults</Text>
              </Alert>
            )}

            {/* Step 1: Copy and run script */}
            <Box>
              <FormLabel fontSize="sm" fontWeight="bold">
                Step 1: Run this script in MFC Console
              </FormLabel>
              <Text fontSize="xs" color="gray.500" mb={2}>
                Open DevTools (F12) on myfigurecollection.net, go to Console, paste and run:
              </Text>
              <Box position="relative">
                <Code
                  fontSize="xs"
                  p={2}
                  display="block"
                  whiteSpace="pre-wrap"
                  wordBreak="break-all"
                  bg={codeBg}
                  borderRadius="md"
                  maxH="80px"
                  overflow="auto"
                >
                  {allowlistLoading ? 'Loading...' : extractionScript}
                </Code>
                <Button
                  size="xs"
                  position="absolute"
                  top={1}
                  right={1}
                  leftIcon={<FaCopy />}
                  onClick={handleCopyScript}
                  colorScheme={scriptCopied ? 'green' : 'blue'}
                  isDisabled={allowlistLoading}
                >
                  {scriptCopied ? 'Copied!' : 'Copy'}
                </Button>
              </Box>
            </Box>

            {/* Step 2: Paste console output */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold">
                Step 2: Paste the JSON output here
              </FormLabel>
              <Textarea
                value={consoleOutput}
                onChange={(e) => handleConsoleOutputChange(e.target.value)}
                placeholder='{"PHPSESSID": "abc123", "sesUID": "12345", "sesDID": "67890"}'
                size="sm"
                rows={4}
                fontFamily="mono"
                fontSize="xs"
              />
              {consoleOutput && !isValidOutput && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  Invalid JSON - paste the exact output from the script
                </Text>
              )}
              {isValidOutput && !hasRequiredCookies && (
                <Text fontSize="xs" color="orange.500" mt={1}>
                  Missing required cookies: {requiredCookies.filter(c => !(c in parsedOutput!)).join(', ')}
                </Text>
              )}
              {isValidOutput && hasRequiredCookies && (
                <Text fontSize="xs" color="green.500" mt={1}>
                  ✓ Valid - found {Object.keys(parsedOutput!).length} cookies
                </Text>
              )}
            </FormControl>

            <Divider />

            {/* Step 3: Manual cf_clearance entry */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold">
                Step 3: Enter cf_clearance (from Application tab)
              </FormLabel>
              <Text fontSize="xs" color="gray.500" mb={2}>
                In DevTools → Application → Cookies → myfigurecollection.net → find cf_clearance → copy its Value
              </Text>
              <Input
                value={cfClearance}
                onChange={(e) => handleCfClearanceChange(e.target.value)}
                placeholder="cf_clearance value (required for Cloudflare bypass)"
                size="sm"
                fontFamily="mono"
                fontSize="xs"
              />
              {!hasCfClearance && (
                <Text fontSize="xs" color="orange.500" mt={1}>
                  ⚠️ Without cf_clearance, requests may be blocked by Cloudflare
                </Text>
              )}
              {hasCfClearance && (
                <Text fontSize="xs" color="green.500" mt={1}>
                  ✓ cf_clearance provided
                </Text>
              )}
            </FormControl>

            {/* Storage Options */}
            <FormControl>
              <FormLabel fontSize="sm">
                Storage Option:
                <Text as="span" ml={2} color={storageTextColor} fontWeight="normal">
                  {storageType === 'session' && '(cleared on logout)'}
                  {storageType === 'persistent' && '(encrypted, persistent)'}
                </Text>
              </FormLabel>
              <RadioGroup value={storageType} onChange={(v) => handleStorageTypeChange(v as StorageType)}>
                <Stack direction="column" spacing={2}>
                  <Radio value="session" size="sm">
                    <Tooltip label="Stored in browser session - cleared when you log out">
                      <Text fontSize="sm">Remember for this session (cleared on logout)</Text>
                    </Tooltip>
                  </Radio>
                  <Radio value="persistent" size="sm">
                    <Tooltip label="Encrypted and stored in browser - persists until manually cleared">
                      <Text fontSize="sm">Remember until cleared (encrypted storage)</Text>
                    </Tooltip>
                  </Radio>
                </Stack>
              </RadioGroup>
            </FormControl>

            {/* Collapsible Security Section */}
            <Box>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSecurity(!showSecurity)}
                rightIcon={showSecurity ? <FaChevronUp /> : <FaChevronDown />}
                width="full"
                justifyContent="space-between"
              >
                <HStack>
                  <FaLock />
                  <Text>Security & Privacy</Text>
                </HStack>
              </Button>
              <Collapse in={showSecurity} animateOpacity>
                <Alert status="info" mt={2} borderRadius="md">
                  <AlertIcon />
                  <Box fontSize="xs">
                    <Text fontWeight="bold" mb={2}>🔒 Security & Privacy</Text>
                    <Text mb={2}>
                      MFC cookies are encrypted and stored only in your browser.
                      They are securely transmitted when scraping, as MFC requires your
                      authenticated session for:
                    </Text>
                    <Text as="ul" pl={4} mb={2}>
                      <li>NSFW/NSFW+ restricted content</li>
                      <li>Your MFC Manager catalog (for bulk import/sync)</li>
                      <li>Other private or restricted items on MFC</li>
                    </Text>
                    <Text mb={2}>
                      <strong>Our services immediately discard your cookies after use</strong>—they
                      are never stored on our servers.
                    </Text>
                    <Text fontWeight="bold" color={warningColor}>
                      ⚠️ Never share your MFC cookies with anyone—they provide access to your MFC account.
                    </Text>
                  </Box>
                </Alert>
              </Collapse>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              size="sm"
              leftIcon={<FaTrash />}
              colorScheme="red"
              variant="outline"
              onClick={handleClear}
              isDisabled={!cookiesStored && !consoleOutput.trim() && !cfClearance.trim()}
            >
              Clear Cookies
            </Button>
            <Button
              size="sm"
              leftIcon={<FaSave />}
              colorScheme="blue"
              onClick={handleSave}
              isDisabled={!isValidOutput || !hasRequiredCookies || !hasChanges}
            >
              Save
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MfcCookiesModal;
