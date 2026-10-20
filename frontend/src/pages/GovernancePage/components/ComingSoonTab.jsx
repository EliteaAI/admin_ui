import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const ComingSoonTab = memo(props => {
  const { label } = props;

  const styles = comingSoonTabStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="governance-coming-soon"
    >
      <Typography
        variant="bodyMedium"
        sx={styles.text}
      >
        {label} is coming in the next update.
      </Typography>
    </Box>
  );
});

ComingSoonTab.displayName = 'ComingSoonTab';

/** @type {MuiSx} */
const comingSoonTabStyles = () => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
  },
  text: ({ palette }) => ({
    color: palette.text.metrics,
  }),
});

export default ComingSoonTab;
