/**
 * CRACO Configuration for Figure Collector Frontend
 *
 * This configuration overrides react-scripts to enable webpack-dev-server v5 compatibility.
 *
 * Background:
 * - react-scripts@5.0.1 uses webpack-dev-server@4.x which has CVE-2025-30360
 * - webpack-dev-server@5.x has several breaking API changes:
 *   - `onAfterSetupMiddleware` / `onBeforeSetupMiddleware` → `setupMiddlewares`
 *   - `https` → `server: { type: 'https', options: {...} }`
 *   - `http2` → `server: { type: 'spdy', options: {...} }`
 *   - `proxy` object format → array format only
 * - CRACO allows us to intercept and transform the config without ejecting from CRA
 *
 * @see https://github.com/facebook/create-react-app/issues/17095
 * @see https://github.com/webpack/webpack-dev-server/blob/main/migration-v5.md
 * @see https://webpack.js.org/configuration/dev-server/#devserversetupmiddlewares
 */

module.exports = {
  devServer: (devServerConfig) => {
    // Extract all deprecated options that need transformation
    const {
      onBeforeSetupMiddleware,
      onAfterSetupMiddleware,
      https,
      http2,
      ...restConfig
    } = devServerConfig;

    let transformedConfig = { ...restConfig };

    // Transform deprecated middleware options to setupMiddlewares
    // webpack-dev-server v5 unified these into a single option
    if (onBeforeSetupMiddleware || onAfterSetupMiddleware) {
      transformedConfig.setupMiddlewares = (middlewares, devServer) => {
        // Call "before" middleware first (mimics onBeforeSetupMiddleware)
        if (onBeforeSetupMiddleware) {
          onBeforeSetupMiddleware(devServer);
        }

        // Call "after" middleware last (mimics onAfterSetupMiddleware)
        if (onAfterSetupMiddleware) {
          onAfterSetupMiddleware(devServer);
        }

        return middlewares;
      };
    }

    // Transform deprecated https option to server option
    // webpack-dev-server v5 replaced `https` with `server: { type: 'https', options: {...} }`
    if (https !== undefined) {
      if (typeof https === 'boolean') {
        // Simple boolean case: https: true → server: 'https'
        if (https) {
          transformedConfig.server = 'https';
        }
        // https: false is the default, no need to set server
      } else if (typeof https === 'object') {
        // Object case with certificate options
        transformedConfig.server = {
          type: 'https',
          options: https,
        };
      }
    }

    // Transform deprecated http2 option to server option
    // webpack-dev-server v5 replaced `http2` with `server: { type: 'spdy', options: {...} }`
    if (http2 !== undefined && http2) {
      // If both https and http2 were set, http2 takes precedence (use 'spdy')
      const existingOptions =
        transformedConfig.server?.options || (typeof https === 'object' ? https : {});
      transformedConfig.server = {
        type: 'spdy',
        options: existingOptions,
      };
    }

    // Transform proxy from object to array format if needed
    // webpack-dev-server v5 only accepts array format for proxy
    if (transformedConfig.proxy && !Array.isArray(transformedConfig.proxy)) {
      const proxyObject = transformedConfig.proxy;
      transformedConfig.proxy = Object.entries(proxyObject).map(([context, options]) => {
        if (typeof options === 'string') {
          return { context: [context], target: options };
        }
        return { context: [context], ...options };
      });
    }

    return transformedConfig;
  },
};
