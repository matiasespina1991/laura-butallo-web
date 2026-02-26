'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import styles from './page.module.css';
import { MediaSet } from '@/utils/types/mediaset';
import { Media } from '@/utils/types/media';
import ScrollContainer from 'react-indiana-drag-scroll';
import { AnimatePresence, motion } from 'framer-motion';
import NextImage from 'next/image';
import { Box, Grid, IconButton, Theme, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { useSwipeable } from 'react-swipeable';
import { fetchMediaSetsWithMedia } from '@/utils/functions/fetchMediaSetsWithMedia';
import ZoomableImage from './components/ZoomeableImage';
import ZoomeableVideo from './components/ZoomeableVideo';
import {
  selectImageAssets,
  selectVideoAssets,
} from '@/utils/media/assetSelectors';
import { useStorageAssetSrc } from '@/hooks/useStorageAssetSrc';
import Footer from './components/Footer';

type MediaWithHandlers = {
  m: Media;
  index: number;
  setIndex: number;
  setId: string;
  total: number;
  onMediaLoaded: (setId: string, index: number, total: number) => void;
  isVisible: boolean;
  sequenceVersion: number;
  isInitialLoad: boolean;
  showPostSkeleton: boolean;
  openLightbox: (
    mediaArray: Media[],
    mediaIndex: number,
    setIndex: number
  ) => void;
  mediaArray: Media[];
  setSize: number;
  isMobileDevice: boolean;
};

function MediaItem(props: MediaWithHandlers) {
  if (props.m.type === 'image') {
    return <ImageGridItem {...props} />;
  }
  return <VideoGridItem {...props} />;
}

function ImageGridItem({
  m,
  index,
  setIndex,
  setId,
  total,
  onMediaLoaded,
  isVisible,
  sequenceVersion,
  isInitialLoad,
  showPostSkeleton,
  openLightbox,
  mediaArray,
  setSize,
  isMobileDevice,
}: MediaWithHandlers) {
  const [loaded, setLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const hasNotifiedRef = useRef(false);
  const canReveal = isVisible && loaded;
  const fadeDelay = isInitialLoad ? '2s' : '0s';

  useEffect(() => {
    setLoaded(false);
    hasNotifiedRef.current = false;
  }, [sequenceVersion]);

  useEffect(() => {
    setLoaded(false);
  }, [m.id]);

  const sources = useMemo(
    () => selectImageAssets(m, isMobileDevice),
    [m, isMobileDevice]
  );
  const lowImage = useStorageAssetSrc(sources.low ?? sources.original);

  const notifyLoaded = useCallback(() => {
    if (hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;
    setLoaded(true);
    onMediaLoaded(setId, index, total);
  }, [index, onMediaLoaded, setId, total]);

  useEffect(() => {
    const img = imageRef.current;
    if (img && img.complete) {
      notifyLoaded();
    }
  }, [lowImage.src, sequenceVersion, notifyLoaded]);

  useEffect(() => {
    if (!lowImage.src) {
      notifyLoaded();
    }
  }, [lowImage.src, notifyLoaded]);

  useEffect(() => {
    if (!isInitialLoad) return;
    if (loaded) return;
    const timeout = window.setTimeout(() => {
      if (hasNotifiedRef.current) return;
      notifyLoaded();
    }, 3500);
    return () => window.clearTimeout(timeout);
  }, [isInitialLoad, loaded, notifyLoaded, setId, index, total, lowImage.src]);

  const handleImageError = () => {
    lowImage.handleError();
    notifyLoaded();
  };

  return (
    <motion.div
      className={styles.mediaHover}
      initial={{ opacity: 1, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: Math.min(0.3 + setIndex * 0.15, 1.2),
        duration: 1.0,
      }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {!canReveal && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(128, 128, 128, 0.06)',
            borderRadius: isMobileDevice ? '8px' : '10px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            zIndex: 0,
          }}
        />
      )}
      {showPostSkeleton ? (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(128, 128, 128, 0.06)',
            borderRadius: isMobileDevice ? '8px' : '10px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      {lowImage.src ? (
        <NextImage
          ref={imageRef}
          draggable={false}
          width={600}
          height={600}
          onLoad={notifyLoaded}
          style={{
            userSelect: 'none',
            display: 'block',
            borderRadius: isMobileDevice ? '8px' : '10px',
            position: 'relative',
            zIndex: 1,
            opacity: canReveal ? 1 : 0,
            transition: `opacity 1.4s ease ${fadeDelay}`,
          }}
          src={lowImage.src}
          onError={handleImageError}
          onClick={() => openLightbox(mediaArray, index, setIndex)}
          alt={'Media'}
          className={styles.photoSetImage}
          priority={setIndex === 0 && index < 4}
          loading={setIndex === 0 ? 'eager' : 'lazy'}
        />
      ) : null}
      {/* SEE MORE LINK */}
      {/* <a
        className={styles.seeMore}
        href="https://zora.co"
        target="_blank"
        rel="noreferrer noopener"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          fontSize: setSize === 1 ? '4rem' : setSize === 2 ? '3rem' : '2rem',
        }}
      >
        see in zora
        <img
          src="/images/logos/zora/zora_logo.svg"
          alt=""
          aria-hidden="true"
          style={{
            width: setSize === 1 ? '2.5rem' : setSize === 2 ? '2rem' : '1.5rem',
          }}
        />
        <img
          src="/images/icons/arrows/arrow_contact_light.png"
          alt=""
          aria-hidden="true"
          className={styles.seeMoreIcon}
        />
      </a> */}
    </motion.div>
  );
}

function VideoGridItem({
  m,
  index,
  setIndex,
  setId,
  total,
  onMediaLoaded,
  isVisible,
  sequenceVersion,
  isInitialLoad,
  showPostSkeleton,
  openLightbox,
  mediaArray,
  setSize,
  isMobileDevice,
}: MediaWithHandlers) {
  const [loaded, setLoaded] = useState(false);
  const hasNotifiedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canReveal = isVisible && loaded;
  const fadeDelay = isInitialLoad ? '2s' : '0s';

  useEffect(() => {
    setLoaded(false);
    hasNotifiedRef.current = false;
  }, [sequenceVersion]);

  useEffect(() => {
    setLoaded(false);
  }, [m.id]);

  const sources = useMemo(
    () => selectVideoAssets(m, isMobileDevice),
    [m, isMobileDevice]
  );
  const videoSource = useStorageAssetSrc(sources.low);
  const posterSource = useStorageAssetSrc(sources.poster);

  const handleVideoLoaded = useCallback(() => {
    if (hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;
    setLoaded(true);
    onMediaLoaded(setId, index, total);
  }, [index, onMediaLoaded, setId, total]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('[MediaItem] video error', m.id, e);
    videoSource.handleError();
    if (hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;
    setLoaded(true);
    onMediaLoaded(setId, index, total);
  };

  useEffect(() => {
    if (!videoSource.src) {
      if (hasNotifiedRef.current) return;
      hasNotifiedRef.current = true;
      setLoaded(true);
      onMediaLoaded(setId, index, total);
    }
  }, [videoSource.src, onMediaLoaded, setId, index, total]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      handleVideoLoaded();
    }
  }, [sequenceVersion, videoSource.src, handleVideoLoaded]);

  return (
    <motion.div
      className={styles.mediaHover}
      initial={{ opacity: 1, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: Math.min(0.3 + setIndex * 0.15, 1.2),
        duration: 1.0,
      }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {!canReveal && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(128, 128, 128, 0.06)',
            borderRadius: isMobileDevice ? '8px' : '10px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            zIndex: 0,
          }}
        />
      )}
      {showPostSkeleton ? (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(128, 128, 128, 0.06)',
            borderRadius: isMobileDevice ? '8px' : '10px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <video
        ref={videoRef}
        width="100%"
        height="100%"
        autoPlay
        loop
        muted
        playsInline
        preload={setIndex === 0 ? 'auto' : 'none'}
        poster={posterSource.src || undefined}
        src={videoSource.src || undefined}
        onLoadedData={handleVideoLoaded}
        onError={handleVideoError}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          display: 'block',
          borderRadius: isMobileDevice ? '8px' : '10px',
          position: 'relative',
          zIndex: 1,
          opacity: canReveal ? 1 : 0,
          transition: `opacity 1.4s ease ${fadeDelay}`,
        }}
        onClick={() => openLightbox(mediaArray, index, setIndex)}
      >
        Your browser does not support video.
      </video>
      {/* SEE MORE LINK */}
      {/* <a
        className={styles.seeMore}
        href="https://zora.co"
        target="_blank"
        rel="noreferrer noopener"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          fontSize: setSize === 1 ? '4rem' : setSize === 2 ? '3rem' : '2rem',
        }}
      >
        see in zora
        <img
          src="/images/logos/zora/zora_logo.svg"
          alt=""
          aria-hidden="true"
          style={{
            width: setSize === 1 ? '2.5rem' : setSize === 2 ? '2rem' : '1.5rem',
          }}
        />
        <img
          src="/images/icons/arrows/arrow_contact_light.png"
          alt=""
          aria-hidden="true"
          className={styles.seeMoreIcon}
        />
      </a> */}
    </motion.div>
  );
}

