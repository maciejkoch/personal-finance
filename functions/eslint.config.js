module.exports = [
  {
    ignores: ['**/lib'],
  },
  {
    files: ['**/*.ts'],
    rules: {
      quotes: ['error', 'double'],
      'import/no-unresolved': 0,
      indent: ['error', 2],
    },
  },
];
