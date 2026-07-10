import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const firebaseConfigFile = fs.existsSync(path.resolve(__dirname, 'firebase-applet-config.json'))
  ? 'firebase-applet-config.json'
  : 'firebase-applet-config.example.json';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@firebase-config': path.resolve(__dirname, firebaseConfigFile),
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
