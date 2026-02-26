'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

type Props = {
  lowSrc: string;
  highSrc?: string;
  poster?: string;
  fillWidth?: boolean;
  zoomScale?: number;
  maxHeight?: string;
  className?: string;
  loop?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  switchToHighOnZoom?: boolean;
  showLoader?: boolean;
  onLowSrcError?: () => void;
  onHighSrcError?: () => void;
  onZoomChange?: (zoomed: boolean) => void;
};

export default function ZoomeableVideo({
  lowSrc,
  highSrc,
  poster,
  fillWidth = false,
  zoomScale = 2.2,
  maxHeight = '80vh',
  className,
  loop = true,
  muted = true,
  autoPlay = true,
  switchToHighOnZoom = true,
  showLoader = true,
  onLowSrcError,
  onHighSrcError,
  onZoomChange,
}: Props) {
  const lowVideoRef = useRef<HTMLVideoElement | null>(null);
  const highVideoRef = useRef<HTMLVideoElement | null>(null);
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
    const el = lowVideoRef.current;
    if (!el) return { x: 50, y: 50 };
    const rect = el.getBoundingClientRect();
    const px = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const py = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return { x: (px / rect.width) * 100, y: (py / rect.height) * 100 };
  }, []);

  const clampPan = useCallback((x: number, y: number, scale: number) => {
    const el = lowVideoRef.current;
    if (!el || scale <= 1) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const maxX = Math.max(0, ((scale - 1) * rect.width) / 2);
    const maxY = Math.max(0, ((scale - 1) * rect.height) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

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
  }, [isTouchInput]);

  const handlePointerLeave = useCallback(() => {
    if (isTouchInput) return;
    setHover(false);
  }, [isTouchInput]);

  useEffect(() => {
    setIsHighReady(false);
  }, [highSrc, lowSrc]);

  useEffect(() => {
    const low = lowVideoRef.current;
    if (!low) return;
    if (!lowSrc) {
      try {
        low.removeAttribute('src');
        low.load();
      } catch {}
      setIsLowReady(false);
      return;
    }
    setIsLowReady(false);
    resetZoom();
  }, [lowSrc, resetZoom]);

  useEffect(() => {
    if (!zoomed || !switchToHighOnZoom || !highSrc || !isHighReady) return;
    const low = lowVideoRef.current;
    const high = highVideoRef.current;
    if (!low || !high) return;

    const syncAndPlay = () => {
      try {
        if (Math.abs(high.currentTime - low.currentTime) > 0.15) {
          high.currentTime = low.currentTime;
        }
      } catch {}
      if (!low.paused && high.paused) {
        high.play().catch(() => {});
      }
    };

    syncAndPlay();
    const interval = window.setInterval(syncAndPlay, 220);
    return () => window.clearInterval(interval);
  }, [zoomed, switchToHighOnZoom, highSrc, isHighReady]);

  useEffect(() => {
    if (zoomed) return;
    const high = highVideoRef.current;
    if (!high) return;
    try {
      high.pause();
    } catch {}
  }, [zoomed]);

  useEffect(() => {
    onZoomChange?.(zoomed);
  }, [zoomed, onZoomChange]);

  useEffect(() => {
    if (!isTouchInput) return;
    setPan((prev) => clampPan(prev.x, prev.y, touchScale));
  }, [clampPan, isTouchInput, touchScale]);

  const effectiveScale = isTouchInput ? touchScale : zoomed ? zoomScale : 1;
  const fullWidthMode = fillWidth || isTouchInput;
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
    width: fullWidthMode ? '100%' : 'auto',
    maxWidth: fullWidthMode ? '100%' : '99vw',
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

  const lowVideoStyle: React.CSSProperties = {
    ...mediaStyleBase,
    cursor: isTouchInput
      ? 'default'
      : zoomed
        ? 'zoom-out'
        : hover
          ? 'zoom-in'
          : 'default',
    zIndex: 1000,
    opacity: isLowReady ? 1 : 0,
  };

  const highVideoStyle: React.CSSProperties = {
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
      <video
        ref={lowVideoRef}
        src={lowSrc || undefined}
        poster={poster}
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        preload="metadata"
        onLoadedData={() => setIsLowReady(true)}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onDragStart={(e) => e.preventDefault()}
        onError={() => {
          setIsLowReady(false);
          onLowSrcError?.();
        }}
        style={lowVideoStyle}
      />
      {switchToHighOnZoom && highSrc ? (
        <video
          ref={highVideoRef}
          src={highSrc}
          playsInline
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          preload="metadata"
          onLoadedData={() => {
            setIsHighReady(true);
            const low = lowVideoRef.current;
            const high = highVideoRef.current;
            if (!low || !high) return;
            try {
              high.currentTime = low.currentTime;
            } catch {}
            if (!low.paused) {
              high.play().catch(() => {});
            }
          }}
          onError={() => {
            setIsHighReady(false);
            onHighSrcError?.();
          }}
          style={highVideoStyle}
        />
      ) : null}
    </div>
  );
}
