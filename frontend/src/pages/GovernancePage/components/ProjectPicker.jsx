import { memo, useCallback, useMemo, useState } from 'react';

import { Autocomplete, TextField } from '@mui/material';

import { useProjectListQuery } from '@/api/projects.api';
import { useDebounceValue } from '@/hooks/useDebounceValue.hooks';

const PROJECT_LIMIT = 20;

const isSameProject = (option, value) => option.id === value.id;
const showAllOptions = options => options;
const getProjectLabel = option => option.name;

/** Picks the project a Governance tab works on. The projects are searched on the server as the user types. */
const ProjectPicker = memo(props => {
  const { value, onChange, sx } = props;

  const styles = projectPickerStyles();

  const [inputValue, setInputValue] = useState(value?.name ?? '');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 300);

  const { data, isFetching } = useProjectListQuery({ limit: PROJECT_LIMIT, search: debouncedSearch });

  const options = useMemo(() => {
    const rows = (data?.rows ?? []).map(row => ({ id: row.id, name: row.name }));
    // The remembered project stays selectable while the list is loading or filtered to something else
    return value && !rows.some(row => row.id === value.id) ? [value, ...rows] : rows;
  }, [data?.rows, value]);

  const handleChange = useCallback(
    (_, next) => {
      onChange(next);
    },
    [onChange],
  );

  const handleInputChange = useCallback((_, next, reason) => {
    setInputValue(next);
    // Picking an option writes its name into the input: that is not a search
    setSearch(reason === 'input' ? next : '');
  }, []);

  return (
    <Autocomplete
      size="small"
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={options}
      loading={isFetching}
      filterOptions={showAllOptions}
      getOptionLabel={getProjectLabel}
      isOptionEqualToValue={isSameProject}
      noOptionsText="No projects found"
      sx={[styles.root, sx]}
      renderInput={params => (
        <TextField
          {...params}
          label="Project"
          placeholder="Choose a project"
          inputProps={{ ...params.inputProps, 'data-testid': 'governance-project-input' }}
        />
      )}
      data-testid="governance-project-picker"
    />
  );
});

ProjectPicker.displayName = 'ProjectPicker';

/** @type {MuiSx} */
const projectPickerStyles = () => ({
  root: {
    width: '16rem',
  },
});

export default ProjectPicker;
