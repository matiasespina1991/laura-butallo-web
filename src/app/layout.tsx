import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import Header from './components/Header';
import ThemeRegistry from './ThemeRegistry';

import { Box, Typography } from '@mui/material';
import AnimatedCursor from 'react-animated-cursor';
import { motion } from 'framer-motion';
import CSAnimatedCursor from './CSAnimatedCursor';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Laura Butallo',
  description: '3D artist.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '', // --- URL OF YOUR WEBSITE ---
    images: [
      {
        url: '', // --- IMAGE FOR MINIATURE IN SOCIAL MEDIA ---
        alt: 'Laura Butallo',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <html lang="en">
        <body className={inter.className}>
          <CSAnimatedCursor />

          <ThemeRegistry>
            <Header />
            <Box mt="64px">{children}</Box>

            <Box>
              <footer
                style={{
                  display: 'flex',

                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '10rem',
                  backgroundColor: 'black',
                  color: 'white',
                }}
              >
                <Box
                  sx={{
                    p: '3.5rem',
                    textAlign: 'center',
                  }}
                >
                  <Typography>
                    Laura Butallo © {new Date().getFullYear()}
                  </Typography>
                  <Box
                    sx={{
                      p: '0.1rem',
                    }}
                  ></Box>
                  <Typography>
                    Designed by <b>Cymatics Ideas</b>™
                  </Typography>
                </Box>
              </footer>
            </Box>
          </ThemeRegistry>
        </body>
      </html>
    </>
  );
}
