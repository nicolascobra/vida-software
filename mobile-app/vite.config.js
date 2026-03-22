import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default {
  plugins: [react()],
  server: {
    host: true  // ← essa linha expõe o IP da rede
  }
}
