import { useState, useCallback, useRef, type PointerEvent } from 'react';

interface Position { x: number; y: number }
interface Size { width: number; height: number }

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface Options {
  initialPosition: Position
  initialSize: Size
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function applyStyle(el: HTMLElement, pos: Position, size: Size) {
  el.style.left = `${pos.x}px`;
  el.style.top = `${pos.y}px`;
  el.style.width = `${size.width}px`;
  el.style.height = `${size.height}px`;
}

export function useFloatingPanel({
  initialPosition,
  initialSize,
  minWidth = 320,
  minHeight = 300,
  maxWidth = 800,
  maxHeight = 900,
}: Options) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);

  // Live values used during drag — no state updates during drag
  const posRef = useRef(initialPosition);
  const sizeRef = useRef(initialSize);
  // Ref to the panel DOM element for direct style mutation
  const panelRef = useRef<HTMLDivElement>(null);

  const onDragStart = useCallback((e: PointerEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...posRef.current };

    const onMove = (e: globalThis.PointerEvent) => {
      const newPos = {
        x: startPos.x + (e.clientX - startX),
        y: startPos.y + (e.clientY - startY),
      };
      posRef.current = newPos;
      // Mutate DOM directly — zero React re-renders during drag
      if (panelRef.current) applyStyle(panelRef.current, newPos, sizeRef.current);
    };

    const onUp = () => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      // Commit to React state once on release
      setPosition({ ...posRef.current });
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
  }, []);

  const onResizeStart = useCallback((direction: ResizeDirection, e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = { ...sizeRef.current };
    const startPos = { ...posRef.current };

    const onMove = (e: globalThis.PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newW = startSize.width;
      let newH = startSize.height;
      let newX = startPos.x;
      let newY = startPos.y;

      if (direction.includes('e')) newW = startSize.width + dx;
      if (direction.includes('w')) {
        const clamped = clamp(startSize.width - dx, minWidth, maxWidth);
        newX = startPos.x + (startSize.width - clamped);
        newW = clamped;
      }
      if (direction.includes('s')) newH = startSize.height + dy;
      if (direction.includes('n')) {
        const clamped = clamp(startSize.height - dy, minHeight, maxHeight);
        newY = startPos.y + (startSize.height - clamped);
        newH = clamped;
      }

      const finalSize = {
        width: clamp(newW, minWidth, maxWidth),
        height: clamp(newH, minHeight, maxHeight),
      };
      const finalPos = { x: newX, y: newY };

      sizeRef.current = finalSize;
      posRef.current = finalPos;
      // Mutate DOM directly — zero React re-renders during drag
      if (panelRef.current) applyStyle(panelRef.current, finalPos, finalSize);
    };

    const onUp = () => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      // Commit to React state once on release
      setSize({ ...sizeRef.current });
      setPosition({ ...posRef.current });
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
  }, [minWidth, minHeight, maxWidth, maxHeight]);

  return { position, size, panelRef, onDragStart, onResizeStart };
}
