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
  videoMedias?: Media[];
};

const driftingLandscapesMedia: Media = {
  id: 'E8LksG9GKq7qoQsbtHYt',
  mediaSetId: null,
  uploadId: 'E8LksG9GKq7qoQsbtHYt',
  origin: {
    context: 'exhibition',
    exhibitionId: null,
    role: 'attachment',
  },
  type: 'video',
  title: 'Drifting Landscapes – Video',
  description: '',
  storagePath: 'uploads/videos/DriftingLandscapes_Belgica.mov',
  paths: {
    original: {
      storagePath: 'uploads/videos/DriftingLandscapes_Belgica.mov',
      downloadURL: null,
    },
    derivatives: {
      webm_360: {
        storagePath: 'temp-assets/E8LksG9GKq7qoQsbtHYt/video_360.webm',
        downloadURL:
          'https://storage.googleapis.com/laura-butallo-web.firebasestorage.app/temp-assets/E8LksG9GKq7qoQsbtHYt/video_360.webm?GoogleAccessId=388226025861-compute%40developer.gserviceaccount.com&Expires=16730323200&Signature=hH8tXQtrJEETRrGx%2BuigziLzDqJLfzqkMItYo0%2BSiV9t8Jm9ZI3SAYFgGqxmXAjbv3%2BTxoy8xygsWmO%2BHKnecEuUK%2FvJMLyPCimaq%2BBPC0sYqWNR3cAN8PYg7ZiDHe6JVLEy%2F4gvyzq%2BqcarWD%2F6uoFTiGi4gDdogsteI6XM%2FU1wSc0RbpiaIm249vmK81r5zlzV3Z1ijphPvDqNAh1gCq0TcOsM5CDOzz1wFOE%2F5QesGq2E5TCJmGFHmR8dRJsB7%2BK1%2B4OhcylO3DOSo1cNvzQPMRvTu%2B54uqNMwsIbV0lcyms0N8K9KzcszA5XGL%2FbpB0n7C3LChs6elx0en6cFw%3D%3D',
      },
      webm_720: {
        storagePath: 'temp-assets/E8LksG9GKq7qoQsbtHYt/video_720.webm',
        downloadURL:
          'https://storage.googleapis.com/laura-butallo-web.firebasestorage.app/temp-assets/E8LksG9GKq7qoQsbtHYt/video_720.webm?GoogleAccessId=388226025861-compute%40developer.gserviceaccount.com&Expires=16730323200&Signature=ZP2Xc750zhAIKoFoFfRJ64lGa%2FuTtXnwGcjt4X2%2FRofFSXWj8Ojzn7uAtN1CwkU0%2BF%2Bn343lwXkhRw7J1ljLNJX7axv9Vt38p0wbTog7bBMoBZDO3rGDMHV2xozFr41vqay88afKjHpPbiZW%2B0J37y8TFe%2FilSl851OpZifHWHzibiW5To%2BZ%2BwCMkHKoyZvrGA3BUDQgz608hSsEsueaE%2FR4hbrBfSk08Qg89qZScnMIIxR9c%2BPGsXXJxKum7KpXRrnEAzxmmDw8sOJKk0p8a8THIxI84ECHcpTC6Nb0r%2FeUojlzk9ecETZr%2FHgXSa2zBHiluG3qn%2BWCeu2m3H6qeA%3D%3D',
      },
      webm_1080: {
        storagePath: 'temp-assets/E8LksG9GKq7qoQsbtHYt/video_1080.webm',
        downloadURL:
          'https://storage.googleapis.com/laura-butallo-web.firebasestorage.app/temp-assets/E8LksG9GKq7qoQsbtHYt/video_1080.webm?GoogleAccessId=388226025861-compute%40developer.gserviceaccount.com&Expires=16730323200&Signature=NBImeRqNXArZFIX%2BDitKEUX0zDJwvgHStm3X%2BYKUPyB%2BMisA%2BB8BQlt2ONNuxWm7aLkOmxu2r0hacUw6GvxEXKkP0qhUKkyvLNTo7wBC4NIWCaO%2F8DANKz8V0FAkIZAZlNXOWF6hObzTD3cslefhsyZfS%2BWaH4ue5XizbwgEtedMrdWnm%2FSN%2FSB0eW6Z7%2BXS%2BykjHVaHSXs35huXso2o91791E1XZLvn0sb5NIbbl85CkKtSx8%2BiMEXV2ZKzT38csJETGkjOl7gRiIMYS71n1Em8NBaQJasnIL3jhHDh9WhqwzOVZYAWojJDM%2B1iV8l99G1EU6mKcQ0fBJ2VP24uEQ%3D%3D',
      },
    },
    poster: {
      storagePath: 'temp-assets/E8LksG9GKq7qoQsbtHYt/poster.webp',
      downloadURL:
        'https://storage.googleapis.com/laura-butallo-web.firebasestorage.app/temp-assets/E8LksG9GKq7qoQsbtHYt/poster.webp?GoogleAccessId=388226025861-compute%40developer.gserviceaccount.com&Expires=16730323200&Signature=IlCCiaOLCd3MfoyiI8dw0USxTdpMXs6IQP5SMvE2PMpv3qtsNqdhI3ZwVEpQWKp2NQLTzjzWuMD4U8JvuECBJmWemklWz4Tf4Fgg3xBP%2Fy37sLnsVNiS5IXyJ4QavWfip8ci07UShTPylMX4qUwRO27xdQg68OhKtgwx5hnVSYDcb2UvQlDHFgLGPo1O4o5QoNXNX5uNYkj%2FHrKOuGfPkEdy7hGUmbKc0ZOE3kkCx7UFDgfI%2BtNc51WyWvSbdw%2F%2Bm7mM7AFEUz7GRGYkhd8iBjBJVH7rP3tORwyuKFtmmYd1HMgm7AL%2FGY4Q8y3ah9mfFPApUz0pgku7R6Dyzwojrg%3D%3D',
    },
  },
  width: 3840,
  height: 2160,
  duration: 19,
  mimeType: 'video/quicktime',
  sizeBytes: 134345156,
  blurHash: null,
  codec: 'vp9',
  bitrate: 58095202,
  createdAt: Timestamp.fromMillis(Date.parse('2025-12-16T17:32:43+01:00')),
  modifiedAt: Timestamp.fromMillis(Date.parse('2025-12-16T17:50:55+01:00')),
  processed: true,
  deletedAt: null,
  uploadId: '',
  origin: {
    context: 'gallery',
    exhibitionId: undefined,
    role: undefined,
  },
};

