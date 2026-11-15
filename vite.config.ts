import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    exclude: [...configDefaults.exclude, 'apps/companion/**', '**/.next/**', '**/storybook-static/**'],
    setupFiles: ['./tests/setup.ts'],
  },
})
