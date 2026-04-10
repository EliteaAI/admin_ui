import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

import { useUserDeleteMutation } from '@/api/usersApi';

function DeleteUserDialog({ open, onClose, userIds }) {
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete User{count > 1 ? 's' : ''}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="bodyMedium">
          Are you sure you want to delete {count} user{count > 1 ? 's' : ''}? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleDelete} variant="contained" color="error" disabled={isLoading}>
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DeleteUserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userIds: PropTypes.array.isRequired,
};

export default DeleteUserDialog;
