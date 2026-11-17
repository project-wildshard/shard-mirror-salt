export default {
  build: { target: 'esnext' },
  optimizeDeps: { esbuildOptions: { target: 'esnext' } },
  server: { port: 5231, strictPort: true, host: '127.0.0.1' },
};
