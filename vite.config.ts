import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    // na GitHub Pages strona siedzi pod /nazwa-repo/, lokalnie pod /
    base: env.VITE_BASE || '/',
    plugins: [react()],
  }
})
