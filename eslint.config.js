const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("@angular-eslint/eslint-plugin");
const angularTemplate = require("@angular-eslint/eslint-plugin-template");
const angularTemplateParser = require("@angular-eslint/template-parser");

module.exports = tseslint.config(
  { ignores: ["dist/**", "coverage/**", "functions/**", ".angular/**"] },
  {
    files: ["src/**/*.ts"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: { "@angular-eslint": angular },
    processor: angularTemplate.processors["extract-inline-html"],
    rules: {
      ...angular.configs.recommended.rules,
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
    languageOptions: { parser: angularTemplateParser },
    plugins: { "@angular-eslint/template": angularTemplate },
    rules: { ...angularTemplate.configs.recommended.rules },
  },
);
