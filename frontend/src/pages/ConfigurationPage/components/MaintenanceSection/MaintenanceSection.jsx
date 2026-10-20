import { memo, useCallback, useEffect, useState } from 'react';

import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Snackbar,
  Switch,
  Typography,
} from '@mui/material';

import { useMaintenanceQuery, useMaintenanceSaveMutation } from '@/api/configuration.api';

import MaintenanceMessageEditor from './components/MaintenanceMessageEditor';
import SplashTemplateEditor from './components/SplashTemplateEditor';
import { applyMaintenanceMessage } from './helpers/maintenanceMessage.helpers';

const MaintenanceSection = memo(() => {
  const styles = maintenanceSectionStyles();

  const { data, isLoading } = useMaintenanceQuery();
  const [saveMaintenance, { isLoading: saving }] = useMaintenanceSaveMutation();

  const serverTemplate = data?.splash_template || '';

  const [enabled, setEnabled] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [messageDirty, setMessageDirty] = useState(false);
  const [templateDirty, setTemplateDirty] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled);
    }
  }, [data]);

  const handleToggle = useCallback(
    async e => {
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
    },
    [saveMaintenance],
  );

  const saveTemplate = useCallback(
    async (template, successMessage) => {
      try {
        await saveMaintenance({ splash_template: template }).unwrap();
        setSnackbar({ open: true, message: successMessage, severity: 'success' });
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Save failed: ${err?.data?.error || err?.message || 'Unknown error'}`,
          severity: 'error',
        });
      }
    },
    [saveMaintenance],
  );

  const handleSaveMessage = useCallback(
    (markdown, successMessage) => {
      const template = applyMaintenanceMessage(serverTemplate, markdown);
      if (template === null) {
        setSnackbar({
          open: true,
          message: 'Save failed: the message panel was not found in the splash template.',
          severity: 'error',
        });
        return;
      }
      saveTemplate(template, successMessage);
    },
    [saveTemplate, serverTemplate],
  );

  const handleAdvancedModeChange = useCallback(e => {
    setAdvancedMode(e.target.checked);
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
      <Typography
        variant="body2"
        sx={styles.description}
      >
        Enable maintenance mode to show a splash screen to all non-admin users. Administrators will bypass the
        splash and can continue using the platform normally.
      </Typography>

      {/* Toggle */}
      <Box sx={styles.toggleCard}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Typography
              variant="body2"
              sx={styles.toggleTitle}
            >
              Maintenance Mode
            </Typography>
            <Typography
              variant="caption"
              sx={styles.toggleHint}
            >
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
            <WarningAmberIcon sx={styles.warningIcon} />
            <Typography variant="caption">
              Maintenance mode is active. Non-admin users cannot access the platform.
            </Typography>
          </Box>
        )}
      </Box>

      <MaintenanceMessageEditor
        serverTemplate={serverTemplate}
        saving={saving}
        saveBlocked={templateDirty}
        onSave={handleSaveMessage}
        onDirtyChange={setMessageDirty}
      />

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={advancedMode}
            onChange={handleAdvancedModeChange}
          />
        }
        label="Advanced mode"
        sx={styles.advancedToggle}
      />

      {advancedMode && (
        <SplashTemplateEditor
          serverTemplate={serverTemplate}
          saving={saving}
          saveBlocked={messageDirty}
          onSave={saveTemplate}
          onDirtyChange={setTemplateDirty}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

MaintenanceSection.displayName = 'MaintenanceSection';

/** @type {MuiSx} */
const maintenanceSectionStyles = () => ({
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
    border: `0.0625rem solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  toggleRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    backgroundColor: palette.background.tabPanel,
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
    backgroundColor: `${palette.warning.main}15`,
    color: palette.warning.main,
    borderTop: `0.0625rem solid ${palette.border.table}`,
  }),
  warningIcon: {
    fontSize: '1rem',
  },
  advancedToggle: {
    alignSelf: 'flex-start',
    marginTop: '-0.5rem',
    marginBottom: '-0.5rem',
    '& .MuiFormControlLabel-label': {
      fontSize: '0.8125rem',
    },
  },
});

export default MaintenanceSection;
