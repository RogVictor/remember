import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'out/**', 'content-import/.work/**'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  { files: ['tests/chat-telegram-fixture.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
]

export default eslintConfig