const artOnTezosMedia: Media = {
  id: 'CsNx0GADEpqxahMxRs2T',
  mediaSetId: null,
  uploadId: 'CsNx0GADEpqxahMxRs2T',
  origin: {
    context: 'exhibition',
    exhibitionId: null,
    role: 'attachment',
  },
  type: 'video',
  title: 'Art on Tezos – Installation',
  description: '',
  storagePath: 'uploads/videos/CRTIstallation_Snippet.mp4',
  paths: {
    original: {
      storagePath: 'uploads/videos/CRTIstallation_Snippet.mp4',
      downloadURL: null,
    },
    derivatives: {
      webm_360: {
        storagePath: 'temp-assets/CsNx0GADEpqxahMxRs2T/video_360.webm',
        downloadURL:
          'https://storage.googleapis.com/laura-butallo-web.firebasestorage.app/temp-assets/CsNx0GADEpqxahMxRs2T/video_360.webm?GoogleAccessId=388226025861-compute%40developer.gserviceaccount.com&Expires=16730323200&Signature=sM7dKvTDzGE0lXOdrzTgG3C4DbbhPYpRvUn7UWujjSMQxi8G50kzjs0FhBbNfY6ice76YCQo3AmIRqzE9L218yB16P2uGQFOB6s9ABrZ%2ByBG%2BP5x%2Fdy%2F9PN48V6dULuhVwUyxlr33LImmxAN5slxWAKDPLkI4QjOJKuiQskzFKZlyr9MSM80W12cGW1TiZv7ufYuS23rXl%2FcFfUEWt81kHHeXOccEAKGal027gcUlUw1jnxjypwOnZVtLCNKOXnrCQjfIC2%2FT5YmqsFbOvVJjy1zQjVSNyW1CTgoj1kUP0uDb3lxZKxNBXuqXlL8o2DISHDCEbs07vb3l%2FJIs9%2Fg0A%3D%3D',
      },
      webm_720: {
        storagePath: 'temp-assets/CsNx0GADEpqxahMxRs2T/video_720.webm',
        downloadURL:
          'https://storage.googleapis.com/laura-butallo-web.firebasestorage.app/temp-assets/CsNx0GADEpqxahMxRs2T/video_720.webm?GoogleAccessId=388226025861-compute%40developer.gserviceaccount.com&Expires=16730323200&Signature=cWjZebtyNmZ0ftjY0UWcy3dtqUKWKIC%2BVJuljAlzHXxcNZMwABryFFeoxHxSlEdqmbOBajc2Ao0S7TUgnSXz0N0GXOTwuE%2B6m6RLXNHc%2FOZuJuoHtJYSQ8aT2mrtziIAB86vE134PK%2FCrGNGH3%2FRd6ZwzAe0FyCTSAec%2BBH2UlEsc0k2Us1wwpF8VzV1FEQI2Nb9SW%2B%2BrBgDOZ28T0YnvrkiskIKPTb39JGT7OG5R5Vozplx4h%2BzsLGMQrvZj6XzYNsmUyJ290fDbmFwwi5NhrpCKTSjB%2B%2FJQIueeD6n%2BZsWiBeeG5uZ3W%2FJf%2Fmt69eSuMBdQyzWDYEMvjXRrUB96g%3D%3D',
      },
      webm_1080: {
        storagePath: 'temp-assets/CsNx0GADEpqxahMxRs2T/video_1080.webm',
        downloadURL:
          'https://storage.googleapis.com/laura-butallo-web.firebasestorage.app/temp-assets/CsNx0GADEpqxahMxRs2T/video_1080.webm?GoogleAccessId=388226025861-compute%40developer.gserviceaccount.com&Expires=16730323200&Signature=Ve7QEKYMZkvb1oujDPKFP20JvugV35wM5RViFib1WYuEG413wTLE1ZKRf07L9AO1LDz%2FdjJMZ2BUDmlK3UtXoivRmzgBeCj4sMC%2B%2Fu3dZSKIcodeLat2GMYyTg5gDSYdqbiaw7HFoixDPtL1X%2BcnwAMtDgNo65vreM5FGOFYwOpwxTK5NymQhCS7uCXEferhaoNw9lx%2F2Zz%2FR2eWyqyLKa%2BepiReyueufWp9aslJCIt9Klw7ISFCoeEosC8ZM0%2BVQygXbVUUuH5hR3DerhxvR3s01UgRBeEvFRaCYwQXMmeDXsFYopvLTJ6vgN7TkB7WjYEvfZkPYlKK7fHTfN3qSw%3D%3D',
      },
    },
    poster: {
      storagePath: 'temp-assets/CsNx0GADEpqxahMxRs2T/poster.webp',
      downloadURL:
        'https://storage.googleapis.com/laura-butallo-web.firebasestorage.app/temp-assets/CsNx0GADEpqxahMxRs2T/poster.webp?GoogleAccessId=388226025861-compute%40developer.gserviceaccount.com&Expires=16730323200&Signature=kBti1k%2FXrQ9%2BFHsPAZ1g3lxSbzEjgkUuHzZkM0iBMJA8IvpAoiHMUupnna93Pa%2BxVmOlPQFgUbGWSPt1m124HKsxst0aNvQDm43%2BMSLxNq1d9iUOW74kZQ%2F5eIlQNBY9PgTMop0g3hNb2ehXVaBXQBU0EwK70PMEcnkbUMnhmpm7pF3AuEW66n6ZztUTAXSlgzDbaVpAdiXhzmv6dkH5ax2iN1%2F%2FP%2B84r1PgAe2Hgz%2F%2FSy2xOeDSJ1CY6sx6yiUTdgaPvY%2BMVeiWpk7%2BvUPZlBTYNhoiEK9ypa7Q6nh2gdeIMwQlE3M9tCTFH1DCduaUwVR1rSqtFHfplNw4yFR1gw%3D%3D',
    },
  },
  width: 1920,
  height: 1080,
  duration: 82,
  mimeType: 'video/mp4',
  sizeBytes: 103431359,
  blurHash: null,
  codec: 'vp9',
  bitrate: 10050987,
  createdAt: Timestamp.fromMillis(Date.parse('2025-12-16T18:03:27+01:00')),
  modifiedAt: Timestamp.fromMillis(Date.parse('2025-12-16T18:27:27+01:00')),
  processed: true,
  deletedAt: null,
  uploadId: '',
  origin: {
    context: 'gallery',
    exhibitionId: undefined,
    role: undefined,
  },
};

