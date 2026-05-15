import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/liff/point_activity/index',
  experimental: {
    renderBuiltUrl(filename, { type }) {
      if (type === 'asset' && filename.startsWith('images/point_activities/')) {
        return `/${filename}`
      }
      return { relative: true }
    },
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? ''
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(name)) {
            return 'images/point_activities/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})
