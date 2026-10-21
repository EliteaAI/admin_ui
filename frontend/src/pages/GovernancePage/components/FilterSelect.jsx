import { memo, useId } from 'react';

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

/**
 * A filter of a list toolbar: "any" plus the options (`[{ value, label }]`). The select itself has the test id
 * `testId`, each option `<itemTestIdPrefix>-<value>`.
 */
const FilterSelect = memo(props => {
  const { label, value, onChange, options, anyLabel, disabled = false, testId, itemTestIdPrefix } = props;

  const styles = filterSelectStyles();

  const labelId = useId();

  return (
    <FormControl
      size="small"
      sx={styles.root}
      disabled={disabled}
    >
      <InputLabel
        shrink
        id={labelId}
      >
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        label={label}
        value={value}
        onChange={onChange}
        displayEmpty
        notched
        SelectDisplayProps={{ 'data-testid': testId }}
      >
        <MenuItem value="">{anyLabel}</MenuItem>
        {options.map(option => (
          <MenuItem
            key={option.value}
            value={option.value}
            data-testid={`${itemTestIdPrefix}-${option.value}`}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});

FilterSelect.displayName = 'FilterSelect';

/** @type {MuiSx} */
const filterSelectStyles = () => ({
  root: {
    minWidth: '10rem',
  },
});

export default FilterSelect;
