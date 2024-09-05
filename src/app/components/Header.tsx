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
import Link from 'next/link';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathname = usePathname();
  const [isHome, setIsHome] = useState<boolean>(true);

  useEffect(() => {
    if (pathname === '/') {
      setIsHome(true);
    } else {
      setIsHome(false);
    }
  }, [pathname]);

  useEffect(() => {
    // Set the mounted state to true after the component has been mounted
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
      <List
        sx={{
          pl: '0.5rem',
        }}
      >
        <ListItem
          component={Button}
          sx={{ border: 'none !important', justifyContent: 'flex-end' }}
          onClick={toggleDrawer(false)}
        >
          <CloseIcon
            sx={{
              color: 'black',
              pt: '0.8rem',
              fontSize: '2.5rem',

              justifyContent: 'flex-end',
            }}
          />
          {/* <ListItemText
            sx={{
              color: 'black',
              textAlign: 'right',
              pr: '0.5rem',
              border: 'none !important',
            }}
            primary="X"
          /> */}
        </ListItem>
        <Box
          sx={{
            height: '3.8rem',
          }}
        ></Box>
        <ListItem component={Link} href="/">
          <ListItemText
            primary={
              <Typography
                variant="h3"
                fontWeight="bold"
                fontFamily="Helvetica Neue"
                fontSize={{
                  xs: '36px',
                  sm: '50px',
                  md: '82px',
                  lg: '82px',
                  xl: '82px',
                }}
                pt={{
                  xs: '0.5rem',
                  sm: '3rem',
                }}
                letterSpacing="-0.04em"
                component="div"
                sx={{
                  flexGrow: 1,
                }}
              >
                Home
              </Typography>
            }
          />
        </ListItem>
        <Box
          sx={{
            height: '1rem',
          }}
        ></Box>
        <ListItem component={Link} href="/about-me">
          <ListItemText
            primary={
              <Typography
                variant="h3"
                fontWeight="bold"
                fontFamily="Helvetica Neue"
                fontSize={{
                  xs: '36px',
                  sm: '50px',
                  md: '82px',
                  lg: '82px',
                  xl: '82px',
                }}
                pt={{
                  xs: '0.5rem',
                  sm: '3rem',
                }}
                letterSpacing="-0.04em"
                component="div"
                sx={{ flexGrow: 1 }}
              >
                About <b>Me</b>
              </Typography>
            }
          />
        </ListItem>
        <Box
          sx={{
            height: '1rem',
          }}
        ></Box>
        <ListItem component={Link} href="/contact">
          <ListItemText
            primary={
              <Typography
                variant="h3"
                fontWeight="bold"
                fontFamily="Helvetica Neue"
                fontSize={{
                  xs: '36px',
                  sm: '50px',
                  md: '82px',
                  lg: '82px',
                  xl: '82px',
                }}
                pt={{
                  xs: '0.5rem',
                  sm: '3rem',
                }}
                letterSpacing="-0.04em"
                component="div"
                sx={{ flexGrow: 1 }}
              >
                Contact
              </Typography>
            }
          />
        </ListItem>
        <Box
          sx={{
            height: '1rem',
          }}
        ></Box>
      </List>
    </Box>
  );

  if (!isMounted) {
    return null;
  }

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
        <Toolbar variant="dense">
          <Typography
            variant="h3"
            fontWeight="bold"
            fontFamily="Helvetica Neue"
            pl="0.3rem"
            pt={{
              xs: '0.5rem',
              sm: '3rem',
            }}
            color="white"
            letterSpacing="-0.04em"
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: isHome
                ? {
                    xs: '36px',
                    sm: '50px',
                    md: '82px',
                    lg: '82px',
                    xl: '82px',
                  }
                : '20px !important',
              ...(!isHome && {
                pt: '0rem !important',
              }),
              transition: '0.5s',
            }}
          >
            <Link
              href="/"
              style={{
                width: '100%',
                textDecoration: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontWeight: '400',
                  overflow: 'hidden',
                  width: isHome ? '0rem' : '1.5rem',
                  transition: '0.5s',
                  transitionDelay: isHome ? '0.5s' : '0.5s',
                  fontSize: isHome ? '40px' : '20px',
                }}
                component="span"
              >
                ←{' '}
              </Box>
              SOFIA VACCARO
            </Link>
          </Typography>
          {isMobile ? (
            <>
              <IconButton
                edge="end"
                color="inherit"
                sx={{
                  mt: {
                    xs: '0.6rem',
                    sm: '0rem',
                  },
                  mr: {
                    xs: '-0.5rem',
                    sm: '0rem',
                  },
                }}
                aria-label="menu"
                onClick={toggleDrawer(true)}
              >
                <MenuIcon
                  sx={{
                    fontSize: '1.8rem',
                  }}
                />
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
              <Link href="/about-me">
                <Button
                  variant="text"
                  sx={{ textTransform: 'unset' }}
                  color="inherit"
                >
                  <span>
                    About <b>Me</b>
                  </span>
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="text"
                  sx={{ textTransform: 'unset' }}
                  color="inherit"
                >
                  <span>Contact</span>
                </Button>
              </Link>
              {/* <Link href="/book-a-visit">
              <Button variant="contained">Book a visit</Button>
            </Link> */}
            </Stack>
          )}
        </Toolbar>
      </motion.div>
    </AppBar>
  );
}
