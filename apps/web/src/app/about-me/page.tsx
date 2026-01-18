'use client';

import { Box, Typography } from '@mui/material';
import styles from '../page.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getAboutMeData } from '@/utils/functions/getAboutMeData';
import { AboutMeData } from '@/utils/types/types';
import Footer from '../components/Footer';

export default function AboutMe() {
  const [aboutMeData, setAboutMeData] = useState<AboutMeData>({
    title: '',
    content: '',
    subcontent: {
      education: {
        title: '',
        content: '',
      },
    },
  });

  const fetchAboutMeData = async () => {
    const data = await getAboutMeData();

    if (data) {
      setAboutMeData({
        title: data.title,
        content: data.content,
        subcontent: data.subcontent,
      });
    }
  };

  useEffect(() => {
    fetchAboutMeData();
  }, []);

  return (
    <>
      <main className={styles.main}>
        <Box
          px={{ xs: '1.2rem', sm: '2rem' }}
          py={{ xs: '1.7rem', sm: '2rem' }}
          width="100%"
        >
          <AnimatePresence mode="wait">
            <motion.div
              className={styles.about_me_container}
              style={{ width: '100%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              exit={{ opacity: 0 }}
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
              <Box width="100%">
                <Typography
                  sx={{
                    fontSize: {
                      xs: '1.8rem',
                      sm: '2.8rem',
                    },
                  }}
                  fontWeight="bold"
                  variant="h3"
                >
                  {aboutMeData.title}
                </Typography>
                <Box height={15}></Box>

                <Typography
                  maxWidth={{
                    sm: '100%',
                    md: '95%',
                    lg: '95%',
                    xl: '78%',
                  }}
                  sx={{
                    fontSize: {
                      xs: '1.3rem',
                      sm: '1.5rem',
                    },
                    '& p': {
                      margin: 0,
                    },
                    '& a': {
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
                  dangerouslySetInnerHTML={{ __html: aboutMeData.content }}
                />
              </Box>

              <Box height={120}></Box>
            </motion.div>
          </AnimatePresence>
        </Box>
      </main>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        style={{ width: '100%' }}
      >
        <Footer />
      </motion.div>
    </>
  );
}
