import { memo } from 'react';

import { Alert, Snackbar } from '@mui/material';

/** The page-level message of a tab. `snackbar` and `onClose` come from `useGovernanceSnackbar`. */
const GovernanceSnackbar = memo(props => {
  const { snackbar, onClose, testId } = props;

  const styles = governanceSnackbarStyles();

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={snackbar.severity}
        variant="filled"
        sx={styles.alert}
        data-testid={testId}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
});

GovernanceSnackbar.displayName = 'GovernanceSnackbar';

/** @type {MuiSx} */
const governanceSnackbarStyles = () => ({
  alert: {
    width: '100%',
  },
});

export default GovernanceSnackbar;
