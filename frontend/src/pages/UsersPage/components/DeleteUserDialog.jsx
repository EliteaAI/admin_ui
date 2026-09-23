import { memo, useCallback, useState } from 'react';

import PropTypes from 'prop-types';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { useUserDeleteMutation } from '@/api/users.api';

const DeleteUserDialog = memo(props => {
  const { open, onClose, userIds } = props;

  const styles = deleteUserDialogStyles();

  const [error, setError] = useState('');
  const [deleteUsers, { isLoading }] = useUserDeleteMutation();

  const count = userIds?.length ?? 0;

  const handleDelete = useCallback(async () => {
    setError('');
    try {
      await deleteUsers({ userIds }).unwrap();
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.error ?? 'Failed to delete user(s).');
    }
  }, [userIds, deleteUsers, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Delete User{count > 1 ? 's' : ''}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert
            severity="error"
            sx={styles.gapBelow}
          >
            {error}
          </Alert>
        )}
        <Typography variant="bodyMedium">
          Are you sure you want to delete {count} user{count > 1 ? 's' : ''}? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button
          onClick={onClose}
          variant="text"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={isLoading}
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

DeleteUserDialog.displayName = 'DeleteUserDialog';

DeleteUserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userIds: PropTypes.array.isRequired,
};

/** @type {MuiSx} */
const deleteUserDialogStyles = () => ({
  gapBelow: {
    marginBottom: '1rem',
  },
  dialogActions: {
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    paddingBottom: '1rem',
  },
});

export default DeleteUserDialog;
