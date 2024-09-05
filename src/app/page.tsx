'use client';

import { Suspense, useEffect, useState } from 'react';
import styles from './page.module.css';
import { fetchArtworks } from '@/utils/functions/fetchArtworks';
import { Artwork } from '@/utils/types/types';
import ScrollContainer from 'react-indiana-drag-scroll';
import { AnimatePresence, motion } from 'framer-motion';
import NextImage from 'next/image';
import { Box, Stack, Modal, IconButton, Skeleton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

export default function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loadedIndexes, setLoadedIndexes] = useState<boolean[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadArtworks() {
      const fetchedArtworks = await fetchArtworks();
      setArtworks(fetchedArtworks);
      setLoadedIndexes(Array(fetchedArtworks.length).fill(false));
    }
    loadArtworks();
  }, []);

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

  const handleImageLoad = (index: number) => {
    setLoadedIndexes((prev) => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  };

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setActiveImageIndex(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxOpen) {
        if (e.key === 'ArrowLeft') {
          handlePrevImage();
        } else if (e.key === 'ArrowRight') {
          handleNextImage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxOpen, activeImageIndex]);

  const handlePrevImage = () => {
    if (activeImageIndex !== null && activeImageIndex > 0) {
      setActiveImageIndex((prevIndex) => prevIndex! - 1);
    }
  };

  const handleNextImage = () => {
    if (activeImageIndex !== null && activeImageIndex < artworks.length - 1) {
      setActiveImageIndex((prevIndex) => prevIndex! + 1);
    }
  };

  return (
    <main className={styles.main}>
      <Box
        sx={{
          height: {
            xs: '0rem',
            sm: '4rem',
            md: '5rem',
            lg: '6rem',
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
        {artworks.length > 0 ? (
          <ScrollContainer draggable={false} className={styles.carousel}>
            {artworks.map((artwork, index) => {
              const imageUrl =
                artwork.right_image_url_optional || artwork.image_url;
              return (
                <>
                  <motion.div
                    key={index}
                    className={styles.artworkContainer}
                    animate={{ opacity: loadedIndexes[index] ? 1 : 0 }}
                    transition={{
                      duration: 1,
                      ease: 'easeInOut',
                      delay: index * 0.2,
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {artwork.right_image_url_optional ? (
                      <Stack direction="row" spacing={2}>
                        <Box>
                          <NextImage
                            draggable="false"
                            style={{ userSelect: 'none' }}
                            src={artwork.image_url}
                            width={600}
                            height={600}
                            placeholder="blur"
                            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
                            onClick={() => openLightbox(index)}
                            onLoad={() => handleImageLoad(index)}
                            alt={artwork.title || ''}
                            className={styles.artworkImage}
                          />
                        </Box>
                        <Box>
                          <NextImage
                            draggable="false"
                            style={{ userSelect: 'none' }}
                            width={600}
                            height={600}
                            placeholder="blur"
                            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
                            src={artwork.right_image_url_optional}
                            onClick={() => openLightbox(index)}
                            onLoad={() => handleImageLoad(index)}
                            alt={artwork.title || ''}
                            className={styles.artworkImage}
                          />
                        </Box>
                      </Stack>
                    ) : (
                      <NextImage
                        draggable="false"
                        width={600}
                        height={600}
                        placeholder="blur"
                        blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
                        style={{ userSelect: 'none' }}
                        onClick={() => openLightbox(index)}
                        src={imageUrl}
                        onLoad={() => handleImageLoad(index)}
                        alt={artwork.title || ''}
                        className={styles.artworkImage}
                      />
                    )}
                  </motion.div>
                </>
              );
            })}
          </ScrollContainer>
        ) : (
          <></>
        )}

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
                  '@media (max-width: 600px)': {
                    transform: 'scale(1)',
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                disabled={activeImageIndex === 0}
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
                    key={artworks[activeImageIndex]?.image_url || ''}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NextImage
                      src={artworks[activeImageIndex]?.image_url || ''}
                      alt="Fullscreen Image"
                      width={1200}
                      height={1200}
                      style={{
                        position: 'relative',
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        objectFit: 'contain',
                        padding: '3rem 0',
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              </Box>

              <IconButton
                sx={{
                  position: 'absolute',
                  right: '1rem',
                  color: 'white',
                  zIndex: 1000,
                  transform: 'scale(1.5)',
                  '@media (max-width: 600px)': {
                    transform: 'scale(1)',
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                disabled={activeImageIndex === artworks.length - 1}
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
