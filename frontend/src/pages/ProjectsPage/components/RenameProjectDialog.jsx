import { memo, useCallback, useEffect, useState } from 'react';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

import { useProjectRenameMutation } from '@/api/projects.api';

const RenameProjectDialog = memo(props => {
  const { open, onClose, project } = props;

  const styles = renameProjectDialogStyles();

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const [renameProject, { isLoading }] = useProjectRenameMutation();

  useEffect(() => {
    if (open) {
      setName(project?.name ?? '');
      setError('');
    }
  }, [open, project]);

  const handleRename = useCallback(async () => {
    setError('');
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    try {
      await renameProject({ projectId: project?.id, name: name.trim() }).unwrap();
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.data?.message ?? err?.error ?? 'Failed to rename project.');
    }
  }, [name, project, renameProject, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Rename Project</DialogTitle>
      <DialogContent>
        {error && (
          <Alert
            severity="error"
            sx={styles.gapBelow}
          >
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Project Name"
          fullWidth
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={isLoading}
          helperText="It renames project"
        />
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
          onClick={handleRename}
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Rename'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

RenameProjectDialog.displayName = 'RenameProjectDialog';

/** @type {MuiSx} */
const renameProjectDialogStyles = () => ({
  gapBelow: {
    marginBottom: '1rem',
  },
  dialogActions: {
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    paddingBottom: '1rem',
  },
});

export default RenameProjectDialog;
