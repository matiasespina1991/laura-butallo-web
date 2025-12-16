'use client';

import { Box, Stack, Typography } from '@mui/material';
import styles from '../page.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../ThemeRegistry';
import Footer from '../components/Footer';
import { Media } from '@/utils/types/media';
import { Timestamp } from 'firebase/firestore';
import { selectVideoAssets } from '@/utils/media/assetSelectors';
import { useStorageAssetSrc } from '@/hooks/useStorageAssetSrc';
import { isMobile } from 'react-device-detect';

type Exhibition = {
  title: string;
  meta?: string;
  paragraphs: string[];
  videoMedia?: Media;
};

const driftingLandscapesMedia: Media = {
  id: 'EFxgQNfUljdThLR1pvHh',
  mediaSetId: null,
  type: 'video',
  title: 'Drifting Landscapes – Video',
  description: '',
  storagePath: 'uploads/videos/DriftingLandscapes_Belgica (2).mov',
  paths: {
    original: {
      storagePath: 'uploads/videos/DriftingLandscapes_Belgica (2).mov',
      downloadURL: null,
    },
    derivatives: {
      webm_360: {
        storagePath: 'temp-assets/EFxgQNfUljdThLR1pvHh/video_360.webm',
        downloadURL:
          'https://storage.googleapis.com/laura-butallo-web.firebasestorage.app/temp-assets/EFxgQNfUljdThLR1pvHh/video_360.webm?GoogleAccessId=388226025861-compute%40developer.gserviceaccount.com&Expires=16730323200&Signature=qMDdFeG1JLRyeF2bgqpPzTMjGb2V4QbXpnRlR5I%2FNql2eGEzShlnhVDdfvyGSv75rFzYf92381ojiga3DEQMQruhieqT19ZGB02fdy%2FZCpuFzEnrsaHhJnJEIiQHpAZV%2FQaJSEHbN5iCHhx9HJoV1tzCmpbCjLImb6E%2BtdfJkXBR4Si2VIaQH81zl%2FdQI7jIeirtg7vtR96A%2FoPfMI8%2BiQLurONYVzvD0A3S7tMJvCcYYre01W9IzKTebHLvmU%2BBfvM0ifPBqFNAYdEjI4PZsaGSMZZDBhLga44kOlp9jgmBkHVqgtycrG4TBmn38t%2FO8SZwfyqMt%2Bk1L2XCDxGuJA%3D%3D',
      },
      webm_720: {
        storagePath: 'temp-assets/EFxgQNfUljdThLR1pvHh/video_720.webm',
        downloadURL:
          'https://storage.googleapis.com/laura-butallo-web.firebasestorage.app/temp-assets/EFxgQNfUljdThLR1pvHh/video_720.webm?GoogleAccessId=388226025861-compute%40developer.gserviceaccount.com&Expires=16730323200&Signature=VMMkV3lKoC6eDO9w5gdSk2CTsiutb5T93n0Zoe1avf%2F7j2z6QdIeadtCfGmtDuFzaXVD1o1CRH3ZxCVCNQr9lAem%2BUYtzBxgNx6OJtKHfK84eBl%2F0Q%2BjtI8IZDc84PqP57ySbIwTI36%2BmicWTa84efeE%2BIxTBJr2qVKfWgYNsByEmNtuZUTViFCD1BkgzjuY30oJonz%2FXPdmuKhflQ2pYGOd0RVC1qJPUTteiGbUsh%2FIl7YsKB5vZwBU8%2BG9FdpGyeLr4MbT5T4wDdXd2YbGbX317ew72GYCvtPTdhPOpoeaRUzLVRGeXzt6e%2FOHMCz9L0QyRtpY8fTOIkKdhWsL%2Bw%3D%3D',
      },
      webm_1080: {
        storagePath: 'temp-assets/EFxgQNfUljdThLR1pvHh/video_1080.webm',
        downloadURL:
          'https://storage.googleapis.com/laura-butallo-web.firebasestorage.app/temp-assets/EFxgQNfUljdThLR1pvHh/video_1080.webm?GoogleAccessId=388226025861-compute%40developer.gserviceaccount.com&Expires=16730323200&Signature=pgidz7yiMjwWQop75yi9r1j9FfyMwtl55KXtZG3q0zGXy1%2BejL5drZ0Huj7tYB73y1rnJA97Br5mExN7QN1t7lHsDAnczgpjkCWjRnpiPo1iYDh%2Bgv7ngDbqkHbcmLBas6rEWzf%2FZVug7tXaRtgjdHDQTA2oo0SSwifqLz5zj6LcZRnT84JpbTVidxLZDDF4f9vW4vRb%2BUJHdmv5tAeMgXBRWIz9IMP8WU8ccOKF36UGrkMkQf9ZdPS8RRKHXQkw1zoJixA4gYTT%2BfYHTvr68uHqNZYbxvG0L0CNClreSlBF%2FJwf7FNBN6f3%2BAQpGrZvkrEhGKYnrXAAsydxKHI%2BdQ%3D%3D',
      },
    },
    poster: {
      storagePath: 'temp-assets/EFxgQNfUljdThLR1pvHh/poster.webp',
      downloadURL:
        'https://storage.googleapis.com/laura-butallo-web.firebasestorage.app/temp-assets/EFxgQNfUljdThLR1pvHh/poster.webp?GoogleAccessId=388226025861-compute%40developer.gserviceaccount.com&Expires=16730323200&Signature=tRQJ%2F8Afs4T41903vMLqedszPR70Ipe2rFYW0QoXKqhC1dCG0iQa2G8xxrmRevAEvFh3r0h8u8MVrGFiQf%2FW1lNItO2IXOhJaqmZ65S9ij5cir%2FqFSjlinw4uMq%2FbUAKlY5QwP1ItBEOOosjjobSYvJXIoo46oepuwl4TAcPk9cfeFT%2BILFUd2oC1GIa4YHb2vRzXwAkrIoL3ocDAX2%2BuvAsGbzCV8CZjyMgWHgIJj%2BJ7VI8K%2Fc2vdoMu2n8IVMA8LJycjdQED2jcUH3bDjL78J2iY%2BkkAnB9Y%2FDuVcZahSUmRT%2BfCUuJN8Xh%2Bfg27Cx79b5e9Yxjr6RUA5fH0qBhQ%3D%3D',
    },
  },
  width: 3840,
  height: 2160,
  duration: 7,
  mimeType: 'video/quicktime',
  sizeBytes: 50240297,
  blurHash: null,
  codec: 'vp9',
  bitrate: 57969576,
  createdAt: Timestamp.fromMillis(Date.parse('2025-12-16T16:08:17Z')),
  modifiedAt: Timestamp.fromMillis(Date.parse('2025-12-16T16:11:25Z')),
  processed: true,
  deletedAt: null,
};

