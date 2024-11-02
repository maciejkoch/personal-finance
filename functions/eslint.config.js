module.exports = [
  {
    ignores: ['**/lib'],
  },
  {
    files: ['**/*.ts'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'import'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:import/errors',
      'plugin:import/warnings',
      'plugin:import/typescript',
    ],
    rules: {
      quotes: ['error', 'double'],
      'import/no-unresolved': 0,
      indent: ['error', 2],
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
