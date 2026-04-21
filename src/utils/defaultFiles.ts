export const TAILWIND_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PuaForge App</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`

export const DEFAULT_PACKAGE_JSON = {
  name: 'puaforgeai-project',
  version: '1.0.0',
  dependencies: {
    react: '^18.0.0',
    'react-dom': '^18.0.0',
    'flowbite-react': '^0.12.0',
  },
}

export function buildPackageJson(extraDeps: Record<string, string> = {}): string {
  return JSON.stringify(
    { ...DEFAULT_PACKAGE_JSON, dependencies: { ...DEFAULT_PACKAGE_JSON.dependencies, ...extraDeps } },
    null,
    2,
  )
}

export const DEFAULT_FILES: Record<string, string> = {
  '/index.html': TAILWIND_HTML,
  '/package.json': buildPackageJson(),
  '/App.tsx': `import { ThemeProvider, createTheme } from 'flowbite-react'

const theme = createTheme({
  button: {
    base: 'group flex items-center justify-center font-medium rounded-lg cursor-pointer transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
    color: {
      primary: 'bg-[#D65A31] text-white hover:bg-[#D65A31]/90 border border-transparent',
      secondary: 'bg-[#1A1A1A] text-[#E0E0E0] border border-[rgba(255,255,255,0.08)] hover:bg-[#1F1F1F]',
      ghost: 'bg-transparent text-[rgba(224,224,224,0.55)] border border-transparent hover:text-[#E0E0E0] hover:bg-[#1A1A1A]',
      danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
    },
    size: {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    },
  },
  textInput: {
    field: {
      input: {
        base: 'block w-full rounded-lg border bg-[#1A1A1A] text-sm text-[#E0E0E0] placeholder-[rgba(224,224,224,0.3)] focus:outline-none transition',
        colors: {
          gray: 'border-[rgba(255,255,255,0.08)] focus:border-[#D65A31]',
          failure: 'border-red-500 focus:border-red-400',
        },
        sizes: { sm: 'px-3 py-2 text-xs', md: 'px-3 py-2 text-sm', lg: 'px-4 py-3 text-base' },
      },
    },
  },
  card: {
    root: {
      base: 'flex rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#141414] shadow-sm',
      children: 'flex h-full flex-col justify-center gap-4 p-5',
    },
  },
  modal: {
    content: {
      inner: 'relative flex max-h-[90dvh] flex-col rounded-xl bg-[#141414] border border-[rgba(255,255,255,0.08)] shadow-2xl',
    },
    header: {
      base: 'flex items-center justify-between rounded-t-xl p-5 border-b border-[rgba(255,255,255,0.06)]',
      title: 'text-base font-semibold text-[#E0E0E0]',
    },
    body: { base: 'flex-1 overflow-auto p-5' },
    footer: { base: 'flex items-center gap-2 rounded-b-xl border-t border-[rgba(255,255,255,0.06)] p-4' },
  },
  tooltip: {
    base: 'absolute z-10 inline-block rounded-lg px-3 py-2 text-xs font-medium shadow-md bg-[#1F1F1F] text-[#E0E0E0] border border-[rgba(255,255,255,0.08)]',
  },
})

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <div
        className="relative flex items-center justify-center min-h-screen bg-[#0D0D0D] text-[#E0E0E0] font-sans overflow-hidden"
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(214,90,49,0.1), transparent)',
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative text-center px-6" style={{ animation: 'fadeUp 0.6s ease both' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-[rgba(214,90,49,0.3)] bg-[rgba(214,90,49,0.08)] text-[11px] text-[#D65A31] tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D65A31] animate-pulse" />
            Pronto para criar
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-[#f8fafc] mb-4 leading-none">
            Descreva sua ideia
          </h1>
          <p className="text-base text-[#4b5563] max-w-sm mx-auto leading-relaxed">
            Digite no chat o que deseja construir e a IA irá gerar o código em tempo real.
          </p>
        </div>

        <style>{\`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        \`}</style>
      </div>
    </ThemeProvider>
  )
}`,
}
