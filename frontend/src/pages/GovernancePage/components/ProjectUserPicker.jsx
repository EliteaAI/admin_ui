import { memo, useCallback, useMemo } from 'react';

import { Autocomplete, TextField } from '@mui/material';

import { useProjectUserListQuery } from '@/api/projects.api';

const isSameUser = (option, value) => option.id === value.id;
const getUserLabel = option => option.email;

/**
 * Picks one member of a project. The value is `{ id, email }` or null. The members are read once for the project and
 * filtered as the operator types. `testId` is on the field; the input has `<testId>-input`.
 */
const ProjectUserPicker = memo(props => {
  const {
    projectId,
    value,
    onChange,
    label = 'User',
    helperText,
    disabled = false,
    required = false,
    testId,
    sx,
  } = props;

  const styles = projectUserPickerStyles();

  const { data, isFetching } = useProjectUserListQuery({ projectId }, { skip: !projectId });

  const options = useMemo(() => {
    const rows = (data?.rows ?? []).map(row => ({ id: row.id, email: row.email ?? `User ${row.id}` }));
    // The chosen user stays selectable while the members are loading
    return value && !rows.some(row => row.id === value.id) ? [value, ...rows] : rows;
  }, [data?.rows, value]);

  const handleChange = useCallback(
    (_, next) => {
      onChange(next);
    },
    [onChange],
  );

  return (
    <Autocomplete
      size="small"
      value={value}
      onChange={handleChange}
      options={options}
      loading={isFetching}
      disabled={disabled || !projectId}
      getOptionLabel={getUserLabel}
      isOptionEqualToValue={isSameUser}
      noOptionsText="No members found"
      sx={[styles.root, sx]}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          required={required}
          helperText={helperText}
          inputProps={{ ...params.inputProps, 'data-testid': `${testId}-input` }}
        />
      )}
      data-testid={testId}
    />
  );
});

ProjectUserPicker.displayName = 'ProjectUserPicker';

/** @type {MuiSx} */
const projectUserPickerStyles = () => ({
  root: {
    width: '14rem',
  },
});

export default ProjectUserPicker;
