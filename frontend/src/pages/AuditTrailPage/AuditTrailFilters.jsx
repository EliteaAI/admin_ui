import { memo, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

const ALL_EVENT_TYPES = [
  { value: '', label: 'All' },
  { value: 'api', label: 'API' },
  { value: 'socketio', label: 'Socket.IO' },
  { value: 'rpc', label: 'RPC' },
  { value: 'agent', label: 'Agent' },
  { value: 'tool', label: 'Tool' },
  { value: 'llm', label: 'LLM' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'admin_task', label: 'Admin Task' },
];

const DATE_PRESETS = [
  { label: '30m', getRange: () => {
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 60 * 1000);
    return { from, to };
  }},
  { label: '1h', getRange: () => {
    const to = new Date();
    const from = new Date(to.getTime() - 60 * 60 * 1000);
    return { from, to };
  }},
  { label: 'Today', getRange: () => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }},
  { label: 'Yesterday', getRange: () => {
    const from = new Date();
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setDate(to.getDate() - 1);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }},
  { label: '7d', getRange: () => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }},
  { label: '30d', getRange: () => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    from.setDate(from.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }},
];

const AuditTrailFilters = memo(function AuditTrailFilters({
  filters,
  onFieldChange,
  onApply,
  onRefresh,
  activePreset,
  onPresetChange,
  eventTypes = ALL_EVENT_TYPES,
}) {
  const handleEventTypeChange = useCallback(
    (event) => {
      onFieldChange('event_type', event.target.value);
    },
    [onFieldChange],
  );

  const handleDateFromChange = useCallback(
    (value) => {
      onFieldChange('date_from', value);
      onPresetChange(null);
    },
    [onFieldChange, onPresetChange],
  );

  const handleDateToChange = useCallback(
    (value) => {
      onFieldChange('date_to', value);
      onPresetChange(null);
    },
    [onFieldChange, onPresetChange],
  );

  const handleErrorToggle = useCallback(
    () => {
      onFieldChange('is_error', !filters.is_error);
    },
    [filters.is_error, onFieldChange],
  );

  const handleProjectIdChange = useCallback(
    (e) => {
      onFieldChange('project_id', e.target.value);
    },
    [onFieldChange],
  );

  const handleUserIdChange = useCallback(
    (e) => {
      onFieldChange('user_id', e.target.value);
    },
    [onFieldChange],
  );

  const handlePresetClick = useCallback(
    (presetLabel) => {
      const preset = DATE_PRESETS.find((p) => p.label === presetLabel);
      if (!preset) return;
      const { from, to } = preset.getRange();
      onFieldChange('date_from', from);
      onFieldChange('date_to', to);
      onPresetChange(presetLabel);
    },
    [onFieldChange, onPresetChange],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') onApply();
    },
    [onApply],
  );

  return (
    <Box sx={styles.wrapper} onKeyDown={handleKeyDown}>
      {/* Row 1: Date presets, pickers, Apply, Refresh */}
      <Box sx={styles.row}>
        <Box sx={styles.presetsRow}>
          {DATE_PRESETS.map((preset) => (
            <Chip
              key={preset.label}
              label={preset.label}
              size="small"
              variant={activePreset === preset.label ? 'filled' : 'outlined'}
              color={activePreset === preset.label ? 'primary' : 'default'}
              onClick={() => handlePresetClick(preset.label)}
              sx={styles.presetChip}
            />
          ))}
        </Box>

        <DateTimePicker
          label="From"
          value={filters.date_from}
          onChange={handleDateFromChange}
          slotProps={{
            textField: { size: 'small', sx: styles.dateField },
            actionBar: { actions: ['clear', 'accept'] },
          }}
          maxDateTime={filters.date_to || undefined}
          ampm={false}
        />

        <DateTimePicker
          label="To"
          value={filters.date_to}
          onChange={handleDateToChange}
          slotProps={{
            textField: { size: 'small', sx: styles.dateField },
            actionBar: { actions: ['clear', 'accept'] },
          }}
          minDateTime={filters.date_from || undefined}
          ampm={false}
        />

        <Button
          variant="contained"
          size="small"
          startIcon={<SearchOutlined />}
          onClick={onApply}
          sx={styles.applyButton}
        >
          Apply
        </Button>

        <Tooltip title="Refresh" placement="top">
          <IconButton size="small" onClick={onRefresh} sx={styles.refreshButton}>
            <RefreshOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Row 2: Optional filters (Type, Project, User, Errors) */}
      <Box sx={styles.row}>
        <FormControl size="small" sx={styles.select}>
          <InputLabel sx={styles.inputLabel}>Type</InputLabel>
          <Select
            value={filters.event_type}
            onChange={handleEventTypeChange}
            label="Type"
            sx={styles.selectInput}
          >
            {eventTypes.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Project"
          size="small"
          value={filters.project_id || ''}
          onChange={handleProjectIdChange}
          inputProps={{ inputMode: 'numeric' }}
          sx={styles.idField}
        />

        <TextField
          label="User"
          size="small"
          value={filters.user_id || ''}
          onChange={handleUserIdChange}
          inputProps={{ inputMode: 'numeric' }}
          sx={styles.idField}
        />

        <Box sx={styles.errorToggle}>
          <Typography variant="bodySmall" color="text.metrics">
            Errors
          </Typography>
          <Switch
            size="small"
            checked={!!filters.is_error}
            onChange={handleErrorToggle}
          />
        </Box>
      </Box>
    </Box>
  );
});

const styles = {
  wrapper: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    padding: '0.5rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    flexWrap: 'wrap',
  },
  presetsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  presetChip: {
    fontSize: '0.6875rem',
    height: '1.5rem',
  },
  select: {
    minWidth: '6rem',
  },
  selectInput: {
    fontSize: '0.8125rem',
  },
  inputLabel: {
    fontSize: '0.8125rem',
  },
  dateField: {
    width: '13rem',
    '& input': { fontSize: '0.8125rem' },
    '& label': { fontSize: '0.8125rem' },
  },
  idField: {
    width: '6.5rem',
    '& input': { fontSize: '0.8125rem' },
    '& label': { fontSize: '0.8125rem' },
  },
  errorToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.125rem',
  },
  applyButton: {
    fontSize: '0.75rem',
    textTransform: 'none',
    minWidth: 'auto',
    padding: '0.25rem 0.75rem',
  },
  refreshButton: {
    color: 'text.secondary',
  },
};

export default AuditTrailFilters;
