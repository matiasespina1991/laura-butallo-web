'use client';

import { Box, Stack, Typography } from '@mui/material';
import styles from '../page.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../ThemeRegistry';
import Footer from '../components/Footer';
import { Media } from '@/utils/types/media';
import db from '@/utils/config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query
} from 'firebase/firestore';
import { selectVideoAssets } from '@/utils/media/assetSelectors';
import { useStorageAssetSrc } from '@/hooks/useStorageAssetSrc';
import { isMobile } from 'react-device-detect';

type Exhibition = {
  id: string;
  title: string;
  meta?: string;
  paragraphs: string[];
  videoMedias?: Media[];
};

type ExhibitionDoc = {
  title?: string;
  dateAndLocation?: string;
  body?: string;
  mediaIds?: string[];
  featureMediaId?: string | null;
};

const parseBodyParagraphs = (body: string) => {
  const trimmed = body.trim();
  if (!trimmed) return [];
  if (typeof window === 'undefined') {
    const fallback = trimmed
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return fallback ? [fallback] : [];
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, 'text/html');
  const paragraphs = Array.from(doc.body.querySelectorAll('p'))
    .map((node) => node.textContent?.trim() ?? '')
    .filter(Boolean);
  if (paragraphs.length) return paragraphs;
  const fallback = doc.body.textContent?.trim() ?? '';
  return fallback ? [fallback] : [];
};

const uniqueIds = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
};

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
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    // Defensive: avoid getting stuck with a global scroll-lock class
    // (can be very noticeable on real mobile Safari).
    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('no-scroll');
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadExhibitions = async () => {
      setLoading(true);
      try {
        const exhibitionsSnap = await getDocs(
          query(collection(db, 'exhibitions'), orderBy('createdAt', 'desc'))
        );

        const rows = await Promise.all(
          exhibitionsSnap.docs.map(async (docSnap) => {
            const data = docSnap.data() as ExhibitionDoc;
            const paragraphs = parseBodyParagraphs(data.body ?? '');
            const meta = data.dateAndLocation?.trim() || undefined;

            const rawIds = [
              data.featureMediaId ?? null,
              ...(data.mediaIds ?? [])
            ].filter(Boolean) as string[];
            const mediaIds = uniqueIds(rawIds);

            const mediaDocs = await Promise.all(
              mediaIds.map(async (mediaId) => {
                const mediaSnap = await getDoc(doc(db, 'media', mediaId));
                if (!mediaSnap.exists()) return null;
                const mediaData = mediaSnap.data() as Media;
                const normalized = { id: mediaSnap.id, ...mediaData };
                return normalized.deletedAt ? null : normalized;
              })
            );

            const videoMedias = mediaDocs.filter(
              (item): item is Media => Boolean(item && item.type === 'video')
            );

            return {
              id: docSnap.id,
              title: data.title ?? '',
              meta,
              paragraphs,
              videoMedias: videoMedias.length ? videoMedias : undefined
            };
          })
        );

        if (isMounted) {
          setExhibitions(rows);
        }
      } catch (error) {
        console.error('[Exhibitions] load exhibitions error', error);
        if (isMounted) {
          setExhibitions([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadExhibitions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (openIndex === null) return;
    if (openIndex > exhibitions.length - 1) {
      setOpenIndex(null);
    }
  }, [exhibitions.length, openIndex]);

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
                {loading ? (
                  <Typography
                    sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
                    color="text.secondary"
                  >
                    Cargando exhibiciones...
                  </Typography>
                ) : exhibitions.length === 0 ? (
                  <Typography
                    sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
                    color="text.secondary"
                  >
                    Todavía no hay exhibiciones publicadas.
                  </Typography>
                ) : (
                  exhibitions.map((exhibition, index) => {
                    const isOpen = openIndex === index;
                    return (
                      <Box key={exhibition.id}>
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
                                            key={`${exhibition.id}-${paragraphIndex}`}
                                            sx={{
                                              mt:
                                                paragraphIndex === 0 ? 1.5 : 1,
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
                                          {exhibition.videoMedias.map(
                                            (media) => (
                                              <ExhibitionVideoPlayer
                                                key={media.id}
                                                media={media}
                                              />
                                            )
                                          )}
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
                  })
                )}
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
