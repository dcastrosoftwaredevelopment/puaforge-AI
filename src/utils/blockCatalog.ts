export type BlockCategory = 'layout' | 'typography' | 'form' | 'ui';

export interface Block {
  id: string;
  category: BlockCategory;
  labelKey: string;
  previewBg: string;
  isContainer?: boolean;
  code: string;
}

export const BLOCKS: Block[] = [
  // ── Layout ───────────────────────────────────────────────────────────────────
  {
    id: 'container',
    category: 'layout',
    labelKey: 'blocks.container',
    previewBg: 'bg-[#111]',
    isContainer: true,
    code: `<div className="max-w-5xl mx-auto px-6 py-8">
</div>`,
  },
  {
    id: 'section',
    category: 'layout',
    labelKey: 'blocks.section',
    previewBg: 'bg-[#111]',
    isContainer: true,
    code: `<section className="w-full py-16 px-6 bg-white">
</section>`,
  },
  {
    id: 'flex-row',
    category: 'layout',
    labelKey: 'blocks.flexRow',
    previewBg: 'bg-[#111]',
    isContainer: true,
    code: `<div className="flex flex-row items-center gap-4">
</div>`,
  },
  {
    id: 'flex-col',
    category: 'layout',
    labelKey: 'blocks.flexCol',
    previewBg: 'bg-[#111]',
    isContainer: true,
    code: `<div className="flex flex-col gap-4">
</div>`,
  },
  {
    id: 'grid-2',
    category: 'layout',
    labelKey: 'blocks.grid2',
    previewBg: 'bg-[#111]',
    isContainer: true,
    code: `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
</div>`,
  },
  {
    id: 'grid-3',
    category: 'layout',
    labelKey: 'blocks.grid3',
    previewBg: 'bg-[#111]',
    isContainer: true,
    code: `<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
</div>`,
  },
  {
    id: 'divider',
    category: 'layout',
    labelKey: 'blocks.divider',
    previewBg: 'bg-[#111]',
    code: `<hr className="border-t border-gray-200 my-8" />`,
  },

  // ── Typography ────────────────────────────────────────────────────────────────
  {
    id: 'heading-1',
    category: 'typography',
    labelKey: 'blocks.heading1',
    previewBg: 'bg-[#111]',
    code: `<h1 className="text-4xl font-bold text-gray-900 leading-tight">
  Título principal
</h1>`,
  },
  {
    id: 'heading-2',
    category: 'typography',
    labelKey: 'blocks.heading2',
    previewBg: 'bg-[#111]',
    code: `<h2 className="text-2xl font-semibold text-gray-800">
  Subtítulo
</h2>`,
  },
  {
    id: 'heading-3',
    category: 'typography',
    labelKey: 'blocks.heading3',
    previewBg: 'bg-[#111]',
    code: `<h3 className="text-xl font-medium text-gray-700">
  Título terciário
</h3>`,
  },
  {
    id: 'paragraph',
    category: 'typography',
    labelKey: 'blocks.paragraph',
    previewBg: 'bg-[#111]',
    code: `<p className="text-base text-gray-600 leading-relaxed">
  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
</p>`,
  },
  {
    id: 'label',
    category: 'typography',
    labelKey: 'blocks.label',
    previewBg: 'bg-[#111]',
    code: `<span className="text-sm font-medium text-gray-500 uppercase tracking-widest">
  Label
</span>`,
  },
  {
    id: 'quote',
    category: 'typography',
    labelKey: 'blocks.quote',
    previewBg: 'bg-[#111]',
    code: `<blockquote className="border-l-4 border-indigo-400 pl-4 py-1 text-gray-600 italic">
  "Uma citação inspiradora vai aqui."
</blockquote>`,
  },
  {
    id: 'link',
    category: 'typography',
    labelKey: 'blocks.link',
    previewBg: 'bg-[#111]',
    code: `<a href="#" className="text-indigo-600 hover:underline font-medium">
  Texto do link
</a>`,
  },

  // ── Form ─────────────────────────────────────────────────────────────────────
  {
    id: 'button-primary',
    category: 'form',
    labelKey: 'blocks.buttonPrimary',
    previewBg: 'bg-[#111]',
    code: `<button type="button" className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition cursor-pointer">
  Botão
</button>`,
  },
  {
    id: 'button-outline',
    category: 'form',
    labelKey: 'blocks.buttonOutline',
    previewBg: 'bg-[#111]',
    code: `<button type="button" className="inline-flex items-center justify-center px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition cursor-pointer">
  Botão
</button>`,
  },
  {
    id: 'button-link',
    category: 'form',
    labelKey: 'blocks.buttonLink',
    previewBg: 'bg-[#111]',
    code: `<a href="#" className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">
  Link botão
</a>`,
  },
  {
    id: 'input-text',
    category: 'form',
    labelKey: 'blocks.inputText',
    previewBg: 'bg-[#111]',
    code: `<div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium text-gray-700">Label</label>
  <input
    type="text"
    placeholder="Placeholder..."
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  />
</div>`,
  },
  {
    id: 'textarea',
    category: 'form',
    labelKey: 'blocks.textarea',
    previewBg: 'bg-[#111]',
    code: `<div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium text-gray-700">Mensagem</label>
  <textarea
    rows={4}
    placeholder="Digite aqui..."
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
  />
</div>`,
  },
  {
    id: 'select',
    category: 'form',
    labelKey: 'blocks.select',
    previewBg: 'bg-[#111]',
    code: `<div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium text-gray-700">Opção</label>
  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
    <option value="">Selecione...</option>
    <option value="1">Opção 1</option>
    <option value="2">Opção 2</option>
  </select>
</div>`,
  },
  {
    id: 'badge',
    category: 'form',
    labelKey: 'blocks.badge',
    previewBg: 'bg-[#111]',
    code: `<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
  Badge
</span>`,
  },

  // ── UI ───────────────────────────────────────────────────────────────────────
  {
    id: 'card',
    category: 'ui',
    labelKey: 'blocks.card',
    previewBg: 'bg-[#111]',
    isContainer: true,
    code: `<div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
</div>`,
  },
  {
    id: 'image',
    category: 'ui',
    labelKey: 'blocks.image',
    previewBg: 'bg-[#111]',
    code: `<img
  src="https://placehold.co/800x450"
  alt="Descrição da imagem"
  className="w-full rounded-xl object-cover block"
/>`,
  },
  {
    id: 'image-link',
    category: 'ui',
    labelKey: 'blocks.imageLink',
    previewBg: 'bg-[#111]',
    code: `<a href="#">
  <img
    src="https://placehold.co/800x450"
    alt="Descrição da imagem"
    className="w-full rounded-xl object-cover block hover:opacity-90 transition"
  />
</a>`,
  },
  {
    id: 'avatar',
    category: 'ui',
    labelKey: 'blocks.avatar',
    previewBg: 'bg-[#111]',
    code: `<div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
    AB
  </div>
  <div>
    <p className="text-sm font-semibold text-gray-900">Nome Sobrenome</p>
    <p className="text-xs text-gray-400">cargo@empresa.com</p>
  </div>
</div>`,
  },
  {
    id: 'alert',
    category: 'ui',
    labelKey: 'blocks.alert',
    previewBg: 'bg-[#111]',
    code: `<div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
  <span className="mt-0.5">⚠️</span>
  <p>Mensagem de alerta importante para o usuário.</p>
</div>`,
  },
];
