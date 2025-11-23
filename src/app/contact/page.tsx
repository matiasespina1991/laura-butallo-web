'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
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
    linktree_url: '',
    behance_url: '',
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
            md: '3rem',
            lg: '3.5rem',
            xl: '5rem',
          },
        }}
      ></Box>
      <Box className={styles.contact_page_container} width="100%">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            exit={{ opacity: 0 }}
          >
            <Stack
              px={{
                xs: '0.3rem',
                sm: '0',
              }}
              gap={1.5}
            >
              <Typography
                sx={{
                  overflowWrap: 'break-word',
                  fontSize: {
                    xs: '1.8rem',
                    sm: '2.5rem',
                  },
                }}
                fontWeight="bold"
                variant="h3"
              >
                CONTACT
              </Typography>
              <Box height={10}></Box>
              {contactData.contact_email && (
                <Link href={`mailto:${contactData.contact_email}`}>
                  <Typography
                    sx={{
                      overflowWrap: 'break-word',
                      fontSize: {
                        xs: '1.4rem',
                        sm: '2.5rem',
                      },
                    }}
                    fontWeight="bold"
                    variant="h3"
                  >
                    <img
                      src="/images/icons/arrows/arrow_contact_light.png"
                      alt="Linktree"
                      style={{
                        width: '0.72em',
                        height: '0.72em',
                        marginRight: '0.3em',
                        mixBlendMode: 'darken',
                      }}
                    />
                    Email
                  </Typography>
                </Link>
              )}
              <Box height={10}></Box>
              {contactData.instagram_url && (
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${contactData.instagram_url}`}
                >
                  <Typography
                    sx={{
                      overflowWrap: 'break-word',
                      fontSize: {
                        xs: '1.4rem',
                        sm: '2.5rem',
                      },
                    }}
                    fontWeight="bold"
                    variant="h3"
                  >
                    <img
                      src="/images/icons/arrows/arrow_contact_light.png"
                      alt="Instagram"
                      style={{
                        width: '0.72em',
                        height: '0.72em',
                        marginRight: '0.3em',
                        mixBlendMode: 'darken',
                      }}
                    />
                    Instagram
                  </Typography>
                </Link>
              )}

              <Box height={10}></Box>
              {contactData.linktree_url && (
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${contactData.linktree_url}`}
                >
                  <Typography
                    sx={{
                      overflowWrap: 'break-word',
                      fontSize: {
                        xs: '1.4rem',
                        sm: '2.5rem',
                      },
                    }}
                    fontWeight="bold"
                    variant="h3"
                  >
                    <img
                      src="/images/icons/arrows/arrow_contact_light.png"
                      alt="Linktree"
                      style={{
                        width: '0.72em',
                        height: '0.72em',
                        marginRight: '0.3em',
                        mixBlendMode: 'darken',
                      }}
                    />
                    Linktree
                  </Typography>
                </Link>
              )}
              <Box height={10}></Box>
              {contactData.behance_url && (
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${contactData.behance_url}`}
                >
                  <Typography
                    sx={{
                      overflowWrap: 'break-word',
                      fontSize: {
                        xs: '1.4rem',
                        sm: '2.5rem',
                      },
                    }}
                    fontWeight="bold"
                    variant="h3"
                  >
                    <img
                      src="/images/icons/arrows/arrow_contact_light.png"
                      alt="Behance"
                      style={{
                        width: '0.72em',
                        height: '0.72em',
                        marginRight: '0.3em',
                        mixBlendMode: 'darken',
                      }}
                    />
                    Behance
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
