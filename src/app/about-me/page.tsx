'use client';

import { Box, Typography } from '@mui/material';
import styles from '../page.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { title } from 'process';
import { getAboutMeData } from '@/utils/functions/getAboutMeData';

export default function AboutMe() {
  const [aboutMeData, setAboutMeData] = useState({
    title: '',
    content: '',
  });

  const fetchAboutMeData = async () => {
    const data = await getAboutMeData();

    if (data) {
      setAboutMeData({
        title: data.title,
        content: data.content,
      });
    }
  };

  useEffect(() => {
    fetchAboutMeData();
  }, []);

  return (
    <main className={styles.main}>
      <AnimatePresence mode="wait">
        <motion.div
          style={{ width: '100%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Box
            sx={{
              height: {
                xs: '1rem',
                sm: '3rem',
                md: '4rem',
                lg: '5rem',
                xl: '6rem',
              },
            }}
          ></Box>
          <Box
            px={{
              xs: '0.3rem',
              sm: '0',
            }}
            width="100%"
          >
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
            <Box height={10}></Box>

            <Typography variant="h5">{aboutMeData.content}</Typography>
          </Box>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
