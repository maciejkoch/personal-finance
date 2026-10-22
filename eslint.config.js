const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const { defineConfig } = require("eslint/config");
const prettier = require("eslint-config-prettier/flat");

module.exports = defineConfig(
  { ignores: ["dist/**", "coverage/**", "functions/**", ".angular/**"] },
  {
    files: ["src/**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "pf", style: "camelCase" },
      ],
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "pf", style: "kebab-case" },
      ],
    },
  },
  {
    files: ["src/app/shared/ui/**/*.ts"],
    rules: {
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "pfui", style: "kebab-case" },
      ],
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "pfUi", style: "camelCase" },
      ],
    },
  },
  {
    files: ["src/**/*.html"],
    extends: [...angular.configs.templateRecommended],
  },
  prettier,
);
