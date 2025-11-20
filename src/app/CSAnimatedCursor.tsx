'use client'; // Marca este componente como un componente cliente

import { Box } from '@mui/material';
import AnimatedCursor from 'react-animated-cursor';
import React from 'react';
import { motion } from 'framer-motion';
import { isMobile } from 'react-device-detect';

export default function CSAnimatedCursor() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box
        zIndex={9999}
        display={{
          xs: isMobile ? 'none' : 'block',
          md: 'block',
          lg: 'block',
          xl: 'block',
        }}
      >
        <AnimatedCursor
          innerSize={10}
          outerSize={45}
          innerScale={1}
          outerScale={2}
          outerAlpha={0}
          trailingSpeed={5}
          innerStyle={{
            backgroundColor: 'white',
            filter: 'opacity(0.9)',
            backdropFilter: 'invert(1)',
            zIndex: 1000,
          }}
          outerStyle={{
            backdropFilter: 'invert(1)',
            zIndex: 1000,
          }}
        />
      </Box>
    </motion.div>
  );
}
