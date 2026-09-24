import { memo } from 'react';

import { Box } from '@mui/material';

const DrawerPage = memo(props => {
  const { sx, children } = props;

  const styles = drawerPageStyles();

  return <Box sx={[styles.root, sx]}>{children}</Box>;
});

DrawerPage.displayName = 'DrawerPage';

/** @type {MuiSx} */
const drawerPageStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    background: palette.background.default,
    overflow: 'scroll',
  }),
});

export default DrawerPage;
