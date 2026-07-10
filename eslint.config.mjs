import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.expo/**',
      'web-build/**',
      'coverage/**',
      'supabase/functions/**', // Deno runtime with URL imports; linted by check:edge.
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2023,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      // A few modules deliberately use CommonJS require() for lazy loading /
      // avoiding circular imports across the RN + zustand boundary. This is an
      // intentional pattern, not a mistake.
      '@typescript-eslint/no-require-imports': 'off',
    },
  }
);
