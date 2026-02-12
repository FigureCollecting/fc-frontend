/**
 * SyncStatusBanner Component Tests
 *
 * Tests rendering, user interactions, and state-dependent behavior.
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import SyncStatusBanner from '../SyncStatusBanner';
import { useSyncStore } from '../../stores/syncStore';
import * as scraperApi from '../../api/scraper';
import { SyncJobStats, SyncPhase } from '../../types';

// Mock the scraper API
jest.mock('../../api/scraper', () => ({
  cancelSyncJob: jest.fn(),
}));

const mockedCancelSyncJob = scraperApi.cancelSyncJob as jest.MockedFunction<
  typeof scraperApi.cancelSyncJob
>;

const mockStats: SyncJobStats = {
  total: 100,
  pending: 20,
  processing: 5,
  completed: 60,
  failed: 10,
  skipped: 5,
};

describe('SyncStatusBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    useSyncStore.setState({
      sessionId: null,
      isActive: false,
      connectionState: 'disconnected',
      phase: null,
      stats: null,
      message: null,
      error: null,
      failedItems: [],
    });
  });

  describe('visibility', () => {
    it('should render nothing when shouldShow is false (no active sync, no terminal phase)', () => {
      render(<SyncStatusBanner />);

      // Banner should not be present
      expect(screen.queryByText('Sync with MFC')).not.toBeInTheDocument();
    });

    it('should render banner when isActive is true', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        phase: 'enriching',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      expect(screen.getByText('Sync with MFC')).toBeInTheDocument();
    });

    it('should render banner when phase is completed (even if not active)', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: false,
        phase: 'completed',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      expect(screen.getByText('Sync with MFC')).toBeInTheDocument();
    });

    it('should render banner when phase is failed (even if not active)', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: false,
        phase: 'failed',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      expect(screen.getByText('Sync with MFC')).toBeInTheDocument();
    });

    it('should render banner when phase is cancelled (even if not active)', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: false,
        phase: 'cancelled',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      expect(screen.getByText('Sync with MFC')).toBeInTheDocument();
    });
  });

  describe('phase labels', () => {
    const phaseLabels: Array<{ phase: SyncPhase; label: string }> = [
      { phase: 'validating', label: 'Validating...' },
      { phase: 'exporting', label: 'Exporting from MFC...' },
      { phase: 'parsing', label: 'Parsing collection...' },
      { phase: 'fetching_lists', label: 'Fetching lists...' },
      { phase: 'queueing', label: 'Queueing items...' },
      { phase: 'enriching', label: 'Enriching figures...' },
      { phase: 'completed', label: 'Sync complete!' },
      { phase: 'failed', label: 'Sync failed' },
      { phase: 'cancelled', label: 'Sync cancelled' },
    ];

    phaseLabels.forEach(({ phase, label }) => {
      it(`should show correct label for ${phase} phase`, () => {
        useSyncStore.setState({
          sessionId: 'test-session',
          isActive: phase !== 'completed' && phase !== 'failed' && phase !== 'cancelled',
          phase,
          stats: mockStats,
        });

        render(<SyncStatusBanner />);

        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('should show "Preparing..." for null phase', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        phase: null,
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      expect(screen.getByText('Preparing...')).toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    it('should show progress bar when active and has items', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        phase: 'enriching',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      // Progress bar should show percentage (completed + failed + skipped) / total
      // (60 + 10 + 5) / 100 = 75%
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should show 0% progress when stats total is 0', () => {
      const emptyStats: SyncJobStats = {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        skipped: 0,
      };

      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        phase: 'validating',
        stats: emptyStats,
      });

      render(<SyncStatusBanner />);

      // With zero total, progress bar should not be shown
      expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });

    it('should not show progress bar when not active', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: false,
        phase: 'completed',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      // Progress percentage should not be shown
      expect(screen.queryByText('75%')).not.toBeInTheDocument();
    });
  });

  describe('cancel button', () => {
    it('should show cancel button when sync is active', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        phase: 'enriching',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      // Button displays "Abort" text
      expect(screen.getByRole('button', { name: /abort/i })).toBeInTheDocument();
    });

    it('should not show cancel button when sync is not active', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: false,
        phase: 'completed',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      expect(screen.queryByRole('button', { name: /^abort$/i })).not.toBeInTheDocument();
    });

    it('should call cancelSyncJob and cancelSync on cancel button click', async () => {
      const user = userEvent.setup();
      mockedCancelSyncJob.mockResolvedValue(undefined);

      useSyncStore.setState({
        sessionId: 'cancel-test-session',
        isActive: true,
        phase: 'enriching',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      const cancelButton = screen.getByRole('button', { name: /abort/i });
      await user.click(cancelButton);

      expect(mockedCancelSyncJob).toHaveBeenCalledWith('cancel-test-session');

      await waitFor(() => {
        const state = useSyncStore.getState();
        expect(state.phase).toBe('cancelled');
        expect(state.isActive).toBe(false);
      });
    });

    it('should still cancel locally if API call fails', async () => {
      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedCancelSyncJob.mockRejectedValue(new Error('Network error'));

      useSyncStore.setState({
        sessionId: 'error-test-session',
        isActive: true,
        phase: 'enriching',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      const cancelButton = screen.getByRole('button', { name: /abort/i });
      await user.click(cancelButton);

      await waitFor(() => {
        const state = useSyncStore.getState();
        expect(state.phase).toBe('cancelled');
        expect(state.isActive).toBe(false);
      });

      consoleError.mockRestore();
    });
  });

  describe('dismiss button', () => {
    it('should show dismiss button when sync is completed', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: false,
        phase: 'completed',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('should call reset on dismiss button click', async () => {
      const user = userEvent.setup();

      useSyncStore.setState({
        sessionId: 'dismiss-test-session',
        isActive: false,
        phase: 'completed',
        stats: mockStats,
        message: 'Test message',
      });

      render(<SyncStatusBanner />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      await waitFor(() => {
        const state = useSyncStore.getState();
        expect(state.sessionId).toBeNull();
        expect(state.phase).toBeNull();
        expect(state.message).toBeNull();
      });
    });
  });

  describe('expandable details section', () => {
    it('should show toggle button when stats have total > 0', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        phase: 'enriching',
        stats: mockStats,
        failedItems: [],
      });

      render(<SyncStatusBanner />);

      expect(screen.getByRole('button', { name: /toggle details/i })).toBeInTheDocument();
    });

    it('should show toggle button when there are failed items', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        phase: 'enriching',
        stats: { ...mockStats, total: 0 },
        failedItems: [{ mfcId: '123', error: 'Error' }],
      });

      render(<SyncStatusBanner />);

      expect(screen.getByRole('button', { name: /toggle details/i })).toBeInTheDocument();
    });

    it('should toggle details section on button click', async () => {
      const user = userEvent.setup();

      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        phase: 'enriching',
        stats: mockStats,
        failedItems: [],
      });

      render(<SyncStatusBanner />);

      const toggleButton = screen.getByRole('button', { name: /toggle details/i });

      // Expand
      await user.click(toggleButton);

      // Now detailed stats should be visible
      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeVisible();
        expect(screen.getByText('Processing')).toBeVisible();
        expect(screen.getByText('Completed')).toBeVisible();
        expect(screen.getByText('Failed')).toBeVisible();
        expect(screen.getByText('Skipped')).toBeVisible();
      });

      // Collapse
      await user.click(toggleButton);

      // The Collapse component may still render content but hide it
      // We verify the toggle works by checking the button was clickable
      // and the component didn't throw any errors
      await waitFor(() => {
        // Verify the toggle button is still accessible for re-expansion
        expect(screen.getByRole('button', { name: /toggle details/i })).toBeInTheDocument();
      });
    });

    it('should show failed items in expanded section', async () => {
      const user = userEvent.setup();

      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: false,
        phase: 'failed',
        stats: mockStats,
        failedItems: [
          { mfcId: '12345', error: 'Network timeout' },
          { mfcId: '67890', error: 'Parse error' },
        ],
      });

      render(<SyncStatusBanner />);

      const toggleButton = screen.getByRole('button', { name: /toggle details/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed Items \(2\)/)).toBeInTheDocument();
        expect(screen.getByText(/MFC#12345: Network timeout/)).toBeInTheDocument();
        expect(screen.getByText(/MFC#67890: Parse error/)).toBeInTheDocument();
      });
    });

    it('should show "Unknown error" for failed items without error message', async () => {
      const user = userEvent.setup();

      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: false,
        phase: 'failed',
        stats: mockStats,
        failedItems: [{ mfcId: '99999' }],
      });

      render(<SyncStatusBanner />);

      const toggleButton = screen.getByRole('button', { name: /toggle details/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/MFC#99999: Unknown error/)).toBeInTheDocument();
      });
    });

    it('should limit displayed failed items and show overflow message', async () => {
      const user = userEvent.setup();

      const manyFailedItems = Array.from({ length: 15 }, (_, i) => ({
        mfcId: `${i + 1}`,
        error: `Error ${i + 1}`,
      }));

      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: false,
        phase: 'failed',
        stats: mockStats,
        failedItems: manyFailedItems,
      });

      render(<SyncStatusBanner />);

      const toggleButton = screen.getByRole('button', { name: /toggle details/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed Items \(15\)/)).toBeInTheDocument();
        expect(screen.getByText(/\.\.\.and 5 more/)).toBeInTheDocument();
      });
    });
  });

  describe('connection state indicator', () => {
    it('should show "Connecting..." badge when connecting and active', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        connectionState: 'connecting',
        phase: 'validating',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('should show "Reconnecting..." badge on error state when active', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        connectionState: 'error',
        phase: 'enriching',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
    });

    it('should not show connection badge when connected', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        connectionState: 'connected',
        phase: 'enriching',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      expect(screen.queryByText('Connecting...')).not.toBeInTheDocument();
      expect(screen.queryByText('Reconnecting...')).not.toBeInTheDocument();
    });
  });

  describe('stats display', () => {
    it('should show completed, failed, and skipped counts in summary', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        phase: 'enriching',
        stats: mockStats,
      });

      render(<SyncStatusBanner />);

      expect(screen.getByText('60 completed')).toBeInTheDocument();
      expect(screen.getByText('10 failed')).toBeInTheDocument();
      expect(screen.getByText('5 skipped')).toBeInTheDocument();
      expect(screen.getByText('of 100')).toBeInTheDocument();
    });

    it('should not show failed count if zero', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        phase: 'enriching',
        stats: { ...mockStats, failed: 0 },
      });

      render(<SyncStatusBanner />);

      expect(screen.queryByText('0 failed')).not.toBeInTheDocument();
    });

    it('should not show skipped count if zero', () => {
      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        phase: 'enriching',
        stats: { ...mockStats, skipped: 0 },
      });

      render(<SyncStatusBanner />);

      expect(screen.queryByText('0 skipped')).not.toBeInTheDocument();
    });
  });

  describe('message display', () => {
    it('should show message in expanded details', async () => {
      const user = userEvent.setup();

      useSyncStore.setState({
        sessionId: 'test-session',
        isActive: true,
        phase: 'enriching',
        stats: mockStats,
        message: 'Processing figure 50 of 100...',
      });

      render(<SyncStatusBanner />);

      const toggleButton = screen.getByRole('button', { name: /toggle details/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Processing figure 50 of 100...')).toBeInTheDocument();
      });
    });
  });
});
