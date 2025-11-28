'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { MediaSet } from '@/utils/types/mediaset';
import { Media } from '@/utils/types/media';
import ScrollContainer from 'react-indiana-drag-scroll';
import { AnimatePresence, motion } from 'framer-motion';
import NextImage from 'next/image';
import { Box, Grid, IconButton, Theme, useMediaQuery } from '@mui/material';
import { isMobile } from 'react-device-detect';

import { useSwipeable } from 'react-swipeable';
import { fetchMediaSetsWithMedia } from '@/utils/functions/fetchMediaSetsWithMedia';
import { MinimalLeftArrowIcon } from './components/MinimalLeftArrowIcon';
import { MinimalRightArrowIcon } from './components/MinimalRightArrowIcon';
import ZoomableImage from './components/ZoomeableImage';
import ZoomeableVideo from './components/ZoomeableVideo';

function chooseVideoSources(mediaItem: Media, useMobilePriorities: boolean) {
  const s = mediaItem.paths?.derivatives || {};
  const v360 = s.webm_360?.downloadURL || '';
  const v720 = s.webm_720?.downloadURL || '';
  const v1080 = s.webm_1080?.downloadURL || '';

  let lowSrc = '';
  let highSrc = '';

  if (useMobilePriorities) {
    lowSrc = v360 || v720 || v1080;
    highSrc = v720 || v1080 || v360;
  } else {
    lowSrc = v720 || v1080 || v360;
    highSrc = v1080 || v720 || v360;
  }

  return { lowSrc, highSrc };
}

function chooseImageSources(mediaItem: Media, useMobilePriorities: boolean) {
  const s = mediaItem.paths?.derivatives || {};
  const webp360 = s.webp_360?.downloadURL || s.webp_small?.downloadURL || '';
  const webp720 = s.webp_720?.downloadURL || s.webp_medium?.downloadURL || '';
  const webp1080 = s.webp_1080?.downloadURL || s.webp_large?.downloadURL || '';
  const original = mediaItem.paths?.original?.downloadURL || '';

  let lowSrc = '';
  let highSrc = '';

  if (useMobilePriorities) {
    lowSrc = webp720 || webp1080 || original;
    highSrc = webp720 || webp1080 || webp360 || original;
  } else {
    lowSrc = webp720 || webp1080 || webp360 || original;
    highSrc = webp1080 || webp720 || webp360 || original;
  }
  return { lowSrc, highSrc };
}

type MediaWithHandlers = {
  m: Media;
  index: number;
  setIndex: number;
  openLightbox: (
    mediaArray: Media[],
    mediaIndex: number,
    setIndex: number
  ) => void;
  mediaArray: Media[];
};

function MediaItem({
  m,
  index,
  setIndex,
  openLightbox,
  mediaArray,
}: MediaWithHandlers) {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    setLoaded(false);
  }, [
    m.paths?.derivatives?.webp_medium?.downloadURL,
    m.paths?.derivatives?.webm_720?.downloadURL,
  ]);

  const handleImageLoad = () => {
    setLoaded(true);
  };

  const handleVideoLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const t = e.currentTarget;

    setLoaded(true);
  };

  const handleVideoError = (e: any) => {
    console.error('[MediaItem] video error', m.id, e);
    setLoaded(true);
  };

  // choose thumbnail / preview source using same philosophy: low for mobile, medium/720 for desktop
  const isMobileDevice = isMobile; // from react-device-detect
  if (m.type === 'image') {
    const { lowSrc } = chooseImageSources(m, isMobileDevice);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={
          loaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.995 }
        }
        transition={{ delay: 0.9 + setIndex * 0.5, duration: 1.1 }}
      >
        <Box sx={{ opacity: loaded ? 1 : 0 }} width="100%" height="100%">
          <NextImage
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
            width={600}
            height={600}
            onContextMenuCapture={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onLoad={handleImageLoad as any}
            style={{
              userSelect: 'none',
              display: 'block',
              borderRadius: '6px',
            }}
            src={lowSrc || ''}
            onClick={() => openLightbox(mediaArray, index, setIndex)}
            alt={'Media'}
            className={styles.photoSetImage}
            priority={false}
          />
        </Box>
      </motion.div>
    );
  } else {
    const { lowSrc } = chooseVideoSources(m, isMobileDevice);
    const posterSrc =
      m.paths?.poster?.downloadURL ||
      lowSrc ||
      m.paths?.derivatives?.webp_medium?.downloadURL ||
      '';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={
          loaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.995 }
        }
        transition={{ delay: 0.9 + setIndex * 0.5, duration: 1.1 }}
      >
        <Box sx={{ opacity: loaded ? 1 : 0 }} width="100%" height="100%">
          <video
            width="100%"
            height="100%"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={posterSrc || undefined}
            onLoadedData={handleVideoLoaded}
            onError={handleVideoError}
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
              display: 'block',
              borderRadius: '10px',
            }}
            onClick={() => openLightbox(mediaArray, index, setIndex)}
          >
            <source src={lowSrc || ''} type="video/webm" />
            Your browser does not support video.
          </video>
        </Box>
      </motion.div>
    );
  }
}

