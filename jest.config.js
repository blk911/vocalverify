const nextJest = require('next/jest.js');

const createJestConfig = nextJest({ dir: './' });

const config = {
  testEnvironment: 'node',
  testMatch: ['**/tests/api/**/*.test.(ts|tsx|js)'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  setupFilesAfterEnv: [],
  transform: { 
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }] 
  },
  moduleNameMapper: { 
    '^@/(.*)$': '<rootDir>/src/$1' 
  },
};

module.exports = createJestConfig(config);