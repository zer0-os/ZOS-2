import { useRef, useCallback, useEffect, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseFastDraggableOptions {
  x?: number;
  y?: number;
  onPositionChange?: (position: Position) => void;
  disabled?: boolean; // Disable dragging when maximized
  onSnapToEdge?: (side: 'left' | 'right' | null) => void; // Callback for edge snapping
  onSnapPreview?: (side: 'left' | 'right' | null) => void; // Callback for snap preview during drag
}

export const useFastDraggable = (options: UseFastDraggableOptions = {}) => {
  const { x = 100, y = 100, onPositionChange, disabled = false, onSnapToEdge, onSnapPreview } = options;
  const [position, setPosition] = useState<Position>({ x, y });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastPositionRef = useRef<Position>({ x, y });

  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;

    // Add CSS optimizations only when not disabled
    if (!disabled) {
      el.classList.add('draggable');
      el.style.willChange = 'transform';
      el.style.touchAction = 'none';
      el.style.contain = 'layout paint style';
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      el.style.left = '0px';
      el.style.top = '0px';
    } else {
      // Remove draggable class when disabled to prevent CSS interference
      el.classList.remove('draggable');
      // Clear all dragging-related styles when disabled
      el.style.transform = 'none';
      el.style.willChange = '';
      el.style.touchAction = '';
      el.style.contain = '';
      el.style.left = '';
      el.style.top = '';
    }
    
    // Update internal position state when external position changes
    // But only if not disabled (not snapped/maximized)
    if (!disabled) {
      setPosition({ x, y });
    }

    return () => {
      if (el) {
        el.classList.remove('draggable');
      }
      // Cancel any pending RAF on cleanup
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [x, y, disabled]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const el = dragRef.current;
    if (!el) return;
    
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    
    // Since we're using transform-only positioning, the element's natural position is at 0,0
    // and the current visual position is determined by the transform
    // We need to get where the user actually clicked relative to the current visual position
    const rect = el.getBoundingClientRect();
    
    // Calculate offset from mouse to where user clicked within the window
    const offsetX = startMouseX - rect.left;
    const offsetY = startMouseY - rect.top;
    
    setIsDragging(true);
    el.style.transition = 'none';
    el.dataset.dragging = '1';

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      
      // Use transform for immediate visual feedback
      el.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
      
      // Store the latest position
      lastPositionRef.current = { x: newX, y: newY };
      
      // Check for snap preview during drag
      if (onSnapPreview) {
        const snapThreshold = 20;
        const sidebarWidth = 64;
        const screenWidth = window.innerWidth;
        const mouseX = e.clientX;
        
        let previewSide: 'left' | 'right' | null = null;
        
        if (mouseX <= sidebarWidth + snapThreshold) {
          previewSide = 'left';
        } else if (mouseX >= screenWidth - snapThreshold) {
          previewSide = 'right';
        }
        
        onSnapPreview(previewSide);
      }
      
      // Throttle state updates with RAF for performance
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          const latestPosition = lastPositionRef.current;
          setPosition(latestPosition);
          onPositionChange?.(latestPosition);
          rafRef.current = 0;
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      
      // Cancel any pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      
      // Check for edge snapping
      const snapThreshold = 20; // pixels from edge to trigger snap
      const sidebarWidth = 64; // account for sidebar
      const screenWidth = window.innerWidth;
      const mouseX = e.clientX;
      
      let snapSide: 'left' | 'right' | null = null;
      
      if (mouseX <= sidebarWidth + snapThreshold) {
        // Near left edge (accounting for sidebar)
        snapSide = 'left';
      } else if (mouseX >= screenWidth - snapThreshold) {
        // Near right edge
        snapSide = 'right';
      }
      
      if (snapSide && onSnapToEdge) {
        // Debug: Log snap detection
        console.log(`Snap detected: ${snapSide}, mouseX: ${mouseX}, screenWidth: ${screenWidth}, threshold: ${snapThreshold}`);
        // Trigger snap instead of normal position update
        onSnapToEdge(snapSide);
      } else {
        // Normal position update
        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);
        onPositionChange?.(newPosition);
      }
      
      setIsDragging(false);
      el.style.transition = '';
      delete el.dataset.dragging;
      
      // Clear snap preview when drag ends
      onSnapPreview?.(null);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onPositionChange, onSnapToEdge, onSnapPreview]);

  return {
    position,
    isDragging,
    dragRef,
    handleMouseDown,
    setPosition
  };
};