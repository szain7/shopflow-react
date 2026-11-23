import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())
  const copyPublicDir = command !== 'build' || env.VITE_PUBLIC_DEMO === 'true'

  return {
    base: mode === 'pages' ? '/shopflow-react/' : '/',
    build: { copyPublicDir },
    plugins: [
      react(),
      tailwindcss(),
      !copyPublicDir && {
        name: 'shopflow-production-assets',
        generateBundle() {
          // The public directory also contains the development service worker.
          this.emitFile({
            type: 'asset',
            fileName: 'product-placeholder.svg',
            source: readFileSync(
              new URL('./public/product-placeholder.svg', import.meta.url),
            ),
          })
        },
      },
    ],
  }
})
