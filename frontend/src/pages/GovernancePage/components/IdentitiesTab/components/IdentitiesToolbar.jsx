import { memo } from 'react';

import AddOutlined from '@mui/icons-material/AddOutlined';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Tooltip } from '@mui/material';

import {
  MODE_OPTIONS,
  STATE_LABELS,
} from '@/pages/GovernancePage/components/IdentitiesTab/constants/identities.constants';
import { modeLabel } from '@/pages/GovernancePage/components/IdentitiesTab/helpers/identities.helpers';
import ProjectPicker from '@/pages/GovernancePage/components/ProjectPicker';

/** Project, filters and the create button of the Agent identities tab. */
const IdentitiesToolbar = memo(props => {
  const {
    project,
    onProjectChange,
    search,
    onSearchChange,
    state,
    onStateChange,
    mode,
    onModeChange,
    canCreate,
    onCreate,
  } = props;

  const styles = identitiesToolbarStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="identities-toolbar"
    >
      <ProjectPicker
        value={project}
        onChange={onProjectChange}
      />
      <TextField
        size="small"
        label="Agent"
        placeholder="Search by agent name"
        value={search}
        onChange={onSearchChange}
        disabled={!project}
        sx={styles.search}
        inputProps={{ 'data-testid': 'identities-search' }}
      />
      <FormControl
        size="small"
        sx={styles.filter}
        disabled={!project}
      >
        <InputLabel id="identities-state-label">State</InputLabel>
        <Select
          labelId="identities-state-label"
          label="State"
          value={state}
          onChange={onStateChange}
          displayEmpty
          SelectDisplayProps={{ 'data-testid': 'identities-state-filter' }}
        >
          <MenuItem value="">Any state</MenuItem>
          {Object.entries(STATE_LABELS).map(([value, label]) => (
            <MenuItem
              key={value}
              value={value}
              data-testid={`identities-state-${value}`}
            >
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl
        size="small"
        sx={styles.filter}
        disabled={!project}
      >
        <InputLabel id="identities-mode-label">Identity mode</InputLabel>
        <Select
          labelId="identities-mode-label"
          label="Identity mode"
          value={mode}
          onChange={onModeChange}
          displayEmpty
          SelectDisplayProps={{ 'data-testid': 'identities-mode-filter' }}
        >
          <MenuItem value="">Any mode</MenuItem>
          {MODE_OPTIONS.map(value => (
            <MenuItem
              key={value}
              value={value}
              data-testid={`identities-mode-${value}`}
            >
              {modeLabel(value)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {canCreate && (
        <Tooltip title={project ? '' : 'Choose a project first'}>
          <Box component="span">
            <Button
              variant="contained"
              size="small"
              startIcon={<AddOutlined />}
              disabled={!project}
              onClick={onCreate}
              data-testid="identities-create"
            >
              Create identity
            </Button>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
});

IdentitiesToolbar.displayName = 'IdentitiesToolbar';

/** @type {MuiSx} */
const identitiesToolbarStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    width: '100%',
  },
  search: {
    width: '14rem',
  },
  filter: {
    minWidth: '10rem',
  },
});

export default IdentitiesToolbar;
