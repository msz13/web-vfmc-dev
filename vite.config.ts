import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['cubing']
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
});
