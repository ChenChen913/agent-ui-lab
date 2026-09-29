import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages 把站点放在 /agent-ui-lab/ 下，构建时要带上这个前缀；开发时还是根路径
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/agent-ui-lab/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5273,
    // 编辑工具落盘时会先写临时文件；Windows 上 watcher 碰到它会被 EBUSY 打死
    watch: {
      ignored: ['**/*.tmpdir/**', '**/*.tmp', '**/.~*'],
    },
  },
}))
