import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /.*\/alimentacao(.*)|.*\/financas(.*)|.*\/exercicio(.*)/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache' }
          },
          {
            urlPattern: /\.(?:css|js|woff2|png|svg|jpg)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'assets-cache' }
          }
        ]
      }
    })
  ],
  server: {
    host: true  // ← essa linha expõe o IP da rede
  }
})
