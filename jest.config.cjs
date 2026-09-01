// Standalone Jest configuration replicating the config that `react-scripts test`
// applied before the Vite migration (Create React App's createJestConfig +
// react-app/jest preset + the package.json `jest` override). The previous
// repo-root jest.config.js was DEAD under react-scripts (CRA reads only the
// package.json `jest` field), so this reconstructs the real baseline:
//
//   - babel-preset-react-app transform (automatic JSX runtime)
//   - jsdom environment, src/setupTests.ts after-env
//   - CRA's css/file transforms (style imports -> {}, assets -> filename)
//   - resetMocks: true (CRA default)
//   - chakra context moduleNameMapper (from the old package.json jest field)
//
// Plus a Vite-migration addition: the import.meta.env -> process.env Babel
// plugin so src/config/env.ts resolves under Jest's CommonJS output.

module.exports = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'jsdom',
  // CRA loaded react-app-polyfill/jsdom here, which only pulls in whatwg-fetch;
  // src/setupTests.ts already provides a fetch mock, so no setupFiles needed.
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: [
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.spec.{ts,tsx}'
  ],
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  transform: {
    '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': '<rootDir>/jest/babelTransform.cjs',
    '^.+\\.css$': '<rootDir>/jest/cssTransform.cjs',
    '^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)': '<rootDir>/jest/fileTransform.cjs'
  },
  transformIgnorePatterns: [
    // Chakra UI v3 and its Ark UI / Zag.js dependencies ship ESM that must be
    // transpiled for Jest's CommonJS runtime; exclude them from the ignore
    // list so babel-jest transforms them. (Several @zag-js packages declare a
    // `require` entry that actually contains ESM `export` syntax.)
    '[/\\\\]node_modules[/\\\\](?!(@chakra-ui|@ark-ui|@zag-js)[/\\\\]).+\\.(js|jsx|mjs|cjs|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  modulePaths: [],
  moduleNameMapper: {
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy'
  },
  moduleFileExtensions: ['web.js', 'js', 'web.ts', 'ts', 'web.tsx', 'tsx', 'json', 'web.jsx', 'jsx', 'node'],
  resetMocks: true
};
