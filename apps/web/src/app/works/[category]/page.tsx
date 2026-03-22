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
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import db from '@/utils/config/firebase';
import ZoomableImage from '../../components/ZoomeableImage';
import ZoomeableVideo from '../../components/ZoomeableVideo';
import {
  selectImageAssets,
  selectVideoAssets,
} from '@/utils/media/assetSelectors';
import { useStorageAssetSrc } from '@/hooks/useStorageAssetSrc';
import Footer from '../../components/Footer';

// ---------------------------------------------------------------------------
// Parallelized fetch with carousel support
// ---------------------------------------------------------------------------
type MediaSetItemDoc = {
  mediaId?: string;
  mediaItems?: Array<{ mediaId?: string; order?: number }>;
  flex?: number;
};

const getOrderedItemMediaIds = (item: MediaSetItemDoc): string[] => {
  const fromArray =
    item.mediaItems
      ?.slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((entry) => entry.mediaId)
      .filter((id): id is string => Boolean(id)) ?? [];
  if (fromArray.length > 0) return fromArray;
  return item.mediaId ? [item.mediaId] : [];
};

async function fetchCategoryMedia(
  category: string
): Promise<{ mediaset: MediaSet; media: Media[] }[]> {
  // 1. Single query for all mediasets in this category
  const mediasetsSnap = await getDocs(
    query(
      collection(db, 'mediasets'),
      where('category', '==', category),
      orderBy('ordering', 'asc')
    )
  );

  const mediasets = mediasetsSnap.docs
    .map((d) => ({ ...d.data(), id: d.id }) as MediaSet)
    .filter((ms) => !ms.deletedAt);

  // 2. All items subcollections IN PARALLEL
  const itemsSnaps = await Promise.all(
    mediasets.map((ms) =>
      getDocs(
        query(
          collection(db, 'mediasets', ms.id, 'items'),
          orderBy('order', 'asc')
        )
      )
    )
  );

  // 3. Collect all unique mediaIds — including carousel mediaItems
  const allMediaIds = new Set<string>();
  itemsSnaps.forEach((snap) => {
    snap.docs.forEach((d) => {
      getOrderedItemMediaIds(d.data() as MediaSetItemDoc).forEach((id) =>
        allMediaIds.add(id)
      );
    });
  });

  // 4. All media docs IN PARALLEL (single batch)
  const mediaDocs = await Promise.all(
    Array.from(allMediaIds).map((id) => getDoc(doc(db, 'media', id)))
  );

  // 5. id → Media map for O(1) lookup
  const mediaMap = new Map<string, Media>();
  mediaDocs.forEach((d) => {
    if (d.exists()) {
      const data = d.data() as Media;
      if (data.processed && !data.deletedAt) {
        mediaMap.set(d.id, { ...data, id: d.id });
      }
    }
  });

  // 6. Build result preserving order and carousel structure
  const result: { mediaset: MediaSet; media: Media[] }[] = [];
  mediasets.forEach((ms, i) => {
    const media: Media[] = [];

    itemsSnaps[i].docs.forEach((itemDoc) => {
      const itemData = itemDoc.data() as MediaSetItemDoc;
      const orderedIds = getOrderedItemMediaIds(itemData);
      if (orderedIds.length === 0) return;

      const orderedMedia = orderedIds
        .map((id) => mediaMap.get(id))
        .filter((m): m is Media => Boolean(m));

      if (!orderedMedia.length) return;

      const primary = orderedMedia[0];
      media.push({
        ...primary,
        itemId: itemDoc.id,
        flex: itemData.flex ?? 1,
        isCarouselItem: orderedMedia.length > 1,
        carouselMedia: orderedMedia.length > 1 ? orderedMedia : undefined,
      });
    });

    if (media.length > 0) {
      result.push({ mediaset: ms, media });
    }
  });

  return result;
}
// ---------------------------------------------------------------------------

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
const LIGHTBOX_MAIN_HEIGHT_MOBILE = `calc(${LIGHTBOX_MEDIA_MAX_HEIGHT} * 0.82)`;
const LIGHTBOX_THUMBNAILS_HEIGHT_MOBILE = `calc(${LIGHTBOX_MEDIA_MAX_HEIGHT} * 0.12)`;

