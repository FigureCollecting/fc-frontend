/**
 * The navigation helpers are a thin boundary over the unforgeable
 * window.location (jsdom >= 21); consumers mock this module. These tests pin
 * the real implementations: hash navigation is the one form jsdom implements
 * (observable via location.hash), and full navigations/reloads surface as a
 * synchronous "Not implemented: navigation" jsdomError that
 * jest-environment-jsdom forwards to console.error, captured here by a spy.
 */
import { redirectTo, reloadPage } from '../navigation';

const notImplementedNavigation = expect.objectContaining({
  message: expect.stringContaining('Not implemented: navigation'),
});

describe('navigation boundary', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    window.history.replaceState(null, '', 'http://localhost/');
  });

  it('redirectTo assigns location.href (hash navigation is observable)', () => {
    redirectTo('#navigated');
    expect(window.location.hash).toBe('#navigated');
  });

  it('redirectTo triggers a real navigation attempt for full paths', () => {
    redirectTo('/somewhere');
    expect(errorSpy).toHaveBeenCalledWith(notImplementedNavigation);
  });

  it('reloadPage calls location.reload (jsdom reports the navigation)', () => {
    reloadPage();
    expect(errorSpy).toHaveBeenCalledWith(notImplementedNavigation);
  });
});
