/**
 * SyncStatusBanner - Persistent sync progress display
 *
 * Shows sync progress in a non-modal banner that appears when a sync is active.
 * Displays: phase, progress bar, item counts, and cancel button.
 */

import React, { useMemo } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Progress,
  Button,
  IconButton,
  Badge,
  Collapse,
  useDisclosure,
  useColorModeValue,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import {
  FaSync,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaPlay,
  FaForward,
  FaPlug,
} from 'react-icons/fa';
import { useSyncStore } from '../stores/syncStore';
import { cancelSyncJob, resumeSyncSession, cancelFailedItems } from '../api/scraper';
import { SyncPhase } from '../types';
import { useSessionRecovery } from '../hooks/useSessionRecovery';
import { syncLogger } from '../utils/logger';

/**
 * Get human-readable phase label.
 */
function getPhaseLabel(phase: SyncPhase | null): string {
  switch (phase) {
    case 'validating':
      return 'Validating...';
    case 'exporting':
      return 'Exporting from MFC...';
    case 'parsing':
      return 'Parsing collection...';
    case 'fetching_lists':
      return 'Fetching lists...';
    case 'queueing':
      return 'Queueing items...';
    case 'enriching':
      return 'Enriching figures...';
    case 'completed':
      return 'Sync complete!';
    case 'failed':
      return 'Sync failed';
    case 'cancelled':
      return 'Sync cancelled';
    default:
      return 'Preparing...';
  }
}

/**
 * Get phase icon and color.
 */
function getPhaseStatus(phase: SyncPhase | null): {
  icon: typeof FaSync;
  color: string;
  isSpinning: boolean;
} {
  switch (phase) {
    case 'completed':
      return { icon: FaCheckCircle, color: 'green.500', isSpinning: false };
    case 'failed':
      return { icon: FaTimesCircle, color: 'red.500', isSpinning: false };
    case 'cancelled':
      return { icon: FaExclamationTriangle, color: 'orange.500', isSpinning: false };
    default:
      return { icon: FaSync, color: 'blue.500', isSpinning: true };
  }
}

