import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import flowbite from 'flowbite-react/plugin/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), flowbite()],
    server: {
      host: true,
      watch: {
        usePolling: true,
      },
      headers: {
        'Permissions-Policy': 'unload=(self)',
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      __API_URL__: JSON.stringify(env.API_URL || ''),
      __GOOGLE_CLIENT_ID__: JSON.stringify(env.GOOGLE_CLIENT_ID || ''),
      __SERVER_IP__: JSON.stringify(env.SERVER_IP || ''),
      __APP_DOMAIN__: JSON.stringify(env.APP_DOMAIN || ''),
      __GA_MEASUREMENT_ID__: JSON.stringify(env.GA_MEASUREMENT_ID || ''),
    },
  }
})
