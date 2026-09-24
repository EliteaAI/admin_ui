import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const NotFound = memo(() => {
  const styles = notFoundStyles();

  return (
    <Box sx={styles.root}>
      <Typography
        variant="headingLarge"
        color="text.secondary"
      >
        404 — Page not found
      </Typography>
    </Box>
  );
});

NotFound.displayName = 'NotFound';

/** @type {MuiSx} */
const notFoundStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
});

export default NotFound;
