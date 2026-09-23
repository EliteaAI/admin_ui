import { memo, useCallback, useEffect, useState } from 'react';

import { Alert, Button, Snackbar } from '@mui/material';

import { useRuntimePylonLogsMutation } from '@/api/configuration.api';
import { LogViewerDrawer } from '@/components/LogViewerDrawer';

const PylonLogsDrawer = memo(props => {
  const { open, pylonId, onClose } = props;

  const styles = pylonLogsDrawerStyles();

  const [logs, setLogs] = useState('');
  const [fetchLogs, { isLoading }] = useRuntimePylonLogsMutation();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Clear logs when drawer opens with a new pylon
  useEffect(() => {
    if (open) {
      setLogs('');
    }
  }, [open, pylonId]);

  const handleFetch = useCallback(async () => {
    try {
      const result = await fetchLogs({ pylonId }).unwrap();
      if (result.ok) {
        setLogs(result.logs || '');
      } else {
        setSnackbar({
          open: true,
          message: 'Error during logs retrieval',
          severity: 'error',
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error during logs retrieval',
        severity: 'error',
      });
      console.error(err);
    }
  }, [fetchLogs, pylonId]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <>
      <LogViewerDrawer
        open={open}
        onClose={onClose}
        title="Pylon Logs"
        subtitle={pylonId}
        logs={logs}
        loading={isLoading}
        placeholder='Click "Fetch" to load pylon logs.'
        downloadFilename={pylonId || 'pylon-logs'}
        footerExtra={
          <Button
            size="small"
            variant="contained"
            onClick={handleFetch}
            disabled={isLoading}
            sx={styles.actionButton}
          >
            {isLoading ? 'Fetching...' : 'Fetch'}
          </Button>
        }
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={styles.snackbarAlert}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
});

PylonLogsDrawer.displayName = 'PylonLogsDrawer';

/** @type {MuiSx} */
const pylonLogsDrawerStyles = () => ({
  snackbarAlert: {
    width: '100%',
  },
  actionButton: {
    textTransform: 'none',
    fontSize: '0.8125rem',
  },
});

export default PylonLogsDrawer;
