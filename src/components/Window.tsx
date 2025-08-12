import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFastDraggable } from '@/hooks/useFastDraggable';
import { X, Minus, Square } from 'lucide-react';
import type { AppWindow as AppWindowType } from '@/types/app';

interface WindowProps {
  // For simple usage
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onFocus?: () => void;
  className?: string;
  initialPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSnapToEdge?: (side: 'left' | 'right' | null) => void;
  
  // For app window usage
  window?: AppWindowType;
}

interface AppWindowProps {
  window: AppWindowType;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus?: () => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSnapToEdge?: (side: 'left' | 'right' | null) => void;
  className?: string;
}

type CombinedWindowProps = WindowProps | AppWindowProps;

export const Window: React.FC<CombinedWindowProps> = (props) => {
  // Determine if this is an app window or simple window
  const isAppWindow = 'window' in props && props.window !== undefined;
  
  let windowData: AppWindowType | undefined;
  let title: string;
  let children: React.ReactNode;
  let onClose: (() => void) | undefined;
  let onMinimize: (() => void) | undefined;
  let onMaximize: (() => void) | undefined;
  let onFocus: (() => void) | undefined;

  let className: string;
  let initialPosition: { x: number; y: number };
  let onPositionChange: ((position: { x: number; y: number }) => void) | undefined;
  let onSnapToEdge: ((side: 'left' | 'right' | null) => void) | undefined;
  let isMinimized: boolean = false;
  let isMaximized: boolean = false;
  let isSnapped: 'left' | 'right' | null = null;
  let zIndex: number = 50;

  if (isAppWindow) {
    const appProps = props as AppWindowProps;
    windowData = appProps.window;
    title = windowData.title;
    children = React.createElement(windowData.component, windowData.props || {});
    onClose = appProps.onClose;
    onMinimize = appProps.onMinimize;
    onMaximize = appProps.onMaximize;
    onFocus = appProps.onFocus;

    className = appProps.className || '';
    initialPosition = windowData.position || { x: 200, y: 150 };
    onPositionChange = appProps.onPositionChange;
    onSnapToEdge = appProps.onSnapToEdge;
    isMinimized = windowData.isMinimized || false;
    isMaximized = windowData.isMaximized || false;
    isSnapped = windowData.isSnapped || null;
    zIndex = windowData.zIndex || 50;
  } else {
    const simpleProps = props as WindowProps;
    title = simpleProps.title || 'Window';
    children = simpleProps.children;
    onClose = simpleProps.onClose;
    onMinimize = simpleProps.onMinimize;
    onMaximize = simpleProps.onMaximize;
    onFocus = simpleProps.onFocus;

    className = simpleProps.className || '';
    initialPosition = simpleProps.initialPosition || { x: 200, y: 150 };
    onPositionChange = simpleProps.onPositionChange;
    onSnapToEdge = simpleProps.onSnapToEdge;
  }

  const { isDragging, dragRef, handleMouseDown } = useFastDraggable({
    x: initialPosition.x,
    y: initialPosition.y,
    onPositionChange: (isMaximized || isSnapped) ? undefined : onPositionChange, // Don't update position when maximized or snapped
    disabled: isMaximized || !!isSnapped, // Disable dragging when maximized or snapped
    onSnapToEdge: (isMaximized || isSnapped) ? undefined : onSnapToEdge // Don't snap when maximized or already snapped
  });

  // Debug: Check applied styles after render
  React.useEffect(() => {
    if (dragRef.current && isSnapped) {
      setTimeout(() => {
        const el = dragRef.current;
        if (el) {
          const computed = window.getComputedStyle(el);
          const inline = el.style;
          console.log('=== STYLE DEBUG ===');
          console.log('Inline styles:', {
            left: inline.left,
            top: inline.top,
            transform: inline.transform,
            position: inline.position
          });
          console.log('Computed styles:', {
            left: computed.left,
            top: computed.top,
            transform: computed.transform,
            position: computed.position
          });
          console.log('Element rect:', el.getBoundingClientRect());
        }
      }, 50);
    }
  }, [isSnapped]);

  // Memoize style calculations for performance
  const windowStyle = useMemo(() => {
    const baseStyle = {
      borderColor: '#2E3135',
      backgroundColor: 'rgba(18, 18, 18, 0.7)',
      borderRadius: '6px',
      borderWidth: '1px',
      backdropFilter: 'blur(8px)',
      zIndex: zIndex,
    };

    if (isMaximized) {
      return {
        ...baseStyle,
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        borderRadius: 0, // Remove border radius when maximized
        transform: 'none', // Override any transform when maximized
      };
    }

    if (isSnapped) {
      const sidebarWidth = 64;
      const availableWidth = window.innerWidth - sidebarWidth;
      const snapWidth = availableWidth / 2;
      const leftPos = isSnapped === 'left' ? sidebarWidth : sidebarWidth + snapWidth;
      
      console.log(`Applying CSS - isSnapped: ${isSnapped}, leftPos: ${leftPos}`);
      
      const snappedStyle = {
        ...baseStyle,
        position: 'fixed' as const,
        top: 0,
        left: leftPos,
        width: snapWidth,
        height: '100vh',
        borderRadius: 0, // Remove border radius when snapped
        transform: 'none', // Override any transform when snapped
      };
      
      console.log('Snapped style object:', snappedStyle);
      
      return snappedStyle;
    }

    // The fast draggable system handles positioning via transforms
    // We only need to set initial position via left/top
    return baseStyle;
  }, [isMaximized, isSnapped, zIndex]);

  // Don't render if minimized (for app windows)
  if (isMinimized) {
    return null;
  }

  return (
    <Card
      ref={dragRef}
      className={`fixed shadow-2xl border ${
        isMaximized ? 'max-w-none min-w-0 w-full h-full' : 'min-w-80'
      } ${
        isDragging ? 'shadow-sm ring-1 ring-white/30' : ''
      } ${
        isAppWindow && !isMaximized ? 'max-w-4xl' : ''
      } ${
        !isAppWindow && !isMaximized ? 'max-w-96' : ''
      } ${className}`}
      style={windowStyle}
      onMouseDown={onFocus}


    >
      <CardHeader
        className={`pb-1 pt-1 px-3 select-none text-white ${
          (isMaximized || isSnapped) ? 'cursor-default' : 'cursor-move'
        }`}
        style={{ 
          backgroundColor: 'rgba(18, 18, 18, 0.7)', 
          borderBottom: '1px solid #2E3135',
          borderTopLeftRadius: (isMaximized || isSnapped) ? '0px' : '6px',
          borderTopRightRadius: (isMaximized || isSnapped) ? '0px' : '6px',
          backdropFilter: 'blur(4px)'
        }}
        onMouseDown={(isMaximized || isSnapped) ? undefined : (e) => {
          // Call focus first, then handle drag
          onFocus?.();
          handleMouseDown(e);
        }}
      >
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            {title}
          </span>
          <span className="flex items-center gap-1">
            {onMinimize && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-slate-600 text-slate-300 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize();
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
            )}
            {onMaximize && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-slate-600 text-slate-300 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onMaximize();
                }}
              >
                <Square className="h-3 w-3" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-red-500 text-slate-300 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent 
        className="overflow-hidden p-0" 
        style={{ 
          backgroundColor: 'rgba(18, 18, 18, 0.7)',
          borderBottomLeftRadius: (isMaximized || isSnapped) ? '0px' : '6px',
          borderBottomRightRadius: (isMaximized || isSnapped) ? '0px' : '6px',
          backdropFilter: 'blur(4px)'
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
};
