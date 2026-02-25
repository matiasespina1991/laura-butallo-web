'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import styles from '../../page.module.css';
import { MediaSet } from '@/utils/types/mediaset';
import { Media, MediaLinkProvider } from '@/utils/types/media';
import ScrollContainer from 'react-indiana-drag-scroll';
import { AnimatePresence, motion } from 'framer-motion';
import NextImage from 'next/image';
import { Box, Grid, IconButton, Theme, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { isMobile } from 'react-device-detect';
import { fetchCategoryMedia } from '@/utils/functions/fetchCategoryMedia';
import { MinimalLeftArrowIcon } from '../../components/MinimalLeftArrowIcon';
import { MinimalRightArrowIcon } from '../../components/MinimalRightArrowIcon';
import ZoomableImage from '../../components/ZoomeableImage';
import ZoomeableVideo from '../../components/ZoomeableVideo';
import {
  selectImageAssets,
  selectVideoAssets,
} from '@/utils/media/assetSelectors';
import { useStorageAssetSrc } from '@/hooks/useStorageAssetSrc';
import Footer from '../../components/Footer';

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
};

const DEFAULT_MEDIA_LINK_COLOR = '#ffffff';

const isValidHexColor = (value: string | undefined | null) =>
  Boolean(value && /^#[0-9a-fA-F]{6}$/.test(value));

const sanitizeMediaLinkColor = (value: string | undefined | null) =>
  typeof value === 'string' && isValidHexColor(value)
    ? value.toLowerCase()
    : DEFAULT_MEDIA_LINK_COLOR;

const getMediaLink = (media: Media) => {
  const link = media.link;
  if (!link) return null;

  const provider = link.provider;
  if (provider !== 'zora' && provider !== 'objkt') return null;

  const url = link.url?.trim();
  if (!url) return null;

  return {
    provider,
    url,
    fontColor: sanitizeMediaLinkColor(link.fontColor),
  };
};

const getItemCarouselMedia = (media: Media) => {
  const items =
    media.carouselMedia?.filter((entry) => Boolean(entry?.id)) ?? [];
  return items.length > 1 ? items : null;
};

const LIGHTBOX_MEDIA_MAX_HEIGHT = '87vh';
const LIGHTBOX_MAIN_HEIGHT = `calc(${LIGHTBOX_MEDIA_MAX_HEIGHT} * 0.75)`;
const LIGHTBOX_THUMBNAILS_HEIGHT = `calc(${LIGHTBOX_MEDIA_MAX_HEIGHT} * 0.25)`;

function MediaLinkAnchor({
  link,
  setSize,
  alwaysVisible = false,
}: {
  link: { provider: MediaLinkProvider; url: string; fontColor: string };
  setSize: number;
  alwaysVisible?: boolean;
}) {
  const textSize = setSize === 1 ? '4rem' : setSize === 2 ? '3rem' : '2rem';
  const zoraLogoSize =
    setSize === 1 ? '2.5rem' : setSize === 2 ? '2rem' : '1.5rem';
  const arrowFilter =
    link.fontColor.toLowerCase() === '#000000' ? 'invert(0)' : 'invert(1)';

  return (
    <a
      className={styles.seeMore}
      href={link.url}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      style={{
        fontSize: textSize,
        color: link.fontColor,
        opacity: alwaysVisible ? 1 : undefined,
      }}
    >
      {`see in ${link.provider}`}
      {link.provider === 'zora' ? (
        <img
          src="/images/logos/zora/zora_logo.svg"
          alt=""
          aria-hidden="true"
          style={{ width: zoraLogoSize }}
        />
      ) : null}
      <img
        src="/images/icons/arrows/arrow_contact_light.png"
        alt=""
        aria-hidden="true"
        className={styles.seeMoreIcon}
        style={{ filter: arrowFilter }}
      />
    </a>
  );
}

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
}: MediaWithHandlers) {
  const [loaded, setLoaded] = useState(false);
  const isMobileDevice = isMobile;
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
  const mediaLink = getMediaLink(m);
  const hasCarousel = Boolean(getItemCarouselMedia(m));

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
            transition: `opacity 1s ease ${fadeDelay}`,
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
      {hasCarousel ? (
        <Box
          sx={{
            position: 'absolute',
            right: '1.08rem',
            top: '1.08rem',
            zIndex: 3,
            width: isMobileDevice ? '1.1664rem' : '1.3608rem',
            height: isMobileDevice ? '1.1664rem' : '1.3608rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <img
            src="/assets/system/icons/multi-post-icon.webp"
            alt=""
            aria-hidden="true"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'contain',
            }}
          />
        </Box>
      ) : null}
      {mediaLink ? (
        <MediaLinkAnchor link={mediaLink} setSize={setSize} />
      ) : null}
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
}: MediaWithHandlers) {
  const [loaded, setLoaded] = useState(false);
  const isMobileDevice = isMobile;
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
  const mediaLink = getMediaLink(m);
  const hasCarousel = Boolean(getItemCarouselMedia(m));

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
          transition: `opacity 1s ease ${fadeDelay}`,
        }}
        onClick={() => openLightbox(mediaArray, index, setIndex)}
      >
        Your browser does not support video.
      </video>
      {hasCarousel ? (
        <Box
          sx={{
            position: 'absolute',
            right: '1.08rem',
            top: '1.08rem',
            zIndex: 3,
            width: isMobileDevice ? '1.1664rem' : '1.3608rem',
            height: isMobileDevice ? '1.1664rem' : '1.3608rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <img
            src="/assets/system/icons/multi-post-icon.webp"
            alt=""
            aria-hidden="true"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'contain',
            }}
          />
        </Box>
      ) : null}
      {mediaLink ? (
        <MediaLinkAnchor link={mediaLink} setSize={setSize} />
      ) : null}
    </motion.div>
  );
}

