import { memo } from 'react';

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

// A select bound to one settings key; its options carry the test ids `${testId}-${value}`.
const SettingSelect = memo(props => {
  const { id, label, value, options, onChange, disabled, sx, testId } = props;

  return (
    <FormControl
      size="small"
      sx={sx}
      disabled={disabled}
    >
      <InputLabel id={id}>{label}</InputLabel>
      <Select
        labelId={id}
        label={label}
        value={value ?? ''}
        onChange={event => onChange(event.target.value)}
        SelectDisplayProps={{ 'data-testid': testId }}
      >
        {options.map(option => (
          <MenuItem
            key={option.value}
            value={option.value}
            data-testid={`${testId}-${option.value}`}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});

SettingSelect.displayName = 'SettingSelect';

export default SettingSelect;
