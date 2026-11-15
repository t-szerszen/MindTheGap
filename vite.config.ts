/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    // na GitHub Pages strona siedzi pod /nazwa-repo/, lokalnie pod /
    base: env.VITE_BASE || '/',
    build: {
      rolldownOptions: {
        output: {
          // firebase osobno: zmienia się rzadko, więc po aktualizacji aplikacji nie trzeba go ściągać od nowa
          codeSplitting: {
            groups: [
              { name: 'firebase', test: /node_modules[\\/](@?firebase)/, priority: 2 },
              // treści: każdy rodzaj to jeden plik, ładowany dopiero na stronie, która go potrzebuje
              {
                name: 'content-exercises',
                test: /src[\\/]content[\\/]exercises[\\/]/,
                priority: 3,
              },
              { name: 'content-topics', test: /src[\\/]content[\\/]topics[\\/]/, priority: 3 },
              { name: 'content-phrases', test: /src[\\/]content[\\/]phrases[\\/]/, priority: 3 },
              { name: 'vendor', test: /node_modules/, priority: 1 },
            ],
          },
        },
      },
      chunkSizeWarningLimit: 700,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Mind the Gap',
          short_name: 'Mind the Gap',
          description: 'Zeszyt do angielskiego przed maturą: czasy, tłumacz, fiszki, ćwiczenia.',
          lang: 'pl',
          start_url: '.',
          scope: '.',
          display: 'standalone',
          background_color: '#F7F0E1',
          theme_color: '#F7F0E1',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // treści (czasy, ćwiczenia) są w bundlu js, więc lecą do precache razem z nim
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    test: {
      include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'worker/src/**/*.test.ts'],
    },
  }
})
