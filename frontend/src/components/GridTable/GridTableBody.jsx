import { memo } from 'react';

import { Box } from '@mui/material';

const GridTableBody = memo(props => {
  const { children, minHeight = '20rem', sx = {} } = props;

  const styles = gridTableBodyStyles(minHeight);

  return <Box sx={[styles.root, sx]}>{children}</Box>;
});

GridTableBody.displayName = 'GridTableBody';

/** @type {MuiSx} */
const gridTableBodyStyles = minHeight => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'auto',
    minHeight,
  },
});

export default GridTableBody;
