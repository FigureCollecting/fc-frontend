/**
 * Tests for logger.ts - sanitizeLogValue, sanitizeArgs, and Logger class
 *
 * Covers log injection prevention (CWE-117), ANSI stripping,
 * truncation, and Logger level-gated output.
 */

import { sanitizeLogValue, createLogger } from '../logger';

describe('sanitizeLogValue', () => {
  it('should convert null to the string "null"', () => {
    expect(sanitizeLogValue(null)).toBe('null');
  });

  it('should convert undefined to the string "undefined"', () => {
    expect(sanitizeLogValue(undefined)).toBe('undefined');
  });

  it('should pass through plain strings unchanged', () => {
    expect(sanitizeLogValue('hello world')).toBe('hello world');
  });

  it('should extract message from Error instances', () => {
    expect(sanitizeLogValue(new Error('something broke'))).toBe('something broke');
  });

  it('should handle Error with empty message', () => {
    expect(sanitizeLogValue(new Error(''))).toBe('Error (no message)');
  });

  it('should JSON.stringify objects', () => {
    expect(sanitizeLogValue({ key: 'value' })).toBe('{"key":"value"}');
  });

  it('should JSON.stringify arrays', () => {
    expect(sanitizeLogValue([1, 2, 3])).toBe('[1,2,3]');
  });

  it('should handle numbers', () => {
    expect(sanitizeLogValue(42)).toBe('42');
  });

  it('should handle booleans', () => {
    expect(sanitizeLogValue(true)).toBe('true');
    expect(sanitizeLogValue(false)).toBe('false');
  });

  it('should fall back to String() when JSON.stringify fails', () => {
    // Create a circular reference that JSON.stringify cannot handle
    const circular: any = {};
    circular.self = circular;
    const result = sanitizeLogValue(circular);
    expect(result).toBe('[object Object]');
  });

  describe('newline removal (log forging prevention)', () => {
    it('should replace newlines with spaces', () => {
      expect(sanitizeLogValue('line1\nline2')).toBe('line1 line2');
    });

    it('should replace carriage returns with spaces', () => {
      expect(sanitizeLogValue('line1\rline2')).toBe('line1 line2');
    });

    it('should replace mixed newlines with spaces', () => {
      expect(sanitizeLogValue('a\r\nb\nc\rd')).toBe('a  b c d');
    });
  });

  describe('ANSI escape code removal', () => {
    it('should strip ANSI color codes', () => {
      expect(sanitizeLogValue('\x1b[31mred text\x1b[0m')).toBe('red text');
    });

    it('should strip bold ANSI codes', () => {
      expect(sanitizeLogValue('\x1b[1mbold\x1b[0m')).toBe('bold');
    });

    it('should strip complex ANSI sequences', () => {
      expect(sanitizeLogValue('\x1b[38;5;196mextended color\x1b[0m')).toBe('extended color');
    });
  });

  describe('truncation', () => {
    it('should not truncate strings under 1000 chars', () => {
      const short = 'a'.repeat(999);
      expect(sanitizeLogValue(short)).toBe(short);
    });

    it('should not truncate strings exactly at 1000 chars', () => {
      const exact = 'a'.repeat(1000);
      expect(sanitizeLogValue(exact)).toBe(exact);
    });

    it('should truncate strings over 1000 chars and append marker', () => {
      const long = 'x'.repeat(1500);
      const result = sanitizeLogValue(long);
      expect(result.length).toBe(1000 + '...[truncated]'.length);
      expect(result).toMatch(/^x{1000}\.\.\.\[truncated\]$/);
    });
  });
});

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create a logger with createLogger', () => {
    const logger = createLogger('TEST_MODULE');
    expect(logger).toBeDefined();
  });

  it('should prefix output with module name', () => {
    const logger = createLogger('MY_MOD');
    logger.debug('hello');
    expect(consoleLogSpy).toHaveBeenCalled();
    const args = consoleLogSpy.mock.calls[0];
    expect(args[0]).toBe('[MY_MOD]');
  });

  it('should include ISO timestamp in output', () => {
    const logger = createLogger('TIMESTAMP_TEST');
    logger.debug('test');
    const args = consoleLogSpy.mock.calls[0];
    // Second arg should be an ISO date string
    expect(args[1]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should sanitize arguments in output', () => {
    const logger = createLogger('SANITIZE_TEST');
    logger.debug('line1\nline2', null, undefined);
    const args = consoleLogSpy.mock.calls[0];
    // Third arg is the sanitized message string
    expect(args[2]).not.toContain('\n');
    expect(args[2]).toContain('null');
    expect(args[2]).toContain('undefined');
  });

  describe('level-gated methods', () => {
    it('verbose should call console.log when level is verbose', () => {
      const logger = createLogger('VERBOSE_TEST');
      // Override the private level to verbose (0) so the branch is entered
      (logger as any).level = 0;
      logger.verbose('verbose message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const args = consoleLogSpy.mock.calls[0];
      expect(args[0]).toBe('[VERBOSE_TEST]');
      expect(args[2]).toContain('verbose message');
    });

    it('verbose should not output when level is higher than verbose', () => {
      const logger = createLogger('VERBOSE_SKIP');
      (logger as any).level = 3; // error level
      logger.verbose('should not appear');
      // console.log may have been called by other code, check specifically
      const calls = consoleLogSpy.mock.calls.filter(
        (c: any[]) => c[0] === '[VERBOSE_SKIP]'
      );
      expect(calls.length).toBe(0);
    });

    it('info should call console.info when level permits', () => {
      const logger = createLogger('INFO_TEST');
      (logger as any).level = 0; // verbose level allows info
      logger.info('info message');
      expect(consoleInfoSpy).toHaveBeenCalled();
      const args = consoleInfoSpy.mock.calls[0];
      expect(args[0]).toBe('[INFO_TEST]');
      expect(args[2]).toContain('info message');
    });

    it('warn should call console.warn when level permits', () => {
      const logger = createLogger('WARN_TEST');
      (logger as any).level = 0; // allow all levels
      logger.warn('warn message');
      expect(consoleWarnSpy).toHaveBeenCalled();
      const args = consoleWarnSpy.mock.calls[0];
      expect(args[0]).toBe('[WARN_TEST]');
      expect(args[2]).toContain('warn message');
    });

    it('error should call console.error', () => {
      const logger = createLogger('ERROR_TEST');
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
      const args = consoleErrorSpy.mock.calls[0];
      expect(args[0]).toBe('[ERROR_TEST]');
      expect(args[2]).toContain('error message');
    });

    it('debug should call console.log', () => {
      const logger = createLogger('DEBUG_TEST');
      logger.debug('debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
