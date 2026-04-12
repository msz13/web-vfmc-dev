import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  optimizeDeps: {
    exclude: ['cubing']
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
});
