'use client';

import * as React from 'react';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from './createEmotionCache';
import { useServerInsertedHTML } from 'next/navigation';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { color } from 'framer-motion';

// Mantengo tu theme tal cual, solo lo dejo en este archivo para envolverlo.
const theme = createTheme({
  typography: {
    fontSize: 13,
    fontFamily: 'Helvetic a Neue, Arial, sans-serif',
  },
  components: {
    MuiToolbar: {
      styleOverrides: {
        dense: {
          height: 70,
          minHeight: 70,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        disableElevation: true,
        root: {
          boxShadow: 'none',
          borderRadius: 0,
        },
        text: {
          borderBottom: '1px solid rgba(0, 0, 0, 0)',
          marginBottom: '-1px',
          transition: '0.4s ease border-bottom',
        },
        contained: {
          backgroundColor: 'black',
          color: 'white',
          ':hover': {
            boxShadow: 'none',
            backgroundColor: '#cacaca',
          },
        },
        outlined: {
          color: 'black',
          border: '1px solid white',
          ':hover': {
            backgroundColor: '#1e1e1eff',
            color: 'white',
            border: '1px solid white',
          },
        },
      },
    },
  },
  palette: {
    primary: {
      main: '#ffffff',
    },
    secondary: {
      main: '#000000',
    },
    text: {
      primary: '#000000',
    },
  },
});

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cache] = React.useState(() => createEmotionCache());

  useServerInsertedHTML(() => {
    const tags = (cache.sheet as any)?.tags ?? [];
    if (tags.length === 0) return null;
    const html = tags.map((t: any) => t.textContent).join('');
    return (
      <style
        key="emotion-server-side"
        data-emotion={`${cache.key}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}
