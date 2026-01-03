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
  query,
} from 'firebase/firestore';
import {
  selectImageAssets,
  selectVideoAssets,
} from '@/utils/media/assetSelectors';
import { useStorageAssetSrc } from '@/hooks/useStorageAssetSrc';
import { isMobile } from 'react-device-detect';

type Exhibition = {
  id: string;
  title: string;
  meta?: string;
  paragraphs: string[];
  mediaItems?: Media[];
};

type ExhibitionDoc = {
  title?: string;
  dateAndLocation?: string;
  body?: string;
  mediaIds?: string[];
  featureMediaId?: string | null;
  order?: number;
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
    .map((node) => node.innerHTML.trim())
    .filter(Boolean);
  if (paragraphs.length) return paragraphs;
  const fallback = doc.body.innerHTML.trim();
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

function ExhibitionVideoPlayer({
  media,
  maxHeight = '45rem',
}: {
  media: Media;
  maxHeight?: string;
}) {
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
    <Box
      sx={{
        opacity: loaded ? 1 : 0,
        transition: 'opacity 300ms ease',
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        paddingInline: isMobileDevice ? '0rem' : '3rem',
      }}
    >
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
        src={videoSource.src || undefined}
        onLoadedData={() => setLoaded(true)}
        onError={handleVideoError}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        style={{
          objectFit: 'contain',
          width: '100%',
          height: 'auto',
          maxWidth: '45rem',
          maxHeight,
          paddingInline: '0rem',
          display: 'block',
          borderRadius: isMobileDevice ? '8px' : '10px',
          touchAction: 'pan-y',
        }}
      >
        Your browser does not support video.
      </video>
    </Box>
  );
}

function ExhibitionImage({
  media,
  maxHeight = '45rem',
}: {
  media: Media;
  maxHeight?: string;
}) {
  const isMobileDevice = isMobile;
  const sources = useMemo(
    () => selectImageAssets(media, isMobileDevice),
    [media, isMobileDevice]
  );
  const imageSource = useStorageAssetSrc(
    sources.high ?? sources.low ?? sources.original
  );

  return (
    <Box>
      <img
        src={imageSource.src || ''}
        alt={media.title ?? 'Imagen de exhibición'}
        onError={imageSource.handleError}
        style={{
          objectFit: 'contain',
          width: '100%',
          height: 'auto',
          maxHeight,

          // maxHeight: '90vh',
          display: 'block',
          borderRadius: isMobileDevice ? '8px' : '10px',
        }}
      />
    </Box>
  );
}

