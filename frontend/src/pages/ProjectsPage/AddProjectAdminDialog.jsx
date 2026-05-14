import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {
  useProjectAddAdminMutation,
  useProjectUpdateUserRoleMutation,
  useProjectUserListQuery,
} from '@/api/projectsApi';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

function AddProjectAdminDialog({ open, onClose, project }) {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [addAdmin, { isLoading: isAdding }] = useProjectAddAdminMutation();
  const [updateRole, { isLoading: isUpdating }] = useProjectUpdateUserRoleMutation();

  const { data: projectUsers } = useProjectUserListQuery(
    { projectId: project?.id },
    { skip: !open || !project?.id },
  );

  const isLoading = isAdding || isUpdating;

  const existingUser = useMemo(() => {
    if (!email.trim() || !projectUsers) return null;
    const normalizedEmail = email.trim().toLowerCase();
    return projectUsers.rows?.find((u) => u.email?.toLowerCase() === normalizedEmail) ?? null;
  }, [email, projectUsers]);

  const isExistingUser = Boolean(existingUser);

  const handleSubmit = useCallback(async () => {
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    try {
      if (isExistingUser) {
        await updateRole({
          projectId: project?.id,
          userId: existingUser.id,
          roles: [selectedRole],
        }).unwrap();
        setSuccess(`Role updated to "${selectedRole}" successfully.`);
      } else {
        const result = await addAdmin({
          projectId: project?.id,
          email: email.trim(),
          roles: [selectedRole],
        }).unwrap();
        const entry = Array.isArray(result) ? result[0] : result;
        if (entry?.status === 'error') {
          setError(entry.msg || 'Failed to add user.');
          return;
        }
        setSuccess(`User added with "${selectedRole}" role successfully.`);
      }
      setEmail('');
      setSelectedRole('admin');
    } catch (err) {
      setError(
        err?.data?.error ??
          err?.error ??
          (isExistingUser ? 'Failed to update role.' : 'Failed to add user.'),
      );
    }
  }, [email, selectedRole, isExistingUser, existingUser, addAdmin, updateRole, project]);

  const handleClose = useCallback(() => {
    setEmail('');
    setSelectedRole('admin');
    setError('');
    setSuccess('');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Project User</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Add or update a user role in project <strong>{project?.name}</strong>
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
          helperText={
            isExistingUser
              ? 'User already exists in this project — role will be updated.'
              : ''
          }
        />
        <FormControl fullWidth margin="dense" disabled={isLoading}>
          <InputLabel>Role</InputLabel>
          <Select
            value={selectedRole}
            label="Role"
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {ROLES.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                {role.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || !email.trim()}
        >
          {isLoading
            ? isExistingUser
              ? 'Updating...'
              : 'Adding...'
            : isExistingUser
              ? 'Update Role'
              : 'Add User'}
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
