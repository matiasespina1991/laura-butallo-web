// src/app/ThemeRegistry.tsx

'use client';

import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BorderBottom } from '@mui/icons-material';

const theme = createTheme({
  typography: {
    fontSize: 13,
    fontFamily: 'Helvetica Neue, Arial, sans-serif',
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
          // ':hover': {
          //   borderBottom: '1px solid black',
          //   marginBottom: '-1px',
          //   backgroundColor: 'inherit',
          // },
        },
        contained: {
          backgroundColor: 'black',
          color: 'white',
          ':hover': {
            boxShadow: 'none',
            backgroundColor: '#cacaca',
          },
        },
      },
    },
  },
  palette: {
    primary: {
      main: '#ffffff', // AppBar background color (white)
    },
    secondary: {
      main: '#000000', // Button background color (black)
    },
    text: {
      primary: '#000000', // Text color (black)
    },
  },
});

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
