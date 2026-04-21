import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { mobileDrawerOpenAtom, mobileDrawerHeightPctAtom, mobileDrawerTabAtom, type MobileDrawerTab } from '@/atoms';
import { useEditorPanelTabs } from './useEditorPanelTabs';
import { useChat } from './useChat';
import type { EditorPanelMode } from '@/atoms';

export function useMobileDrawer() {
  const [drawerOpen, setDrawerOpen] = useAtom(mobileDrawerOpenAtom);
  const [drawerHeightPct, setDrawerHeightPct] = useAtom(mobileDrawerHeightPctAtom);
  const [drawerTab, setDrawerTabAtom] = useAtom(mobileDrawerTabAtom);
  const { setEditorPanelMode } = useEditorPanelTabs();
  const { setIsOpen: setChatOpen } = useChat();

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

  return { drawerOpen, drawerHeightPct, setDrawerHeightPct, drawerTab, openDrawer, closeDrawer, toggleDrawer };
}