type LightboxMediaProps = {
  media: Media;
  isMobileQuery: boolean;
  isMobileDevice: boolean;
  onZoomStateChange: (zoomed: boolean) => void;
};

const LIGHTBOX_MEDIA_MAX_HEIGHT = '87vh';
const LIGHTBOX_MAIN_HEIGHT = `calc(${LIGHTBOX_MEDIA_MAX_HEIGHT} * 0.75)`;
const LIGHTBOX_MAIN_HEIGHT_MOBILE = `calc(${LIGHTBOX_MEDIA_MAX_HEIGHT} * 0.82)`;

function LightboxMediaContent(props: LightboxMediaProps) {
  if (props.media.type === 'image') {
    return <LightboxImageContent {...props} />;
  }
  return <LightboxVideoContent {...props} />;
}

function LightboxImageContent({
  media,
  isMobileQuery,
  isMobileDevice,
  onZoomStateChange,
}: LightboxMediaProps) {
  const sources = useMemo(
    () => selectImageAssets(media, isMobileDevice),
    [media, isMobileDevice]
  );
  const lowImage = useStorageAssetSrc(sources.low ?? sources.original);
  const highImage = useStorageAssetSrc(sources.high ?? sources.original);

  return (
    <ZoomableImage
      className="auto-cursor"
      lowSrc={lowImage.src || ''}
      highSrc={highImage.src || undefined}
      alt="Fullscreen Image"
      zoomScale={isMobileDevice ? 5 : 3}
      maxHeight={
        isMobileQuery ? LIGHTBOX_MAIN_HEIGHT_MOBILE : LIGHTBOX_MAIN_HEIGHT
      }
      onLowSrcError={lowImage.handleError}
      onHighSrcError={highImage.handleError}
      showLoader={false}
      onZoomChange={onZoomStateChange}
    />
  );
}

