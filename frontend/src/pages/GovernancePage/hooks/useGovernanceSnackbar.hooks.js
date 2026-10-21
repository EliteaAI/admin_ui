import { useCallback, useState } from 'react';

const CLOSED = { open: false, message: '', severity: 'success' };

// The message a page-level action leaves behind: green when it worked, amber when the view was out of date
export const useGovernanceSnackbar = () => {
  const [snackbar, setSnackbar] = useState(CLOSED);

  const showSuccess = useCallback(message => setSnackbar({ open: true, message, severity: 'success' }), []);
  const showWarning = useCallback(message => setSnackbar({ open: true, message, severity: 'warning' }), []);
  const close = useCallback(() => setSnackbar(prev => ({ ...prev, open: false })), []);

  return { snackbar, showSuccess, showWarning, close };
};
