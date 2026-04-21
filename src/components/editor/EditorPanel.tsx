import { SandpackCodeEditor } from '@codesandbox/sandpack-react';

export default function EditorPanel() {
  return (
    <div className="w-full h-full">
      <SandpackCodeEditor
        showTabs
        showLineNumbers
        showInlineErrors
        readOnly
        style={{ height: '100%' }}
      />
    </div>
  );
}
