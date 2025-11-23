'use client';
import React, { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import { Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import { MinimalMenuIcon } from './MinimalMenuIcon';
import { MinimalCloseIcon } from './MinimalCloseIcon';

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [worksDropdownOpen, setWorksDropdownOpen] = useState(false);
  const [worksDrawerExpanded, setWorksDrawerExpanded] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathname = usePathname();
  const [isHome, setIsHome] = useState<boolean>(true);

  useEffect(() => {
    setIsHome(pathname === '/');
  }, [pathname]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === 'keydown' &&
        ((event as React.KeyboardEvent).key === 'Tab' ||
          (event as React.KeyboardEvent).key === 'Shift')
      ) {
        return;
      }
      setDrawerOpen(open);
    };

  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const worksCategoriesItems = [
    { label: 'All', href: '/works' },
    { label: 'Caves', href: '/works?category=caves' },
    { label: 'Landscapes', href: '/works?category=landscapes' },
  ];

  const drawerList = () => (
    <Box
      sx={{ width: '100vw' }}
      role="presentation"
      onKeyDown={toggleDrawer(false)}
    >
      <List sx={{ pl: '0.5rem' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: '0.7rem',
            paddingRight: '0.8rem',
          }}
        >
          <IconButton aria-label="close menu" onClick={toggleDrawer(false)}>
            <MinimalCloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ height: '2.8rem' }} />

        {/* Home */}
        <ListItemButton
          component={NextLink}
          href="/"
          prefetch
          onClick={toggleDrawer(false)}
        >
          <ListItemText
            primary={
              <Typography
                variant="h3"
                fontWeight="500"
                fontFamily="Helvetica Neue"
                fontSize={{
                  xs: '36px',
                  sm: '50px',
                  md: '82px',
                  lg: '82px',
                  xl: '82px',
                }}
                pt={{ xs: '0.5rem', sm: '3rem' }}
                letterSpacing="-0.04em"
                component="div"
                sx={{ flexGrow: 1 }}
              >
                Home
              </Typography>
            }
          />
        </ListItemButton>

        <Box sx={{ height: '1rem' }} />

        {/* Works - EXPANDIBLE */}
        <ListItemButton
          onClick={(e) => {
            e.preventDefault();
            setWorksDrawerExpanded(!worksDrawerExpanded);
          }}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <ListItemText
            primary={
              <>
                <Typography
                  variant="h3"
                  fontWeight="500"
                  fontFamily="Helvetica Neue"
                  fontSize={{
                    xs: '36px',
                    sm: '50px',
                    md: '82px',
                    lg: '82px',
                    xl: '82px',
                  }}
                  pt={{ xs: '0.5rem', sm: '3rem' }}
                  letterSpacing="-0.04em"
                  component="div"
                  noWrap
                  sx={{
                    flexGrow: 0,
                    display: 'inline-flex',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Works
                </Typography>
              </>
            }
          />
        </ListItemButton>

        {/* Submenu expandible */}
        <AnimatePresence>
          {worksDrawerExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box
                sx={{ pl: '2rem', display: 'flex', flexDirection: 'column' }}
              >
                {worksCategoriesItems.map((item) => (
                  <ListItemButton
                    key={item.href}
                    component={NextLink}
                    href={item.href}
                    prefetch
                    onClick={() => {
                      setWorksDrawerExpanded(false);
                      setDrawerOpen(false);
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="h4"
                          fontWeight="400"
                          fontFamily="Helvetica Neue"
                          fontSize={{
                            xs: '24px',
                            sm: '32px',
                            md: '48px',
                            lg: '48px',
                            xl: '48px',
                          }}
                          letterSpacing="-0.04em"
                          component="div"
                          sx={{ opacity: 0.8 }}
                        >
                          {item.label}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <Box sx={{ height: '1rem' }} />

        {/* About Me */}
        <ListItemButton
          component={NextLink}
          href="/about-me"
          prefetch
          onClick={toggleDrawer(false)}
        >
          <ListItemText
            primary={
              <Typography
                variant="h3"
                fontWeight="500"
                fontFamily="Helvetica Neue"
                fontSize={{
                  xs: '36px',
                  sm: '50px',
                  md: '82px',
                  lg: '82px',
                  xl: '82px',
                }}
                pt={{ xs: '0.5rem', sm: '3rem' }}
                letterSpacing="-0.04em"
                component="div"
                noWrap
                sx={{
                  flexGrow: 0,
                  display: 'inline-flex',
                  whiteSpace: 'nowrap',
                }}
              >
                About&nbsp;Me
              </Typography>
            }
          />
        </ListItemButton>

        <Box sx={{ height: '1rem' }} />

        {/* Contact */}
        <ListItemButton
          component={NextLink}
          href="/contact"
          prefetch
          onClick={toggleDrawer(false)}
        >
          <ListItemText
            primary={
              <Typography
                variant="h3"
                fontWeight="500"
                fontFamily="Helvetica Neue"
                fontSize={{
                  xs: '36px',
                  sm: '50px',
                  md: '82px',
                  lg: '82px',
                  xl: '82px',
                }}
                pt={{ xs: '0.5rem', sm: '3rem' }}
                letterSpacing="-0.04em"
                component="div"
                sx={{ flexGrow: 1 }}
              >
                Contact
              </Typography>
            }
          />
        </ListItemButton>

        <Box sx={{ height: '1rem' }} />
      </List>
    </Box>
  );

  if (!isMounted) return null;

  return (
    <AppBar
      elevation={0}
      position="fixed"
      sx={{
        zIndex: 1,
        backgroundColor: 'transparent',
        color: 'white',
        mixBlendMode: 'difference',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <Toolbar
          sx={{
            height: isMobile ? '78px' : '101px',
          }}
          variant="dense"
        >
          <Typography
            variant="h3"
            fontWeight="bold"
            fontFamily="Helvetica Neue"
            pl="0.3rem"
            color="white"
            letterSpacing="-0.04em"
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: isHome
                ? { xs: '36px', sm: '50px', md: '82px', lg: '82px', xl: '82px' }
                : '20px !important',
              ...(!isHome && { pt: '0rem !important' }),
              transition: '0.5s',
            }}
          >
            {!isMobile && (
              <Box
                sx={{
                  width: '100%',
                  position: 'absolute',
                  height: '100%',
                  backdropFilter: 'blur(0.3px)',
                  pointerEvents: 'none',
                }}
              ></Box>
            )}

            <NextLink
              href="/"
              prefetch
              onClick={handleBrandClick}
              style={{
                width: '100%',
                textDecoration: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                component="span"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontWeight: '400',
                  overflow: 'hidden',
                  width: isHome ? '0rem' : '1.5rem',
                  transition: '0.5s',
                  transitionDelay: isHome ? '0.5s' : '0.5s',
                  fontSize: isHome ? '40px' : '20px',
                }}
              >
                ←{' '}
              </Box>
              Laura Butallo
            </NextLink>
          </Typography>

          {isMobile ? (
            <>
              <IconButton
                edge="end"
                color="inherit"
                sx={{
                  mt: { xs: '0.6rem', sm: '0rem' },
                  mr: { xs: '-0.3rem', sm: '0rem' },
                }}
                aria-label="menu"
                onClick={toggleDrawer(true)}
              >
                <MinimalMenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
              >
                {drawerList()}
              </Drawer>
            </>
          ) : (
            <Stack
              direction="row"
              gap={4}
              position="relative"
              sx={{
                alignItems: 'center',
              }}
            >
              <Button
                component={NextLink}
                href="/"
                prefetch
                variant="text"
                sx={{ textTransform: 'unset', justifyContent: 'right' }}
                color="inherit"
              >
                <img
                  style={{
                    transform: 'translate(11px, -0.2px)',
                    filter: 'invert(1)',
                    width: '1.9rem',
                  }}
                  src="/images/icons/home/cueva.png"
                  alt="Home"
                />
              </Button>

              <Box
                position="relative"
                onMouseEnter={() => setWorksDropdownOpen(true)}
                onMouseLeave={() => setWorksDropdownOpen(false)}
                sx={{
                  display: 'inline-block',
                }}
              >
                <Button
                  variant="text"
                  sx={{
                    textTransform: 'unset',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '6px 8px',
                  }}
                  color="inherit"
                >
                  Works
                  <span
                    style={{
                      transform: worksDropdownOpen
                        ? 'rotate(180deg)'
                        : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    ▼
                  </span>
                </Button>

                <AnimatePresence>
                  {worksDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '8px',
                        minWidth: '160px',
                        marginTop: '0.5rem',
                        zIndex: 1000,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        isolation: 'isolate',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          isolation: 'isolate',
                        }}
                      >
                        {worksCategoriesItems.map((item, index) => (
                          <Button
                            key={item.href}
                            component={NextLink}
                            href={item.href}
                            prefetch
                            variant="text"
                            color="inherit"
                            sx={{
                              textTransform: 'unset',
                              justifyContent: 'flex-start',
                              px: '1.5rem',
                              py: '0.75rem',
                              fontSize: '1rem',
                              transition: 'all 0.2s ease',
                              isolation: 'isolate',
                              mixBlendMode: 'normal',
                              borderBottom:
                                index < worksCategoriesItems.length - 1
                                  ? '1px solid rgba(255, 255, 255, 0.05)'
                                  : 'none',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              },
                            }}
                            onClick={() => setWorksDropdownOpen(false)}
                          >
                            {item.label}
                          </Button>
                        ))}
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>

              <Button
                component={NextLink}
                href="/works"
                prefetch
                variant="text"
                sx={{ textTransform: 'unset' }}
                color="inherit"
              >
                <span>Exhibiciones</span>
              </Button>
              <Button
                component={NextLink}
                href="/about-me"
                prefetch
                variant="text"
                sx={{ textTransform: 'unset' }}
                color="inherit"
              >
                <span>About&nbsp;Me</span>
              </Button>

              <Button
                component={NextLink}
                href="/contact"
                prefetch
                variant="text"
                sx={{ textTransform: 'unset' }}
                color="inherit"
              >
                <span>Contact</span>
              </Button>
            </Stack>
          )}
        </Toolbar>
      </motion.div>
    </AppBar>
  );
}
