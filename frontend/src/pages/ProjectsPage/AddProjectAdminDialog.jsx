import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useProjectAddAdminMutation } from '@/api/projectsApi';

function AddProjectAdminDialog({ open, onClose, project }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addAdmin, { isLoading }] = useProjectAddAdminMutation();

  const handleSubmit = useCallback(async () => {
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    try {
      const result = await addAdmin({
        projectId: project?.id,
        email: email.trim(),
      }).unwrap();
      const entry = Array.isArray(result) ? result[0] : result;
      if (entry?.status === 'error') {
        setError(entry.msg || 'Failed to add admin.');
        return;
      }
      setSuccess(`Admin added successfully.`);
      setEmail('');
    } catch (err) {
      setError(err?.data?.error ?? err?.error ?? 'Failed to add admin.');
    }
  }, [email, addAdmin, project]);

  const handleClose = useCallback(() => {
    setEmail('');
    setError('');
    setSuccess('');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Project Admin</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Add an admin to project <strong>{project?.name}</strong>
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          label="User Email"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          placeholder="user@example.com"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isLoading || !email.trim()}>
          {isLoading ? 'Adding...' : 'Add Admin'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AddProjectAdminDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
};

export default AddProjectAdminDialog;
