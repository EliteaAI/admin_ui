import { memo, useCallback, useState } from 'react';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

/** Shows a newly issued SCIM token: it is not stored in clear and cannot be shown again */
const TokenIssuedDialog = memo(props => {
  const { token, baseUrl, onClose } = props;

  const styles = tokenIssuedDialogStyles();
  const [copied, setCopied] = useState('');

  const copy = useCallback(async (field, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const copyUrl = useCallback(() => copy('url', baseUrl), [copy, baseUrl]);
  const copyToken = useCallback(() => copy('token', token), [copy, token]);

  const handleClose = useCallback(() => {
    setCopied('');
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={Boolean(token)}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>SCIM token issued</DialogTitle>
      <DialogContent sx={styles.content}>
        <Alert severity="warning">
          Copy the token now and paste it as the Secret Token in the IdP. It is not shown again.
        </Alert>
        <TextField
          size="small"
          label="Tenant URL"
          value={baseUrl}
          slotProps={{ input: { readOnly: true } }}
        />
        <Button
          size="small"
          onClick={copyUrl}
          sx={styles.copyButton}
        >
          {copied === 'url' ? 'Copied' : 'Copy URL'}
        </Button>
        <TextField
          size="small"
          label="Secret token"
          value={token ?? ''}
          slotProps={{ input: { readOnly: true } }}
          inputProps={{ 'data-testid': 'scim-issued-token' }}
        />
        <Button
          size="small"
          onClick={copyToken}
          sx={styles.copyButton}
        >
          {copied === 'token' ? 'Copied' : 'Copy token'}
        </Button>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={handleClose}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
});

TokenIssuedDialog.displayName = 'TokenIssuedDialog';

/** @type {MuiSx} */
const tokenIssuedDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    paddingTop: '0.5rem',
  },
  copyButton: {
    alignSelf: 'flex-end',
    textTransform: 'none',
  },
});

export default TokenIssuedDialog;