type LightboxMediaProps = {
  media: Media;
  isMobileQuery: boolean;
  isMobileDevice: boolean;
  onUserZoom: () => void;
};

function SingleLightboxMediaContent(props: LightboxMediaProps) {
  if (props.media.type === 'image') {
    return <LightboxImageContent {...props} />;
  }
  return <LightboxVideoContent {...props} />;
}

function LightboxImageContent({
  media,
  isMobileQuery,
  isMobileDevice,
  onUserZoom,
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
      zoomScale={2.5}
      maxHeight={LIGHTBOX_MAIN_HEIGHT}
      onLowSrcError={lowImage.handleError}
      onHighSrcError={highImage.handleError}
      onZoomChange={(zoomed) => {
        if (zoomed) onUserZoom();
      }}
    />
  );
}

function LightboxVideoContent({
  media,
  isMobileQuery,
  isMobileDevice,
  onUserZoom,
}: LightboxMediaProps) {
  const sources = useMemo(
    () => selectVideoAssets(media, isMobileDevice),
    [media, isMobileDevice]
  );
  const lowVideo = useStorageAssetSrc(sources.low, { preferDirect: false });
  const highVideo = useStorageAssetSrc(sources.high, { preferDirect: false });
  const posterSource = useStorageAssetSrc(sources.poster);

  return (
    <ZoomeableVideo
      className="auto-cursor"
      lowSrc={lowVideo.src || ''}
      highSrc={highVideo.src || undefined}
      poster={posterSource.src || undefined}
      zoomScale={isMobileDevice ? 2 : 3}
      maxHeight={LIGHTBOX_MAIN_HEIGHT}
      autoPlay={true}
      muted={true}
      loop={true}
      onLowSrcError={lowVideo.handleError}
      onHighSrcError={highVideo.handleError}
      onZoomChange={(zoomed) => {
        if (zoomed) onUserZoom();
      }}
    />
  );
}

