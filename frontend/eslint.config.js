import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';

import babelParser from '@babel/eslint-parser';
import js from '@eslint/js';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'storybook-static/**',
      '*.min.js',
      '*.bundle.js',
      '.vscode/**',
      '.storybook/**',
    ],
  },
  // Base configuration
  js.configs.recommended,

  // Build tooling config files run in Node
  {
    files: ['*.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },

  // React plugin configuration
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: babelParser, // Use Babel parser to handle JSX
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        requireConfigFile: false, // Allow parsing without a Babel config file
        babelOptions: {
          presets: ['@babel/preset-react'], // Enable JSX parsing via Babel preset
        },
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        styled: 'readonly', // Injected by @rollup/plugin-inject in vite.config.js
        __APP_VERSION__: 'readonly', // Defined in vite.config.js
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      // React rules
      'react/jsx-no-target-blank': 'off',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'error',
      'react/jsx-no-bind': 'off',
      'react/jsx-pascal-case': 'error',
      'react/jsx-no-undef': ['error', { allowGlobals: true }],
      'react-refresh/only-export-components': ['off'],

      // Import rules
      'import/no-unresolved': ['error', { ignore: ['.svg'] }],
      'import/no-useless-path-segments': 'error',
      'import/no-duplicates': 'error',
      'import/no-unused-modules': 'warn',

      // Code quality rules
      'no-unused-vars': ['error'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['error', { allow: ['error'] }],
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'no-shadow': 'error',
      'vars-on-top': 'error',
      'no-undef': 'error',
      'no-constant-binary-expression': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        alias: {
          map: [['@', './src']],
          extensions: ['.js', '.jsx', '.json', '.svg'],
        },
      },
      'import/external-module-folders': ['node_modules'],
      'import/extensions': ['.js', '.jsx', '.svg'],
    },
  },
  ...storybook.configs['flat/recommended'],
];