const exhibitions: Exhibition[] = [
  {
    title: '"Drifting Landscapes" – Exposición de Arte',
    meta: 'Abril de 2025 · Wintercircus Arena, Bélgica',
    paragraphs: [
      'En DRIFTING LANDSCAPES, la curadora @dianedrubay explora cómo han cambiado (nuestras ideas sobre) los paisajes en un contexto de fragilidad ecológica y acelerado crecimiento tecnológico. La exposición reúne a artistas que conciben el paisaje no como un telón de fondo apacible, sino como un espacio de disrupción: un territorio activo y en disputa, donde la tecnología y el impacto humano colisionan.',
      'Todas las obras de esta exposición forman parte de la colección personal de NFT de Diane, y todos los artistas participantes son personas a quienes he seguido de cerca (y coleccionado) durante los últimos años.',
    ],
    videoMedia: driftingLandscapesMedia,
  },
  {
    title: 'Art on Tezos – Installation',
    meta: 'November 2025 · Estudio Aquel, Argentina',
    paragraphs: [
      'The Art on Tezos satellite event in Buenos Aires reminded us what drives this ecosystem: artists coming together, sharing space, and expanding the possibilities of digital art.',
      'The atmosphere was determined, collaborative, and warm. A brief look back. Organized by @NewtroArts.',
      'Together with OHDE, we had the opportunity to work on the construction of the impressive CRT tree installation. Our mission was to create the roots of the tree and the mutant decoration that adorned the large structure. It was a joint effort between the team of artists who worked on the televisions and Marian and Flopa, who were in charge of the aerial network of branches.',
    ],
  },
];

