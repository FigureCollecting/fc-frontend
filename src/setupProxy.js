const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('[SETUP PROXY] Configuring proxies...');

  // Special proxy for SSE streams - must come before general /api proxy
  // SSE requires streaming without buffering
  // NOTE: When Express matches '/api/sync/stream', it strips that prefix from req.url
  // So we need pathRewrite to ADD BACK /sync/stream, not strip /api
  app.use(
    '/api/sync/stream',
    createProxyMiddleware({
      target: 'http://localhost:5080',
      changeOrigin: true,
      pathRewrite: (path) => {
        // Express already stripped '/api/sync/stream', so path is just '/:sessionId'
        // We need to add '/sync/stream' back to get '/sync/stream/:sessionId'
        return '/sync/stream' + path;
      },
      // SSE-specific settings to prevent buffering
      onProxyRes: (proxyRes) => {
        // Disable buffering for SSE
        proxyRes.headers['X-Accel-Buffering'] = 'no';
        proxyRes.headers['Cache-Control'] = 'no-cache';
        proxyRes.headers['Connection'] = 'keep-alive';
      },
      logLevel: 'debug',
    })
  );
  console.log('[SETUP PROXY] /api/sync/stream SSE proxy configured');

  // Proxy /api requests to backend, stripping the /api prefix
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5080',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Remove /api prefix
      },
      logLevel: 'debug',
    })
  );
  console.log('[SETUP PROXY] /api proxy configured');

  // Proxy /version to backend
  app.use(
    '/version',
    createProxyMiddleware({
      target: 'http://localhost:5080',
      changeOrigin: true,
      logLevel: 'debug',
    })
  );
  console.log('[SETUP PROXY] /version proxy configured');
};
