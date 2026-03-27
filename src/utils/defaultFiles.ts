export const DEFAULT_FILES: Record<string, string> = {
  '/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vibe App</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
  '/App.tsx': `export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0f16] text-[#e2e8f0] font-sans">
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-[#f1f5f9] mb-3">
          Vibe Platform
        </h1>
        <p className="text-lg text-[#64748b]">
          Descreva o que deseja construir no chat...
        </p>
      </div>
    </div>
  )
}`,
}
