import { memo, useCallback, useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

const RejectRequestDialog = memo(props => {
  const { open, onClose, onSubmit, request } = props;

  const styles = rejectRequestDialogStyles();

  const [comments, setComments] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    if (!comments.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    onSubmit(request?.id, comments.trim());
    setComments('');
    setError('');
  }, [comments, onSubmit, request]);

  const handleClose = useCallback(() => {
    setComments('');
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
      <DialogTitle>Reject Request</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Rejection reason"
          placeholder="Explain why the request is rejected and what is missing or needs to be corrected"
          multiline
          rows={4}
          fullWidth
          value={comments}
          onChange={e => {
            setComments(e.target.value);
            if (error) setError('');
          }}
          error={!!error}
          helperText={error}
          sx={styles.gapAbove}
        />
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button
          onClick={handleClose}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
        >
          Reject
        </Button>
      </DialogActions>
    </Dialog>
  );
});

RejectRequestDialog.displayName = 'RejectRequestDialog';

/** @type {MuiSx} */
const rejectRequestDialogStyles = () => ({
  gapAbove: {
    marginTop: '0.5rem',
  },
  dialogActions: {
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    paddingBottom: '1rem',
  },
});

export default RejectRequestDialog;
