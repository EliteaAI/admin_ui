import { memo } from 'react';

import { Alert, Box, Chip, Typography } from '@mui/material';

import { checkLabel } from '@/pages/GovernancePage/components/OverviewTab/helpers/governance.helpers';

/** A backend refusal `{ error, code }` as a readable message with the code chip beside it. */
const GovernanceErrorAlert = memo(props => {
  const { error, sx } = props;

  const styles = governanceErrorAlertStyles();

  if (!error) return null;

  return (
    <Alert
      severity="error"
      sx={[styles.root, sx]}
      data-testid="governance-error"
    >
      <Box sx={styles.row}>
        <Typography variant="bodyMedium">{error.message}</Typography>
        {error.code && (
          <Chip
            label={error.code}
            size="small"
            variant="outlined"
            data-testid="governance-error-code"
          />
        )}
      </Box>
      {error.failedChecks?.length > 0 && (
        <Typography variant="bodySmall">
          Failed checks: {error.failedChecks.map(checkLabel).join(', ')}
        </Typography>
      )}
    </Alert>
  );
});

GovernanceErrorAlert.displayName = 'GovernanceErrorAlert';

/** @type {MuiSx} */
const governanceErrorAlertStyles = () => ({
  root: {
    alignItems: 'center',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
});

export default GovernanceErrorAlert;
