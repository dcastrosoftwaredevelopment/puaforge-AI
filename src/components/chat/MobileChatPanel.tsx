import ChatPanel from './ChatPanel';

export default function MobileChatPanel() {
  return (
    <div className="flex-1 flex flex-col bg-bg-secondary overflow-hidden">
      <ChatPanel isDocked={true} />
    </div>
  );
}
