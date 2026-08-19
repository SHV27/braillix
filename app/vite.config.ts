import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative base so a built bundle runs from a file server, a subpath, or a USB stick.
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: {
      external: [
        // Node-only backends of @huggingface/transformers. They must never reach the browser
        // bundle — they pull in `sharp` and `onnxruntime-node`, which are irrelevant here and
        // carry advisories. Guarded by a test in src/core/__tests__/bundle-hygiene.test.ts.
        'onnxruntime-node',
        'sharp',
      ],
    },
  },
  optimizeDeps: {
    exclude: ['onnxruntime-node', 'sharp'],
  },
  worker: {
    format: 'es',
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
