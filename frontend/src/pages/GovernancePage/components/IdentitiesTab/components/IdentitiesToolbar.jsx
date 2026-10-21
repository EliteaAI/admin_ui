import { memo } from 'react';

import AddOutlined from '@mui/icons-material/AddOutlined';
import { Box, Button, TextField, Tooltip } from '@mui/material';

import FilterSelect from '@/pages/GovernancePage/components/FilterSelect';
import {
  MODE_OPTIONS,
  STATES,
} from '@/pages/GovernancePage/components/IdentitiesTab/constants/identities.constants';
import { modeLabel } from '@/pages/GovernancePage/components/IdentitiesTab/helpers/identities.helpers';
import ProjectPicker from '@/pages/GovernancePage/components/ProjectPicker';
import { stateLabel } from '@/pages/GovernancePage/helpers/governance.helpers';

const STATE_OPTIONS = STATES.map(value => ({ value, label: stateLabel(value) }));
const MODE_FILTER_OPTIONS = MODE_OPTIONS.map(value => ({ value, label: modeLabel(value) }));

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
      <FilterSelect
        label="State"
        value={state}
        onChange={onStateChange}
        options={STATE_OPTIONS}
        anyLabel="Any state"
        disabled={!project}
        testId="identities-state-filter"
        itemTestIdPrefix="identities-state"
      />
      <FilterSelect
        label="Identity mode"
        value={mode}
        onChange={onModeChange}
        options={MODE_FILTER_OPTIONS}
        anyLabel="Any mode"
        disabled={!project}
        testId="identities-mode-filter"
        itemTestIdPrefix="identities-mode"
      />
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
});

export default IdentitiesToolbar;
