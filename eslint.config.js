import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'worker/.wrangler'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser },
    },
  },
  {
    files: ['src/**/*.tsx'],
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
  },
  {
    files: ['scripts/**/*.ts', 'vite.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
)
