/**
 * Thin navigation boundary around window.location.
 *
 * jsdom >= 21 defines window.location as unforgeable (non-configurable), so
 * tests can no longer delete or replace it to observe redirects. Production
 * code routes hard navigations through these helpers; tests mock this module.
 */
export const redirectTo = (path: string): void => {
  window.location.href = path;
};

export const reloadPage = (): void => {
  window.location.reload();
};
