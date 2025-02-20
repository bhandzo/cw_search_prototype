/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require("next/jest");
(async () => {
  const { Request } = await import("node-fetch");
  global.Request = Request;
})();

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  transformIgnorePatterns: ["node_modules/(?!lucide-react/.*)"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

module.exports = createJestConfig(customJestConfig);
