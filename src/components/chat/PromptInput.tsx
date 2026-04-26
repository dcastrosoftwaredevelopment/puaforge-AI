import { useRef, type KeyboardEvent } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Send, ImagePlus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMessages } from '@/hooks/useMessages';
import { useMessageSender } from '@/hooks/useMessageSender';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useState } from 'react';

export default function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const { t } = useTranslation();
  const { isGenerating } = useMessages();
  const { sendMessage } = useMessageSender();
  const { pendingImages, imageError, handleImageSelect, removeImage, clearImages } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    const text = prompt.trim();
    if ((!text && pendingImages.length === 0) || isGenerating) return;
    const images = pendingImages.length > 0 ? [...pendingImages] : undefined;
    setPrompt('');
    clearImages();
    await sendMessage(text, images);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = isGenerating;

  return (
    <div className="space-y-2">
      {imageError && (
        <div className="text-xs text-forge-terracotta bg-forge-terracotta/10 border border-forge-terracotta/20 rounded-lg px-3 py-2">
          {imageError}
        </div>
      )}
      {pendingImages.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {pendingImages.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={`data:${img.mediaType};base64,${img.base64}`}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-lg border border-border-subtle"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                <X size={10} className="text-text-muted" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <TextareaAutosize
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          minRows={4}
          maxRows={8}
          className="w-full bg-bg-tertiary border border-border-subtle rounded-xl p-3 pr-20 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-border-default transition"
          placeholder={t('chat.placeholder')}
          disabled={isDisabled}
        />
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled}
            className="p-1.5 rounded-lg bg-bg-elevated text-text-muted border border-border-subtle hover:text-forge-terracotta hover:border-forge-terracotta/30 disabled:opacity-20 transition cursor-pointer"
            title={t('chat.sendImage')}
          >
            <ImagePlus size={14} />
          </button>
          <button
            onClick={handleSend}
            disabled={isDisabled || (!prompt.trim() && pendingImages.length === 0)}
            className="p-1.5 rounded-lg bg-forge-terracotta/10 text-forge-terracotta border border-forge-terracotta/30 hover:bg-forge-terracotta/20 disabled:opacity-20 transition cursor-pointer"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
