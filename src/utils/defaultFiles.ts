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
  '/App.tsx': `export default function App() {
  return (
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
  )
}`,
}
