'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { fetchPhotoSets } from '@/utils/functions/fetchPhotoSets';
import { PhotoSetData } from '@/utils/types/types';
import ScrollContainer from 'react-indiana-drag-scroll';
import { AnimatePresence, motion } from 'framer-motion';
import NextImage from 'next/image';
import { Box, Grid, IconButton, Theme, useMediaQuery } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useSwipeable } from 'react-swipeable';
import Draggable from 'react-draggable';

export default function Home() {
  const [photoSetArray, setPhotoSetArray] = useState<PhotoSetData[]>([]);
  const [photoSetIndex, setPhotoSetIndex] = useState<number>(0);

  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [lightboxImageIsDragging, setLightboxImageIsDragging] =
    useState<boolean>(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
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
    async function loadPhotoSets() {
      const fetchedPhotoSetArray = await fetchPhotoSets();

      setPhotoSetArray(fetchedPhotoSetArray);
    }
    loadPhotoSets();
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNextImage(),
    onSwipedRight: () => handlePrevImage(),
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
    images: string[],
    clickedIndex: number,
    photoSetIndex: number
  ) => {
    setCurrentImages(images);
    setActiveImageIndex(clickedIndex);
    setLightboxOpen(true);
    setPhotoSetIndex(photoSetIndex);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setActiveImageIndex(null);
  };

  const handlePrevImage = useCallback(() => {
    if (activeImageIndex !== null && activeImageIndex !== 0) {
      setActiveImageIndex((prevIndex) => {
        const newIndex = prevIndex! - 1;
        return newIndex >= 0 ? newIndex : 0;
      });
    } else {
      const prevPhotoSetIndex =
        photoSetIndex > 0 ? photoSetIndex - 1 : photoSetArray.length - 1;

      if (photoSetArray[prevPhotoSetIndex].images) {
        openLightbox(
          photoSetArray[prevPhotoSetIndex].images,
          photoSetArray[prevPhotoSetIndex].images.length - 1,
          prevPhotoSetIndex
        );
      }
    }
  }, [activeImageIndex, photoSetArray, photoSetIndex]);

  const handleNextImage = useCallback(() => {
    if (
      activeImageIndex !== null &&
      activeImageIndex < currentImages.length - 1
    ) {
      setActiveImageIndex((prevIndex) => {
        const newIndex = prevIndex! + 1;
        return newIndex <= currentImages.length - 1
          ? newIndex
          : currentImages.length - 1;
      });
    } else {
      const nextPhotoSetIndex =
        photoSetIndex < photoSetArray.length - 1 ? photoSetIndex + 1 : 0;

      setPhotoSetIndex(nextPhotoSetIndex);

      if (photoSetArray[nextPhotoSetIndex].images) {
        openLightbox(
          photoSetArray[nextPhotoSetIndex].images,
          0,
          nextPhotoSetIndex
        );
      }
    }
  }, [activeImageIndex, currentImages, photoSetArray, photoSetIndex]);

  useEffect(() => {
    if (lightboxOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
          handleNextImage();
        } else if (e.key === 'ArrowLeft') {
          handlePrevImage();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [
    lightboxOpen,
    currentImages,
    activeImageIndex,

    handleNextImage,
    handlePrevImage,
  ]);

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
      ></Box>
      <Box
        px={{
          xs: '0rem',
          sm: '2rem',
        }}
        width="100%"
      >
        {photoSetArray.length > 0 ? (
          <ScrollContainer draggable={false} className={styles.carousel}>
            {photoSetArray.map((photoSet, photoSetIndex) => {
              const allImages = [...(photoSet.images || [])].filter(Boolean);

              return (
                <motion.div
                  key={photoSetIndex}
                  className={styles.photoSetContainer}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 1,
                    ease: 'easeInOut',
                    delay: photoSetIndex * 0.2,
                  }}
                >
                  {photoSet?.images && photoSet.images.length > 0 ? (
                    <Box>
                      <Grid
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${getGridColumns(photoSet.images.length)}, 1fr)`,
                        }}
                        gap={2}
                      >
                        {photoSet.images.map((img, imageIndex) => (
                          <Box width="100%" height="100%" key={imageIndex}>
                            <NextImage
                              onContextMenu={(e) => e.preventDefault()}
                              draggable="false"
                              width={600}
                              height={600}
                              placeholder="blur"
                              blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
                              style={{ userSelect: 'none' }}
                              src={img}
                              onClick={() =>
                                openLightbox(
                                  allImages,
                                  imageIndex,
                                  photoSetIndex
                                )
                              }
                              alt={photoSet.title || ''}
                              className={styles.photoSetImage}
                            />
                          </Box>
                        ))}
                      </Grid>
                    </Box>
                  ) : (
                    <></>
                  )}
                </motion.div>
              );
            })}
          </ScrollContainer>
        ) : (
          <></>
        )}
        {/* Lightbox */}
        <AnimatePresence mode="wait">
          {activeImageIndex !== null && (
            <motion.div
              onClick={closeLightbox}
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
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
                WebkitBackdropFilter: 'blur(2px) saturate(0)',
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
                  handlePrevImage();
                }}
              >
                <ArrowBackIosNewIcon fontSize="large" />
              </IconButton>

              <Box
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  outline: 'none',
                  zIndex: 900,
                }}
                onClick={closeLightbox}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImages[activeImageIndex]}
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
                      bounds={{
                        left: -240,
                        right: 240,
                      }}
                    >
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
                        src={currentImages[activeImageIndex]}
                        alt="Fullscreen Image"
                        width={1200}
                        height={1200}
                        style={{
                          opacity: lightboxImageIsDragging ? 0.5 : 1,
                          position: 'relative',
                          maxWidth: '91.5vw',
                          maxHeight: '80vh',
                          objectFit: 'contain',

                          transition: `transform ${
                            lightboxImageIsDragging ? '0s' : '0.9s'
                          }, opacity 0.5s`,
                        }}
                      />
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
                  handleNextImage();
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
