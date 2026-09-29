import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5273,
    // 编辑工具落盘时会先写临时文件；Windows 上 watcher 碰到它会被 EBUSY 打死
    watch: {
      ignored: ['**/*.tmpdir/**', '**/*.tmp', '**/.~*'],
    },
  },
})
