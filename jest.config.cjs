const { createCjsPreset } = require("jest-preset-angular/presets");
const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");

module.exports = {
  ...createCjsPreset({ tsconfig: "<rootDir>/tsconfig.spec.json" }),
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.spec.ts", "**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/",
  }),
  testEnvironmentOptions: {
    customExportConditions: ["node", "require", "default"],
  },
  coverageDirectory: "<rootDir>/coverage",
};
