import { defineConfig } from 'oxlint';

export default defineConfig({
  settings: {
    next: { rootDir: './app' },
  },
  plugins: ['react', 'typescript', 'promise'],
  categories: {
    correctness: 'warn',
  },
  rules: {
    'eslint/no-unused-vars': 'error',
  },
});
