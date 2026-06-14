'use strict';

// Babel transform for Jest, replicating Create React App's
// config/jest/babelTransform.js (babel-preset-react-app with the automatic JSX
// runtime, babelrc/configFile disabled). Adds the import.meta.env -> process.env
// plugin so src/config/env.ts (Vite env access) resolves under CommonJS.

const babelJest = require('babel-jest').default;

const hasJsxRuntime = (() => {
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
    return false;
  }
  try {
    require.resolve('react/jsx-runtime');
    return true;
  } catch (e) {
    return false;
  }
})();

module.exports = babelJest.createTransformer({
  presets: [
    [
      require.resolve('babel-preset-react-app'),
      { runtime: hasJsxRuntime ? 'automatic' : 'classic' },
    ],
  ],
  plugins: [require.resolve('./babel-plugin-import-meta-env.cjs')],
  babelrc: false,
  configFile: false,
});
