import { memo, useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

import { useSecretUpdateMutation } from '@/api/secrets.api';

const EditSecretDialog = memo(props => {
  const { open, onClose, secretName } = props;

  const styles = editSecretDialogStyles();

  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [updateSecret, { isLoading }] = useSecretUpdateMutation();

  useEffect(() => {
    if (open) {
      setValue('');
      setError('');
    }
  }, [open]);

  const handleSave = useCallback(async () => {
    setError('');
    if (!value) {
      setError('Secret value is required.');
      return;
    }
    try {
      await updateSecret({ name: secretName, value }).unwrap();
      setValue('');
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.data?.message ?? err?.error ?? 'Failed to update secret.');
    }
  }, [secretName, value, updateSecret, onClose]);

  const handleClose = useCallback(() => {
    setValue('');
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Edit Secret</DialogTitle>
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
          margin="dense"
          label="Secret Name"
          fullWidth
          value={secretName || ''}
          disabled
        />
        <TextField
          autoFocus
          margin="dense"
          label="New Value"
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          value={value}
          onChange={e => setValue(e.target.value)}
          disabled={isLoading}
          placeholder="Enter new value"
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
          onClick={handleSave}
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

EditSecretDialog.displayName = 'EditSecretDialog';

EditSecretDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  secretName: PropTypes.string,
};

/** @type {MuiSx} */
const editSecretDialogStyles = () => ({
  gapBelow: {
    marginBottom: '1rem',
  },
  dialogActions: {
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    paddingBottom: '1rem',
  },
});

export default EditSecretDialog;
