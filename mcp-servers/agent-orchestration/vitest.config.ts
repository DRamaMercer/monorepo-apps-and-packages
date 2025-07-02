import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ ignoreConfigErrors: true })], // ignoreConfigErrors for robustness in monorepo
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/index.ts',
        'src/**/types.ts', // if such files exist
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/environment.ts', // Often not useful to cover env loading itself
      ],
    },
  },
});
