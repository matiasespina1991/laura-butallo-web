'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

type Props = {
  lowSrc: string;
  highSrc?: string;
  alt?: string;
  zoomScale?: number;
  maxHeight?: string;
  className?: string;
  switchToHighOnZoom?: boolean;
  showLoader?: boolean;
  onLowSrcError?: () => void;
  onHighSrcError?: () => void;
  onZoomChange?: (zoomed: boolean) => void;
};

export default function ZoomeableImage({
  lowSrc,
  highSrc,
  alt = '',
  zoomScale = 2.2,
  maxHeight = '80vh',
  className,
  switchToHighOnZoom = true,
  showLoader = true,
  onLowSrcError,
  onHighSrcError,
  onZoomChange,
}: Props) {
  const lowImgRef = useRef<HTMLImageElement | null>(null);
  const touchDeviceRef = useRef(false);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [touchScale, setTouchScale] = useState(1);
  const [isTouchInput, setIsTouchInput] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  const [hover, setHover] = useState(false);
  const [isLowReady, setIsLowReady] = useState(false);
  const [isHighReady, setIsHighReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const coarsePointer =
      window.matchMedia('(pointer: coarse)').matches ||
      window.navigator.maxTouchPoints > 0;
    if (coarsePointer) setIsTouchInput(true);
  }, []);

  const clampScale = useCallback(
    (value: number) => Math.min(zoomScale, Math.max(1, value)),
    [zoomScale]
  );

  const resetZoom = useCallback(() => {
    setZoomed(false);
    setTouchScale(1);
    setPan({ x: 0, y: 0 });
    setOrigin({ x: 50, y: 50 });
    dragStartRef.current = null;
  }, []);

  const coordsFromEvent = useCallback((clientX: number, clientY: number) => {
    const el = lowImgRef.current;
    if (!el) return { x: 50, y: 50 };
    const rect = el.getBoundingClientRect();
    const px = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const py = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return { x: (px / rect.width) * 100, y: (py / rect.height) * 100 };
  }, []);

  const clampPan = useCallback((x: number, y: number, scale: number) => {
    const el = lowImgRef.current;
    if (!el || scale <= 1) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const maxX = Math.max(0, ((scale - 1) * rect.width) / 2);
    const maxY = Math.max(0, ((scale - 1) * rect.height) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (touchDeviceRef.current || isTouchInput) return;
      e.stopPropagation();
      const { x, y } = coordsFromEvent(e.clientX, e.clientY);
      setOrigin({ x, y });
      setZoomed((z) => !z);
    },
    [coordsFromEvent, isTouchInput]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isTouchInput || !zoomed) return;
      e.stopPropagation();
      const { x, y } = coordsFromEvent(e.clientX, e.clientY);
      setOrigin({ x, y });
    },
    [coordsFromEvent, isTouchInput, zoomed]
  );

  const handleMouseEnter = useCallback(() => setHover(true), []);

  const handleMouseLeave = useCallback(() => {
    if (isTouchInput) return;
    setHover(false);
    resetZoom();
  }, [isTouchInput, resetZoom]);

  const handlePointerLeave = useCallback(() => {
    if (isTouchInput) return;
    setHover(false);
    resetZoom();
  }, [isTouchInput, resetZoom]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchDeviceRef.current = true;
      setIsTouchInput(true);
      if (e.touches.length !== 2) {
        if (e.touches.length === 1 && touchScale > 1.01) {
          const t = e.touches[0];
          dragStartRef.current = {
            x: t.clientX,
            y: t.clientY,
            panX: pan.x,
            panY: pan.y,
          };
          e.stopPropagation();
          e.preventDefault();
        }
        return;
      }

      e.stopPropagation();
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(
        t2.clientX - t1.clientX,
        t2.clientY - t1.clientY
      );
      dragStartRef.current = null;
      pinchStartDistanceRef.current = distance > 0 ? distance : 1;
      pinchStartScaleRef.current = touchScale;
      if (touchScale <= 1.01) setZoomed(true);
    },
    [pan.x, pan.y, touchScale]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDistanceRef.current) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const distance = Math.hypot(
          t2.clientX - t1.clientX,
          t2.clientY - t1.clientY
        );
        const nextScale = clampScale(
          pinchStartScaleRef.current *
            ((distance > 0 ? distance : 1) / pinchStartDistanceRef.current)
        );
        setTouchScale(nextScale);
        setZoomed(nextScale > 1.01);
        setPan((prev) => clampPan(prev.x, prev.y, nextScale));
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      if (!zoomed || e.touches.length !== 1 || touchScale <= 1.01) return;
      const t = e.touches[0];
      const dragStart = dragStartRef.current;
      if (!dragStart) return;
      const nextX = dragStart.panX + (t.clientX - dragStart.x);
      const nextY = dragStart.panY + (t.clientY - dragStart.y);
      setPan(clampPan(nextX, nextY, touchScale));
      e.stopPropagation();
      e.preventDefault();
    },
    [clampPan, clampScale, touchScale, zoomed]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStartDistanceRef.current = null;
        pinchStartScaleRef.current = touchScale;
      }
      if (e.touches.length === 1 && touchScale > 1.01) {
        const t = e.touches[0];
        dragStartRef.current = {
          x: t.clientX,
          y: t.clientY,
          panX: pan.x,
          panY: pan.y,
        };
      }
      if (e.touches.length === 0 && touchScale <= 1.01) {
        resetZoom();
      }
      if (e.touches.length === 0) {
        dragStartRef.current = null;
      }
      e.stopPropagation();
    },
    [pan.x, pan.y, resetZoom, touchScale]
  );

  const handleTouchCancel = useCallback(() => {
    pinchStartDistanceRef.current = null;
    dragStartRef.current = null;
    if (touchScale <= 1.01) {
      resetZoom();
    }
  }, [resetZoom, touchScale]);

  useEffect(() => {
    const img = lowImgRef.current;
    if (!img) return;
    if (!lowSrc) {
      img.removeAttribute('src');
      setIsLowReady(false);
      return;
    }
    if (img.src && img.src.includes(lowSrc)) return;
    setIsLowReady(false);
    setIsHighReady(false);
    img.src = lowSrc;
    resetZoom();
  }, [lowSrc, resetZoom]);

  useEffect(() => {
    setIsHighReady(false);
  }, [highSrc, lowSrc]);

  useEffect(() => {
    if (!switchToHighOnZoom || !highSrc || !zoomed || isHighReady) return;
    let canceled = false;
    const pre = new Image();
    pre.onload = () => {
      if (canceled) return;
      setIsHighReady(true);
    };
    pre.onerror = () => {
      if (canceled) return;
      onHighSrcError?.();
    };
    pre.src = highSrc;
    return () => {
      canceled = true;
    };
  }, [zoomed, highSrc, switchToHighOnZoom, isHighReady, onHighSrcError]);

  useEffect(() => {
    onZoomChange?.(zoomed);
  }, [zoomed, onZoomChange]);

  useEffect(() => {
    if (!isTouchInput) return;
    setPan((prev) => clampPan(prev.x, prev.y, touchScale));
  }, [clampPan, isTouchInput, touchScale]);

  const effectiveScale = isTouchInput ? touchScale : zoomed ? zoomScale : 1;
  const transformTransition = isTouchInput
    ? 'transform 0s'
    : zoomed
      ? 'transform 0.08s linear'
      : 'transform 240ms ease';
  const showHighLayer =
    Boolean(highSrc) && switchToHighOnZoom && isHighReady && zoomed;

  const mediaStyleBase: React.CSSProperties = {
    gridArea: '1 / 1',
    display: 'block',
    width: isTouchInput ? '100%' : 'auto',
    maxWidth: isTouchInput ? '100%' : '99vw',
    maxHeight,
    borderRadius: '8px',
    height: 'auto',
    objectFit: 'contain',
    transformOrigin: isTouchInput ? '50% 50%' : `${origin.x}% ${origin.y}%`,
    transform: isTouchInput
      ? `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${effectiveScale})`
      : `scale(${effectiveScale})`,
    transition: `${transformTransition}, opacity 240ms ease`,
    userSelect: 'none',
    touchAction: 'none',
    margin: '0 auto',
    willChange: 'transform, opacity',
  };

  const lowImgStyle: React.CSSProperties = {
    ...mediaStyleBase,
    cursor: isTouchInput
      ? 'default'
      : zoomed
        ? 'zoom-out'
        : hover
          ? 'zoom-in'
          : 'default',
    pointerEvents: 'auto',
    zIndex: 1000,
    opacity: isLowReady ? 1 : 0,
  };

  const highImgStyle: React.CSSProperties = {
    ...mediaStyleBase,
    cursor: 'default',
    pointerEvents: 'none',
    zIndex: 1001,
    opacity: showHighLayer ? 1 : 0,
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    padding: 0,
    boxSizing: 'border-box',
    display: 'grid',
    placeItems: 'center',
    overflow: 'visible',
    maxHeight,
    touchAction: 'none',
    overscrollBehavior: 'contain',
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerLeave={handlePointerLeave}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={containerStyle}
      className={className}
    >
      {!isLowReady && showLoader ? (
        <img
          src="/assets/system/loader/loader.webp"
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '2.4rem',
            height: '2.4rem',
            transform: 'translate(-50%, -50%)',
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 1200,
          }}
        />
      ) : null}
      <img
        ref={lowImgRef}
        alt={alt}
        draggable={false}
        src={lowSrc || undefined}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onLoad={() => setIsLowReady(true)}
        style={lowImgStyle}
        onDragStart={(e) => e.preventDefault()}
        onError={() => {
          setIsLowReady(false);
          onLowSrcError?.();
        }}
      />
      {switchToHighOnZoom && highSrc ? (
        <img
          src={highSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          onLoad={() => setIsHighReady(true)}
          onError={() => {
            setIsHighReady(false);
            onHighSrcError?.();
          }}
          style={highImgStyle}
        />
      ) : null}
    </div>
  );
}
