import { memo } from 'react';

import Box from '@mui/material/Box';

const GridTableBody = memo(function GridTableBody(props) {
  const { children, minHeight = '20rem', sx = {} } = props;

  return (
    <Box
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'auto',
          minHeight,
        },
        sx,
      ]}
    >
      {children}
    </Box>
  );
});

export default GridTableBody;
