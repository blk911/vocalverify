const next = require('eslint-config-next');

module.exports = [
  ...next,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'apps/web/.next/**',
      'apps/web/node_modules/**',
      '**/*.d.ts'
    ]
  },
  {
    rules: {
      // Hooks deps: require explicit deps (fix by adding them or disabling per-line with a comment)
      'react-hooks/exhaustive-deps': 'error',

      // JSX text entities like "don't" → OK
      'react/no-unescaped-entities': 'off', // or 'warn' if you prefer

      // Next image rule: warn, not error (until you migrate <img> to <Image>)
      '@next/next/no-img-element': 'warn',

      // camelcase: relax to warn to avoid blocking builds initially
      'camelcase': ['warn', { properties: 'never', ignoreDestructuring: true }]
    }
  }
];
