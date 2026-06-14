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
import { useColorModeValue } from "./ui/color-mode";
import {
  Steps,
  Textarea,
  Input,
  Button,
  IconButton,
  Text,
  HStack,
  VStack,
  Badge,
  Collapsible,
  Code,
  RadioGroup,
  Radio,
  Stack,
  Alert,
  Box,
  InputGroup,
  useToast,
  Separator,
  Field,
  Dialog,
  Portal,
} from '@chakra-ui/react';
import { Tooltip } from 'ui/tooltip';
import { FaLock, FaChevronUp, FaChevronDown, FaTrash, FaSave, FaCopy, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuthStore } from '../stores/authStore';
import { getMfcCookieAllowlist, CookieAllowlistResponse } from '../api/scraper';
import { usePublicConfig } from '../hooks/usePublicConfig';
import { apiLogger } from '../utils/logger';
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
  return `(() => { const cookies = [${cookieList}]; const result = {}; cookies.forEach(name => { const match = document.cookie.split(';').find(c => c.trim().startsWith(name + '=')); if (match) result[name] = match.split('=')[1]; }); copy(JSON.stringify(result, null, 2)); return "Copied to clipboard!"; })()`;
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
  const [showStep2, setShowStep2] = useState(false);
  const [showStep3, setShowStep3] = useState(false);

  // Allowlist state
  const [allowlist, setAllowlist] = useState<CookieAllowlistResponse | null>(null);
  const [allowlistLoading, setAllowlistLoading] = useState(false);
  const [allowlistError, setAllowlistError] = useState<string | null>(null);

  // SystemConfig override for extraction script (enables dynamic updates without redeploying)
  const { data: scriptConfig, isLoading: scriptConfigLoading } = usePublicConfig(
    'mfc_cookie_script',
    { enabled: isOpen }
  );


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
      apiLogger.error('Failed to fetch cookie allowlist:', err);
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

  // Derived values — prefer SystemConfig script (dynamically updatable) over local generation
  const extractionScript = scriptConfig?.value
    || (allowlist ? generateExtractionScript(allowlist.scriptReadable) : '');

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
    setShowStep2(false);
    setShowStep3(false);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} size='xl' scrollBehavior="inside" onOpenChange={e => {
      if (!e.open) {
        handleClose();
      }
    }}>
      <Portal>

        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <HStack gap={2}>
                <FaLock />
                <Text>MFC Session Cookies</Text>
                {cookiesStored && (
                  <Badge colorPalette="green" fontSize="xs">
                    <HStack gap={1}>
                      <FaLock size={10} />
                      <Text>Stored</Text>
                    </HStack>
                  </Badge>
                )}
              </HStack>
            </Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body>
              <VStack gap={4} align="stretch">
                {/* Description */}
                <Text fontSize="sm" color="gray.500">
                  Required for accessing NSFW/Private content from MyFigureCollection
                </Text>

                {allowlistError && (
                  <Alert.Root status="warning" borderRadius="md" size="sm">
                    <Alert.Indicator />
                    <Text fontSize="sm">{allowlistError} - using defaults</Text>
                  </Alert.Root>
                )}

                {/* Step 1: Copy and run script */}
                <Box>
                  <Field.Label fontSize="sm" fontWeight="bold">
                    Step 1: Run this script in MFC Console
                  </Field.Label>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    Open DevTools (F12) on myfigurecollection.net, go to Console, paste and run. The cookies will be copied to your clipboard.
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
                      {(allowlistLoading || scriptConfigLoading) ? 'Loading...' : extractionScript}
                    </Code>
                    <Button
                      size="xs"
                      position="absolute"
                      top={1}
                      right={1}
                      onClick={handleCopyScript}
                      colorPalette={scriptCopied ? 'green' : 'blue'}
                      disabled={allowlistLoading || scriptConfigLoading}><FaCopy />{scriptCopied ? 'Copied!' : 'Copy'}</Button>
                  </Box>
                </Box>

                {/* Step 2: Paste console output */}
                <Field.Root>
                  <HStack justify="space-between" mb={1}>
                    <Field.Label fontSize="sm" fontWeight="bold" mb={0}>
                      Step 2: Paste the copied JSON here
                    </Field.Label>
                    <IconButton
                      aria-label={showStep2 ? 'Hide cookie values' : 'Show cookie values'}
                      size="xs"
                      variant="ghost"
                      onClick={() => setShowStep2(!showStep2)}>{showStep2 ? <FaEyeSlash /> : <FaEye />}</IconButton>
                  </HStack>
                  <Textarea
                    value={consoleOutput}
                    onValueChange={(e) => handleConsoleOutputChange(e.target.value)}
                    placeholder='{"PHPSESSID": "abc123", "sesUID": "12345", "sesDID": "67890"}'
                    size="sm"
                    rows={4}
                    fontFamily="mono"
                    fontSize="xs"
                    sx={!showStep2 && consoleOutput ? {
                      filter: 'blur(5px)',
                      userSelect: 'none',
                    } : undefined}
                  />
                  {consoleOutput && !isValidOutput && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      Invalid JSON - paste the clipboard contents from running the script
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
                </Field.Root>

                <Separator />

                {/* Step 3: Manual cf_clearance entry */}
                <Field.Root>
                  <HStack justify="space-between" mb={1}>
                    <Field.Label fontSize="sm" fontWeight="bold" mb={0}>
                      Step 3: Enter cf_clearance (from Application tab)
                    </Field.Label>
                    <IconButton
                      aria-label={showStep3 ? 'Hide cf_clearance value' : 'Show cf_clearance value'}
                      size="xs"
                      variant="ghost"
                      onClick={() => setShowStep3(!showStep3)}>{showStep3 ? <FaEyeSlash /> : <FaEye />}</IconButton>
                  </HStack>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    In DevTools → Application → Cookies → myfigurecollection.net → find cf_clearance → double-click its Value → Ctrl+C to copy
                  </Text>
                  <InputGroup size="sm">
                    <Input
                      type={showStep3 ? 'text' : 'password'}
                      value={cfClearance}
                      onValueChange={(e) => handleCfClearanceChange(e.target.value)}
                      placeholder="cf_clearance value (required for Cloudflare bypass)"
                      fontFamily="mono"
                      fontSize="xs"
                    />
                  </InputGroup>
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
                </Field.Root>

                {/* Storage Options */}
                <Field.Root>
                  <Field.Label fontSize="sm">
                    Storage Option:
                    <Text as="span" ml={2} color={storageTextColor} fontWeight="normal">
                      {storageType === 'session' && '(cleared on logout)'}
                      {storageType === 'persistent' && '(encrypted, persistent)'}
                    </Text>
                  </Field.Label>
                  <RadioGroup.Root
                    value={storageType}
                    onValueChange={(v) => handleStorageTypeChange(v as StorageType)}>
                    <Stack direction="column" gap={2}>
                      <RadioGroup.Item value="session" size="sm"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator /><RadioGroup.ItemText>
                          <Tooltip content="Stored in browser session - cleared when you log out">
                            <Text fontSize="sm">Remember for this session (cleared on logout)</Text>
                          </Tooltip>
                        </RadioGroup.ItemText></RadioGroup.Item>
                      <RadioGroup.Item value="persistent" size="sm"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator /><RadioGroup.ItemText>
                          <Tooltip content="Encrypted and stored in browser - persists until manually cleared">
                            <Text fontSize="sm">Remember until cleared (encrypted storage)</Text>
                          </Tooltip>
                        </RadioGroup.ItemText></RadioGroup.Item>
                    </Stack>
                  </RadioGroup.Root>
                </Field.Root>

                {/* Collapsible Security Section */}
                <Box>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSecurity(!showSecurity)}
                    width="full"
                    justifyContent="space-between"><HStack>
                      <FaLock />
                      <Text>Security & Privacy</Text>
                    </HStack>{showSecurity ? <FaChevronUp /> : <FaChevronDown />}</Button>
                  <Collapsible.Root open={showSecurity}>
                    <Collapsible.Content>
                      <Alert.Root status="info" mt={2} borderRadius="md">
                        <Alert.Indicator />
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
                      </Alert.Root>
                    </Collapsible.Content>
                  </Collapsible.Root>
                </Box>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <HStack gap={3}>
                <Button
                  size="sm"
                  colorPalette="red"
                  variant="outline"
                  onClick={handleClear}
                  disabled={!cookiesStored && !consoleOutput.trim() && !cfClearance.trim()}><FaTrash />Clear Cookies
                              </Button>
                <Button
                  size="sm"
                  colorPalette="blue"
                  onClick={handleSave}
                  disabled={!isValidOutput || !hasRequiredCookies || !hasChanges}><FaSave />Save
                              </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>

      </Portal>
    </Dialog.Root>
  );
};

export default MfcCookiesModal;