function MediaLinkAnchor({
  link,
  setSize,
  alwaysVisible = false,
}: {
  link: { provider: MediaLinkProvider; url: string; fontColor: string };
  setSize: number;
  alwaysVisible?: boolean;
}) {
  const isMobileQuery = useMediaQuery(
    (theme: Theme) => theme.breakpoints.down('sm'),
    { noSsr: true }
  );
  const textSize = setSize === 1 ? '4rem' : setSize === 2 ? '3rem' : '2rem';
  const zoraLogoSize =
    setSize === 1 ? '2.5rem' : setSize === 2 ? '2rem' : '1.5rem';
  const lightboxTextSize = 'clamp(1.25rem, 4.2vw, 2rem)';
  const lightboxZoraLogoSize = 'clamp(1rem, 3vw, 1.35rem)';
  const lightboxBottomOffset = isMobileQuery ? '0.95rem' : '0.60rem';
  const lightboxMaxWidth = isMobileQuery
    ? 'calc(100% - 0.45rem)'
    : 'calc(100% - 0.9rem)';
  const mobileLightboxScale = alwaysVisible && isMobileQuery ? 1.5 : 1;
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
        fontSize: alwaysVisible ? lightboxTextSize : textSize,
        color: link.fontColor,
        opacity: alwaysVisible ? 1 : undefined,
        zIndex: alwaysVisible ? 2200 : undefined,
        bottom: alwaysVisible ? lightboxBottomOffset : undefined,
        left: alwaysVisible ? '0.95rem' : undefined,
        maxWidth: alwaysVisible ? lightboxMaxWidth : undefined,
        transform:
          mobileLightboxScale !== 1
            ? `scale(${mobileLightboxScale})`
            : undefined,
        transformOrigin: mobileLightboxScale !== 1 ? 'left bottom' : undefined,
      }}
    >
      {`see in ${link.provider}`}
      {link.provider === 'zora' ? (
        <img
          src="/images/logos/zora/zora_logo.svg"
          alt=""
          aria-hidden="true"
          style={{
            width: alwaysVisible ? lightboxZoraLogoSize : zoraLogoSize,
          }}
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
            right: isMobileDevice ? '0.52rem' : '1.08rem',
            top: isMobileDevice ? '0.52rem' : '1.08rem',
            zIndex: 3,
            width: isMobileDevice ? '1rem' : '1.3608rem',
            height: isMobileDevice ? '1rem' : '1.3608rem',
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
      {mediaLink && !isMobileDevice ? (
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
      {mediaLink && !isMobileDevice ? (
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
  onZoomStateChange: (zoomed: boolean) => void;
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
      onZoomChange={(zoomed) => {
        onZoomStateChange(zoomed);
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
      onZoomChange={(zoomed) => {
        onZoomStateChange(zoomed);
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
        borderRadius: isMobileDevice ? '8px' : '10px',
        overflow: 'hidden',
        background: 'transparent',
        height: isMobileDevice ? '4.2rem' : '100%',
        width: isMobileDevice ? '4.2rem' : 'auto',
        minWidth: isMobileDevice ? '4.2rem' : 'auto',
        aspectRatio: '1 / 1',
        flex: '0 0 auto',
        cursor: 'pointer',
        opacity: isActive ? 1 : 0.8,
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
  const [carouselAutoplayStopped, setCarouselAutoplayStopped] = useState(false);
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

      // Fetch fresh data from database (now parallelized)
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
    if (!lightboxOpen) {
      setIsLightboxZoomed(false);
      return;
    }
    setIsLightboxZoomed(false);
  }, [lightboxOpen, activeLightboxMedia?.id, activeCarouselIndex]);

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
    setIsLightboxZoomed(false);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setActiveMediaIndex(null);
    setActiveMediaSetIndex(null);
    setActiveCarouselIndex(0);
    setCarouselAutoplayStopped(false);
    setIsLightboxZoomed(false);
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
  }, [
    lightboxOpen,
    handleNextMedia,
    handlePreviousMedia,
    stopCarouselAutoplay,
  ]);

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
      </AnimatePresence>{' '}
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
              paddingInline: isMobileViewport ? '1.4rem' : '2.1rem',
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
                {isMobileViewport ? '•' : '﹥'}
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
              <Box>
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
                                    backgroundColor:
                                      'rgba(120, 120, 120, 0.34)',
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
                                        zIndex: { xs: 2600, sm: 2100 },
                                        width: { xs: '2.75rem', sm: '3rem' },
                                        height: { xs: '2.75rem', sm: '3rem' },
                                        borderRadius: '999px',
                                        backgroundColor:
                                          'rgba(120, 120, 120, 0.26)',
                                        border:
                                          '1px solid rgba(255,255,255,0.2)',
                                        boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                                        backdropFilter: 'blur(3px)',
                                        WebkitBackdropFilter: 'blur(3px)',
                                        transition:
                                          'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                                        '&:hover': {
                                          backgroundColor:
                                            'rgba(120, 120, 120, 0.34)',
                                          borderColor: 'rgba(255,255,255,0.28)',
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
                                        stopCarouselAutoplay();
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

                                  {(() => {
                                    if (!activeLightboxMedia) return null;
                                    const mediaLink =
                                      getMediaLink(activeLightboxMedia);
                                    const setSize =
                                      mediaSetsWithMedia[activeMediaSetIndex]
                                        .media.length;
                                    return (
                                      <Box
                                        sx={{
                                          position: 'relative',
                                          display: 'grid',
                                          placeItems: 'center',
                                        }}
                                      >
                                        <AnimatePresence
                                          initial={false}
                                          mode="sync"
                                        >
                                          <motion.div
                                            key={`${activeLightboxMedia.id}-${activeCarouselIndex}`}
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
                                            <SingleLightboxMediaContent
                                              media={activeLightboxMedia}
                                              isMobileQuery={isMobileQuery}
                                              isMobileDevice={isMobileViewport}
                                              onUserZoom={stopCarouselAutoplay}
                                              onZoomStateChange={
                                                setIsLightboxZoomed
                                              }
                                            />
                                          </motion.div>
                                        </AnimatePresence>
                                        {mediaLink ? (
                                          <MediaLinkAnchor
                                            link={mediaLink}
                                            setSize={setSize}
                                            alwaysVisible
                                          />
                                        ) : null}
                                        {hasActiveCarousel &&
                                        activeCarouselItems ? (
                                          <Box
                                            onClick={(e) => e.stopPropagation()}
                                            sx={{
                                              position: 'absolute',
                                              left: '50%',
                                              bottom: '0.55rem',
                                              transform: 'translateX(-50%)',
                                              display: {
                                                xs: 'flex',
                                                sm: 'none',
                                              },
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              gap: '0.45rem',
                                              paddingInline: '0.05rem',
                                              paddingBlock: '0.05rem',
                                              zIndex: 2100,
                                            }}
                                            aria-label="Carousel position indicators"
                                          >
                                            {activeCarouselItems.map(
                                              (item, dotIndex) => {
                                                const isActive =
                                                  dotIndex ===
                                                  activeCarouselIndex;
                                                return (
                                                  <Box
                                                    key={`carousel-dot-mobile-${item.id}`}
                                                    sx={{
                                                      width: '0.48rem',
                                                      height: '0.48rem',
                                                      borderRadius: '999px',
                                                      position: 'relative',
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      backgroundColor:
                                                        'rgba(255,255,255,0.40)',
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
                                                  >
                                                    {isActive ? (
                                                      <Box
                                                        component="span"
                                                        sx={{
                                                          width: '90%',
                                                          height: '90%',
                                                          borderRadius: '999px',
                                                          backgroundColor:
                                                            'rgba(0,0,0,0.70)',
                                                        }}
                                                      />
                                                    ) : null}
                                                  </Box>
                                                );
                                              }
                                            )}
                                          </Box>
                                        ) : null}
                                      </Box>
                                    );
                                  })()}

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
                                        zIndex: { xs: 2600, sm: 2100 },
                                        width: { xs: '2.75rem', sm: '3rem' },
                                        height: { xs: '2.75rem', sm: '3rem' },
                                        borderRadius: '999px',
                                        backgroundColor:
                                          'rgba(120, 120, 120, 0.26)',
                                        border:
                                          '1px solid rgba(255,255,255,0.2)',
                                        boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                                        backdropFilter: 'blur(3px)',
                                        WebkitBackdropFilter: 'blur(3px)',
                                        transition:
                                          'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                                        '&:hover': {
                                          backgroundColor:
                                            'rgba(120, 120, 120, 0.34)',
                                          borderColor: 'rgba(255,255,255,0.28)',
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
                                        stopCarouselAutoplay();
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

                                  {hasActiveCarousel && activeCarouselItems ? (
                                    <Box
                                      onClick={(e) => e.stopPropagation()}
                                      sx={{
                                        position: 'absolute',
                                        left: '50%',
                                        bottom: {
                                          xs: '0.5rem',
                                          sm: '0.75rem',
                                        },
                                        transform: 'translateX(-50%)',
                                        display: { xs: 'none', sm: 'flex' },
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: {
                                          xs: '0.45rem',
                                          sm: '0.55rem',
                                        },
                                        paddingInline: '0.05rem',
                                        paddingBlock: '0.05rem',
                                        zIndex: 2100,
                                      }}
                                      aria-label="Carousel position indicators"
                                    >
                                      {activeCarouselItems.map(
                                        (item, dotIndex) => {
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
                                                position: 'relative',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: {
                                                  xs: 'rgba(255,255,255,0.40)',
                                                  sm: isActive
                                                    ? 'rgba(0,0,0,0.58)'
                                                    : 'rgba(230,230,230,0.16)',
                                                },
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
                                            >
                                              {isActive ? (
                                                <Box
                                                  component="span"
                                                  sx={{
                                                    display: {
                                                      xs: 'block',
                                                      sm: 'none',
                                                    },
                                                    width: '90%',
                                                    height: '90%',
                                                    borderRadius: '999px',
                                                    backgroundColor:
                                                      'rgba(0,0,0,0.70)',
                                                  }}
                                                />
                                              ) : null}
                                            </Box>
                                          );
                                        }
                                      )}
                                    </Box>
                                  ) : null}
                                </Box>

                                {hasActiveCarousel && activeCarouselItems ? (
                                  <Box
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{
                                      width: { xs: '99vw', sm: '100%' },
                                      height: {
                                        xs: LIGHTBOX_THUMBNAILS_HEIGHT_MOBILE,
                                        sm: LIGHTBOX_THUMBNAILS_HEIGHT,
                                      },
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flex: '0 0 auto',
                                      paddingInline: {
                                        xs: '0.55rem',
                                        sm: '1rem',
                                      },
                                      paddingBottom: {
                                        xs: '0.05rem',
                                        sm: '0.35rem',
                                      },
                                      marginTop: { xs: '-0.55rem', sm: 0 },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: {
                                          xs: 'fit-content',
                                          sm: '100%',
                                        },
                                        maxWidth: { xs: '99vw', sm: '100%' },
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: {
                                          xs: 'center',
                                          sm: 'flex-start',
                                        },
                                        gap: { xs: '0.35rem', sm: '0.65rem' },
                                        overflowX: 'auto',
                                        overflowY: 'hidden',
                                        WebkitOverflowScrolling: 'touch',
                                        touchAction: 'pan-x',
                                        overscrollBehaviorX: 'contain',
                                        paddingBlock: {
                                          xs: '0.15rem',
                                          sm: '0.35rem',
                                        },
                                        marginInline: 'auto',
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
                                            isMobileDevice={isMobileViewport}
                                            onSelect={() => {
                                              stopCarouselAutoplay();
                                              setActiveCarouselIndex(
                                                thumbIndex
                                              );
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
