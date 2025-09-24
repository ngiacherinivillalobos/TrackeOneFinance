import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // Adicionar logging para debug
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      }
    },
    // Forçar uso da porta 5173 para frontend
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
  },
  // Adicionar configuração para resolver problemas de importação
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})