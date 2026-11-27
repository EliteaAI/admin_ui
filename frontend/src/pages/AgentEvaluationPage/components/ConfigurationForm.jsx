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
  HISTORY_NUMBER_FIELDS,
  HISTORY_STRATEGY_OPTIONS,
  HISTORY_VERSION_OPTIONS,
  MODE_OPTIONS,
  NUMBER_FIELDS,
  POLICY_OPTIONS,
  SCOPE_OPTIONS,
  changedSettings,
  parseProjectIds,
  readsHistory,
  toWindow,
} from '@/pages/AgentEvaluationPage/helpers/evalAuto.helpers';

import SettingSelect from './SettingSelect';

// Settings saved before history evaluation existed carry no mode; they run live.
const withDefaults = stored => ({ mode: 'live', ...stored });

const toForm = saved => ({
  ...saved,
  projectIdsText: (saved.project_ids ?? []).join(', '),
  windowStart: saved.window?.start ?? '',
  windowEnd: saved.window?.end ?? '',
});

// A cleared number field keeps the saved value instead of sending 0.
const toNumber = (value, fallback) =>
  value === '' || Number.isNaN(Number(value)) ? fallback : Number(value);

// The history fields are hidden in live mode, so an edit made there before switching back is not sent.
const toHistorySettings = (form, saved) =>
  readsHistory(form.mode)
    ? {
        history_version: form.history_version,
        history_strategy: form.history_strategy,
        ...Object.fromEntries(HISTORY_NUMBER_FIELDS.map(([key]) => [key, toNumber(form[key], saved[key])])),
      }
    : {};

const toSettings = (form, saved) => ({
  project_scope_mode: form.project_scope_mode,
  project_ids: parseProjectIds(form.projectIdsText),
  include_personal_projects: form.include_personal_projects,
  dataset_policy: form.dataset_policy,
  mode: form.mode,
  ...toHistorySettings(form, saved),
  ...Object.fromEntries(NUMBER_FIELDS.map(([key]) => [key, toNumber(form[key], saved[key])])),
  window: toWindow(form.windowStart, form.windowEnd),
});

// The server lowers min turns to max turns; say so before saving rather than after.
const historyHint = (key, form, saved, fallback) => {
  if (key !== 'history_min_turns') return fallback;
  const minTurns = toNumber(form.history_min_turns, saved.history_min_turns);
  const maxTurns = toNumber(form.history_max_turns, saved.history_max_turns);
  return minTurns > maxTurns ? `Will be saved as ${maxTurns}, the max turns per agent` : fallback;
};

const ConfigurationForm = memo(props => {
  const { saved: stored } = props;

  const styles = configurationFormStyles();

  const { hasPermission } = useCheckPermission();
  const canEdit = hasPermission(PERMISSIONS.evalAuto.edit);

  const saved = useMemo(() => withDefaults(stored), [stored]);
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
      setForm(toForm(withDefaults(effective)));
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
        Turning the scheduled evaluation on or off, and its schedule, are set in Features → Schedules → Agent
        Schedules.
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

      <Typography variant="headingSmall">Mode</Typography>
      <SettingSelect
        id="eval-auto-mode-label"
        label="Evaluation mode"
        value={form.mode}
        options={MODE_OPTIONS}
        onChange={value => setField('mode', value)}
        disabled={!canEdit}
        sx={styles.wideSelect}
        testId="eval-auto-mode"
      />
      {readsHistory(form.mode) && (
        <>
          <Alert
            severity="info"
            data-testid="eval-auto-history-consent-note"
          >
            Only projects whose admins turned on evaluation from chat history are scored from history. In
            history mode the others are Not Evaluated; in hybrid mode they run live. Chat text stays visible
            to the chat author and project admins only.
          </Alert>
          <Box sx={styles.row}>
            <SettingSelect
              id="eval-auto-history-version-label"
              label="Turns from"
              value={form.history_version}
              options={HISTORY_VERSION_OPTIONS}
              onChange={value => setField('history_version', value)}
              disabled={!canEdit}
              sx={styles.select}
              testId="eval-auto-history-version"
            />
            <SettingSelect
              id="eval-auto-history-strategy-label"
              label="Sampling"
              value={form.history_strategy}
              options={HISTORY_STRATEGY_OPTIONS}
              onChange={value => setField('history_strategy', value)}
              disabled={!canEdit}
              sx={styles.select}
              testId="eval-auto-history-strategy"
            />
          </Box>
          <Box sx={styles.grid}>
            {HISTORY_NUMBER_FIELDS.map(([key, label, min, max, step, hint]) => (
              <TextField
                key={key}
                size="small"
                type="number"
                label={label}
                value={form[key]}
                onChange={event => setField(key, event.target.value)}
                disabled={!canEdit}
                helperText={historyHint(key, form, saved, hint ?? `${min}–${max}`)}
                slotProps={{ htmlInput: { min, max, step, 'data-testid': `eval-auto-field-${key}` } }}
              />
            ))}
          </Box>
        </>
      )}

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
        Scheduled agents start only inside this window (UTC); Run now starts them at once. Leave both empty to
        allow any time.
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
