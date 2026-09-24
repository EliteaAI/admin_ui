import { memo, useCallback, useState } from 'react';

import PropTypes from 'prop-types';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { useProjectDeleteMutation } from '@/api/projects.api';

const DeleteProjectDialog = memo(props => {
  const { open, onClose, projectIds } = props;

  const styles = deleteProjectDialogStyles();

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Delete Project{count > 1 ? 's' : ''}</DialogTitle>
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
          Are you sure you want to delete {count} project{count > 1 ? 's' : ''}? This action cannot be undone.
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

DeleteProjectDialog.displayName = 'DeleteProjectDialog';

DeleteProjectDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  projectIds: PropTypes.array.isRequired,
};

/** @type {MuiSx} */
const deleteProjectDialogStyles = () => ({
  gapBelow: {
    marginBottom: '1rem',
  },
  dialogActions: {
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    paddingBottom: '1rem',
  },
});

export default DeleteProjectDialog;
