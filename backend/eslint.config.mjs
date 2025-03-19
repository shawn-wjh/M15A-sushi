import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default defineConfig([
  globalIgnores([
    '**/node_modules/',
    '**/coverage/',
    '**/dist/',
    '**/uploads/',
    '**/tests/'
  ]),
  {
    extends: compat.extends(
      'airbnb-base',
      'eslint:recommended',
      'plugin:prettier/recommended'
    ),

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      },

      ecmaVersion: 12,
      sourceType: 'commonjs'
    },

    rules: {
      'operator-linebreak': ['error', 'after'],
      'no-console': 'off',
      'comma-dangle': ['error', 'never'],
      'linebreak-style': 'off',

      'max-len': [
        'error',
        {
          code: 120
        }
      ]
    }
  }
]);
