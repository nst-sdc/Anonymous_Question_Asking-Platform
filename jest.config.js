/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files before each test file is executed
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Module name mapper for handling static assets and CSS modules
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1', // Optional: for absolute imports
  },
  
  // Transform settings
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.(css|scss|sass|less)$': 'jest-transform-stub',
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}', // Skip index files
    '!src/**/*.test.{js,jsx,ts,tsx}', // Skip test files
    '!src/**/__mocks__/**', // Skip mock files
    '!src/**/__tests__/**', // Skip test directories
    '!src/test-utils/**/*',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  
  // Paths to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/public/',
    '/coverage/',
    '/.next/',
    '/.vercel/',
    '/.vscode/',
    '/.github/',
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss|less)$',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  
  // Setup for handling ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(react-dnd|dnd-core|@react-dnd|react-dnd-html5-backend|@react-dnd/invariant|react-dnd-touch-backend|react-dnd-test-backend|react-dnd-test-utils|@testing-library/react-hooks|@react-dnd/shallowequal|@react-dnd/asap|@react-dnd/component|@react-dnd/core|@react-dnd/multi-backend|@react-dnd/shallowequal|@react-dnd/invariant|@react-dnd/asap|@react-dnd/component|@react-dnd/core|@react-dnd/multi-backend|@react-dnd/shallowequal|@react-dnd/invariant|@react-dnd/asap|@react-dnd/component|@react-dnd/core|@react-dnd/multi-backend|@react-dnd/shallowequal)/)',
  ],
  
  // Module directores for module resolution
  moduleDirectories: ['node_modules', 'src'],
  
  // Reset mocks between tests
  resetMocks: true,
  
  // Clear mock calls between tests
  clearMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Show test coverage
  verbose: true,
};

module.exports = config;
