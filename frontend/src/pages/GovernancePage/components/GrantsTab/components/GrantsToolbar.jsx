import { memo } from 'react';

import AddOutlined from '@mui/icons-material/AddOutlined';
import { Box, Button, Tooltip } from '@mui/material';

import FilterSelect from '@/pages/GovernancePage/components/FilterSelect';
import { STATES } from '@/pages/GovernancePage/components/GrantsTab/constants/grants.constants';
import ProjectPicker from '@/pages/GovernancePage/components/ProjectPicker';
import ProjectUserPicker from '@/pages/GovernancePage/components/ProjectUserPicker';
import { stateLabel } from '@/pages/GovernancePage/helpers/governance.helpers';

const STATE_OPTIONS = STATES.map(value => ({ value, label: stateLabel(value) }));

/** Project, the user and state filters and the create button of the Grants tab. Filtering by user is the per-user view. */
const GrantsToolbar = memo(props => {
  const { project, onProjectChange, user, onUserChange, state, onStateChange, canCreate, onCreate } = props;

  const styles = grantsToolbarStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="grants-toolbar"
    >
      <ProjectPicker
        value={project}
        onChange={onProjectChange}
      />
      <ProjectUserPicker
        projectId={project?.id}
        value={user}
        onChange={onUserChange}
        label="User"
        testId="grants-user-filter"
      />
      <FilterSelect
        label="State"
        value={state}
        onChange={onStateChange}
        options={STATE_OPTIONS}
        anyLabel="Any state"
        disabled={!project}
        testId="grants-state-filter"
        itemTestIdPrefix="grants-state"
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
              data-testid="grants-create"
            >
              Create grant
            </Button>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
});

GrantsToolbar.displayName = 'GrantsToolbar';

/** @type {MuiSx} */
const grantsToolbarStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    width: '100%',
  },
});

export default GrantsToolbar;
