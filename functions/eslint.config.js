const js = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const globals = require("globals");
const tseslint = require("typescript-eslint");

module.exports = defineConfig(
  { ignores: ["lib/**", "node_modules/**"] },
  {
    files: ["src/**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["src/**/*.test.ts"],
    languageOptions: { globals: globals.mocha },
  },
);
