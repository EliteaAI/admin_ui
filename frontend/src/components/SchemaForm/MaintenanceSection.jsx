import { memo, useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';
import {
  useMaintenanceQuery,
  useMaintenanceSaveMutation,
} from '@/api/configurationApi';

function MaintenanceSection() {
  const { data, isLoading } = useMaintenanceQuery();
  const [saveMaintenance, { isLoading: saving }] = useMaintenanceSaveMutation();

  const [enabled, setEnabled] = useState(false);
  const [template, setTemplate] = useState('');
  const [templateDirty, setTemplateDirty] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled);
      setTemplate(data.splash_template || '');
      setTemplateDirty(false);
    }
  }, [data]);

  const handleToggle = useCallback(async (e) => {
    const newValue = e.target.checked;
    setEnabled(newValue);
    try {
      await saveMaintenance({ enabled: newValue }).unwrap();
      setSnackbar({
        open: true,
        message: newValue
          ? 'Maintenance mode enabled. Non-admin users will see the splash screen.'
          : 'Maintenance mode disabled. Platform is accessible to all users.',
        severity: newValue ? 'warning' : 'success',
      });
    } catch (err) {
      setEnabled(!newValue);
      setSnackbar({
        open: true,
        message: `Failed to toggle: ${err?.data?.error || err?.message || 'Unknown error'}`,
        severity: 'error',
      });
    }
  }, [saveMaintenance]);

  const handleTemplateChange = useCallback((val) => {
    setTemplate(val);
    setTemplateDirty(true);
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    try {
      await saveMaintenance({ splash_template: template }).unwrap();
      setTemplateDirty(false);
      setSnackbar({ open: true, message: 'Splash template saved.', severity: 'success' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Save failed: ${err?.data?.error || err?.message || 'Unknown error'}`,
        severity: 'error',
      });
    }
  }, [template, saveMaintenance]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  if (isLoading) {
    return (
      <Box sx={styles.loading}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      <Typography variant="body2" sx={styles.description}>
        Enable maintenance mode to show a splash screen to all non-admin users.
        Administrators will bypass the splash and can continue using the platform normally.
      </Typography>

      {/* Toggle */}
      <Box sx={styles.toggleCard}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Typography variant="body2" sx={styles.toggleTitle}>
              Maintenance Mode
            </Typography>
            <Typography variant="caption" sx={styles.toggleHint}>
              When enabled, all non-admin users see a 503 maintenance page.
            </Typography>
          </Box>
          <Switch
            checked={enabled}
            onChange={handleToggle}
            disabled={saving}
          />
        </Box>
        {enabled && (
          <Box sx={styles.warningBanner}>
            <WarningAmberIcon sx={{ fontSize: '1rem' }} />
            <Typography variant="caption">
              Maintenance mode is active. Non-admin users cannot access the platform.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Template Editor */}
      <Box sx={styles.editorCard}>
        <Box sx={styles.editorHeader}>
          <Typography variant="body2" sx={styles.editorTitle}>
            Splash Page Template
          </Typography>
          <Typography variant="caption" sx={styles.editorHint}>
            Custom HTML shown during maintenance. Leave empty to use the default template.
          </Typography>
        </Box>
        <Box sx={styles.editorWrapper}>
          <CodeMirror
            value={template}
            height="300px"
            extensions={[html(), EditorView.lineWrapping]}
            onChange={handleTemplateChange}
            theme="dark"
          />
        </Box>
        <Box sx={styles.editorFooter}>
          <Button
            size="small"
            variant="contained"
            onClick={handleSaveTemplate}
            disabled={!templateDirty || saving}
            sx={styles.saveButton}
          >
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    padding: '1.5rem',
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.8125rem',
    lineHeight: 1.6,
  }),
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  toggleCard: ({ palette }) => ({
    border: `1px solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  toggleRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    backgroundColor: palette.background.tabPanel || palette.background.userInputBackground,
  }),
  toggleLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  toggleTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  toggleHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
  }),
  warningBanner: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    backgroundColor: palette.warning?.main ? `${palette.warning.main}15` : 'rgba(255, 152, 0, 0.08)',
    color: palette.warning?.main || '#ff9800',
    borderTop: `1px solid ${palette.border.table}`,
  }),
  editorCard: ({ palette }) => ({
    border: `1px solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  editorHeader: ({ palette }) => ({
    padding: '1rem 1.25rem',
    backgroundColor: palette.background.tabPanel || palette.background.userInputBackground,
    borderBottom: `1px solid ${palette.border.table}`,
  }),
  editorTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  editorHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
  }),
  editorWrapper: {
    '& .cm-theme-dark': {
      display: 'flex',
      flexDirection: 'column',
    },
    '& .cm-editor': {
      fontSize: '0.75rem',
    },
    '& .cm-scroller': {
      overflow: 'auto',
    },
    '& .cm-gutters': {
      fontSize: '0.75rem',
    },
  },
  editorFooter: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '0.75rem 1.25rem',
    borderTop: `1px solid ${palette.border.table}`,
  }),
  saveButton: {
    textTransform: 'none',
    fontSize: '0.8125rem',
  },
};

export default memo(MaintenanceSection);
