'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { MediaSet } from '@/utils/types/mediaset';
import { Media } from '@/utils/types/media';
import ScrollContainer from 'react-indiana-drag-scroll';
import { AnimatePresence, motion } from 'framer-motion';
import NextImage from 'next/image';
import { Box, Grid, IconButton, Theme, useMediaQuery } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useSwipeable } from 'react-swipeable';
import Draggable from 'react-draggable';
import { fetchMediaSetsWithMedia } from '@/utils/functions/fetchMediaSetsWithMedia';

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
  // Track whether this specific media has finished loading.
  const [loaded, setLoaded] = useState<boolean>(false);

  // Reset loaded when source changes to allow re-animating on re-render/new src.
  useEffect(() => {
    setLoaded(false);
  }, [
    m.paths?.derivatives?.webp_medium?.downloadURL,
    m.paths?.derivatives?.webm_720?.downloadURL,
  ]);

  const handleImageLoad = () => {
    setLoaded(true);
  };

  const handleVideoLoaded = () => {
    setLoaded(true);
  };

  return (
    <motion.div
      // animate only when loaded to prevent "pop in"
      initial={{ opacity: 0, scale: 0.995 }}
      animate={loaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.995 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{ width: '100%', height: '100%' }}
    >
      <Box width="100%" height="100%">
        {m.type === 'image' ? (
          <NextImage
            onContextMenu={(e) => e.preventDefault()}
            draggable="false"
            width={600}
            height={600}
            // onLoadingComplete is supported by next/image and signals the image has finished decoding
            onLoadingComplete={handleImageLoad as any}
            style={{ userSelect: 'none', cursor: 'pointer' }}
            src={m.paths.derivatives.webp_medium?.downloadURL || ''}
            onClick={() => openLightbox(mediaArray, index, setIndex)}
            alt={m.title || ''}
            className={styles.photoSetImage}
            // keep layout predictable
            priority={false}
          />
        ) : (
          <video
            width="100%"
            height="100%"
            autoPlay={true}
            loop
            muted
            playsInline
            onLoadedData={handleVideoLoaded}
            style={{
              objectFit: 'cover',
              cursor: 'pointer',
              width: '100%',
              height: '100%',
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

  const draggableNodeRef = useRef(null);
  const isMobile = useMediaQuery((theme: Theme) =>
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

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNextMedia(),
    onSwipedRight: () => handlePrevMedia(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
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

  const handlePrevMedia = useCallback(() => {
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
        if (prevSet && prevSet.media.length > 0) {
          setActiveMediaSetIndex(prevSetIndex);
          setActiveMediaIndex(prevSet.media.length - 1);
        }
      }
    }
  }, [activeMediaIndex, activeMediaSetIndex, mediaSetsWithMedia]);

  const handleNextMedia = useCallback(() => {
    if (activeMediaIndex !== null && activeMediaSetIndex !== null) {
      const currentSet = mediaSetsWithMedia[activeMediaSetIndex];
      if (currentSet && activeMediaIndex < currentSet.media.length - 1) {
        setActiveMediaIndex(activeMediaIndex + 1);
      } else {
        const nextSetIndex =
          activeMediaSetIndex < mediaSetsWithMedia.length - 1
            ? activeMediaSetIndex + 1
            : 0;
        const nextSet = mediaSetsWithMedia[nextSetIndex];
        if (nextSet && nextSet.media.length > 0) {
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
        if (e.key === 'ArrowLeft') handlePrevMedia();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [lightboxOpen, handleNextMedia, handlePrevMedia]);

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
      <Box px={{ xs: '0rem', sm: '2rem' }} width="100%">
        {mediaSetsWithMedia.length > 0 && (
          <ScrollContainer draggable={false} className={styles.carousel}>
            {mediaSetsWithMedia.map((setWithMedia, setIndex) => (
              <motion.div
                key={setWithMedia.mediaset.id}
                className={styles.photoSetContainer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.8,
                  ease: 'easeInOut',
                  delay: setIndex * 0.12,
                }}
              >
                {setWithMedia.media.length > 0 && (
                  <Box>
                    <Grid
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${getGridColumns(setWithMedia.media.length)}, 1fr)`,
                      }}
                      gap={2}
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
            ))}
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
                  display: 'flex',
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  height: '100vh',
                  width: '100vw',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 900,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(2px) saturate(0)',
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
                    handlePrevMedia();
                  }}
                >
                  <ArrowBackIosNewIcon fontSize="large" />
                </IconButton>

                <Box
                  sx={{ position: 'relative', cursor: 'pointer', zIndex: 900 }}
                  onClick={closeLightbox}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={
                        mediaSetsWithMedia[activeMediaSetIndex].media[
                          activeMediaIndex
                        ].id
                      }
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      {...swipeHandlers}
                    >
                      <Draggable
                        disabled={!isMobile}
                        nodeRef={draggableNodeRef}
                        position={{ x: 0, y: 0 }}
                        axis="x"
                        onDrag={() => setLightboxImageIsDragging(true)}
                        onStop={() => setLightboxImageIsDragging(false)}
                        bounds={{ left: -240, right: 240 }}
                      >
                        {mediaSetsWithMedia[activeMediaSetIndex].media[
                          activeMediaIndex
                        ].type === 'image' ? (
                          <NextImage
                            ref={draggableNodeRef}
                            onContextMenu={(e) => e.preventDefault()}
                            onDrag={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            draggable="false"
                            src={
                              mediaSetsWithMedia[activeMediaSetIndex].media[
                                activeMediaIndex
                              ].paths.derivatives.webp_medium?.downloadURL || ''
                            }
                            alt="Fullscreen Image"
                            width={1200}
                            height={1200}
                            style={{
                              opacity: lightboxImageIsDragging ? 0.5 : 1,
                              position: 'relative',
                              maxWidth: '91.5vw',
                              maxHeight: '80vh',
                              objectFit: 'contain',
                              transition: `transform ${lightboxImageIsDragging ? '0s' : '0.9s'}, opacity 0.5s`,
                            }}
                          />
                        ) : (
                          <video
                            width={1200}
                            height={1200}
                            autoPlay
                            poster={
                              mediaSetsWithMedia[activeMediaSetIndex].media[
                                activeMediaIndex
                              ].paths.poster?.downloadURL || undefined
                            }
                            style={{
                              opacity: lightboxImageIsDragging ? 0.5 : 1,
                              position: 'relative',
                              maxWidth: '91.5vw',
                              maxHeight: '80vh',
                              objectFit: 'contain',
                              transition: 'opacity 0.5s',
                            }}
                          >
                            <source
                              src={
                                mediaSetsWithMedia[activeMediaSetIndex].media[
                                  activeMediaIndex
                                ].paths.derivatives.webm_720?.downloadURL || ''
                              }
                              type="video/webm"
                            />
                            Tu navegador no soporta videos HTML5.
                          </video>
                        )}
                      </Draggable>
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
                  <ArrowForwardIosIcon fontSize="large" />
                </IconButton>
              </motion.div>
            )}
        </AnimatePresence>
      </Box>
    </main>
  );
}
