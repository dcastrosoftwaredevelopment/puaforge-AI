import { SandpackPreview } from '@codesandbox/sandpack-react';

export default function PreviewPanel() {
  return (
    <div className="w-full h-full">
      <SandpackPreview
        showNavigator
        showRefreshButton
        style={{ height: '100%' }}
      />
    </div>
  );
}
