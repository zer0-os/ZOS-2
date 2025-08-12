import { useState, useCallback } from 'react';
import type { AppWindow, FactoryApp } from '@/types/app';

export const useAppManager = () => {
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [nextZIndex, setNextZIndex] = useState(100);

  const openApp = useCallback((app: FactoryApp, props?: Record<string, any>) => {
    const windowId = `${app.id}-${Date.now()}`;
    const newWindow: AppWindow = {
      id: windowId,
      appId: app.id,
      title: app.defaultWindowTitle || app.name,
      component: app.component,
      position: {
        x: 350 + (windows.length * 30), // Start after sidebar (64px) + IndexPanel (256px) + padding (30px)
        y: 80 + (windows.length * 30), // Start below TopBar (40px) + padding
      },
      zIndex: nextZIndex,
      props,
    };

    setWindows(prev => [...prev, newWindow]);
    setNextZIndex(prev => prev + 1);
    return windowId;
  }, [windows.length, nextZIndex]);

  const closeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, isMinimized: true } : w
    ));
  }, []);

  const maximizeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === windowId) {
        if (w.isMaximized) {
          // Restore to previous position
          return { 
            ...w, 
            isMaximized: false,
            position: w.restorePosition || w.position || { x: 200, y: 150 }
          };
        } else {
          // Maximize and store current position for restore
          return { 
            ...w, 
            isMaximized: true,
            restorePosition: w.position || { x: 200, y: 150 }
          };
        }
      }
      return w;
    }));
  }, []);

  const updateWindowPosition = useCallback((windowId: string, position: { x: number; y: number }) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId && !w.isMaximized ? { ...w, position } : w
    ));
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, zIndex: nextZIndex } : w
    ));
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const snapWindow = useCallback((windowId: string, snapSide: 'left' | 'right' | null) => {
    setWindows(prev => prev.map(w => {
      if (w.id === windowId) {
        if (snapSide === null) {
          // Unsnap - restore to center with original size
          return {
            ...w,
            isSnapped: null,
            position: { x: 200, y: 150 }
          };
        } else {
          // Snap to side - account for sidebar width (64px collapsed)
          const sidebarWidth = 64;
          const availableWidth = window.innerWidth - sidebarWidth;
          return {
            ...w,
            isSnapped: snapSide,
            position: snapSide === 'left' 
              ? { x: sidebarWidth, y: 0 } 
              : { x: sidebarWidth + availableWidth / 2, y: 0 }
          };
        }
      }
      return w;
    }));
  }, []);

  return {
    windows,
    openApp,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    focusWindow,
    snapWindow,
  };
};
