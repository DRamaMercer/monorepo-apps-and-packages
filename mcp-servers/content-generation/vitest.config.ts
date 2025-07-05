import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ ignoreConfigErrors: true })],
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        // No 'src/**/index.ts' exclusion here, as src/index.ts is an important entry point
        // No 'src/**/server.ts' exclusion here, as src/mcp/server.ts has logic
        'src/**/types.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/environment.ts', // Usually not covered for simple env loaders
      ],
    },
  },
});