function LightboxVideoContent({
  media,
  isMobileQuery,
  isMobileDevice,
  onZoomStateChange,
}: LightboxMediaProps) {
  const sources = useMemo(
    () => selectVideoAssets(media, isMobileDevice),
    [media, isMobileDevice]
  );
  const mobileMediumVideo = media.paths?.derivatives?.['webm_720'];
  const lightboxLowAsset = isMobileDevice
    ? (mobileMediumVideo ?? sources.high ?? sources.low)
    : sources.low;
  const lowVideo = useStorageAssetSrc(lightboxLowAsset, {
    preferDirect: false,
  });
  const highVideo = useStorageAssetSrc(sources.high, { preferDirect: false });
  const posterSource = useStorageAssetSrc(sources.poster);

  return (
    <ZoomeableVideo
      className="auto-cursor"
      lowSrc={lowVideo.src || ''}
      highSrc={highVideo.src || undefined}
      poster={isMobileDevice ? undefined : posterSource.src || undefined}
      fillWidth={isMobileQuery || isMobileDevice}
      zoomScale={isMobileDevice ? 4 : 3}
      maxHeight={
        isMobileQuery ? LIGHTBOX_MAIN_HEIGHT_MOBILE : LIGHTBOX_MAIN_HEIGHT
      }
      autoPlay={true}
      muted={true}
      loop={true}
      onLowSrcError={lowVideo.handleError}
      onHighSrcError={highVideo.handleError}
      showLoader={false}
      onZoomChange={onZoomStateChange}
    />
  );
}

