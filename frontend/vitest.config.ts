import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/utils/**/*.ts',
        'src/hooks/useTenantHelpers.ts',
        'src/hooks/useTenantState.ts',
        'src/constants/**/*.ts',
      ],
      exclude: ['**/*.test.ts'],
    },
  },
});
