/**
 * The navigation helpers are a thin boundary over the unforgeable
 * window.location (jsdom >= 21); consumers mock this module. These tests pin
 * the real implementations as callable under jsdom, which reports
 * "Not implemented: navigation" through the virtual console without throwing.
 */
import { redirectTo, reloadPage } from '../navigation';

describe('navigation boundary', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Silence jsdom's "Not implemented: navigation" virtual-console report.
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('redirectTo assigns location.href without throwing', () => {
    expect(() => redirectTo('/somewhere')).not.toThrow();
  });

  it('reloadPage calls location.reload without throwing', () => {
    expect(() => reloadPage()).not.toThrow();
  });
});
