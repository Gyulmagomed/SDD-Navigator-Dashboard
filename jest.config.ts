/**
 * Jest + ts-jest + jsdom. MSW Node подключается в jest.setup.ts.
 * modulePathIgnorePatterns — не индексировать .next/standalone (коллизии имён с package.json).
 * Пороги покрытия — см. coverageThreshold.
 */
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  clearMocks: true,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/__tests__/mocks/",
  ],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  collectCoverageFrom: [
    "lib/api/**/*.{ts,tsx}",
    "lib/store/**/*.{ts,tsx}",
    "components/dashboard/**/*.{ts,tsx}",
    "components/specifications/specifications-list.tsx",
    "app/(auth)/login/page.tsx",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      statements: 65,
      branches: 50,
      functions: 60,
      lines: 65,
    },
    "./lib/api/client.ts": {
      statements: 80,
      branches: 60,
      functions: 80,
      lines: 80,
    },
  },
};

export default config;
