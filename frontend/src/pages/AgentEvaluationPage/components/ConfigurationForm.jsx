import { memo, useCallback, useMemo, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import { useEvalAutoSettingsUpdateMutation } from '@/api/evalAuto.api';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import {
  NUMBER_FIELDS,
  POLICY_OPTIONS,
  SCOPE_OPTIONS,
  changedSettings,
  parseProjectIds,
  toWindow,
} from '@/pages/AgentEvaluationPage/helpers/evalAuto.helpers';

const toForm = saved => ({
  ...saved,
  projectIdsText: (saved.project_ids ?? []).join(', '),
  windowStart: saved.window?.start ?? '',
  windowEnd: saved.window?.end ?? '',
});

// A cleared number field keeps the saved value instead of sending 0.
const toNumber = (value, fallback) =>
  value === '' || Number.isNaN(Number(value)) ? fallback : Number(value);

const toSettings = (form, saved) => ({
  project_scope_mode: form.project_scope_mode,
  project_ids: parseProjectIds(form.projectIdsText),
  include_personal_projects: form.include_personal_projects,
  dataset_policy: form.dataset_policy,
  ...Object.fromEntries(NUMBER_FIELDS.map(([key]) => [key, toNumber(form[key], saved[key])])),
  window: toWindow(form.windowStart, form.windowEnd),
});

const ConfigurationForm = memo(props => {
  const { saved } = props;

  const styles = configurationFormStyles();

  const { hasPermission } = useCheckPermission();
  const canEdit = hasPermission(PERMISSIONS.evalAuto.edit);

  const [form, setForm] = useState(() => toForm(saved));
  const [notice, setNotice] = useState(null);
  const [update, { isLoading: isSaving }] = useEvalAutoSettingsUpdateMutation();

  const changes = useMemo(() => changedSettings(saved, toSettings(form, saved)), [saved, form]);
  const isDirty = Object.keys(changes).length > 0;
  const halfWindow = Boolean(form.windowStart) !== Boolean(form.windowEnd);

  const setField = useCallback((key, value) => setForm(prev => ({ ...prev, [key]: value })), []);

  const handleSave = useCallback(async () => {
    try {
      // The server clamps out-of-range numbers, so the form shows what it actually stored.
      const effective = await update(changes).unwrap();
      setForm(toForm(effective));
      setNotice({ severity: 'success', message: 'Settings saved.' });
    } catch (err) {
      setNotice({ severity: 'error', message: err?.data?.error ?? 'Failed to save the settings.' });
    }
  }, [update, changes]);

  const handleReset = useCallback(() => {
    setForm(toForm(saved));
    setNotice(null);
  }, [saved]);

  return (
    <Box sx={styles.root}>
      <Alert severity="info">
        Turning the scheduled evaluation on or off, and its schedule, are set in Configuration → Runtime.
      </Alert>

      {!canEdit && (
        <Alert
          severity="warning"
          data-testid="eval-auto-read-only"
        >
          You can view these settings but not change them: that needs the evaluation edit permission.
        </Alert>
      )}

      <Typography variant="headingSmall">Scope</Typography>
      <Box sx={styles.row}>
        <FormControl
          size="small"
          sx={styles.select}
          disabled={!canEdit}
        >
          <InputLabel id="eval-auto-scope-label">Projects</InputLabel>
          <Select
            labelId="eval-auto-scope-label"
            label="Projects"
            value={form.project_scope_mode}
            onChange={event => setField('project_scope_mode', event.target.value)}
            SelectDisplayProps={{ 'data-testid': 'eval-auto-scope' }}
          >
            {SCOPE_OPTIONS.map(option => (
              <MenuItem
                key={option.value}
                value={option.value}
                data-testid={`eval-auto-scope-${option.value}`}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {form.project_scope_mode !== 'all' && (
          <TextField
            size="small"
            label="Project IDs"
            placeholder="1, 4, 12"
            value={form.projectIdsText}
            onChange={event => setField('projectIdsText', event.target.value)}
            disabled={!canEdit}
            sx={styles.grow}
            slotProps={{ htmlInput: { 'data-testid': 'eval-auto-project-ids' } }}
          />
        )}
      </Box>
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(form.include_personal_projects)}
            onChange={event => setField('include_personal_projects', event.target.checked)}
            disabled={!canEdit}
            slotProps={{ input: { 'data-testid': 'eval-auto-include-personal' } }}
          />
        }
        label="Include personal projects"
      />

      <Typography variant="headingSmall">Datasets</Typography>
      <FormControl
        size="small"
        sx={styles.wideSelect}
        disabled={!canEdit}
      >
        <InputLabel id="eval-auto-policy-label">Dataset policy</InputLabel>
        <Select
          labelId="eval-auto-policy-label"
          label="Dataset policy"
          value={form.dataset_policy}
          onChange={event => setField('dataset_policy', event.target.value)}
          SelectDisplayProps={{ 'data-testid': 'eval-auto-policy' }}
        >
          {POLICY_OPTIONS.map(option => (
            <MenuItem
              key={option.value}
              value={option.value}
              data-testid={`eval-auto-policy-${option.value}`}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="headingSmall">Limits and thresholds</Typography>
      <Box sx={styles.grid}>
        {NUMBER_FIELDS.map(([key, label, min, max, step]) => (
          <TextField
            key={key}
            size="small"
            type="number"
            label={label}
            value={form[key]}
            onChange={event => setField(key, event.target.value)}
            disabled={!canEdit}
            helperText={`${min}–${max}`}
            slotProps={{ htmlInput: { min, max, step, 'data-testid': `eval-auto-field-${key}` } }}
          />
        ))}
      </Box>

      <Typography variant="headingSmall">Launch window</Typography>
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        New agents start only inside this window (server time). Leave both empty to allow any time.
      </Typography>
      <Box sx={styles.row}>
        <TextField
          size="small"
          type="time"
          label="From"
          value={form.windowStart}
          onChange={event => setField('windowStart', event.target.value)}
          disabled={!canEdit}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { 'data-testid': 'eval-auto-window-start' } }}
        />
        <TextField
          size="small"
          type="time"
          label="To"
          value={form.windowEnd}
          onChange={event => setField('windowEnd', event.target.value)}
          disabled={!canEdit}
          error={halfWindow}
          helperText={halfWindow ? 'Set both ends, or neither' : ' '}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { 'data-testid': 'eval-auto-window-end' } }}
        />
      </Box>

      {notice && (
        <Alert
          severity={notice.severity}
          onClose={() => setNotice(null)}
          data-testid="eval-auto-settings-notice"
        >
          {notice.message}
        </Alert>
      )}

      {canEdit && (
        <Box sx={styles.actions}>
          <Button
            variant="text"
            disabled={!isDirty || isSaving}
            onClick={handleReset}
            data-testid="eval-auto-settings-reset"
          >
            Discard
          </Button>
          <Button
            variant="contained"
            disabled={!isDirty || isSaving || halfWindow}
            onClick={handleSave}
            data-testid="eval-auto-settings-save"
          >
            Save
          </Button>
        </Box>
      )}
    </Box>
  );
});

ConfigurationForm.displayName = 'ConfigurationForm';

/** @type {MuiSx} */
const configurationFormStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  select: {
    minWidth: '14rem',
  },
  wideSelect: {
    maxWidth: '28rem',
  },
  grow: {
    flex: 1,
    minWidth: '12rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
    gap: '1rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
});

export default ConfigurationForm;
