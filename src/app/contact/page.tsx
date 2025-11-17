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

  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);

  const fetchContactData = async () => {
    const data: ContactData | null = await getContactData();

    if (data) {
      setContactData(data);
    }
  };

  const runMigration = async () => {
    try {
      setMigrating(true);
      setMigrationResult(null);

      const res = await fetch(
        'https://migrateartworkstoassets-iqcs3ho3pa-uc.a.run.app',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Callable functions expect a "data" key in the JSON body
          body: JSON.stringify({ data: {} }),
        }
      );

      // Provide better error visibility
      const text = await res.text();
      if (!res.ok) {
        setMigrationResult(`HTTP ${res.status} ${res.statusText}\n${text}`);
        return;
      }

      // Try to parse JSON response if any
      try {
        const json = JSON.parse(text || '{}');
        setMigrationResult(JSON.stringify(json, null, 2));
      } catch {
        setMigrationResult(text || 'OK');
      }
    } catch (err: any) {
      setMigrationResult(`Error: ${String(err)}`);
    } finally {
      setMigrating(false);
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
              gap={1.5}
            >
              {/* Migration Button */}
              <Box height={30}></Box>

              <Button
                variant="contained"
                disabled={migrating}
                onClick={runMigration}
              >
                {migrating ? 'Running migration...' : 'Run migration'}
              </Button>

              {migrationResult && (
                <Typography
                  sx={{
                    fontSize: '1rem',
                    whiteSpace: 'pre-wrap',
                    marginTop: '1rem',
                  }}
                >
                  {migrationResult}
                </Typography>
              )}
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
                        sm: '2.8rem',
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
                        sm: '2.8rem',
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
                        sm: '2.8rem',
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
                        sm: '2.8rem',
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
