import { memo } from 'react';

import Box from '@mui/material/Box';

const DrawerPage = memo(function DrawerPage({ sx, children }) {
  return (
    <Box
      sx={[
        ({ palette }) => ({
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          background: palette.background.default,
          overflow: 'scroll',
        }),
        sx,
      ]}
    >
      {children}
    </Box>
  );
});

export default DrawerPage;
