import { memo, useCallback, useState } from 'react';

import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';

import { useProjectCreateMutation } from '@/api/projects.api';

const CreateProjectDialog = memo(props => {
  const { open, onClose } = props;

  const styles = createProjectDialogStyles();

  const [name, setName] = useState('');
  const [adminEmails, setAdminEmails] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const [createProject, { isLoading }] = useProjectCreateMutation();

  const handleCreate = useCallback(async () => {
    setError('');

    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    const emails = inputValue.trim() ? [...adminEmails, inputValue.trim()] : adminEmails;

    const getProjectAdminEmail = () => {
      if (emails.length === 1) return emails[0];
      if (emails.length > 1) return emails;
      return undefined;
    };

    try {
      await createProject({
        name: name.trim(),
        project_admin_email: getProjectAdminEmail(),
      }).unwrap();

      setName('');
      setAdminEmails([]);
      setInputValue('');
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.error ?? 'Failed to create project.');
    }
  }, [name, adminEmails, inputValue, createProject, onClose]);

  const handleClose = useCallback(() => {
    setName('');
    setAdminEmails([]);
    setInputValue('');
    setError('');
    onClose();
  }, [onClose]);

  const handleEmailKeyDown = useCallback(
    event => {
      // Tab key: add email as chip if there's input value
      if (event.key === 'Tab' && inputValue.trim()) {
        event.preventDefault();
        setAdminEmails(prev => [...prev, inputValue.trim()]);
        setInputValue('');
        return;
      }

      // Arrow keys: disable chip navigation, only allow text caret movement
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.stopPropagation();
    },
    [inputValue],
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Create Project</DialogTitle>
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
        />
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={adminEmails}
          inputValue={inputValue}
          onInputChange={(_, value) => setInputValue(value)}
          onChange={(_, value) => setAdminEmails(value)}
          disabled={isLoading}
          renderValue={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                key={option}
                label={option}
                size="small"
                {...getTagProps({ index })}
              />
            ))
          }
          renderInput={params => (
            <TextField
              {...params}
              margin="dense"
              label="Admin Email(s)"
              type="email"
              placeholder={adminEmails.length === 0 ? 'user@example.com' : ''}
              helperText="Press Enter or Tab to add multiple emails"
              onKeyDown={handleEmailKeyDown}
            />
          )}
        />
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button
          onClick={handleClose}
          variant="text"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

CreateProjectDialog.displayName = 'CreateProjectDialog';

/** @type {MuiSx} */
const createProjectDialogStyles = () => ({
  gapBelow: {
    marginBottom: '1rem',
  },
  dialogActions: {
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    paddingBottom: '1rem',
  },
});

export default CreateProjectDialog;
