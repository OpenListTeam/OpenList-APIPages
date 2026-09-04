import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 前端源码位于 frontend/，构建产物直接输出到部署目录 public/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: '../public',
    emptyOutDir: true,
    assetsDir: 'static',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5177,
    proxy: {
      '/onedrive': 'http://localhost:3000',
      '/alicloud': 'http://localhost:3000',
      '/alicloud2': 'http://localhost:3000',
      '/baiduyun': 'http://localhost:3000',
      '/115cloud': 'http://localhost:3000',
      '/115cloud_qr': 'http://localhost:3000',
      '/123cloud': 'http://localhost:3000',
      '/googleui': 'http://localhost:3000',
      '/yandexui': 'http://localhost:3000',
      '/dropboxs': 'http://localhost:3000',
      '/quarkyun': 'http://localhost:3000',
    },
  },
})
