import { memo } from 'react';

import AddOutlined from '@mui/icons-material/AddOutlined';
import { Box, Button } from '@mui/material';

import FilterSelect from '@/pages/GovernancePage/components/FilterSelect';
import ProjectPicker from '@/pages/GovernancePage/components/ProjectPicker';
import { stateLabel } from '@/pages/GovernancePage/helpers/governance.helpers';

const STATE_OPTIONS = ['draft', 'pending_approval', 'active', 'suspended', 'expired', 'revoked'].map(
  value => ({
    value,
    label: stateLabel(value),
  }),
);

/** Project, state filter and the create button of the Mandates tab. */
const MandatesToolbar = memo(props => {
  const { project, onProjectChange, state, onStateChange, canCreate, onCreate } = props;

  const styles = mandatesToolbarStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="mandates-toolbar"
    >
      <ProjectPicker
        value={project}
        onChange={onProjectChange}
      />
      <FilterSelect
        label="State"
        value={state}
        onChange={onStateChange}
        options={STATE_OPTIONS}
        anyLabel="Any state"
        disabled={!project}
        testId="mandates-state-filter"
      />
      <Box sx={styles.spacer} />
      {canCreate && (
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={onCreate}
          disabled={!project}
          data-testid="mandates-create"
        >
          Create mandate
        </Button>
      )}
    </Box>
  );
});

MandatesToolbar.displayName = 'MandatesToolbar';

/** @type {MuiSx} */
const mandatesToolbarStyles = () => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
  },
  spacer: {
    flex: 1,
  },
});

export default MandatesToolbar;