export default function Home() {
  const [mediaSetsWithMedia, setMediaSetsWithMedia] = useState<
    { mediaset: MediaSet; media: Media[] }[]
  >([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const [activeMediaSetIndex, setActiveMediaSetIndex] = useState<number | null>(
    null
  );
  const [isLightboxZoomed, setIsLightboxZoomed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allImagesLoaded, setAllImagesLoaded] = useState<boolean>(false);
  const [showCenteredLoader, setShowCenteredLoader] = useState(true);
  const loadedFlagsRef = useRef<Record<string, boolean[]>>({});
  const [maxVisibleBySet, setMaxVisibleBySet] = useState<
    Record<string, number>
  >({});
  const [firstSetReady, setFirstSetReady] = useState(false);
  const [postSkeletonVisible, setPostSkeletonVisible] = useState(false);
  const [sequenceVersion, setSequenceVersion] = useState(0);
  const firstSetId = mediaSetsWithMedia[0]?.mediaset.id;
  const firstSetTotal = mediaSetsWithMedia[0]?.media.length ?? 0;

  const isMobileQuery = useMediaQuery(
    (theme: Theme) => theme.breakpoints.down('sm'),
    { noSsr: true }
  );
  const isMobileViewport = isMobileQuery;
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const loaderTextColor = isDarkMode ? '#ffffff' : '#000000';
  const loaderGlowStrong = isDarkMode
    ? 'rgba(255,255,255,0.07)'
    : 'rgba(0,0,0,0.055)';
  const loaderGlowSoft = isDarkMode
    ? 'rgba(255,255,255,0.015)'
    : 'rgba(0,0,0,0.012)';
  const firstNavigablePosition = useMemo(() => {
    for (
      let setIndex = 0;
      setIndex < mediaSetsWithMedia.length;
      setIndex += 1
    ) {
      if (mediaSetsWithMedia[setIndex]?.media.length) {
        return { setIndex, mediaIndex: 0 };
      }
    }
    return null;
  }, [mediaSetsWithMedia]);
  const lastNavigablePosition = useMemo(() => {
    for (
      let setIndex = mediaSetsWithMedia.length - 1;
      setIndex >= 0;
      setIndex -= 1
    ) {
      const setLength = mediaSetsWithMedia[setIndex]?.media.length ?? 0;
      if (setLength > 0) {
        return { setIndex, mediaIndex: setLength - 1 };
      }
    }
    return null;
  }, [mediaSetsWithMedia]);
  const isAtLightboxStart =
    activeMediaSetIndex !== null &&
    activeMediaIndex !== null &&
    firstNavigablePosition !== null &&
    activeMediaSetIndex === firstNavigablePosition.setIndex &&
    activeMediaIndex === firstNavigablePosition.mediaIndex;
  const isAtLightboxEnd =
    activeMediaSetIndex !== null &&
    activeMediaIndex !== null &&
    lastNavigablePosition !== null &&
    activeMediaSetIndex === lastNavigablePosition.setIndex &&
    activeMediaIndex === lastNavigablePosition.mediaIndex;

  const getGridColumns = (length: number) => {
    switch (length) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 3:
        return 3;
      case 4:
        return 4;
      case 5:
        return 4;
      case 6:
        return 3;
      case 7:
        return 4;
      case 8:
        return 4;
      default:
        return 1;
    }
  };

  const getColumnsForSetLength = useCallback(
    (length: number) =>
      isMobileQuery && length === 4 ? 2 : getGridColumns(length),
    [isMobileQuery]
  );

  const getFirstRowVisibleLimit = useCallback(
    (total: number) => {
      if (total <= 0) return 0;
      const columns = getColumnsForSetLength(total);
      return Math.min(columns - 1, total - 1);
    },
    [getColumnsForSetLength]
  );

  const getRowEndIndex = useCallback(
    (index: number, total: number) => {
      if (total <= 0) return 0;
      const columns = getColumnsForSetLength(total);
      const safeIndex = Math.max(0, index);
      const rowStart = Math.floor(safeIndex / columns) * columns;
      return Math.min(rowStart + columns - 1, total - 1);
    },
    [getColumnsForSetLength]
  );

  useEffect(() => {
    async function loadMediaSets() {
      const cacheKey = 'home_mediaSets_cache';
      const cacheTimestampKey = 'home_mediaSets_cache_timestamp';

      let cachedData: string | null = null;

      // Try to load from cache first
      try {
        cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          setMediaSetsWithMedia(parsed);
          setIsLoading(false);
          setTimeout(() => setAllImagesLoaded(true), 800);
        }
      } catch (error) {
        console.error('Error loading from cache:', error);
      }

      // Fetch fresh data from database
      setIsLoading(cachedData ? false : true);
      if (!cachedData) {
        setAllImagesLoaded(false);
      }
      const fetched = await fetchMediaSetsWithMedia();
      setMediaSetsWithMedia(fetched);
      setIsLoading(false);
      setTimeout(() => setAllImagesLoaded(true), 800);

      // Save to cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify(fetched));
        localStorage.setItem(cacheTimestampKey, Date.now().toString());
      } catch (error) {
        console.error('Error saving to cache:', error);
      }
    }
    loadMediaSets();
  }, []);

  useEffect(() => {
    setMaxVisibleBySet((prev) =>
      Object.fromEntries(
        mediaSetsWithMedia.map((setWithMedia) => {
          const setId = setWithMedia.mediaset.id;
          const total = setWithMedia.media.length;
          const maxIndex = Math.max(total - 1, 0);
          const firstRowLimit = getFirstRowVisibleLimit(total);
          const prevLimit = allImagesLoaded ? prev[setId] : undefined;
          const baseLimit =
            typeof prevLimit === 'number' ? prevLimit : firstRowLimit;
          return [
            setId,
            Math.min(Math.max(baseLimit, firstRowLimit), maxIndex),
          ];
        })
      )
    );
    if (!allImagesLoaded) {
      loadedFlagsRef.current = {};
      setFirstSetReady(false);
      setSequenceVersion((prev) => prev + 1);
    }
  }, [mediaSetsWithMedia, allImagesLoaded, getFirstRowVisibleLimit]);

  useEffect(() => {
    if (!firstSetId) {
      setFirstSetReady(false);
      return;
    }
    if (firstSetTotal === 0) {
      setFirstSetReady(true);
    }
  }, [firstSetId, firstSetTotal]);

  useEffect(() => {
    if (!allImagesLoaded) {
      setPostSkeletonVisible(false);
      return;
    }
    setPostSkeletonVisible(true);
    const timeout = window.setTimeout(() => {
      setPostSkeletonVisible(false);
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [allImagesLoaded]);

  useEffect(() => {
    const shouldShowLoader =
      !isMobileViewport && (isLoading || !allImagesLoaded);
    if (shouldShowLoader) {
      setShowCenteredLoader(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowCenteredLoader(false);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [isLoading, allImagesLoaded, isMobileViewport]);

  const handleMediaLoaded = useCallback(
    (setId: string, index: number, total: number) => {
      const existing = loadedFlagsRef.current[setId];
      const flags = existing
        ? [...existing]
        : Array.from({ length: total }, () => false);
      if (flags.length !== total) {
        flags.length = total;
        for (let i = 0; i < total; i += 1) {
          if (typeof flags[i] !== 'boolean') flags[i] = false;
        }
      }
      if (flags[index]) return;
      flags[index] = true;
      loadedFlagsRef.current[setId] = flags;

      let contiguous = -1;
      for (let i = 0; i < flags.length; i += 1) {
        if (flags[i]) {
          contiguous = i;
        } else {
          break;
        }
      }

      const nextVisible =
        contiguous >= total - 1
          ? total - 1
          : getRowEndIndex(contiguous + 1, total);
      setMaxVisibleBySet((prev) => {
        if (prev[setId] === nextVisible) return prev;
        return { ...prev, [setId]: nextVisible };
      });

      if (firstSetId && setId === firstSetId) {
        const allLoaded =
          flags.length === firstSetTotal && flags.every(Boolean);
        if (allLoaded) setFirstSetReady(true);
      }
    },
    [firstSetId, firstSetTotal, getRowEndIndex]
  );

  const handlePreviousMedia = useCallback(() => {
    if (activeMediaIndex !== null && activeMediaSetIndex !== null) {
      if (activeMediaIndex > 0) {
        setActiveMediaIndex(activeMediaIndex - 1);
      } else {
        for (
          let setIndex = activeMediaSetIndex - 1;
          setIndex >= 0;
          setIndex -= 1
        ) {
          const prevSet = mediaSetsWithMedia[setIndex];
          if (prevSet?.media.length) {
            setActiveMediaSetIndex(setIndex);
            setActiveMediaIndex(prevSet.media.length - 1);
            return;
          }
        }
      }
    }
  }, [activeMediaIndex, activeMediaSetIndex, mediaSetsWithMedia]);

  const handleNextMedia = useCallback(() => {
    if (activeMediaIndex !== null && activeMediaSetIndex !== null) {
      const currentSet = mediaSetsWithMedia[activeMediaSetIndex];
      if (activeMediaIndex < currentSet.media.length - 1) {
        setActiveMediaIndex(activeMediaIndex + 1);
      } else {
        for (
          let setIndex = activeMediaSetIndex + 1;
          setIndex < mediaSetsWithMedia.length;
          setIndex += 1
        ) {
          const nextSet = mediaSetsWithMedia[setIndex];
          if (nextSet?.media.length) {
            setActiveMediaSetIndex(setIndex);
            setActiveMediaIndex(0);
            return;
          }
        }
      }
    }
  }, [activeMediaIndex, activeMediaSetIndex, mediaSetsWithMedia]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNextMedia(),
    onSwipedRight: () => handlePreviousMedia(),
  });

  useEffect(() => {
    if (lightboxOpen) {
      document.body.classList.add('no-scroll');
      document.documentElement.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
    };
  }, [lightboxOpen]);

  const openLightbox = (
    mediaArray: Media[],
    mediaIndex: number,
    setIndex: number
  ) => {
    setActiveMediaIndex(mediaIndex);
    setActiveMediaSetIndex(setIndex);
    setIsLightboxZoomed(false);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setActiveMediaIndex(null);
    setActiveMediaSetIndex(null);
    setIsLightboxZoomed(false);
  };

  useEffect(() => {
    if (!lightboxOpen) {
      setIsLightboxZoomed(false);
      return;
    }
    setIsLightboxZoomed(false);
  }, [lightboxOpen, activeMediaSetIndex, activeMediaIndex]);

  useEffect(() => {
    if (lightboxOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') handleNextMedia();
        if (e.key === 'ArrowLeft') handlePreviousMedia();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [lightboxOpen, handleNextMedia, handlePreviousMedia]);

  return (
    <>
      <AnimatePresence>
        {showCenteredLoader && !isMobileViewport ? (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{
              opacity: 0,
              filter: ['blur(0px)', 'blur(0.4px)', 'blur(2px)'],
            }}
            transition={{
              duration: 2.7,
              ease: [0.2, 0.9, 0.3, 1],
              filter: { duration: 2.7, times: [0, 0.82, 1], ease: 'easeIn' },
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              pointerEvents: 'none',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.38rem',
              }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                style={{
                  width: isMobileQuery ? '7.2rem' : '9rem',
                  height: isMobileQuery ? '7.2rem' : '9rem',
                  objectFit: 'contain',
                }}
              >
                <source
                  src="/assets/system/loader/loader_cueva.webm"
                  type="video/webm"
                />
              </video>
              <motion.span
                aria-hidden="true"
                animate={{
                  opacity: [0.45, 1, 0.45],
                  textShadow: [
                    `0 0 6px ${loaderGlowSoft}`,
                    `0 0 16px ${loaderGlowStrong}`,
                    `0 0 6px ${loaderGlowSoft}`,
                  ],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  fontSize: isMobileQuery ? '0.85rem' : '0.95rem',
                  letterSpacing: '0.08em',
                  textTransform: 'none',
                  color: loaderTextColor,
                  fontWeight: 500,
                }}
              >
                Loading...
              </motion.span>
            </Box>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <main className={`${styles.main} ${styles.homePage}`}>
        <Box
          sx={{
            height: {
              xs: '2.2rem',
              sm: '4rem',
              md: '5rem',
              lg: '5rem',
              xl: '7rem',
            },
          }}
        />
        <Box
          px={{ xs: '1.2rem', sm: '2rem' }}
          pb={{ xs: '0rem', sm: '6rem' }}
          width="100%"
          maxWidth="1400px"
        >
          {isLoading || !allImagesLoaded ? (
            <Box>
              <Box
                display="flex"
                flexDirection="column"
                gap={isMobileQuery ? '13px' : '16px'}
              >
                {/* Fila de 2 */}
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(2, 1fr)"
                  gap={isMobileQuery ? '13px' : '16px'}
                >
                  <Box
                    sx={{
                      aspectRatio: '1',
                      backgroundColor: 'rgba(128, 128, 128, 0.1)',
                      borderRadius: isMobileQuery ? '8px' : '10px',
                      animation:
                        'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                      },
                    }}
                  />
                  <Box
                    sx={{
                      aspectRatio: '1',
                      backgroundColor: 'rgba(128, 128, 128, 0.06)',
                      borderRadius: isMobileQuery ? '8px' : '10px',
                      animation:
                        'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                </Box>
                {/* Fila de 4 */}
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(4, 1fr)"
                  gap={isMobileQuery ? '13px' : '16px'}
                >
                  {[...Array(4)].map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        aspectRatio: '1',
                        backgroundColor: 'rgba(128, 128, 128, 0.06)',
                        borderRadius: isMobileQuery ? '8px' : '10px',
                        animation:
                          'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }}
                    />
                  ))}
                </Box>
                {/* Fila de 2 */}
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(2, 1fr)"
                  gap={isMobileQuery ? '13px' : '16px'}
                >
                  <Box
                    sx={{
                      aspectRatio: '1',
                      backgroundColor: 'rgba(128, 128, 128, 0.06)',
                      borderRadius: isMobileQuery ? '8px' : '10px',
                      animation:
                        'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                  <Box
                    sx={{
                      aspectRatio: '1',
                      backgroundColor: 'rgba(128, 128, 128, 0.06)',
                      borderRadius: isMobileQuery ? '8px' : '10px',
                      animation:
                        'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                </Box>
                {/* Fila de 3 */}
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(3, 1fr)"
                  gap={isMobileQuery ? '13px' : '16px'}
                >
                  {[...Array(3)].map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        aspectRatio: '1',
                        backgroundColor: 'rgba(128, 128, 128, 0.06)',
                        borderRadius: isMobileQuery ? '8px' : '10px',
                        animation:
                          'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }}
                    />
                  ))}
                </Box>
                {/* Fila de 2 (duplicada) */}
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(2, 1fr)"
                  gap={isMobileQuery ? '13px' : '16px'}
                >
                  <Box
                    sx={{
                      aspectRatio: '1',
                      backgroundColor: 'rgba(128, 128, 128, 0.1)',
                      borderRadius: isMobileQuery ? '8px' : '10px',
                      animation:
                        'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                  <Box
                    sx={{
                      aspectRatio: '1',
                      backgroundColor: 'rgba(128, 128, 128, 0.06)',
                      borderRadius: isMobileQuery ? '8px' : '10px',
                      animation:
                        'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                </Box>
                {/* Fila de 4 (duplicada) */}
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(4, 1fr)"
                  gap={isMobileQuery ? '13px' : '16px'}
                >
                  {[...Array(4)].map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        aspectRatio: '1',
                        backgroundColor: 'rgba(128, 128, 128, 0.06)',
                        borderRadius: isMobileQuery ? '8px' : '10px',
                        animation:
                          'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }}
                    />
                  ))}
                </Box>
                {/* Fila de 2 (duplicada) */}
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(2, 1fr)"
                  gap={isMobileQuery ? '13px' : '16px'}
                >
                  <Box
                    sx={{
                      aspectRatio: '1',
                      backgroundColor: 'rgba(128, 128, 128, 0.06)',
                      borderRadius: isMobileQuery ? '8px' : '10px',
                      animation:
                        'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                  <Box
                    sx={{
                      aspectRatio: '1',
                      backgroundColor: 'rgba(128, 128, 128, 0.06)',
                      borderRadius: isMobileQuery ? '8px' : '10px',
                      animation:
                        'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                </Box>
                {/* Fila de 3 (duplicada) */}
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(3, 1fr)"
                  gap={isMobileQuery ? '13px' : '16px'}
                >
                  {[...Array(3)].map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        aspectRatio: '1',
                        backgroundColor: 'rgba(128, 128, 128, 0.06)',
                        borderRadius: isMobileQuery ? '8px' : '10px',
                        animation:
                          'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          ) : null}

          {mediaSetsWithMedia.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: allImagesLoaded ? 1 : 0 }}
              transition={{ duration: 1.2 }}
            >
              <ScrollContainer draggable={false} className={styles.carousel}>
                {mediaSetsWithMedia.map((setWithMedia, setIndex) => {
                  if (setIndex > 0 && !firstSetReady) return null;
                  const columns = getColumnsForSetLength(
                    setWithMedia.media.length
                  );
                  const setId = setWithMedia.mediaset.id;
                  const visibleLimit =
                    maxVisibleBySet[setId] ??
                    getFirstRowVisibleLimit(setWithMedia.media.length);

                  return (
                    <motion.div
                      key={setWithMedia.mediaset.id}
                      className={styles.photoSetContainer}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 1,
                        ease: 'easeInOut',
                        delay: setIndex * 0.12,
                      }}
                    >
                      {setWithMedia.media.length > 0 && (
                        <Box>
                          <Grid
                            className="media-grid"
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: `repeat(${columns}, 1fr)`,
                            }}
                            gap={isMobileQuery ? '13px' : '16px'}
                          >
                            {setWithMedia.media.map((m, mediaIndex) => {
                              if (mediaIndex > visibleLimit) return null;
                              return (
                                <Box key={m.id} width="100%" height="100%">
                                  <MediaItem
                                    m={m}
                                    index={mediaIndex}
                                    setIndex={setIndex}
                                    setId={setId}
                                    total={setWithMedia.media.length}
                                    setSize={setWithMedia.media.length}
                                    onMediaLoaded={handleMediaLoaded}
                                    isVisible={mediaIndex <= visibleLimit}
                                    sequenceVersion={sequenceVersion}
                                    isInitialLoad={!allImagesLoaded}
                                    showPostSkeleton={postSkeletonVisible}
                                    openLightbox={openLightbox}
                                    mediaArray={setWithMedia.media}
                                    isMobileDevice={isMobileViewport}
                                  />
                                </Box>
                              );
                            })}
                          </Grid>
                        </Box>
                      )}
                    </motion.div>
                  );
                })}
              </ScrollContainer>
            </motion.div>
          )}

          {/* Lightbox */}
          <AnimatePresence mode="wait">
            {lightboxOpen &&
              activeMediaIndex !== null &&
              activeMediaSetIndex !== null && (
                <motion.div
                  onClick={closeLightbox}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    touchAction: 'none',
                    display: 'flex',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    width: '100vw',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingBottom: isMobileQuery ? '5rem' : '0',
                    zIndex: 1300,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(2px) saturate(0)',
                    overscrollBehavior: 'none',
                    pointerEvents: 'auto',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 900,
                      background: 'transparent',
                      pointerEvents: 'auto',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      zIndex: 900,
                      display: 'grid',
                      width: '100%',
                      height: '100%',
                      placeItems: 'center',
                    }}
                    onClick={closeLightbox}
                  >
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 1 }}
                        transition={{ duration: 0 }}
                        // {...swipeHandlers}
                        style={{
                          gridArea: '1 / 1',
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <Box
                          onClick={(e) => e.stopPropagation()}
                          onTouchStart={(e) => {}}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          style={{
                            display: 'block',
                            userSelect: 'none',
                            pointerEvents: 'auto',
                            width: isMobileViewport ? '99vw' : 'auto',
                            maxWidth: '99vw',
                            maxHeight: '80vh',
                            margin: '0 auto',
                          }}
                        >
                          <Box
                            sx={{
                              borderRadius: '6px',
                              overflow: 'visible',
                            }}
                          >
                            <IconButton
                              sx={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                color: 'white',
                                zIndex: 9999,
                                transition:
                                  'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                                width: '2.75rem',
                                height: '2.75rem',
                                borderRadius: '999px',
                                backgroundColor: 'rgba(120, 120, 120, 0.26)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                '&:hover': {
                                  backgroundColor: 'rgba(120, 120, 120, 0.34)',
                                },
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                closeLightbox();
                              }}
                            >
                              <Box
                                component="span"
                                aria-hidden="true"
                                sx={{
                                  fontSize: '1.44rem',
                                  lineHeight: 1,
                                  fontWeight: 300,
                                  transform: 'translateY(-1px)',
                                  display: 'inline-block',
                                }}
                              >
                                ×
                              </Box>
                            </IconButton>

                            {(() => {
                              const media =
                                mediaSetsWithMedia[activeMediaSetIndex].media[
                                  activeMediaIndex
                                ];
                              return (
                                <Box
                                  sx={{
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: {
                                      xs: 'auto',
                                      sm: LIGHTBOX_MEDIA_MAX_HEIGHT,
                                    },
                                    width: '100%',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      position: 'relative',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '100%',
                                      height: {
                                        xs: 'auto',
                                        sm: LIGHTBOX_MAIN_HEIGHT,
                                      },
                                      flex: '0 0 auto',
                                    }}
                                  >
                                    <motion.div
                                      initial={false}
                                      animate={{
                                        opacity:
                                          !isMobileViewport && isLightboxZoomed
                                            ? 0
                                            : 1,
                                        filter:
                                          !isMobileViewport && isLightboxZoomed
                                            ? 'blur(6px)'
                                            : 'blur(0px)',
                                      }}
                                      transition={{
                                        duration: 0.22,
                                        ease: 'easeInOut',
                                      }}
                                    style={{
                                      position: 'relative',
                                      zIndex: isMobileViewport ? 2600 : 2100,
                                      pointerEvents:
                                        !isMobileViewport && isLightboxZoomed
                                          ? 'none'
                                          : 'auto',
                                    }}
                                    >
                                      <IconButton
                                        aria-label="Previous media"
                                        sx={{
                                          position: 'absolute',
                                          left: { xs: '0.5rem', sm: '-4.5rem' },
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          color: 'white',
                                          zIndex: {
                                            xs: 2600,
                                            sm: 2100,
                                          },
                                          width: { xs: '2.75rem', sm: '3rem' },
                                          height: {
                                            xs: '2.75rem',
                                            sm: '3rem',
                                          },
                                          borderRadius: '999px',
                                          backgroundColor:
                                            'rgba(120, 120, 120, 0.26)',
                                          border:
                                            '1px solid rgba(255,255,255,0.2)',
                                          boxShadow:
                                            '0 6px 18px rgba(0,0,0,0.2)',
                                          backdropFilter: 'blur(3px)',
                                          WebkitBackdropFilter: 'blur(3px)',
                                          transition:
                                            'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                                          '&:hover': {
                                            backgroundColor:
                                              'rgba(120, 120, 120, 0.34)',
                                            borderColor:
                                              'rgba(255,255,255,0.28)',
                                            boxShadow:
                                              '0 8px 20px rgba(0,0,0,0.24)',
                                          },
                                          '&:focus-visible': {
                                            outline:
                                              '2px solid rgba(255,255,255,0.95)',
                                            outlineOffset: '2px',
                                          },
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isAtLightboxStart) return;
                                          handlePreviousMedia();
                                        }}
                                      >
                                        <Box
                                          component="span"
                                          aria-hidden="true"
                                          sx={{
                                            fontSize: {
                                              xs: '1.8rem',
                                              sm: '2rem',
                                            },
                                            lineHeight: 1,
                                            fontWeight: 300,
                                            paddingBottom: '0.3rem',
                                            transform: 'translateX(-1px)',
                                            display: 'inline-block',
                                          }}
                                        >
                                          ‹
                                        </Box>
                                      </IconButton>
                                    </motion.div>
                                    <Box
                                      sx={{
                                        position: 'relative',
                                        display: 'grid',
                                        placeItems: 'center',
                                      }}
                                    >
                                      <AnimatePresence initial={false} mode="sync">
                                        <motion.div
                                          key={media.id}
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          transition={{
                                            duration: 0.32,
                                            ease: 'easeInOut',
                                          }}
                                          style={{
                                            gridArea: '1 / 1',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            willChange: 'opacity',
                                          }}
                                        >
                                          <LightboxMediaContent
                                            media={media}
                                            isMobileQuery={isMobileQuery}
                                            isMobileDevice={isMobileViewport}
                                            onZoomStateChange={
                                              setIsLightboxZoomed
                                            }
                                          />
                                        </motion.div>
                                      </AnimatePresence>
                                    </Box>
                                    <motion.div
                                      initial={false}
                                      animate={{
                                        opacity:
                                          !isMobileViewport && isLightboxZoomed
                                            ? 0
                                            : 1,
                                        filter:
                                          !isMobileViewport && isLightboxZoomed
                                            ? 'blur(6px)'
                                            : 'blur(0px)',
                                      }}
                                      transition={{
                                        duration: 0.22,
                                        ease: 'easeInOut',
                                      }}
                                    style={{
                                      position: 'relative',
                                      zIndex: isMobileViewport ? 2600 : 2100,
                                      pointerEvents:
                                        !isMobileViewport && isLightboxZoomed
                                          ? 'none'
                                          : 'auto',
                                    }}
                                    >
                                      <IconButton
                                        aria-label="Next media"
                                        sx={{
                                          position: 'absolute',
                                          right: { xs: '0.5rem', sm: '-4.5rem' },
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          color: 'white',
                                          zIndex: {
                                            xs: 2600,
                                            sm: 2100,
                                          },
                                          width: { xs: '2.75rem', sm: '3rem' },
                                          height: {
                                            xs: '2.75rem',
                                            sm: '3rem',
                                          },
                                          borderRadius: '999px',
                                          backgroundColor:
                                            'rgba(120, 120, 120, 0.26)',
                                          border:
                                            '1px solid rgba(255,255,255,0.2)',
                                          boxShadow:
                                            '0 6px 18px rgba(0,0,0,0.2)',
                                          backdropFilter: 'blur(3px)',
                                          WebkitBackdropFilter: 'blur(3px)',
                                          transition:
                                            'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                                          '&:hover': {
                                            backgroundColor:
                                              'rgba(120, 120, 120, 0.34)',
                                            borderColor:
                                              'rgba(255,255,255,0.28)',
                                            boxShadow:
                                              '0 8px 20px rgba(0,0,0,0.24)',
                                          },
                                          '&:focus-visible': {
                                            outline:
                                              '2px solid rgba(255,255,255,0.95)',
                                            outlineOffset: '2px',
                                          },
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isAtLightboxEnd) return;
                                          handleNextMedia();
                                        }}
                                      >
                                        <Box
                                          component="span"
                                          aria-hidden="true"
                                          sx={{
                                            fontSize: {
                                              xs: '1.8rem',
                                              sm: '2rem',
                                            },
                                            lineHeight: 1,
                                            fontWeight: 300,
                                            paddingBottom: '0.3rem',
                                            transform: 'translateX(1px)',
                                            display: 'inline-block',
                                          }}
                                        >
                                          ›
                                        </Box>
                                      </IconButton>
                                    </motion.div>
                                  </Box>
                                </Box>
                              );
                            })()}
                          </Box>
                        </Box>
                      </motion.div>
                    </AnimatePresence>
                  </Box>
                </motion.div>
              )}
          </AnimatePresence>
        </Box>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ width: '100%', marginTop: 'auto' }}
        >
          <Footer />
        </motion.div>
      </main>
    </>
  );
}
