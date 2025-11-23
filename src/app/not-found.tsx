'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './page.module.css';

import {
  Box,
  Button,
  Grid,
  IconButton,
  Theme,
  useMediaQuery,
} from '@mui/material';

export default function NotFound() {
  return (
    <main className={styles.main}>
      <Box
        sx={{
          height: {
            xs: '0rem',
            sm: '4rem',
            md: '5rem',
            lg: '5.5rem',
            xl: '7rem',
          },
        }}
      />
      <Box
        className={styles.not_found_container}
        sx={{
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
        <Box height="0.5rem" />
        <p>The page you are looking for does not exist.</p>

        <Box height="1.3rem" />
        <Button
          variant="outlined"
          href="/"
          sx={{
            padding: '0.5rem 1rem',
            width: '11rem',
            border: '2px solid black',
            borderRadius: '0.5rem',
            textTransform: 'none',
            fontSize: '1rem',
          }}
        >
          Back to Home
        </Button>
      </Box>
    </main>
  );
}