function ExhibitionVideoPlayer({ media }: { media: Media }) {
  const isMobileDevice = isMobile;
  const [loaded, setLoaded] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [media.id]);

  const sources = useMemo(
    () => selectVideoAssets(media, isMobileDevice),
    [media, isMobileDevice]
  );
  const videoSource = useStorageAssetSrc(sources.low);
  const posterSource = useStorageAssetSrc(sources.poster);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('[Exhibitions] video error', media.id, e);
    videoSource.handleError();
  };

  return (
    <Box sx={{ opacity: loaded ? 1 : 0, transition: 'opacity 300ms ease' }}>
      <video
        width="100%"
        height="100%"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        controls={showControls}
        poster={posterSource.src || undefined}
        onLoadedData={() => setLoaded(true)}
        onError={handleVideoError}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          display: 'block',
          borderRadius: isMobileDevice ? '8px' : '10px',
        }}
      >
        <source src={videoSource.src || ''} type="video/webm" />
        Your browser does not support video.
      </video>
    </Box>
  );
}

export default function Exhibitions() {
  const { mode } = useContext(ThemeContext);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleExhibition = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <main className={`${styles.main} ${styles.contactPage}`}>
      <Box
        px={{ xs: '1.2rem', sm: '2rem' }}
        py={{ xs: '1.7rem', sm: '2rem' }}
        width="100%"
      >
        <Box
          sx={{
            height: {
              xs: '1rem',
              sm: '3rem',
              md: '3rem',
              lg: '3.5rem',
              xl: '5rem',
            },
          }}
        ></Box>
        <Box className={styles.contact_page_container} width="100%">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              exit={{ opacity: 0 }}
            >
              <Stack
                px={{
                  xs: '0.3rem',
                  sm: '0',
                }}
                gap={1.5}
              >
                <Typography
                  sx={{
                    overflowWrap: 'break-word',
                    fontSize: {
                      xs: '1.8rem',
                      sm: '2.5rem',
                    },
                  }}
                  fontWeight="bold"
                  variant="h3"
                >
                  EXHIBITIONS
                </Typography>
                <Box height={10}></Box>
                {exhibitions.map((exhibition, index) => {
                  const isOpen = openIndex === index;
                  return (
                    <Box key={exhibition.title}>
                      <Box
                        onClick={() => toggleExhibition(index)}
                        sx={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          sx={{
                            overflowWrap: 'break-word',
                            fontSize: {
                              xs: '1.4rem',
                              sm: '2.5rem',
                            },
                          }}
                          fontWeight="bold"
                          variant="h3"
                        >
                          <img
                            src="/images/icons/arrows/arrow_contact_light.png"
                            alt="Toggle exhibition description"
                            style={{
                              width: '0.72em',
                              height: '0.72em',
                              marginRight: '0.3em',
                              filter: mode === 'dark' ? 'invert(1)' : 'none',
                            }}
                          />
                          {exhibition.title}
                        </Typography>
                      </Box>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            <Box mt={1.5} pl={{ xs: 0, sm: '1.8rem' }}>
                              {(() => {
                                const textContent = (
                                  <>
                                    {exhibition.meta && (
                                      <Typography
                                        variant="subtitle1"
                                        sx={{
                                          fontSize: '1.1rem',
                                          fontStyle: 'italic',
                                          fontWeight: 500,
                                        }}
                                      >
                                        {exhibition.meta}
                                      </Typography>
                                    )}
                                    {exhibition.paragraphs.map(
                                      (paragraph, paragraphIndex) => (
                                        <Typography
                                          key={`${exhibition.title}-${paragraphIndex}`}
                                          sx={{
                                            mt: paragraphIndex === 0 ? 1.5 : 1,
                                            fontSize: {
                                              xs: '1rem',
                                              sm: '1.1rem',
                                            },
                                            lineHeight: 1.6,
                                          }}
                                        >
                                          {paragraph}
                                        </Typography>
                                      )
                                    )}
                                  </>
                                );

                                if (!exhibition.videoMedia) {
                                  return textContent;
                                }

                                return (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      flexDirection: {
                                        xs: 'column',
                                        md: 'row',
                                      },
                                      gap: '1.5rem',
                                      padding: '1rem',
                                    }}
                                  >
                                    <Box flex={1}>{textContent}</Box>
                                    <Box
                                      flex={1}
                                      width="100%"
                                      sx={{
                                        paddingLeft: {
                                          xs: 0,
                                          md: '3rem',
                                        },
                                        paddingTop: {
                                          xs: '1.5rem',
                                          md: 0,
                                        },
                                      }}
                                    >
                                      <ExhibitionVideoPlayer
                                        media={exhibition.videoMedia}
                                      />
                                    </Box>
                                  </Box>
                                );
                              })()}
                            </Box>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <Box height={10}></Box>
                    </Box>
                  );
                })}
              </Stack>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        style={{ width: '100%' }}
      >
        <Footer />
      </motion.div>
    </main>
  );
}
