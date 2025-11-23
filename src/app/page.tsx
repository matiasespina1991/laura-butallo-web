'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { MediaSet } from '@/utils/types/mediaset';
import { Media } from '@/utils/types/media';
import ScrollContainer from 'react-indiana-drag-scroll';
import { AnimatePresence, motion } from 'framer-motion';
import NextImage from 'next/image';
import { Box, Grid, IconButton, Theme, useMediaQuery } from '@mui/material';

import { useSwipeable } from 'react-swipeable';
import { fetchMediaSetsWithMedia } from '@/utils/functions/fetchMediaSetsWithMedia';
import { MinimalLeftArrowIcon } from './components/MinimalLeftArrowIcon';
import { MinimalRightArrowIcon } from './components/MinimalRightArrowIcon';
import ZoomableImage from './components/ZoomeableImage';

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
    console.log('[MediaItem] video loaded', m.id, t.videoWidth, t.videoHeight);
    setLoaded(true);
  };

  const handleVideoError = (e: any) => {
    console.error('[MediaItem] video error', m.id, e);
    setLoaded(true);
  };

  const posterSrc =
    m.paths?.poster?.downloadURL ||
    m.paths?.derivatives?.webp_medium?.downloadURL;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={loaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.995 }}
      transition={{ delay: 0.9 + setIndex * 0.5, duration: 1.1 }}
    >
      <Box sx={{ opacity: loaded ? 1 : 0 }} width="100%" height="100%">
        {m.type === 'image' ? (
          <NextImage
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
            width={600}
            height={600}
            onLoad={handleImageLoad as any}
            style={{ userSelect: 'none', display: 'block' }}
            src={m.paths.derivatives.webp_medium?.downloadURL || ''}
            onClick={() => openLightbox(mediaArray, index, setIndex)}
            alt={'Media'}
            className={styles.photoSetImage}
            priority={false}
          />
        ) : (
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
            }}
            onClick={() => openLightbox(mediaArray, index, setIndex)}
          >
            <source
              src={m.paths.derivatives.webm_720?.downloadURL || ''}
              type="video/webm"
            />
            Your browser does not support video.
          </video>
        )}
      </Box>
    </motion.div>
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
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxImageIsDragging, setLightboxImageIsDragging] =
    useState<boolean>(false);

  // const draggableNodeRef = useRef(null);
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('sm')
  );

  const draggableNodeRef = useRef<HTMLDivElement | null>(null);

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
                isMobile && setWithMedia.media.length === 4
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
                        gap={isMobile ? '14px' : 3}
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
                  paddingBottom: isMobile ? '5rem' : '0',
                  zIndex: 900,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(2px) saturate(0)',
                  overscrollBehavior: 'none',
                }}
              >
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
                        // ref={draggableNodeRef}
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => {}}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                        style={{
                          display: 'block',
                          // cursor: isMobile ? 'grab' : 'default',
                          userSelect: 'none',
                          // touchAction: 'pan-y',

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

                          {mediaSetsWithMedia[activeMediaSetIndex].media[
                            activeMediaIndex
                          ].type === 'image' ? (
                            <ZoomableImage
                              className="auto-cursor"
                              src={
                                mediaSetsWithMedia[activeMediaSetIndex].media[
                                  activeMediaIndex
                                ].paths.derivatives.webp_medium?.downloadURL ||
                                ''
                              }
                              alt="Fullscreen Image"
                              zoomScale={3}
                              maxHeight="80vh"
                            />
                          ) : (
                            <video
                              playsInline
                              onClick={(e) => e.stopPropagation()}
                              autoPlay
                              muted
                              loop
                              preload="metadata"
                              poster={
                                mediaSetsWithMedia[activeMediaSetIndex].media[
                                  activeMediaIndex
                                ].paths.poster?.downloadURL || undefined
                              }
                              onLoadedData={(e) => {
                                console.log(
                                  '[Lightbox] video loaded',
                                  mediaSetsWithMedia[activeMediaSetIndex].media[
                                    activeMediaIndex
                                  ].id,
                                  e.currentTarget.videoWidth,
                                  e.currentTarget.videoHeight
                                );
                              }}
                              onError={(e) =>
                                console.error(
                                  '[Lightbox] video error',
                                  mediaSetsWithMedia[activeMediaSetIndex].media[
                                    activeMediaIndex
                                  ].id,
                                  e
                                )
                              }
                              // NEW: stop propagation for touchstart on video
                              onTouchStart={(e) => e.stopPropagation()}
                              style={{
                                display: 'block',
                                opacity: lightboxImageIsDragging ? 0.5 : 1,
                                width: 'auto',
                                maxWidth: isMobile
                                  ? '99vw'
                                  : 'calc(100vw - 4rem)',
                                maxHeight: isMobile ? '80vh' : '70vh',
                                minHeight: '15rem',
                                objectFit: 'contain',
                                transition: 'opacity 0.5s',
                                margin: '0 auto',
                              }}
                            >
                              <source
                                src={
                                  mediaSetsWithMedia[activeMediaSetIndex].media[
                                    activeMediaIndex
                                  ].paths.derivatives.webm_720?.downloadURL ||
                                  ''
                                }
                                type="video/webm"
                              />
                            </video>
                          )}
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
