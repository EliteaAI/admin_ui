import { memo, useCallback, useState } from 'react';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { useOAuthAppDeleteMutation } from '@/api/oauthApps.api';

const DeleteOAuthAppDialog = memo(props => {
  const { open, app, onClose, onDeleted } = props;

  const [error, setError] = useState('');
  const [deleteApp, { isLoading }] = useOAuthAppDeleteMutation();

  const handleClose = useCallback(() => {
    setError('');
    onClose();
  }, [onClose]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteApp({ id: app.id }).unwrap();
      setError('');
      onDeleted?.(app);
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.data?.message ?? err?.error ?? 'Failed to delete the app.');
    }
  }, [app, deleteApp, onClose, onDeleted]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Delete OAuth app</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography variant="bodyMedium">
          Delete &quot;{app?.name}&quot; and its client secret? Credentials that use it stop working and ask
          their owners to pick another app or switch to Custom app. To pause it instead, disable the app.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={handleDelete}
          disabled={isLoading}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
});

DeleteOAuthAppDialog.displayName = 'DeleteOAuthAppDialog';

export default DeleteOAuthAppDialog;
