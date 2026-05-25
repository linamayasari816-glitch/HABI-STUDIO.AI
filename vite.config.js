import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/leonardo': {
        target: 'https://cloud.leonardo.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/leonardo/, '/api/rest/v1'),
        headers: {
          'origin': 'https://cloud.leonardo.ai'
        }
      }
    }
  }
})