const exhibitions: Exhibition[] = [
  {
    title: '"Drifting Landscapes" – Exposición de Arte',
    meta: 'Abril de 2025 · Wintercircus Arena, Bélgica',
    paragraphs: [
      'En DRIFTING LANDSCAPES, la curadora @dianedrubay explora cómo han cambiado (nuestras ideas sobre) los paisajes en un contexto de fragilidad ecológica y acelerado crecimiento tecnológico. La exposición reúne a artistas que conciben el paisaje no como un telón de fondo apacible, sino como un espacio de disrupción: un territorio activo y en disputa, donde la tecnología y el impacto humano colisionan.',
      'Todas las obras de esta exposición forman parte de la colección personal de NFT de Diane, y todos los artistas participantes son personas a quienes he seguido de cerca (y coleccionado) durante los últimos años.',
    ],
    videoMedias: [
      driftingLandscapesMedia,
      //   driftingLandscapesEncoreMedia,
    ],
  },
  {
    title: 'Art on Tezos – Installation',
    meta: 'November 2025 · Estudio Aquel, Argentina',
    paragraphs: [
      'The Art on Tezos satellite event in Buenos Aires reminded us what drives this ecosystem: artists coming together, sharing space, and expanding the possibilities of digital art.',
      'The atmosphere was determined, collaborative, and warm. A brief look back. Organized by @NewtroArts.',
      'Together with OHDE, we had the opportunity to work on the construction of the impressive CRT tree installation. Our mission was to create the roots of the tree and the mutant decoration that adorned the large structure. It was a joint effort between the team of artists who worked on the televisions and Marian and Flopa, who were in charge of the aerial network of branches.',
    ],
    videoMedias: [artOnTezosMedia],
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
          touchAction: 'pan-y',
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

  useEffect(() => {
    // Defensive: avoid getting stuck with a global scroll-lock class
    // (can be very noticeable on real mobile Safari).
    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('no-scroll');
  }, []);

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

                                if (!exhibition.videoMedias?.length) {
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
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '2rem',
                                        }}
                                      >
                                        {exhibition.videoMedias.map((media) => (
                                          <ExhibitionVideoPlayer
                                            key={media.id}
                                            media={media}
                                          />
                                        ))}
                                      </Box>
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
