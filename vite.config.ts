import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'soundlines-mockable-mobile-catalogue',
      resolveId(id) {
        if (id === 'virtual:mobile-catalogue') return '\0' + id
      },
    },
  ],
  resolve: { alias: { '#media': fileURLToPath(new URL('./packages/media/public', import.meta.url)) } },
  test: {
    exclude: [...configDefaults.exclude, 'apps/companion/**', '**/.next/**', '**/storybook-static/**'],
    setupFiles: ['./tests/setup.ts'],
  },
})
