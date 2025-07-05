import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ ignoreConfigErrors: true })],
  test: {
    globals: true,
    environment: 'node', // Or 'jsdom' if testing React components
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'], // files to include in coverage
      exclude: [ // files to exclude from coverage
        'src/**/index.ts',
        'src/**/types.ts', // if you have type definition files
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
      ],
    },
  },
});