function CarouselThumbnail({
  media,
  isActive,
  isMobileDevice,
  onSelect,
}: {
  media: Media;
  isActive: boolean;
  isMobileDevice: boolean;
  onSelect: () => void;
}) {
  const thumbAsset = useMemo(() => {
    if (media.type === 'image') {
      const derivatives = media.paths?.derivatives ?? {};
      return (
        derivatives['webp_thumb'] ??
        derivatives['webp_small'] ??
        derivatives['webp_360'] ??
        media.paths?.original
      );
    }

    const videoAssets = selectVideoAssets(media, isMobileDevice);
    return videoAssets.poster;
  }, [media, isMobileDevice]);

  const thumbSrc = useStorageAssetSrc(thumbAsset);

  return (
    <Box
      component="button"
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      aria-label="Select carousel media"
      sx={{
        padding: 0,
        border: isActive
          ? '1px solid rgba(255,255,255,0.85)'
          : '1px solid rgba(255,255,255,0.28)',
        borderRadius: '10px',
        overflow: 'hidden',
        background: 'transparent',
        height: '100%',
        aspectRatio: '1 / 1',
        flex: '0 0 auto',
        cursor: 'pointer',
        opacity: isActive ? 1 : 0.75,
        transition: 'opacity 200ms ease, border-color 200ms ease',
      }}
    >
      {thumbSrc.src ? (
        <img
          src={thumbSrc.src}
          alt=""
          aria-hidden="true"
          onError={thumbSrc.handleError}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : null}
    </Box>
  );
}

export default function WorksCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const [mediaSetsWithMedia, setMediaSetsWithMedia] = useState<
    { mediaset: MediaSet; media: Media[] }[]
  >([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const [activeMediaSetIndex, setActiveMediaSetIndex] = useState<number | null>(
    null
  );
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [carouselAutoplayStopped, setCarouselAutoplayStopped] =
    useState(false);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxImageIsDragging, setLightboxImageIsDragging] =
    useState<boolean>(false);
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

  const isMobileQuery = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('sm')
  );
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const loaderTextColor = isDarkMode ? '#ffffff' : '#000000';
  const loaderGlowStrong = isDarkMode
    ? 'rgba(255,255,255,0.07)'
    : 'rgba(0,0,0,0.055)';
  const loaderGlowSoft = isDarkMode
    ? 'rgba(255,255,255,0.015)'
    : 'rgba(0,0,0,0.012)';
  const activeBaseMedia =
    activeMediaSetIndex !== null && activeMediaIndex !== null
      ? (mediaSetsWithMedia[activeMediaSetIndex]?.media[activeMediaIndex] ??
        null)
      : null;
  const activeCarouselItems = useMemo(
    () => (activeBaseMedia ? getItemCarouselMedia(activeBaseMedia) : null),
    [activeBaseMedia]
  );
  const activeLightboxMedia =
    activeCarouselItems?.[activeCarouselIndex] ?? activeBaseMedia;
  const hasActiveCarousel =
    Boolean(activeCarouselItems) && (activeCarouselItems?.length ?? 0) > 1;

  const stopCarouselAutoplay = useCallback(() => {
    setCarouselAutoplayStopped(true);
  }, []);

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

  useEffect(() => {
    async function loadMediaSets() {
      const cacheKey = `category_${params.category}_mediaSets_cache`;
      const cacheTimestampKey = `category_${params.category}_mediaSets_cache_timestamp`;

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
      const fetched = await fetchCategoryMedia(params.category);
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
  }, [params.category]);

  useEffect(() => {
    setMaxVisibleBySet((prev) =>
      Object.fromEntries(
        mediaSetsWithMedia.map((setWithMedia) => {
          const setId = setWithMedia.mediaset.id;
          const total = setWithMedia.media.length;
          const prevLimit = prev[setId] ?? 0;
          const maxIndex = Math.max(total - 1, 0);
          return [setId, Math.min(prevLimit, maxIndex)];
        })
      )
    );
    if (!allImagesLoaded) {
      loadedFlagsRef.current = {};
      setFirstSetReady(false);
      setSequenceVersion((prev) => prev + 1);
    }
  }, [mediaSetsWithMedia, allImagesLoaded]);

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
    const shouldShowLoader = isLoading || !allImagesLoaded;
    if (shouldShowLoader) {
      setShowCenteredLoader(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowCenteredLoader(false);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [isLoading, allImagesLoaded]);

  useEffect(() => {
    if (!activeCarouselItems) {
      if (activeCarouselIndex !== 0) setActiveCarouselIndex(0);
      return;
    }
    if (activeCarouselIndex > activeCarouselItems.length - 1) {
      setActiveCarouselIndex(0);
    }
  }, [activeCarouselItems, activeCarouselIndex]);

  useEffect(() => {
    if (!lightboxOpen) return;
    setCarouselAutoplayStopped(false);
  }, [lightboxOpen, activeBaseMedia?.id]);

  useEffect(() => {
    if (!lightboxOpen) return;
    if (!hasActiveCarousel || !activeCarouselItems) return;
    if (carouselAutoplayStopped) return;

    const interval = window.setInterval(() => {
      setActiveCarouselIndex((prev) => {
        const length = activeCarouselItems.length;
        if (length <= 1) return prev;
        return (prev + 1) % length;
      });
    }, 4000);

    return () => window.clearInterval(interval);
  }, [
    lightboxOpen,
    hasActiveCarousel,
    activeCarouselItems,
    carouselAutoplayStopped,
  ]);

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

      const nextVisible = Math.min(contiguous + 1, total - 1);
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
    [firstSetId, firstSetTotal]
  );

  const handlePreviousMedia = useCallback(() => {
    if (activeMediaIndex === null || activeMediaSetIndex === null) return;
    const currentSet = mediaSetsWithMedia[activeMediaSetIndex];
    if (!currentSet || currentSet.media.length === 0) return;

    const currentMedia = currentSet.media[activeMediaIndex];
    const currentCarousel = getItemCarouselMedia(currentMedia);
    if (currentCarousel && activeCarouselIndex > 0) {
      setActiveCarouselIndex((prev) => prev - 1);
      return;
    }

    if (activeMediaIndex > 0) {
      const prevIndex = activeMediaIndex - 1;
      setActiveMediaIndex(prevIndex);
      const prevCarousel = getItemCarouselMedia(currentSet.media[prevIndex]);
      setActiveCarouselIndex(prevCarousel ? prevCarousel.length - 1 : 0);
      return;
    }

    const prevSetIndex =
      activeMediaSetIndex > 0
        ? activeMediaSetIndex - 1
        : mediaSetsWithMedia.length - 1;
    const prevSet = mediaSetsWithMedia[prevSetIndex];
    if (!prevSet || prevSet.media.length === 0) return;
    const prevMediaIndex = prevSet.media.length - 1;
    setActiveMediaSetIndex(prevSetIndex);
    setActiveMediaIndex(prevMediaIndex);
    const prevCarousel = getItemCarouselMedia(prevSet.media[prevMediaIndex]);
    setActiveCarouselIndex(prevCarousel ? prevCarousel.length - 1 : 0);
  }, [
    activeMediaIndex,
    activeMediaSetIndex,
    activeCarouselIndex,
    mediaSetsWithMedia,
  ]);

  const handleNextMedia = useCallback(() => {
    if (activeMediaIndex === null || activeMediaSetIndex === null) return;
    const currentSet = mediaSetsWithMedia[activeMediaSetIndex];
    if (!currentSet || currentSet.media.length === 0) return;

    const currentMedia = currentSet.media[activeMediaIndex];
    const currentCarousel = getItemCarouselMedia(currentMedia);
    if (currentCarousel && activeCarouselIndex < currentCarousel.length - 1) {
      setActiveCarouselIndex((prev) => prev + 1);
      return;
    }

    if (activeMediaIndex < currentSet.media.length - 1) {
      setActiveMediaIndex(activeMediaIndex + 1);
      setActiveCarouselIndex(0);
      return;
    }

    const nextSetIndex =
      activeMediaSetIndex < mediaSetsWithMedia.length - 1
        ? activeMediaSetIndex + 1
        : 0;
    const nextSet = mediaSetsWithMedia[nextSetIndex];
    if (!nextSet || nextSet.media.length === 0) return;
    setActiveMediaSetIndex(nextSetIndex);
    setActiveMediaIndex(0);
    setActiveCarouselIndex(0);
  }, [
    activeMediaIndex,
    activeMediaSetIndex,
    activeCarouselIndex,
    mediaSetsWithMedia,
  ]);

  const handlePreviousBaseMedia = useCallback(() => {
    if (activeMediaIndex === null || activeMediaSetIndex === null) return;
    const currentSet = mediaSetsWithMedia[activeMediaSetIndex];
    if (!currentSet || currentSet.media.length === 0) return;

    if (activeMediaIndex > 0) {
      setActiveMediaIndex(activeMediaIndex - 1);
      setActiveCarouselIndex(0);
      return;
    }

    const prevSetIndex =
      activeMediaSetIndex > 0
        ? activeMediaSetIndex - 1
        : mediaSetsWithMedia.length - 1;
    const prevSet = mediaSetsWithMedia[prevSetIndex];
    if (!prevSet || prevSet.media.length === 0) return;

    setActiveMediaSetIndex(prevSetIndex);
    setActiveMediaIndex(prevSet.media.length - 1);
    setActiveCarouselIndex(0);
  }, [activeMediaIndex, activeMediaSetIndex, mediaSetsWithMedia]);

  const handleNextBaseMedia = useCallback(() => {
    if (activeMediaIndex === null || activeMediaSetIndex === null) return;
    const currentSet = mediaSetsWithMedia[activeMediaSetIndex];
    if (!currentSet || currentSet.media.length === 0) return;

    if (activeMediaIndex < currentSet.media.length - 1) {
      setActiveMediaIndex(activeMediaIndex + 1);
      setActiveCarouselIndex(0);
      return;
    }

    const nextSetIndex =
      activeMediaSetIndex < mediaSetsWithMedia.length - 1
        ? activeMediaSetIndex + 1
        : 0;
    const nextSet = mediaSetsWithMedia[nextSetIndex];
    if (!nextSet || nextSet.media.length === 0) return;

    setActiveMediaSetIndex(nextSetIndex);
    setActiveMediaIndex(0);
    setActiveCarouselIndex(0);
  }, [activeMediaIndex, activeMediaSetIndex, mediaSetsWithMedia]);

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
    setActiveCarouselIndex(0);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setActiveMediaIndex(null);
    setActiveMediaSetIndex(null);
    setActiveCarouselIndex(0);
    setCarouselAutoplayStopped(false);
  };

  useEffect(() => {
    if (lightboxOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
          stopCarouselAutoplay();
          handleNextMedia();
        }
        if (e.key === 'ArrowLeft') {
          stopCarouselAutoplay();
          handlePreviousMedia();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [lightboxOpen, handleNextMedia, handlePreviousMedia, stopCarouselAutoplay]);

  return (
    <>
      <AnimatePresence>
        {showCenteredLoader ? (
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
                gap: '0.3rem',
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
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
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
      {' '}
      <main className={`${styles.main} ${styles.worksPage}`}>
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
          sx={{
            width: '100%',
            maxWidth: '1400px',
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              paddingInline: isMobile ? '1.4rem' : '2.1rem',
            }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{
                fontSize: '0.95rem',
                fontWeight: 300,
                textAlign: 'center',
                marginBottom: '0.7rem',
              }}
            >
              WORKS{' '}
              <span className="breadcrumb-divider">
                {isMobile ? '•' : '﹥'}
              </span>{' '}
              {params.category.replace(/-/g, ' ').toUpperCase()}
            </motion.h1>
          </Box>
          <Box
            px={{ xs: '1.1rem', sm: '2rem' }}
            pb={{ xs: '0rem', sm: '1.5rem' }}
            minHeight={'60vh'}
            width="100%"
          >
            {isLoading || !allImagesLoaded ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, delay: 0.5 }}
              >
                <Box
                  display="flex"
                  flexDirection="column"
                  gap={isMobileQuery ? '13px' : '16px'}
                >
                  {[...Array(4)].map((_, rowIndex) => (
                    <Box
                      key={rowIndex}
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
                            ...(rowIndex === 0 && i === 0
                              ? {
                                  '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.5 },
                                  },
                                }
                              : null),
                          }}
                        />
                      ))}
                    </Box>
                  ))}
                </Box>
              </motion.div>
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
                    const columns =
                      isMobileQuery && setWithMedia.media.length === 4
                        ? 2
                        : getGridColumns(setWithMedia.media.length);
                    const setId = setWithMedia.mediaset.id;
                    const visibleLimit = maxVisibleBySet[setId] ?? 0;

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
                      zIndex: 900,
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
                    <IconButton
                      sx={{
                        position: 'absolute',
                        left: '1rem',
                        color: 'white',
                        zIndex: 1000,
                        transform: 'scale(1.5)',
                        opacity: lightboxImageIsDragging ? 0 : 1,
                        transition: 'opacity 0.3s',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviousBaseMedia();
                      }}
                    >
                      <MinimalLeftArrowIcon />
                    </IconButton>

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
                          key={
                            activeLightboxMedia
                              ? `${activeLightboxMedia.id}-${activeCarouselIndex}`
                              : 'lightbox-media'
                          }
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
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
                              maxWidth: '99vw',
                              maxHeight: '80vh',
                              margin: '0 auto',
                            }}
                          >
                            <Box
                              sx={{
                                borderRadius: '6px',
                                overflow: 'hidden',
                              }}
                            >
                              <IconButton
                                sx={{
                                  position: 'absolute',
                                  top: '1rem',
                                  right: '1rem',
                                  color: 'white',
                                  zIndex: 9999,
                                  opacity: lightboxImageIsDragging ? 0 : 1,
                                  transition: 'opacity 0.3s',
                                  transform: 'scale(1.3)',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  closeLightbox();
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  width="35px"
                                  height="35px"
                                >
                                  <line
                                    x1="6"
                                    y1="6"
                                    x2="18"
                                    y2="18"
                                    stroke="currentColor"
                                    strokeWidth="0.6"
                                  />
                                  <line
                                    x1="18"
                                    y1="6"
                                    x2="6"
                                    y2="18"
                                    stroke="currentColor"
                                    strokeWidth="0.6"
                                  />
                                </svg>
                              </IconButton>

                              <Box
                                sx={{
                                  position: 'relative',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: LIGHTBOX_MEDIA_MAX_HEIGHT,
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
                                    height: LIGHTBOX_MAIN_HEIGHT,
                                    flex: '0 0 auto',
                                  }}
                                >
                                  {hasActiveCarousel ? (
                                    <IconButton
                                      aria-label="Previous carousel media"
                                      sx={{
                                        position: 'absolute',
                                        left: { xs: '0.5rem', sm: '0.9rem' },
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'white',
                                        zIndex: 2000,
                                        width: { xs: '2.75rem', sm: '3rem' },
                                        height: { xs: '2.75rem', sm: '3rem' },
                                        borderRadius: '999px',
                                        backgroundColor:
                                          'rgba(120, 120, 120, 0.26)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                                        backdropFilter: 'blur(8px)',
                                        WebkitBackdropFilter: 'blur(8px)',
                                        transition:
                                          'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                                        '&:hover': {
                                          backgroundColor:
                                            'rgba(120, 120, 120, 0.34)',
                                          borderColor: 'rgba(255,255,255,0.28)',
                                          boxShadow: '0 8px 20px rgba(0,0,0,0.24)',
                                        },
                                        '&:focus-visible': {
                                          outline: '2px solid rgba(255,255,255,0.95)',
                                          outlineOffset: '2px',
                                        },
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        stopCarouselAutoplay();
                                        handlePreviousMedia();
                                      }}
                                    >
                                      <Box
                                        component="span"
                                        aria-hidden="true"
                                        sx={{
                                          fontSize: { xs: '1.8rem', sm: '2rem' },
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
                                  ) : null}

                                  {(() => {
                                    if (!activeLightboxMedia) return null;
                                    const mediaLink =
                                      getMediaLink(activeLightboxMedia);
                                    const setSize =
                                      mediaSetsWithMedia[activeMediaSetIndex]
                                        .media.length;
                                    return (
                                      <>
                                        <SingleLightboxMediaContent
                                          media={activeLightboxMedia}
                                          isMobileQuery={isMobileQuery}
                                          isMobileDevice={isMobile}
                                          onUserZoom={stopCarouselAutoplay}
                                        />
                                        {mediaLink ? (
                                          <MediaLinkAnchor
                                            link={mediaLink}
                                            setSize={setSize}
                                            alwaysVisible
                                          />
                                        ) : null}
                                      </>
                                    );
                                  })()}

                                  {hasActiveCarousel ? (
                                    <IconButton
                                      aria-label="Next carousel media"
                                      sx={{
                                        position: 'absolute',
                                        right: { xs: '0.5rem', sm: '0.9rem' },
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'white',
                                        zIndex: 2000,
                                        width: { xs: '2.75rem', sm: '3rem' },
                                        height: { xs: '2.75rem', sm: '3rem' },
                                        borderRadius: '999px',
                                        backgroundColor:
                                          'rgba(120, 120, 120, 0.26)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                                        backdropFilter: 'blur(8px)',
                                        WebkitBackdropFilter: 'blur(8px)',
                                        transition:
                                          'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                                        '&:hover': {
                                          backgroundColor:
                                            'rgba(120, 120, 120, 0.34)',
                                          borderColor: 'rgba(255,255,255,0.28)',
                                          boxShadow: '0 8px 20px rgba(0,0,0,0.24)',
                                        },
                                        '&:focus-visible': {
                                          outline: '2px solid rgba(255,255,255,0.95)',
                                          outlineOffset: '2px',
                                        },
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        stopCarouselAutoplay();
                                        handleNextMedia();
                                      }}
                                    >
                                      <Box
                                        component="span"
                                        aria-hidden="true"
                                        sx={{
                                          fontSize: { xs: '1.8rem', sm: '2rem' },
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
                                  ) : null}

                                  {hasActiveCarousel && activeCarouselItems ? (
                                    <Box
                                      onClick={(e) => e.stopPropagation()}
                                      sx={{
                                        position: 'absolute',
                                        left: '50%',
                                        bottom: { xs: '0.5rem', sm: '0.75rem' },
                                        transform: 'translateX(-50%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: { xs: '0.45rem', sm: '0.55rem' },
                                        paddingInline: '0.05rem',
                                        paddingBlock: '0.05rem',
                                        zIndex: 2100,
                                      }}
                                      aria-label="Carousel position indicators"
                                    >
                                      {activeCarouselItems.map((item, dotIndex) => {
                                        const isActive =
                                          dotIndex === activeCarouselIndex;
                                        return (
                                          <Box
                                            key={`carousel-dot-${item.id}`}
                                            sx={{
                                              width: {
                                                xs: '0.48rem',
                                                sm: '0.54rem',
                                              },
                                              height: {
                                                xs: '0.48rem',
                                                sm: '0.54rem',
                                              },
                                              borderRadius: '999px',
                                              backgroundColor: isActive
                                                ? 'rgba(0,0,0,0.58)'
                                                : 'rgba(230,230,230,0.16)',
                                              border: isActive
                                                ? '1px solid rgba(0,0,0,0)'
                                                : '1.2px solid rgba(0,0,0,0.15)',
                                              boxShadow:
                                                '0 0 4px rgba(0,0,0,0.08)',
                                              backdropFilter:
                                                'blur(6px) saturate(140%)',
                                              WebkitBackdropFilter:
                                                'blur(6px) saturate(140%)',
                                              opacity: 1,
                                              transition:
                                                'background-color 180ms ease, border-color 180ms ease, transform 180ms ease, width 180ms ease, height 180ms ease, box-shadow 180ms ease',
                                              transform: 'scale(1)',
                                            }}
                                            aria-hidden="true"
                                          />
                                        );
                                      })}
                                    </Box>
                                  ) : null}
                                </Box>

                                {hasActiveCarousel && activeCarouselItems ? (
                                  <Box
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{
                                      width: '100%',
                                      height: LIGHTBOX_THUMBNAILS_HEIGHT,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flex: '0 0 auto',
                                      paddingInline: {
                                        xs: '0.75rem',
                                        sm: '1rem',
                                      },
                                      paddingBottom: {
                                        xs: '0.25rem',
                                        sm: '0.35rem',
                                      },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: { xs: '0.5rem', sm: '0.65rem' },
                                        overflowX: 'auto',
                                        overflowY: 'hidden',
                                        WebkitOverflowScrolling: 'touch',
                                        touchAction: 'pan-x',
                                        overscrollBehaviorX: 'contain',
                                        paddingBlock: '0.35rem',
                                      }}
                                    >
                                      {activeCarouselItems.map(
                                        (item, thumbIndex) => (
                                          <CarouselThumbnail
                                            key={`carousel-thumb-${item.id}`}
                                            media={item}
                                            isActive={
                                              thumbIndex === activeCarouselIndex
                                            }
                                            isMobileDevice={isMobile}
                                            onSelect={() => {
                                              stopCarouselAutoplay();
                                              setActiveCarouselIndex(thumbIndex);
                                            }}
                                          />
                                        )
                                      )}
                                    </Box>
                                  </Box>
                                ) : null}

                              </Box>
                            </Box>
                          </Box>
                        </motion.div>
                      </AnimatePresence>
                    </Box>

                    <IconButton
                      sx={{
                        position: 'absolute',
                        right: '1rem',
                        color: 'white',
                        zIndex: 1000,
                        opacity: lightboxImageIsDragging ? 0 : 1,
                        transition: 'opacity 0.3s',
                        transform: 'scale(1.5)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextBaseMedia();
                      }}
                    >
                      <MinimalRightArrowIcon />
                    </IconButton>
                  </motion.div>
                )}
            </AnimatePresence>
          </Box>
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
