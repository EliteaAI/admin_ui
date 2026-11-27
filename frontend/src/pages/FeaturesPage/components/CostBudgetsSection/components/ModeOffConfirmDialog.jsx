import { memo } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

const ModeOffConfirmDialog = memo(props => {
  const { open, onConfirm, onClose } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="mode-off-confirm-dialog"
    >
      <DialogTitle>Turn Cost Budgets off?</DialogTitle>
      <DialogContent>
        <Typography variant="bodyMedium">
          Agent & Pipeline Complexity is on. Complexity scores will stop updating while Cost Budgets Mode is
          off. Existing scores are kept.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          data-testid="mode-off-confirm-cancel"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          data-testid="mode-off-confirm-submit"
        >
          Turn off
        </Button>
      </DialogActions>
    </Dialog>
  );
});

ModeOffConfirmDialog.displayName = 'ModeOffConfirmDialog';

export default ModeOffConfirmDialog;
