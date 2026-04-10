import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

import { useProjectDeleteMutation } from '@/api/projectsApi';

function DeleteProjectDialog({ open, onClose, projectIds }) {
  const [error, setError] = useState('');
  const [deleteProject, { isLoading }] = useProjectDeleteMutation();

  const count = projectIds?.length ?? 0;

  const handleDelete = useCallback(async () => {
    setError('');
    try {
      for (const projectId of projectIds) {
        await deleteProject({ projectId }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.error ?? 'Failed to delete project(s).');
    }
  }, [projectIds, deleteProject, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Project{count > 1 ? 's' : ''}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="bodyMedium">
          Are you sure you want to delete {count} project{count > 1 ? 's' : ''}? This action cannot be undone.
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

DeleteProjectDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  projectIds: PropTypes.array.isRequired,
};

export default DeleteProjectDialog;
