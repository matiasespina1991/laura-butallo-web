'use client';

import { Box, Stack, Typography } from '@mui/material';
import styles from '../page.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

export default function Contact() {
  return (
    <main className={styles.main}>
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
      <Box width="100%">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Stack
              px={{
                xs: '0.3rem',
                sm: '0',
              }}
              gap={2}
            >
              <Link href="mailto:moirasofiavaccaro@gmail.com">
                <Typography
                  sx={{
                    overflowWrap: 'break-word',
                    fontSize: {
                      xs: '1.8rem',
                      sm: '2.8rem',
                    },
                  }}
                  fontWeight="bold"
                  variant="h3"
                >
                  moirasofiavaccaro@gmail.com
                </Typography>
              </Link>
              <Box height={10}></Box>

              <Link
                href="https://wa.me/4915739403198"
                passHref
                // href="https://api.whatsapp.com/send/?phone=34623319655&text&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
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
                  +49 1573 9403198
                </Typography>
              </Link>
            </Stack>
          </motion.div>
        </AnimatePresence>
      </Box>
    </main>
  );
}
