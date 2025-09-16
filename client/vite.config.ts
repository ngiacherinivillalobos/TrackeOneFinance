import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    },
    // Forçar uso da porta 3000 para frontend
    strictPort: true,
    // Configuração para melhor exibição de erros
    hmr: {
      overlay: true
    }
  },
  // Configuração para variáveis de ambiente
  envPrefix: 'VITE_',
  // Melhorar o tratamento de erros
  build: {
    // Falha na compilação quando ocorrem erros sérios
    reportCompressedSize: true,
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})