import JSZip from 'jszip'

const PACKAGE_JSON = {
  name: 'vibe-project',
  private: true,
  version: '1.0.0',
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'tsc -b && vite build',
    preview: 'vite preview',
  },
  dependencies: {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
  },
  devDependencies: {
    '@types/react': '^18.3.12',
    '@types/react-dom': '^18.3.1',
    '@vitejs/plugin-react': '^4.3.4',
    autoprefixer: '^10.4.20',
    postcss: '^8.4.49',
    tailwindcss: '^3.4.17',
    typescript: '~5.6.2',
    vite: '^6.0.5',
  },
}

const VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`

const TSCONFIG = {
  compilerOptions: {
    target: 'ES2020',
    useDefineForClassFields: true,
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    allowImportingTsExtensions: true,
    isolatedModules: true,
    moduleDetection: 'force',
    noEmit: true,
    jsx: 'react-jsx',
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedSideEffectImports: true,
  },
  include: ['src'],
}

const TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
`

const POSTCSS_CONFIG = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`

const INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;
`

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vibe Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

const MAIN_TSX = `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`

const VITE_ENV_DTS = `/// <reference types="vite/client" />
`

export async function downloadProject(files: Record<string, string>) {
  const zip = new JSZip()

  // Scaffold files
  zip.file('package.json', JSON.stringify(PACKAGE_JSON, null, 2))
  zip.file('vite.config.ts', VITE_CONFIG)
  zip.file('tsconfig.json', JSON.stringify(TSCONFIG, null, 2))
  zip.file('tailwind.config.js', TAILWIND_CONFIG)
  zip.file('postcss.config.js', POSTCSS_CONFIG)
  zip.file('index.html', INDEX_HTML)

  // src/ files
  zip.file('src/main.tsx', MAIN_TSX)
  zip.file('src/index.css', INDEX_CSS)
  zip.file('src/vite-env.d.ts', VITE_ENV_DTS)

  // Project files from Sandpack (map /App.tsx → src/App.tsx)
  for (const [path, code] of Object.entries(files)) {
    // Skip index.html from Sandpack files (we have our own)
    if (path === '/index.html') continue

    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    zip.file(`src/${cleanPath}`, code)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'vibe-project.zip'
  a.click()
  URL.revokeObjectURL(url)
}
