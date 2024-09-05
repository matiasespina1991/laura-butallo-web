// src/app/about/page.tsx

import { Box, Typography } from '@mui/material';
import styles from '../page.module.css';

export default function BookAVisit() {
  return (
    <main className={styles.main}>
      <Typography variant="h3">
        <b>Book a visit</b> page
      </Typography>
      <Box height={10}></Box>
      <Box px={4}>
        <Typography textAlign="center">
          Here the user should be able to book a visit to <b>Studio46</b>.
        </Typography>
      </Box>
    </main>
  );
}
