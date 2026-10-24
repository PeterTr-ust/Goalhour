import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const BASE_PATH = '/Goalhour/';
const THEME_COLOR = '#0f766e';
const BACKGROUND_COLOR = '#f8fafc';

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Goalhour',
        short_name: 'Goalhour',
        lang: 'de',
        display: 'standalone',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        theme_color: THEME_COLOR,
        background_color: BACKGROUND_COLOR,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
