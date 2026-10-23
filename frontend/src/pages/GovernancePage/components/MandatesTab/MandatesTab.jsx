import { memo } from 'react';

import { Box, Typography } from '@mui/material';

/**
 * Placeholder for the Mandates tab. A mandate lets a scheduled or webhook run act for a user who is not present. They
 * are managed through the admin task for now; this tab will list them when the operator screens for them ship.
 */
const MandatesTab = memo(() => {
  const styles = mandatesTabStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="governance-mandates"
    >
      <Typography variant="headingSmall">Mandates</Typography>
      <Typography
        variant="bodyMedium"
        sx={styles.text}
      >
        Mandates let scheduled and webhook runs act for a user without them being present. They are managed
        through the admin task manage_autonomous_mandate (System → Tasks) for now, and this tab will list them
        in a later release.
      </Typography>
    </Box>
  );
});

MandatesTab.displayName = 'MandatesTab';

/** @type {MuiSx} */
const mandatesTabStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '3rem 1.5rem',
    textAlign: 'center',
  },
  text: ({ palette }) => ({
    color: palette.text.metrics,
    maxWidth: '40rem',
  }),
});

export default MandatesTab;
