import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { useProjectCreateMutation } from '@/api/projectsApi';

function CreateProjectDialog({ open, onClose }) {
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
    const emails = inputValue.trim()
      ? [...adminEmails, inputValue.trim()]
      : adminEmails;
    try {
      await createProject({
        name: name.trim(),
        project_admin_email: emails.length === 1 ? emails[0] : emails.length > 1 ? emails : undefined,
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Project</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          label="Project Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                key={option}
                label={option}
                size="small"
                {...getTagProps({ index })}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              margin="dense"
              label="Admin Email(s)"
              type="email"
              placeholder={adminEmails.length === 0 ? 'user@example.com' : ''}
              helperText="Press Enter or Tab to add multiple emails"
            />
          )}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleCreate} variant="contained" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

CreateProjectDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CreateProjectDialog;
