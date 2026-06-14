'use strict';

// Jest transformer turning style imports into empty objects.
// Mirrors Create React App's config/jest/cssTransform.js.

module.exports = {
  process() {
    return { code: 'module.exports = {};' };
  },
  getCacheKey() {
    return 'cssTransform';
  },
};
