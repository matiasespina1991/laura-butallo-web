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
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import { MinimalMenuIcon } from './MinimalMenuIcon';
import { MinimalCloseIcon } from './MinimalCloseIcon';

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathname = usePathname();
  const [isHome, setIsHome] = useState<boolean>(true);

  useEffect(() => {
    setIsHome(pathname === '/');
  }, [pathname]);

  useEffect(() => {
    // Avoid hydration mismatch
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

  const drawerList = () => (
    <Box
      sx={{ width: '100vw' }}
      role="presentation"
      onClick={toggleDrawer(false)}
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
        <ListItemButton component={NextLink} href="/" prefetch>
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

        {/* About Me */}
        <ListItemButton component={NextLink} href="/obras" prefetch>
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
                {/* Usar &nbsp; elimina el corte entre palabras */}
                Obras
              </Typography>
            }
          />
        </ListItemButton>

        <Box sx={{ height: '1rem' }} />

        {/* About Me */}
        <ListItemButton component={NextLink} href="/about-me" prefetch>
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
                noWrap // <-- clave
                sx={{
                  flexGrow: 0, // <-- que no se estire
                  display: 'inline-flex',
                  whiteSpace: 'nowrap', // <-- y no permita cortes
                }}
              >
                {/* Usar &nbsp; elimina el corte entre palabras */}
                About&nbsp;Me
              </Typography>
            }
          />
        </ListItemButton>

        <Box sx={{ height: '1rem' }} />

        {/* Contact */}
        <ListItemButton component={NextLink} href="/contact" prefetch>
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
            <Box
              sx={{
                width: '100%',
                position: 'absolute',
                height: '100%',
                backdropFilter: 'blur(0.3px)',
                pointerEvents: 'none',
              }}
            ></Box>
            {/* Brand link */}
            <NextLink
              href="/"
              prefetch
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
            <Stack direction="row" gap={4}>
              {/* Do NOT wrap Button with <Link>. Use component={NextLink}. */}

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

              <Button
                component={NextLink}
                href="/works"
                prefetch
                variant="text"
                sx={{ textTransform: 'unset' }}
                color="inherit"
              >
                <span>
                  Obras&nbsp; <span>▼</span>
                </span>
              </Button>
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
