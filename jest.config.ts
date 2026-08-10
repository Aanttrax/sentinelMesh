import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/libs/*/src/**/*.test.ts'],
  collectCoverageFrom: ['apps/*/src/**/*.ts', 'libs/*/src/**/*.ts'],
  coverageDirectory: 'coverage',
};

export default config;
