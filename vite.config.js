import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import vue from '@vitejs/plugin-vue'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
      '~bootstrap-icons': path.resolve(__dirname, 'node_modules/bootstrap-icons'),
    }
  },
  build: {
    target: ['esnext'],
  },
  css: {
    devSourcemap: true,
  },
})
