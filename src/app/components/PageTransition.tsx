'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { isMobile } from 'react-device-detect';

const variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={{ 
        duration: 0.4,
        ease: 'easeInOut'
      }}
    >
      {children}
      <div key={`footer-${pathname}`}>
        <Box>
          <footer
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: isMobile ? '6rem' : '10rem',
            backgroundColor: 'rgb(var(--background-rgb))',
            color: 'rgb(var(--foreground-rgb))',
            transition: 'background-color 0.3s ease, color 0.3s ease',
            borderTop: '1px solid rgba(128, 127, 127, 0.16)',
          }}
        >
          <Box
            sx={{
              p: '3.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography fontSize="0.55rem">
              Laura Butallo © {new Date().getFullYear()}
            </Typography>

            <Typography fontSize="0.55rem">
              Designed by <b>Cymatics Ideas</b>
            </Typography>
          </Box>
        </footer>
      </Box>
      </div>
    </motion.div>
  );
}
