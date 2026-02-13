/**
 * Tests for scraper API client
 */
import axios from 'axios';

// Mock axios BEFORE importing scraper
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock auth store
jest.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: { token: 'test-token' },
    })),
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    verbose: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Set up mock axios instance
const mockAxiosInstance: any = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

mockedAxios.create.mockReturnValue(mockAxiosInstance);

// Now import after mocks are set up
let scraperModule: typeof import('../scraper');

beforeAll(() => {
  jest.isolateModules(() => {
    scraperModule = require('../scraper');
  });
});

describe('Scraper API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMfcCookieAllowlist', () => {
    it('should fetch cookie allowlist successfully', async () => {
      const mockData = {
        allowedCookies: ['PHPSESSID', 'sesUID'],
        scriptReadable: ['PHPSESSID'],
        manualCopy: ['cf_clearance'],
      };
      mockAxiosInstance.get.mockResolvedValue({ data: { success: true, data: mockData } });

      const result = await scraperModule.getMfcCookieAllowlist();
      expect(result).toEqual(mockData);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sync/mfc/cookie-allowlist');
    });

    it('should throw on unsuccessful response', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: false, message: 'Service unavailable' },
      });

      await expect(scraperModule.getMfcCookieAllowlist()).rejects.toThrow('Service unavailable');
    });
  });

  describe('validateMfcCookies', () => {
    it('should validate cookies successfully', async () => {
      const validationResult = { valid: true, username: 'testuser' };
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true, data: validationResult } });

      const cookies = { PHPSESSID: 'abc', sesUID: '123', sesDID: '456' };
      const result = await scraperModule.validateMfcCookies(cookies);
      expect(result).toEqual(validationResult);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/sync/validate-cookies', { cookies });
    });

    it('should throw on validation failure', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: false, message: 'Invalid cookies' },
      });

      const cookies = { PHPSESSID: 'abc', sesUID: '123', sesDID: '456' };
      await expect(scraperModule.validateMfcCookies(cookies)).rejects.toThrow('Invalid cookies');
    });
  });

  describe('executeFullSync', () => {
    it('should execute full sync and return results', async () => {
      const syncResult = {
        parsedCount: 10,
        queuedCount: 8,
        skippedCount: 2,
        listsFound: 3,
        stats: { owned: 5, ordered: 3, wished: 2, total: 10, nsfw: 0 },
        errors: [],
      };
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true, data: syncResult } });

      const options = {
        cookies: { PHPSESSID: 'abc', sesUID: '123', sesDID: '456' },
        userId: 'user1',
        sessionId: 'sess1',
        includeLists: true,
        skipCached: false,
        statusFilter: ['owned' as const],
      };
      const result = await scraperModule.executeFullSync(options);
      expect(result.success).toBe(true);
      expect(result.parsedCount).toBe(10);
      expect(result.queuedCount).toBe(8);
    });

    it('should throw on sync failure', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: false, message: 'Sync failed' },
      });

      const options = {
        cookies: { PHPSESSID: 'abc', sesUID: '123', sesDID: '456' },
        userId: 'user1',
        sessionId: 'sess1',
      };
      await expect(scraperModule.executeFullSync(options)).rejects.toThrow('Sync failed');
    });
  });

  describe('syncFromCsv', () => {
    it('should sync from CSV content', async () => {
      const syncResult = {
        parsedCount: 5,
        queuedCount: 5,
        skippedCount: 0,
        stats: { owned: 5, ordered: 0, wished: 0, total: 5, nsfw: 0 },
        errors: [],
      };
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true, data: syncResult } });

      const result = await scraperModule.syncFromCsv({
        csvContent: 'csv-content',
        userId: 'user1',
      });
      expect(result.success).toBe(true);
      expect(result.parsedCount).toBe(5);
    });

    it('should throw on CSV sync failure', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: false, message: 'CSV parse error' },
      });

      await expect(
        scraperModule.syncFromCsv({ csvContent: 'bad', userId: 'user1' })
      ).rejects.toThrow('CSV parse error');
    });
  });

  describe('parseMfcCsv', () => {
    it('should parse CSV and return items', async () => {
      const parseResult = {
        items: [{ mfcId: '123', name: 'Figure', status: 'owned' }],
        stats: { owned: 1, ordered: 0, wished: 0, total: 1, nsfw: 0 },
      };
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true, data: parseResult } });

      const result = await scraperModule.parseMfcCsv('csv-content');
      expect(result.items).toHaveLength(1);
    });

    it('should throw on parse failure', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: false, message: 'Parse failed' },
      });

      await expect(scraperModule.parseMfcCsv('bad-csv')).rejects.toThrow('Parse failed');
    });
  });

  describe('getQueueStats', () => {
    it('should fetch queue stats', async () => {
      const stats = { queues: { hot: 1, warm: 2, cold: 3 }, total: 6 };
      mockAxiosInstance.get.mockResolvedValue({ data: { success: true, data: stats } });

      const result = await scraperModule.getQueueStats();
      expect(result).toEqual(stats);
    });

    it('should throw on failure', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: false, message: 'Queue unavailable' },
      });
      await expect(scraperModule.getQueueStats()).rejects.toThrow('Queue unavailable');
    });
  });

  describe('getSyncStatus', () => {
    it('should fetch sync status', async () => {
      const status = { queueStats: {}, isProcessing: true };
      mockAxiosInstance.get.mockResolvedValue({ data: { success: true, data: status } });

      const result = await scraperModule.getSyncStatus();
      expect(result.isProcessing).toBe(true);
    });

    it('should throw on failure', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: false, message: 'Status error' },
      });
      await expect(scraperModule.getSyncStatus()).rejects.toThrow('Status error');
    });
  });

  describe('createSyncJob', () => {
    it('should create a sync job', async () => {
      const jobResult = {
        success: true,
        job: { sessionId: 'sess1', phase: 'validating', message: 'Starting' },
        webhookUrl: 'http://localhost/webhook',
        webhookSecret: 'secret',
      };
      mockAxiosInstance.post.mockResolvedValue({ data: jobResult });

      const result = await scraperModule.createSyncJob({ sessionId: 'sess1' });
      expect(result.webhookUrl).toBeTruthy();
    });

    it('should throw on failure', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: false, message: 'Job creation failed' },
      });
      await expect(scraperModule.createSyncJob({ sessionId: 'x' })).rejects.toThrow(
        'Job creation failed'
      );
    });
  });

  describe('getSyncJob', () => {
    it('should fetch sync job', async () => {
      const job = { sessionId: 'sess1', phase: 'enriching', message: 'Processing' };
      mockAxiosInstance.get.mockResolvedValue({ data: { success: true, job } });

      const result = await scraperModule.getSyncJob('sess1');
      expect(result).toEqual(job);
    });

    it('should return null on unsuccessful response', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { success: false } });

      const result = await scraperModule.getSyncJob('sess1');
      expect(result).toBeNull();
    });

    it('should return null on 404', async () => {
      mockAxiosInstance.get.mockRejectedValue({ response: { status: 404 } });

      const result = await scraperModule.getSyncJob('sess1');
      expect(result).toBeNull();
    });

    it('should rethrow on non-404 errors', async () => {
      const error = new Error('Server error');
      (error as any).response = { status: 500 };
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(scraperModule.getSyncJob('sess1')).rejects.toThrow('Server error');
    });
  });

  describe('getActiveJob', () => {
    it('should return job when active', async () => {
      const job = { sessionId: 'active1', phase: 'enriching' };
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, hasActiveJob: true, job },
      });

      const result = await scraperModule.getActiveJob();
      expect(result).toEqual(job);
    });

    it('should return null when no active job', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, hasActiveJob: false },
      });

      const result = await scraperModule.getActiveJob();
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      const result = await scraperModule.getActiveJob();
      expect(result).toBeNull();
    });

    it('should return null on unsuccessful response', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: false },
      });

      const result = await scraperModule.getActiveJob();
      expect(result).toBeNull();
    });
  });

  describe('cancelSyncJob', () => {
    it('should cancel a sync job', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: { success: true } });

      await expect(scraperModule.cancelSyncJob('sess1')).resolves.not.toThrow();
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/sync/job/sess1');
    });

    it('should throw on failure', async () => {
      mockAxiosInstance.delete.mockResolvedValue({
        data: { success: false, message: 'Cannot cancel' },
      });
      await expect(scraperModule.cancelSyncJob('x')).rejects.toThrow('Cannot cancel');
    });
  });

  describe('getSyncSessions', () => {
    it('should fetch sync sessions', async () => {
      const data = { sessions: [], count: 0, pausedCount: 0, inCooldownCount: 0 };
      mockAxiosInstance.get.mockResolvedValue({ data: { success: true, data } });

      const result = await scraperModule.getSyncSessions();
      expect(result.count).toBe(0);
    });

    it('should throw on failure', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: false, message: 'Sessions error' },
      });
      await expect(scraperModule.getSyncSessions()).rejects.toThrow('Sessions error');
    });
  });

  describe('resumeSyncSession', () => {
    it('should resume a session', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });
      await expect(scraperModule.resumeSyncSession('sess1')).resolves.not.toThrow();
    });

    it('should throw on failure', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: false, message: 'Cannot resume' },
      });
      await expect(scraperModule.resumeSyncSession('x')).rejects.toThrow('Cannot resume');
    });
  });

  describe('cancelFailedItems', () => {
    it('should cancel failed items and return count', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true, data: { cancelledCount: 3 } },
      });

      const result = await scraperModule.cancelFailedItems('sess1');
      expect(result).toBe(3);
    });

    it('should throw on failure', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: false, message: 'Cannot cancel failed' },
      });
      await expect(scraperModule.cancelFailedItems('x')).rejects.toThrow('Cannot cancel failed');
    });
  });
});