export default function Home() {
  const [mediaSetsWithMedia, setMediaSetsWithMedia] = useState<
    { mediaset: MediaSet; media: Media[] }[]
  >([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const [activeMediaSetIndex, setActiveMediaSetIndex] = useState<number | null>(
    null
  );
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxImageIsDragging, setLightboxImageIsDragging] =
    useState<boolean>(false);

  const isMobileQuery = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('sm')
  );

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
      const fetched = await fetchMediaSetsWithMedia();
      setMediaSetsWithMedia(fetched);
    }
    loadMediaSets();
  }, []);

  const handlePreviousMedia = useCallback(() => {
    if (activeMediaIndex !== null && activeMediaSetIndex !== null) {
      const currentSet = mediaSetsWithMedia[activeMediaSetIndex];
      if (activeMediaIndex > 0) {
        setActiveMediaIndex(activeMediaIndex - 1);
      } else {
        const prevSetIndex =
          activeMediaSetIndex > 0
            ? activeMediaSetIndex - 1
            : mediaSetsWithMedia.length - 1;
        const prevSet = mediaSetsWithMedia[prevSetIndex];
        if (prevSet.media.length > 0) {
          setActiveMediaSetIndex(prevSetIndex);
          setActiveMediaIndex(prevSet.media.length - 1);
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
        const nextSetIndex =
          activeMediaSetIndex < mediaSetsWithMedia.length - 1
            ? activeMediaSetIndex + 1
            : 0;
        const nextSet = mediaSetsWithMedia[nextSetIndex];
        if (nextSet.media.length > 0) {
          setActiveMediaSetIndex(nextSetIndex);
          setActiveMediaIndex(0);
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
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setActiveMediaIndex(null);
    setActiveMediaSetIndex(null);
  };

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
    <main className={styles.main}>
      <Box
        sx={{
          height: {
            xs: '0rem',
            sm: '4rem',
            md: '5rem',
            lg: '5.5rem',
            xl: '7rem',
          },
        }}
      />
      <Box px={{ xs: '0rem', sm: '2rem' }} pb="6rem" width="100%">
        {mediaSetsWithMedia.length > 0 && (
          <ScrollContainer draggable={false} className={styles.carousel}>
            {mediaSetsWithMedia.map((setWithMedia, setIndex) => {
              const columns =
                isMobileQuery && setWithMedia.media.length === 4
                  ? 2
                  : getGridColumns(setWithMedia.media.length);

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
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        }}
                        gap={isMobileQuery ? '14px' : '16px'}
                      >
                        {setWithMedia.media.map((m, mediaIndex) => (
                          <Box key={m.id} width="100%" height="100%">
                            <MediaItem
                              m={m}
                              index={mediaIndex}
                              setIndex={setIndex}
                              openLightbox={openLightbox}
                              mediaArray={setWithMedia.media}
                            />
                          </Box>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </motion.div>
              );
            })}
          </ScrollContainer>
        )}

        {/* Lightbox */}
        <AnimatePresence mode="wait">
          {lightboxOpen &&
            activeMediaIndex !== null &&
            activeMediaSetIndex !== null && (
              <motion.div
                onClick={closeLightbox}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
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
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
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
                    handlePreviousMedia();
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
                        mediaSetsWithMedia[activeMediaSetIndex].media[
                          activeMediaIndex
                        ].id
                      }
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
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
                                stroke-width="0.6"
                              />
                              <line
                                x1="18"
                                y1="6"
                                x2="6"
                                y2="18"
                                stroke="currentColor"
                                stroke-width="0.6"
                              />
                            </svg>
                          </IconButton>

                          {(() => {
                            const media =
                              mediaSetsWithMedia[activeMediaSetIndex].media[
                                activeMediaIndex
                              ];
                            if (media.type === 'image') {
                              const { lowSrc, highSrc } = chooseImageSources(
                                media,
                                isMobile
                              );
                              return (
                                <ZoomableImage
                                  className="auto-cursor"
                                  lowSrc={lowSrc}
                                  highSrc={highSrc}
                                  alt="Fullscreen Image"
                                  zoomScale={2.5}
                                  maxHeight={isMobileQuery ? '80vh' : '70vh'}
                                />
                              );
                            } else {
                              const { lowSrc, highSrc } = chooseVideoSources(
                                media,
                                isMobile // use isMobile from react-device-detect to decide priorities
                              );
                              return (
                                <ZoomeableVideo
                                  className="auto-cursor"
                                  lowSrc={lowSrc}
                                  highSrc={highSrc}
                                  poster={
                                    media.paths.poster?.downloadURL || undefined
                                  }
                                  zoomScale={isMobile ? 2 : 3}
                                  maxHeight={isMobileQuery ? '80vh' : '70vh'}
                                  autoPlay={true}
                                  muted={true}
                                  loop={true}
                                />
                              );
                            }
                          })()}
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
                    handleNextMedia();
                  }}
                >
                  <MinimalRightArrowIcon />
                </IconButton>
              </motion.div>
            )}
        </AnimatePresence>
      </Box>
    </main>
  );
}
