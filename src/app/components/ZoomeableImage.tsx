'use client';

import React, { useRef, useState, useCallback } from 'react';

type Props = {
  src: string;
  alt?: string;
  zoomScale?: number;
  maxHeight?: string; // e.g. '80vh'
  className?: string;
};

export default function ZoomableImage({
  src,
  alt = '',
  zoomScale = 2.2,
  maxHeight = '80vh',
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const touchDeviceRef = useRef(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  const [hover, setHover] = useState(false);

  const coordsFromEvent = useCallback((clientX: number, clientY: number) => {
    const el = imgRef.current;
    if (!el) return { x: 50, y: 50 };
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return { x: (x / rect.width) * 100, y: (y / rect.height) * 100 };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (touchDeviceRef.current) return;
      e.stopPropagation();
      const { x, y } = coordsFromEvent(e.clientX, e.clientY);
      if (!zoomed) {
        setOrigin({ x, y });
        setZoomed(true);
      } else {
        setZoomed(false);
        setOrigin({ x: 50, y: 50 });
      }
    },
    [coordsFromEvent, zoomed]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!zoomed) return;
      e.stopPropagation();
      const { x, y } = coordsFromEvent(e.clientX, e.clientY);
      setOrigin({ x, y });
    },
    [coordsFromEvent, zoomed]
  );

  const handleMouseEnter = useCallback(() => {
    setHover(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHover(false);
    setZoomed(false);
    setOrigin({ x: 50, y: 50 });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setHover(false);
    setZoomed(false);
    setOrigin({ x: 50, y: 50 });
  }, []);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchDeviceRef.current = true;
      const t = e.touches[0];
      const { x, y } = coordsFromEvent(t.clientX, t.clientY);
      touchStartRef.current = { x, y };
      setOrigin({ x, y });
      setZoomed(true);
    },
    [coordsFromEvent]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!zoomed) return;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const { x, y } = coordsFromEvent(t.clientX, t.clientY);
      setOrigin({ x, y });
      e.preventDefault();
    },
    [coordsFromEvent, zoomed]
  );

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    if (zoomed) {
      setZoomed(false);
      setOrigin({ x: 50, y: 50 });
    }
  }, [zoomed]);

  const imgStyle: React.CSSProperties = {
    display: 'block',
    width: 'auto',
    maxWidth: '99vw',
    maxHeight: maxHeight,
    height: 'auto',
    objectFit: 'contain',
    transformOrigin: `${origin.x}% ${origin.y}%`,
    transform: zoomed ? `scale(${zoomScale})` : 'scale(1)',
    transition: zoomed ? 'transform 0.08s linear' : 'transform 240ms ease',
    cursor: zoomed ? 'zoom-out' : hover ? 'zoom-in' : 'default',
    userSelect: 'none',
    pointerEvents: 'auto',
    margin: '0 auto',
    zIndex: 1000,
  };

  const containerStyle: React.CSSProperties = {
    padding: '2rem 0',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    maxHeight: maxHeight,
    width: '100%',
  };

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      onPointerLeave={handlePointerLeave}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleTouchEnd}
      style={containerStyle}
      className={className}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={imgStyle}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
}
