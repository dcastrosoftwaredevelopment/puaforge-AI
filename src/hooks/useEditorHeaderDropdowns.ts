import { useState, useRef, useEffect, useCallback } from 'react';
import { useDraft } from '@/hooks/useDraft';

export function useEditorHeaderDropdowns() {
  const { saveDraft, discardDraft } = useDraft();
  const [showImages, setShowImages] = useState(false);
  const [showCheckpoints, setShowCheckpoints] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const checkpointRef = useRef<HTMLDivElement>(null);
  const mobileCheckpointRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const mobilePaletteRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try { await saveDraft(); } finally { setSaving(false); }
  }, [saveDraft]);

  const handleDiscard = useCallback(async () => {
    await discardDraft();
    setShowDiscardModal(false);
    window.location.reload();
  }, [discardDraft]);

  useEffect(() => {
    if (!showImages && !showCheckpoints && !showPalette && !showMobileMenu) return;
    function handleClick(e: MouseEvent) {
      if (showImages) {
        const inside = panelRef.current?.contains(e.target as Node) || mobilePanelRef.current?.contains(e.target as Node);
        if (!inside) setShowImages(false);
      }
      if (showCheckpoints) {
        const inside = checkpointRef.current?.contains(e.target as Node) || mobileCheckpointRef.current?.contains(e.target as Node);
        if (!inside) setShowCheckpoints(false);
      }
      if (showPalette) {
        const inside = paletteRef.current?.contains(e.target as Node) || mobilePaletteRef.current?.contains(e.target as Node);
        if (!inside) setShowPalette(false);
      }
      if (showMobileMenu && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showImages, showCheckpoints, showPalette, showMobileMenu]);

  return {
    showImages, setShowImages,
    showCheckpoints, setShowCheckpoints,
    showPalette, setShowPalette,
    showMobileMenu, setShowMobileMenu,
    showDiscardModal, setShowDiscardModal,
    saving,
    panelRef, mobilePanelRef,
    checkpointRef, mobileCheckpointRef,
    paletteRef, mobilePaletteRef,
    mobileMenuRef,
    handleSave,
    handleDiscard,
  };
}