function ExhibitionMediaCarousel({
  items,
  mode,
}: {
  items: Media[];
  mode: 'light' | 'dark';
}) {
  const isMobileDevice = isMobile;
  const [activeIndex, setActiveIndex] = useState(0);
  const total = items.length;

  useEffect(() => {
    setActiveIndex(0);
  }, [items.map((item) => item.id).join('|')]);

  const goPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  const activeItem = items[activeIndex];

  const controlColor = '#ffffff';
  const controlBg = mode === 'dark' ? 'rgba(10, 10, 10, 0.6)' : '#00000099';
  const controlBorder = '#ffffff';
  const dotColor = '#4a4a4a';

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '48rem',
        marginInline: 'auto',
        paddingTop: '2rem',
      }}
    >
      {total > 1 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {items.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <Box
                key={`dot-${items[index].id}`}
                component="button"
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to media ${index + 1}`}
                sx={{
                  width: isActive ? '0.50rem' : '0.45rem',
                  height: isActive ? '0.50rem' : '0.45rem',
                  borderRadius: '999px',
                  border: `1px solid #000000`,
                  backgroundColor: isActive ? '#1c1c1cff' : 'transparent',
                  opacity: isActive ? 1 : 0.6,
                  transition: 'all 200ms ease',
                  cursor: 'pointer',
                }}
              />
            );
          })}
        </Box>
      )}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: isMobileDevice ? '14rem' : '18rem',
        }}
      >
        {total > 1 && (
          <>
            <Box
              component="button"
              type="button"
              onClick={goPrev}
              aria-label="Previous media"
              sx={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translate(-30%, -50%)',
                width: '2.6rem',
                height: '2.6rem',
                borderRadius: '999px',
                backgroundColor: controlBg,
                border: `1px solid ${controlBorder}`,
                color: controlColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 18px rgba(0,0,0,0.12)',
              }}
            >
              <Box component="span" sx={{ fontSize: '1.4rem', mb: '2px' }}>
                ‹
              </Box>
            </Box>
            <Box
              component="button"
              type="button"
              onClick={goNext}
              aria-label="Next media"
              sx={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translate(30%, -50%)',
                width: '2.6rem',
                height: '2.6rem',
                borderRadius: '999px',
                backgroundColor: controlBg,
                border: `1px solid ${controlBorder}`,
                color: controlColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 18px rgba(0,0,0,0.12)',
              }}
            >
              <Box component="span" sx={{ fontSize: '1.4rem', mb: '2px' }}>
                ›
              </Box>
            </Box>
          </>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{
              width: '100%',
              height: '28rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {activeItem.type === 'video' ? (
              <ExhibitionVideoPlayer media={activeItem} maxHeight="28rem" />
            ) : (
              <ExhibitionImage media={activeItem} maxHeight="28rem" />
            )}
          </motion.div>
        </AnimatePresence>
      </Box>
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
          query(collection(db, 'exhibitions'), orderBy('order', 'asc'))
        );

        const rows = await Promise.all(
          exhibitionsSnap.docs.map(async (docSnap) => {
            const data = docSnap.data() as ExhibitionDoc;
            const paragraphs = parseBodyParagraphs(data.body ?? '');
            const meta = data.dateAndLocation?.trim() || undefined;

            const rawIds = [
              data.featureMediaId ?? null,
              ...(data.mediaIds ?? []),
            ].filter(Boolean) as string[];
            const mediaIds = uniqueIds(rawIds);

            const mediaDocs = await Promise.all(
              mediaIds.map(async (mediaId) => {
                const mediaSnap = await getDoc(doc(db, 'media', mediaId));
                if (!mediaSnap.exists()) return null;
                const mediaData = mediaSnap.data() as Omit<Media, 'id'>;
                const normalized = { ...mediaData, id: mediaSnap.id };
                return normalized.deletedAt ? null : normalized;
              })
            );

            const mediaItems = mediaIds
              .map((mediaId) => mediaDocs.find((item) => item?.id === mediaId))
              .filter((item): item is Media => Boolean(item));

            return {
              id: docSnap.id,
              title: data.title ?? '',
              meta,
              paragraphs,
              mediaItems: mediaItems.length ? mediaItems : undefined,
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
                  <Typography sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    Loading exhibitions...
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
                                            component="div"
                                            sx={{
                                              mt:
                                                paragraphIndex === 0 ? 1.5 : 1,
                                              fontSize: {
                                                xs: '1rem',
                                                sm: '1.1rem',
                                              },
                                              lineHeight: 1.6,
                                              '& a': {
                                                display: 'inline',
                                                textDecoration: 'underline',
                                                textUnderlineOffset: '2px',
                                              },
                                              '& img': {
                                                display: 'block',
                                                maxWidth: '640px',
                                                maxHeight: '640px',
                                                width: '100%',
                                                height: 'auto',
                                              },
                                            }}
                                            dangerouslySetInnerHTML={{
                                              __html: paragraph,
                                            }}
                                          />
                                        )
                                      )}
                                    </>
                                  );

                                  if (!exhibition.mediaItems?.length) {
                                    return textContent;
                                  }

                                  return (
                                    <Box
                                      sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                          xs: '1fr',
                                          md: 'minmax(0, 1fr) minmax(0, 1fr)',
                                        },
                                        alignItems: 'start',
                                        columnGap: {
                                          xs: '0',
                                          md: '1.5rem',
                                        },
                                        rowGap: {
                                          xs: '1.5rem',
                                          md: 0,
                                        },
                                        padding: isMobile ? '0rem' : '1rem',
                                      }}
                                    >
                                      <Box sx={{ minWidth: 0 }}>
                                        {textContent}
                                      </Box>
                                      <Box
                                        sx={{
                                          minWidth: 0,
                                          width: '100%',
                                        }}
                                      >
                                        <ExhibitionMediaCarousel
                                          items={exhibition.mediaItems}
                                          mode={mode}
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
