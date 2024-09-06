'use client';

import { Box, Stack, Typography } from '@mui/material';
import styles from '../page.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getContactData } from '@/utils/functions/getContactData';
import { ContactData } from '@/utils/types/types';

export default function Contact() {
  const [contactData, setContactData] = useState<ContactData>({
    contact_email: '',
    whatsapp_number: '',
    instagram_url: '',
  });

  const fetchContactData = async () => {
    const data: ContactData | null = await getContactData();

    if (data) {
      setContactData(data);
    }
  };

  useEffect(() => {
    fetchContactData();
  }, []);

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
              {contactData.contact_email && (
                <Link href={`mailto:${contactData.contact_email}`}>
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
                    {contactData.contact_email}
                  </Typography>
                </Link>
              )}

              <Box height={10}></Box>

              {contactData.whatsapp_number && (
                <Link
                  href={`https://wa.me/${contactData.whatsapp_number}`}
                  passHref
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
                    +{contactData.whatsapp_number}
                  </Typography>
                </Link>
              )}
            </Stack>
          </motion.div>
        </AnimatePresence>
      </Box>
    </main>
  );
}
