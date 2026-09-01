'use strict';

// Jest transformer turning asset imports into filenames (and SVGs into a
// React component). Jest-30-native replacement for CRA's fileTransform.

const path = require('path');

const pascalCase = (name) =>
  name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

module.exports = {
  process(src, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));

    if (filename.match(/\.svg$/)) {
      const componentName = `Svg${pascalCase(path.parse(filename).name)}`;
      return {
        code: `const React = require('react');
      module.exports = {
        __esModule: true,
        default: ${assetFilename},
        ReactComponent: React.forwardRef(function ${componentName}(props, ref) {
          return React.createElement('svg', Object.assign({ ref: ref }, props), ${assetFilename});
        }),
      };`,
      };
    }

    return { code: `module.exports = ${assetFilename};` };
  },
  getCacheKey() {
    return 'fileTransform';
  },
};
