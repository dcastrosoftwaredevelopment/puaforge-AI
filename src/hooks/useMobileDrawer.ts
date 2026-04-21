import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import {
  mobileDrawerOpenAtom,
  mobileDrawerHeightPctAtom,
  mobileDrawerTabAtom,
  selectedElementAtom,
  inspectModeAtom,
  type MobileDrawerTab,
} from '@/atoms';
import { useEditorPanelTabs } from './useEditorPanelTabs';
import { useChat } from './useChat';
import { useIsMobile } from './useIsMobile';
import type { EditorPanelMode } from '@/atoms';

export function useMobileDrawer() {
  const [drawerOpen, setDrawerOpen] = useAtom(mobileDrawerOpenAtom);
  const [drawerHeightPct, setDrawerHeightPct] = useAtom(mobileDrawerHeightPctAtom);
  const [drawerTab, setDrawerTabAtom] = useAtom(mobileDrawerTabAtom);
  const { setEditorPanelMode } = useEditorPanelTabs();
  const { setIsOpen: setChatOpen } = useChat();
  const selectedElement = useAtomValue(selectedElementAtom);
  const inspectMode = useAtomValue(inspectModeAtom);
  const isMobile = useIsMobile();
  const prevSelectedIdRef = useRef<string | null>(null);

  const setDrawerTab = useCallback(
    (tab: MobileDrawerTab) => {
      setDrawerTabAtom(tab);
      if (tab === 'chat') {
        setChatOpen(true);
      } else {
        setChatOpen(false);
        setEditorPanelMode(tab as EditorPanelMode);
      }
    },
    [setDrawerTabAtom, setEditorPanelMode, setChatOpen],
  );

  const openDrawer = useCallback(
    (tab?: MobileDrawerTab) => {
      if (tab) setDrawerTab(tab);
      setDrawerOpen(true);
    },
    [setDrawerTab, setDrawerOpen],
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, [setDrawerOpen]);

  const toggleDrawer = useCallback(
    (tab: MobileDrawerTab) => {
      if (drawerOpen && drawerTab === tab) {
        setDrawerOpen(false);
      } else {
        setDrawerTab(tab);
        setDrawerOpen(true);
      }
    },
    [drawerOpen, drawerTab, setDrawerTab, setDrawerOpen],
  );

  // When a new element is selected in inspect mode on mobile, auto-open the style drawer
  useEffect(() => {
    const newId = selectedElement?.id ?? null;
    if (isMobile && inspectMode && newId && newId !== prevSelectedIdRef.current) {
      openDrawer('style');
    }
    prevSelectedIdRef.current = newId;
  }, [selectedElement, isMobile, inspectMode, openDrawer]);

  return { drawerOpen, drawerHeightPct, setDrawerHeightPct, drawerTab, openDrawer, closeDrawer, toggleDrawer };
}
