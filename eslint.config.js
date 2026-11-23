const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'android/**', 'ios/**', 'scripts/**'],
  },
  {
    settings: {
      react: {
        version: '19.1',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      // HTML-only rule incompatible with French apostrophes inside React Native <Text>
      'react/no-unescaped-entities': 'off',
      // React Compiler rules bundled in eslint-plugin-react-hooks@7 (React Compiler not enabled)
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
];
