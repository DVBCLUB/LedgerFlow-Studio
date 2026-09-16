import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useResizablePanel — custom hook for draggable panel resizing.
 *
 * Returns:
 *   panelWidth  — current width in pixels (or initial as fallback)
 *   panelRef    — attach to the resizable panel
 *   handleRef   — attach to the drag handle
 *   isResizing  — true while the user is dragging
 *
 * Usage:
 *   const { panelWidth, panelRef, handleRef, isResizing } = useResizablePanel({ minWidth: 280, maxWidth: 800, initialWidth: 360 });
 *   <div ref={panelRef} style={{ width: panelWidth }}> ... <div ref={handleRef} className="resize-handle" /> </div>
 */
export function useResizablePanel({
  minWidth = 240,
  maxWidth = 960,
  initialWidth = 360,
  defaultDirection = 'right',
}: {
  minWidth?: number;
  maxWidth?: number;
  initialWidth?: number;
  defaultDirection?: 'right' | 'left';
} = {}) {
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(initialWidth);

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = panelRef.current?.getBoundingClientRect().width ?? initialWidth;
    },
    [initialWidth],
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = defaultDirection === 'right' ? e.clientX - startXRef.current : startXRef.current - e.clientX;
      const next = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta));
      setPanelWidth(next);
    },
    [isResizing, minWidth, maxWidth, defaultDirection],
  );

  const onMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Attach / detach global listeners
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    handle.addEventListener('mousedown', onMouseDown);
    return () => handle.removeEventListener('mousedown', onMouseDown);
  }, [onMouseDown]);

  useEffect(() => {
    if (!isResizing) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, onMouseMove, onMouseUp]);

  return { panelWidth, panelRef, handleRef, isResizing };
}
