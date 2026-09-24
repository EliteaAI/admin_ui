import { memo } from 'react';

import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';

import { Box } from '@mui/material';

import Sidebar from './components/Sidebar';
import { COLLAPSED_DRAWER_WIDTH, DRAWER_WIDTH } from './constants/layout.constants';

const Layout = memo(() => {
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const currentWidth = sideBarCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  const styles = layoutStyles(currentWidth);

  return (
    <Box sx={styles.root}>
      <Sidebar />
      <Box
        component="main"
        sx={styles.main}
      >
        <Outlet />
      </Box>
    </Box>
  );
});

Layout.displayName = 'Layout';

/** @type {MuiSx} */
const layoutStyles = currentWidth => ({
  root: {
    display: 'flex',
    height: '100vh',
  },
  main: {
    flexGrow: 1,
    width: `calc(100% - ${currentWidth})`,
    transition: 'width 0.2s ease-in-out',
    height: '100vh',
    overflow: 'hidden',
  },
});

export default Layout;
