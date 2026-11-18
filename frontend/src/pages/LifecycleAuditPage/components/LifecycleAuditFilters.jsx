import { memo, useCallback } from 'react';

import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import FilterAltOffOutlined from '@mui/icons-material/FilterAltOffOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import {
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import {
  DATE_PRESETS,
  PROJECT_TYPE_OPTIONS,
  RESULT_OPTIONS,
  SOURCE_OPTIONS,
} from '@/pages/LifecycleAuditPage/constants/lifecycleAudit.constants';

const TEXT_FIELDS = {
  projects: [
    { field: 'project_name', label: 'Project name' },
    { field: 'project_id', label: 'Project ID', numeric: true },
    { field: 'user_email', label: 'User email' },
  ],
  users: [
    { field: 'user_name', label: 'User name' },
    { field: 'user_id', label: 'User ID', numeric: true },
    { field: 'user_email', label: 'User email' },
    { field: 'project_id', label: 'Project ID', numeric: true },
  ],
};

const LifecycleAuditFilters = memo(props => {
  const {
    tab,
    filters,
    eventTypes,
    activePreset,
    isExporting,
    onFieldChange,
    onPresetChange,
    onApply,
    onClear,
    onRefresh,
    onExport,
  } = props;

  const styles = lifecycleAuditFiltersStyles();

  const handlePresetClick = useCallback(
    label => {
      const preset = DATE_PRESETS.find(item => item.label === label);
      if (!preset) return;
      const { from, to } = preset.getRange();
      onFieldChange('date_from', from);
      onFieldChange('date_to', to);
      onPresetChange(label);
    },
    [onFieldChange, onPresetChange],
  );

  const handleDateFromChange = useCallback(
    value => {
      onFieldChange('date_from', value);
      onPresetChange(null);
    },
    [onFieldChange, onPresetChange],
  );

  const handleDateToChange = useCallback(
    value => {
      onFieldChange('date_to', value);
      onPresetChange(null);
    },
    [onFieldChange, onPresetChange],
  );

  const handleTextChange = useCallback(
    event => onFieldChange(event.target.name, event.target.value),
    [onFieldChange],
  );

  const handleAdminToggle = useCallback(
    () => onFieldChange('admin_only', !filters.admin_only),
    [filters.admin_only, onFieldChange],
  );

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter') onApply();
    },
    [onApply],
  );

  const renderSelect = (field, label, options) => (
    <FormControl
      size="small"
      sx={styles.select}
    >
      <InputLabel
        id={`lifecycle-audit-${field}`}
        sx={styles.inputLabel}
      >
        {label}
      </InputLabel>
      <Select
        labelId={`lifecycle-audit-${field}`}
        value={filters[field]}
        label={label}
        onChange={event => onFieldChange(field, event.target.value)}
        sx={styles.selectInput}
      >
        {options.map(option => (
          <MenuItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <Box
      sx={styles.wrapper}
      onKeyDown={handleKeyDown}
    >
      <Box sx={styles.row}>
        <Box sx={styles.presetsRow}>
          {DATE_PRESETS.map(preset => (
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
          slotProps={{ textField: { size: 'small', sx: styles.dateField } }}
          maxDateTime={filters.date_to || undefined}
          ampm={false}
        />
        <DateTimePicker
          label="To"
          value={filters.date_to}
          onChange={handleDateToChange}
          slotProps={{ textField: { size: 'small', sx: styles.dateField } }}
          minDateTime={filters.date_from || undefined}
          ampm={false}
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<SearchOutlined />}
          onClick={onApply}
          sx={styles.button}
        >
          Apply
        </Button>
        <Button
          variant="text"
          size="small"
          startIcon={<FilterAltOffOutlined />}
          onClick={onClear}
          sx={styles.button}
        >
          Clear filters
        </Button>
        <Tooltip
          title="Refresh"
          placement="top"
        >
          <IconButton
            size="small"
            aria-label="Refresh"
            onClick={onRefresh}
            sx={styles.iconButton}
          >
            <RefreshOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadOutlined />}
          onClick={onExport}
          disabled={isExporting}
          sx={styles.button}
        >
          Export to Excel
        </Button>
      </Box>

      <Box sx={styles.row}>
        {renderSelect('event_type', 'Event', [{ value: '', label: 'All' }, ...eventTypes])}
        {tab === 'projects' && renderSelect('project_type', 'Project type', PROJECT_TYPE_OPTIONS)}
        {TEXT_FIELDS[tab].map(item => (
          <TextField
            key={item.field}
            name={item.field}
            label={item.label}
            size="small"
            value={filters[item.field] || ''}
            onChange={handleTextChange}
            inputProps={item.numeric ? { inputMode: 'numeric' } : undefined}
            sx={styles.textField}
          />
        ))}
        <TextField
          name="actor"
          label="Actor"
          size="small"
          value={filters.actor || ''}
          onChange={handleTextChange}
          sx={styles.textField}
        />
        <TextField
          name="role"
          label="Role"
          size="small"
          value={filters.role || ''}
          onChange={handleTextChange}
          sx={styles.textField}
        />
        {renderSelect('source', 'Source', SOURCE_OPTIONS)}
        {renderSelect('result', 'Result', RESULT_OPTIONS)}
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={!!filters.admin_only}
              onChange={handleAdminToggle}
              slotProps={{ input: { role: 'switch' } }}
            />
          }
          label="Administrator access only"
          sx={styles.switchLabel}
        />
      </Box>
    </Box>
  );
});

LifecycleAuditFilters.displayName = 'LifecycleAuditFilters';

/** @type {MuiSx} */
const lifecycleAuditFiltersStyles = () => ({
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
  dateField: {
    width: '13rem',
    '& input': { fontSize: '0.8125rem' },
    '& label': { fontSize: '0.8125rem' },
  },
  select: {
    minWidth: '8rem',
  },
  selectInput: {
    fontSize: '0.8125rem',
  },
  inputLabel: {
    fontSize: '0.8125rem',
  },
  textField: {
    width: '9rem',
    '& input': { fontSize: '0.8125rem' },
    '& label': { fontSize: '0.8125rem' },
  },
  switchLabel: {
    marginLeft: '0',
    '& .MuiFormControlLabel-label': { fontSize: '0.8125rem' },
  },
  button: {
    fontSize: '0.75rem',
    textTransform: 'none',
    minWidth: 'auto',
    padding: '0.25rem 0.75rem',
  },
  iconButton: {
    color: 'text.secondary',
  },
});

export default LifecycleAuditFilters;
