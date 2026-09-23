import { memo } from 'react';

import Box from '@mui/material/Box';

const DrawerPage = memo(({ sx, children }) => {
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

DrawerPage.displayName = 'DrawerPage';

export default DrawerPage;