const SyncStatusBanner: React.FC = () => {
  const { isOpen: isExpanded, onToggle } = useDisclosure();

  const {
    sessionId,
    isActive,
    connectionState,
    phase,
    stats,
    message,
    failedItems,
    isPaused,
    hasOrphanedSession,
    orphanedSessionData,
    cancelSync,
    reset,
    setIsPaused,
    recoverSession,
    dismissOrphanedSession,
  } = useSyncStore();

  // Check for orphaned sessions on mount
  useSessionRecovery();

  // Colors
  const bgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const completeBgColor = useColorModeValue('green.50', 'green.900');
  const completeBorderColor = useColorModeValue('green.200', 'green.700');
  const failedBgColor = useColorModeValue('red.50', 'red.900');
  const failedBorderColor = useColorModeValue('red.200', 'red.700');
  const recoveryBgColor = useColorModeValue('orange.50', 'orange.900');
  const recoveryBorderColor = useColorModeValue('orange.200', 'orange.700');

  // Calculate progress
  const progressPercent = useMemo(() => {
    if (!stats || stats.total === 0) return 0;
    return Math.round(((stats.completed + stats.failed + stats.skipped) / stats.total) * 100);
  }, [stats]);

  // Phase status
  const phaseStatus = getPhaseStatus(phase);

  // Determine if we should show the banner
  const shouldShow = isActive || phase === 'completed' || phase === 'failed' || phase === 'cancelled' || hasOrphanedSession;

  // Handle reconnect to orphaned session
  const handleReconnect = () => {
    if (orphanedSessionData) {
      recoverSession(orphanedSessionData);
    }
  };

  // Handle cancel orphaned session
  const handleCancelOrphaned = async () => {
    if (orphanedSessionData) {
      try {
        await cancelSyncJob(orphanedSessionData.sessionId);
        dismissOrphanedSession();
      } catch (error) {
        syncLogger.error('Failed to cancel orphaned session:', error);
        dismissOrphanedSession(); // Dismiss locally anyway
      }
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (sessionId) {
      try {
        await cancelSyncJob(sessionId);
        cancelSync();
      } catch (error) {
        syncLogger.error('Failed to cancel sync:', error);
        cancelSync(); // Cancel locally anyway
      }
    }
  };

  // Handle resume (when paused due to failures)
  const handleResume = async () => {
    if (sessionId) {
      try {
        await resumeSyncSession(sessionId);
        setIsPaused(false);
      } catch (error) {
        syncLogger.error('Failed to resume sync:', error);
      }
    }
  };

  // Handle skip failed items
  const handleSkipFailed = async () => {
    if (sessionId) {
      try {
        const skippedCount = await cancelFailedItems(sessionId);
        syncLogger.info('Skipped failed items:', skippedCount);
        // Clear failed items from local state
        // The stats will update via SSE
      } catch (error) {
        syncLogger.error('Failed to skip failed items:', error);
      }
    }
  };

  // Handle dismiss (for completed/failed/cancelled states)
  const handleDismiss = () => {
    reset();
  };

  if (!shouldShow) return null;

  // Determine colors based on state
  let currentBgColor = bgColor;
  let currentBorderColor = borderColor;
  if (hasOrphanedSession && !isActive) {
    currentBgColor = recoveryBgColor;
    currentBorderColor = recoveryBorderColor;
  } else if (phase === 'completed') {
    currentBgColor = completeBgColor;
    currentBorderColor = completeBorderColor;
  } else if (phase === 'failed' || phase === 'cancelled') {
    currentBgColor = failedBgColor;
    currentBorderColor = failedBorderColor;
  }

  // Render recovery banner if orphaned session detected
  if (hasOrphanedSession && !isActive && orphanedSessionData) {
    const orphanedStats = orphanedSessionData.stats;
    const orphanedProgress = orphanedStats.total > 0
      ? Math.round(((orphanedStats.completed + orphanedStats.failed + orphanedStats.skipped) / orphanedStats.total) * 100)
      : 0;

    return (
      <Box
        position="sticky"
        top={0}
        zIndex={100}
        bg={currentBgColor}
        borderBottom="1px"
        borderColor={currentBorderColor}
        px={4}
        py={2}
      >
        <Flex align="center" justify="space-between">
          <HStack spacing={3} flex={1}>
            <Icon as={FaPlug} color="orange.500" boxSize={5} />
            <VStack align="start" spacing={0} flex={1}>
              <HStack>
                <Text fontWeight="bold" fontSize="sm">
                  Sync Session Found
                </Text>
                <Badge colorScheme="orange" fontSize="xs">
                  {orphanedSessionData.phase}
                </Badge>
              </HStack>
              <Text fontSize="xs" color="gray.600">
                A sync session is running in the background ({orphanedProgress}% complete - {orphanedStats.completed}/{orphanedStats.total})
              </Text>
            </VStack>
          </HStack>

          <HStack spacing={2}>
            <Tooltip label="Reconnect to this session to see live progress">
              <Button
                size="sm"
                colorScheme="green"
                leftIcon={<FaPlug />}
                onClick={handleReconnect}
              >
                Reconnect
              </Button>
            </Tooltip>
            <Tooltip label="Cancel this sync session">
              <Button
                size="sm"
                variant="outline"
                colorScheme="red"
                leftIcon={<FaTimes />}
                onClick={handleCancelOrphaned}
              >
                Cancel
              </Button>
            </Tooltip>
            <Tooltip label="Dismiss this notification">
              <IconButton
                aria-label="Dismiss"
                icon={<FaTimes />}
                size="sm"
                variant="ghost"
                onClick={dismissOrphanedSession}
              />
            </Tooltip>
          </HStack>
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={100}
      bg={currentBgColor}
      borderBottom="1px"
      borderColor={currentBorderColor}
      px={4}
      py={2}
    >
      <Flex align="center" justify="space-between">
        {/* Left: Icon and status */}
        <HStack spacing={3} flex={1}>
          <Icon
            as={phaseStatus.icon}
            color={phaseStatus.color}
            boxSize={5}
            className={phaseStatus.isSpinning ? 'spin' : ''}
            sx={phaseStatus.isSpinning ? {
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            } : {}}
          />
          <VStack align="start" spacing={0} flex={1}>
            <HStack>
              <Text fontWeight="bold" fontSize="sm">
                Sync with MFC
              </Text>
              <Badge
                colorScheme={
                  phase === 'completed' ? 'green' :
                  phase === 'failed' || phase === 'cancelled' ? 'red' :
                  'blue'
                }
                fontSize="xs"
              >
                {getPhaseLabel(phase)}
              </Badge>
              {connectionState !== 'connected' && isActive && (
                <Badge colorScheme="yellow" fontSize="xs">
                  {connectionState === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
                </Badge>
              )}
            </HStack>
            {stats && stats.total > 0 && (
              <HStack spacing={2} fontSize="xs" color="gray.600">
                {/* Per-status progress if available */}
                {stats.byStatus ? (
                  <>
                    <Text>
                      <Text as="span" fontWeight="semibold" color="green.600">Owned:</Text>{' '}
                      {stats.byStatus.owned.completed}/{stats.byStatus.owned.queued}
                    </Text>
                    <Text color="gray.400">|</Text>
                    <Text>
                      <Text as="span" fontWeight="semibold" color="blue.600">Ordered:</Text>{' '}
                      {stats.byStatus.ordered.completed}/{stats.byStatus.ordered.queued}
                    </Text>
                    <Text color="gray.400">|</Text>
                    <Text>
                      <Text as="span" fontWeight="semibold" color="purple.600">Wished:</Text>{' '}
                      {stats.byStatus.wished.completed}/{stats.byStatus.wished.queued}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text>{stats.completed} completed</Text>
                    {stats.failed > 0 && <Text color="red.500">{stats.failed} failed</Text>}
                    {stats.skipped > 0 && <Text color="gray.500">{stats.skipped} skipped</Text>}
                    <Text>of {stats.total}</Text>
                  </>
                )}
              </HStack>
            )}
          </VStack>
        </HStack>

        {/* Center: Progress bar (only for active sync with items) */}
        {isActive && stats && stats.total > 0 && (
          <Box flex={1} mx={4} maxW="300px">
            <Progress
              value={progressPercent}
              size="sm"
              colorScheme={phase === 'enriching' ? 'green' : 'blue'}
              borderRadius="full"
              hasStripe
              isAnimated={isActive}
            />
            <Text fontSize="xs" textAlign="center" color="gray.500" mt={1}>
              {progressPercent}%
            </Text>
          </Box>
        )}

        {/* Right: Actions */}
        <HStack spacing={2}>
          {/* Expand/collapse details */}
          {(failedItems.length > 0 || (stats && stats.total > 0)) && (
            <Tooltip label={isExpanded ? 'Hide details' : 'Show details'}>
              <IconButton
                aria-label="Toggle details"
                icon={isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                size="sm"
                variant="ghost"
                onClick={onToggle}
              />
            </Tooltip>
          )}

          {/* Resume button (when paused) */}
          {isActive && isPaused && (
            <Tooltip label="Resume sync after fixing issues">
              <Button
                size="sm"
                variant="solid"
                colorScheme="green"
                leftIcon={<FaPlay />}
                onClick={handleResume}
              >
                Resume
              </Button>
            </Tooltip>
          )}

          {/* Skip failed button (when there are failed items) */}
          {isActive && stats && stats.failed > 0 && (
            <Tooltip label="Skip failed items and continue with remaining">
              <Button
                size="sm"
                variant="outline"
                colorScheme="orange"
                leftIcon={<FaForward />}
                onClick={handleSkipFailed}
              >
                Skip Failed
              </Button>
            </Tooltip>
          )}

          {/* Cancel button (only for active sync) */}
          {isActive && (
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              leftIcon={<FaTimes />}
              onClick={handleCancel}
            >
              Abort
            </Button>
          )}

          {/* Dismiss button (for completed/failed/cancelled) */}
          {!isActive && (
            <Tooltip label="Dismiss">
              <IconButton
                aria-label="Dismiss"
                icon={<FaTimes />}
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              />
            </Tooltip>
          )}
        </HStack>
      </Flex>

      {/* Expandable details section */}
      <Collapse in={isExpanded}>
        <Box mt={3} pt={3} borderTop="1px" borderColor={currentBorderColor}>
          {/* Per-status breakdown */}
          {stats?.byStatus && (
            <HStack spacing={6} wrap="wrap" mb={3}>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color="green.600" fontWeight="semibold">Owned</Text>
                <Text fontWeight="bold">
                  {stats.byStatus.owned.completed}/{stats.byStatus.owned.queued}
                  {stats.byStatus.owned.failed > 0 && (
                    <Text as="span" color="red.500" fontSize="xs"> ({stats.byStatus.owned.failed} failed)</Text>
                  )}
                </Text>
              </VStack>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color="blue.600" fontWeight="semibold">Ordered</Text>
                <Text fontWeight="bold">
                  {stats.byStatus.ordered.completed}/{stats.byStatus.ordered.queued}
                  {stats.byStatus.ordered.failed > 0 && (
                    <Text as="span" color="red.500" fontSize="xs"> ({stats.byStatus.ordered.failed} failed)</Text>
                  )}
                </Text>
              </VStack>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color="purple.600" fontWeight="semibold">Wished</Text>
                <Text fontWeight="bold">
                  {stats.byStatus.wished.completed}/{stats.byStatus.wished.queued}
                  {stats.byStatus.wished.failed > 0 && (
                    <Text as="span" color="red.500" fontSize="xs"> ({stats.byStatus.wished.failed} failed)</Text>
                  )}
                </Text>
              </VStack>
            </HStack>
          )}
          {/* Overall stats */}
          <HStack spacing={6} wrap="wrap">
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500">Pending</Text>
              <Text fontWeight="bold">{stats?.pending || 0}</Text>
            </VStack>
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500">Processing</Text>
              <Text fontWeight="bold" color="blue.500">{stats?.processing || 0}</Text>
            </VStack>
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500">Completed</Text>
              <Text fontWeight="bold" color="green.500">{stats?.completed || 0}</Text>
            </VStack>
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500">Failed</Text>
              <Text fontWeight="bold" color="red.500">{stats?.failed || 0}</Text>
            </VStack>
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500">Skipped</Text>
              <Text fontWeight="bold" color="gray.500">{stats?.skipped || 0}</Text>
            </VStack>
          </HStack>

          {/* Failed items list */}
          {failedItems.length > 0 && (
            <Box mt={3}>
              <Text fontSize="xs" color="red.500" fontWeight="bold" mb={1}>
                Failed Items ({failedItems.length}):
              </Text>
              <Box maxH="100px" overflowY="auto" fontSize="xs" color="gray.600">
                {failedItems.slice(0, 10).map((item, idx) => (
                  <Text key={idx}>
                    MFC#{item.mfcId}: {item.error || 'Unknown error'}
                  </Text>
                ))}
                {failedItems.length > 10 && (
                  <Text fontStyle="italic">...and {failedItems.length - 10} more</Text>
                )}
              </Box>
            </Box>
          )}

          {/* Message */}
          {message && (
            <Text fontSize="xs" color="gray.500" mt={2}>
              {message}
            </Text>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default SyncStatusBanner;
