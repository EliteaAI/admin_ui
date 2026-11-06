import { memo } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

const UnlinkGroupDialog = memo(props => {
  const { group, isLoading, onConfirm, onClose } = props;

  const styles = unlinkGroupDialogStyles();

  return (
    <Dialog
      open={Boolean(group)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Unlink group</DialogTitle>
      <DialogContent>
        <Typography variant="bodyMedium">
          {`Unlink "${group?.display_name}" from project "${group?.project_name}"? The members synced from the ` +
            'group are removed from the project; the project, its manual members and data stay. On the next sync ' +
            'the group is linked to the active project with its name (rename a project to the group name first ' +
            'to move it there), or a new project is created.'}
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
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={isLoading}
        >
          {isLoading ? 'Unlinking...' : 'Unlink'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

UnlinkGroupDialog.displayName = 'UnlinkGroupDialog';

/** @type {MuiSx} */
const unlinkGroupDialogStyles = () => ({
  dialogActions: {
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    paddingBottom: '1rem',
  },
});

export default UnlinkGroupDialog;
