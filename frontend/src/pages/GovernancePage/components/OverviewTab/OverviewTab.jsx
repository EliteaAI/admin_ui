import { memo, useCallback, useMemo, useState } from 'react';

import LockOutlined from '@mui/icons-material/LockOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  useGovernanceSettingsGetQuery,
  useGovernanceSettingsHistoryListQuery,
  useGovernanceSettingsUpdateMutation,
} from '@/api/governance.api';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import SecurityEventsDrawer from '@/pages/GovernancePage/components/SecurityEventsDrawer';
import { formatDateTime, toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';

import ModeSelector from './components/ModeSelector';
import PreflightPanel from './components/PreflightPanel';
import SettingRow from './components/SettingRow';
import SettingsHistoryDrawer from './components/SettingsHistoryDrawer';
import SwitchModeDialog from './components/SwitchModeDialog';
import {
  MAX_CHANGE_NOTE,
  MAX_ENVIRONMENT,
  MAX_POLICY_REVISION,
  READ_ERROR_TEXT,
} from './constants/governanceSettings.constants';
import {
  buildUpdateBody,
  fillPlaceholders,
  getSaveBlock,
  isEnvironmentLocked,
  isMigrationRequired,
  mergeDescriptions,
  modeLabel,
} from './helpers/governanceSettings.helpers';
import { useGovernanceDraft } from './hooks/useGovernanceDraft.hooks';

// Stable filter for the audit view: the runs that audit-only let through but enforce would have refused
const WOULD_DENY_FILTERS = { would_deny: true };

const OverviewTab = memo(() => {
  const styles = overviewTabStyles();

  const { hasPermission } = useCheckPermission();
  const canView = hasPermission(PERMISSIONS.governance.settings.view);
  const canManage = hasPermission(PERMISSIONS.governance.settings.manage);

  const {
    data,
    isLoading,
    isFetching,
    error: loadError,
    refetch,
  } = useGovernanceSettingsGetQuery(undefined, { skip: !canView, refetchOnMountOrArgChange: true });
  const { data: latestChange } = useGovernanceSettingsHistoryListQuery(
    { limit: 1, offset: 0 },
    { skip: !canView, refetchOnMountOrArgChange: true },
  );
  const [updateSettings] = useGovernanceSettingsUpdateMutation();

  const { draft, isDirty, setField, reset } = useGovernanceDraft(data);

  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const descriptions = useMemo(() => mergeDescriptions(data?.descriptions), [data?.descriptions]);

  const migrationRequired = isMigrationRequired(data) || saveError?.code === 'MIGRATION_REQUIRED';
  const environmentLocked = isEnvironmentLocked(data);
  const storedMode = data?.stored?.mode ?? 'off';
  const ceilingMode = data?.ceiling?.max_mode ?? 'enforce';
  const readOnly = !canManage;

  const saveBlock = useMemo(
    () => (data && draft ? getSaveBlock({ draft, isDirty, data, descriptions, migrationRequired }) : null),
    [data, draft, isDirty, descriptions, migrationRequired],
  );

  const handleModeChange = useCallback(value => setField('mode', value), [setField]);
  const handlePolicyRevisionChange = useCallback(
    event => setField('policy_revision', event.target.value),
    [setField],
  );
  const handleEnvironmentChange = useCallback(
    event => setField('environment', event.target.value),
    [setField],
  );
  const handleNoteChange = useCallback(event => setField('change_note', event.target.value), [setField]);
  const handleLegacyChange = useCallback(
    event => setField('admit_legacy_pat', event.target.checked),
    [setField],
  );
  const handleRuntimeChange = useCallback(
    event => setField('allow_runtime_domain_binding', event.target.checked),
    [setField],
  );

  // Throws the request error, so the confirmation dialog can show it
  const submit = useCallback(async () => {
    await updateSettings(buildUpdateBody(draft, data)).unwrap();
    setField('change_note', '');
    setConfirmOpen(false);
    setSnackbar({ open: true, message: 'Governance settings saved.' });
  }, [updateSettings, draft, data, setField]);

  const handleSave = useCallback(async () => {
    setSaveError(null);
    if (draft.mode !== storedMode) {
      setConfirmOpen(true);
      return;
    }
    setIsSaving(true);
    try {
      await submit();
    } catch (err) {
      setSaveError(toGovernanceError(err, 'Failed to save governance settings.'));
    } finally {
      setIsSaving(false);
    }
  }, [draft, storedMode, submit]);

  const handleCancel = useCallback(() => {
    setSaveError(null);
    reset();
  }, [reset]);

  const handleConfirmClose = useCallback(() => setConfirmOpen(false), []);
  const handleHistoryOpen = useCallback(() => setHistoryOpen(true), []);
  const handleHistoryClose = useCallback(() => setHistoryOpen(false), []);
  const handleEventsOpen = useCallback(() => setEventsOpen(true), []);
  const handleEventsClose = useCallback(() => setEventsOpen(false), []);
  const handleSnackbarClose = useCallback(() => setSnackbar(prev => ({ ...prev, open: false })), []);

  if (!canView) {
    return (
      <Box sx={styles.root}>
        <Alert
          severity="info"
          data-testid="governance-no-access"
        >
          You do not have permission to view the governance settings.
        </Alert>
      </Box>
    );
  }

  if (isLoading || (!data && !loadError)) {
    return (
      <Box sx={styles.root}>
        <LinearProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={styles.root}>
        <GovernanceErrorAlert
          error={toGovernanceError(loadError, 'Failed to load the governance settings.')}
        />
        <Box>
          <Button
            size="small"
            onClick={refetch}
          >
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  const { effective, stored, locks } = data;
  const lastChange = latestChange?.rows?.find(row => row.revision === stored?.revision);

  return (
    <Box
      sx={styles.root}
      data-testid="governance-overview"
    >
      {effective.capped && (
        <Alert
          severity="warning"
          data-testid="governance-capped-banner"
        >
          {fillPlaceholders(descriptions.locks.capped, {
            max: modeLabel(descriptions, ceilingMode),
            stored: modeLabel(descriptions, storedMode),
          })}
        </Alert>
      )}
      {effective.unavailable && (
        <Alert
          severity="error"
          data-testid="governance-unavailable-banner"
        >
          {descriptions.preflight.unavailable}
        </Alert>
      )}
      {migrationRequired && (
        <Alert
          severity="warning"
          data-testid="governance-table-missing"
        >
          {descriptions.preflight.table_missing}
        </Alert>
      )}
      {data.read === 'error' && (
        <Alert
          severity="warning"
          data-testid="governance-read-error"
        >
          {READ_ERROR_TEXT}
        </Alert>
      )}

      <PreflightPanel
        preflight={data.preflight}
        descriptions={descriptions}
        onRecheck={refetch}
        isRechecking={isFetching}
      />

      <Box sx={styles.card}>
        <SettingRow
          label="Mode"
          stacked
        >
          <ModeSelector
            value={draft.mode}
            onChange={handleModeChange}
            disabled={readOnly}
            ceilingMode={ceilingMode}
            descriptions={descriptions}
          />
        </SettingRow>
        {effective.mode !== draft.mode && (
          <Typography
            variant="bodySmall"
            sx={styles.muted}
            data-testid="governance-effective-mode"
          >
            In effect now: {modeLabel(descriptions, effective.mode)}
          </Typography>
        )}

        <SettingRow
          label={descriptions.fields.policy_revision.label}
          tooltip={descriptions.fields.policy_revision.tooltip}
        >
          <TextField
            size="small"
            value={draft.policy_revision}
            onChange={handlePolicyRevisionChange}
            disabled={readOnly}
            fullWidth
            slotProps={{
              htmlInput: { maxLength: MAX_POLICY_REVISION, 'data-testid': 'governance-policy-revision' },
            }}
          />
        </SettingRow>

        <SettingRow
          label={descriptions.fields.environment.label}
          tooltip={descriptions.fields.environment.tooltip}
        >
          <TextField
            size="small"
            value={draft.environment}
            onChange={handleEnvironmentChange}
            disabled={readOnly || environmentLocked}
            sx={styles.environmentField}
            slotProps={{
              htmlInput: { maxLength: MAX_ENVIRONMENT, 'data-testid': 'governance-environment' },
            }}
          />
          {environmentLocked && (
            <Tooltip
              title={descriptions.locks.environment}
              placement="top"
            >
              <Chip
                icon={<LockOutlined />}
                label={locks.environment.env_var}
                size="small"
                variant="outlined"
                data-testid="governance-environment-lock"
              />
            </Tooltip>
          )}
        </SettingRow>

        <SettingRow
          label={descriptions.fields.admit_legacy_pat.label}
          tooltip={descriptions.fields.admit_legacy_pat.tooltip}
        >
          <Switch
            checked={draft.admit_legacy_pat}
            onChange={handleLegacyChange}
            disabled={readOnly}
            slotProps={{
              input: {
                'aria-label': descriptions.fields.admit_legacy_pat.label,
                'data-testid': 'governance-flag-admit_legacy_pat',
              },
            }}
          />
        </SettingRow>

        <SettingRow
          label={descriptions.fields.allow_runtime_domain_binding.label}
          tooltip={descriptions.fields.allow_runtime_domain_binding.tooltip}
        >
          <Switch
            checked={draft.allow_runtime_domain_binding}
            onChange={handleRuntimeChange}
            disabled={readOnly}
            slotProps={{
              input: {
                'aria-label': descriptions.fields.allow_runtime_domain_binding.label,
                'data-testid': 'governance-flag-allow_runtime_domain_binding',
              },
            }}
          />
        </SettingRow>

        {canManage && (
          <SettingRow label={descriptions.fields.change_note.label}>
            <TextField
              size="small"
              value={draft.change_note}
              onChange={handleNoteChange}
              placeholder={descriptions.fields.change_note.placeholder}
              fullWidth
              helperText={`${draft.change_note.length}/${MAX_CHANGE_NOTE}`}
              slotProps={{
                htmlInput: { maxLength: MAX_CHANGE_NOTE, 'data-testid': 'governance-change-note' },
              }}
            />
          </SettingRow>
        )}

        <GovernanceErrorAlert error={saveError} />

        <Box sx={styles.footer}>
          <Typography
            variant="bodySmall"
            sx={styles.muted}
            data-testid="governance-last-change"
          >
            {stored
              ? `Last change: revision ${stored.revision} by ${lastChange?.changed_by?.email ?? `user ${stored.updated_by}`}, ${formatDateTime(stored.updated_at)}`
              : 'No change has been saved yet.'}
          </Typography>
          <Box sx={styles.actions}>
            <Button
              size="small"
              onClick={handleHistoryOpen}
              data-testid="governance-history-button"
            >
              History
            </Button>
            <Button
              size="small"
              onClick={handleEventsOpen}
              data-testid="governance-events-button"
            >
              Would-deny events
            </Button>
            {canManage && (
              <>
                <Button
                  size="small"
                  onClick={handleCancel}
                  disabled={!isDirty && !draft.change_note}
                  data-testid="governance-cancel"
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSave}
                  disabled={Boolean(saveBlock) || isSaving}
                  data-testid="governance-save"
                >
                  Save
                </Button>
              </>
            )}
          </Box>
        </Box>
        {saveBlock?.message && (
          <Typography
            variant="bodySmall"
            sx={styles.reason}
            data-testid="governance-save-reason"
          >
            {saveBlock.message}
          </Typography>
        )}
        {readOnly && (
          <Typography
            variant="bodySmall"
            sx={styles.muted}
            data-testid="governance-readonly-note"
          >
            These settings are read-only for you. Changing them needs the governance.settings.manage
            permission.
          </Typography>
        )}
      </Box>

      <SwitchModeDialog
        open={confirmOpen}
        targetMode={draft.mode}
        descriptions={descriptions}
        changeNote={draft.change_note}
        onClose={handleConfirmClose}
        onConfirm={submit}
      />
      <SettingsHistoryDrawer
        open={historyOpen}
        onClose={handleHistoryClose}
        descriptions={descriptions}
      />
      <SecurityEventsDrawer
        open={eventsOpen}
        onClose={handleEventsClose}
        title="Would-deny events"
        subtitle="Runs that audit-only let through but enforce would have refused"
        filters={WOULD_DENY_FILTERS}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          variant="filled"
          sx={styles.snackbarAlert}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

OverviewTab.displayName = 'OverviewTab';

/** @type {MuiSx} */
const overviewTabStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '64rem',
    boxSizing: 'border-box',
  },
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.table}`,
  }),
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  environmentField: {
    flex: '1 1 14rem',
  },
  reason: ({ palette }) => ({
    color: palette.text.warningText,
    textAlign: 'right',
  }),
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  snackbarAlert: {
    width: '100%',
  },
});

export default OverviewTab;
