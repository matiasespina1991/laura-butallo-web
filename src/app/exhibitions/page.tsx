'use client';

import { Box, Stack, Typography } from '@mui/material';
import styles from '../page.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useContext, useState } from 'react';
import { ThemeContext } from '../ThemeRegistry';
import Footer from '../components/Footer';

type Exhibition = {
  title: string;
  meta?: string;
  paragraphs: string[];
};

const exhibitions: Exhibition[] = [
  {
    title: '"Drifting Landscapes" – Exposición de Arte',
    meta: 'Abril de 2025 · Wintercircus Arena, Bélgica',
    paragraphs: [
      'En DRIFTING LANDSCAPES, la curadora @dianedrubay explora cómo han cambiado (nuestras ideas sobre) los paisajes en un contexto de fragilidad ecológica y acelerado crecimiento tecnológico. La exposición reúne a artistas que conciben el paisaje no como un telón de fondo apacible, sino como un espacio de disrupción: un territorio activo y en disputa, donde la tecnología y el impacto humano colisionan.',
      'Todas las obras de esta exposición forman parte de la colección personal de NFT de Diane, y todos los artistas participantes son personas a quienes he seguido de cerca (y coleccionado) durante los últimos años.',
    ],
  },
];

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
