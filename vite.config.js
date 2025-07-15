import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ jsxImportSource: 'react' })],
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  }
})
