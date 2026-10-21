import { memo } from 'react';

import AddOutlined from '@mui/icons-material/AddOutlined';
import { Box, Button, TextField, Tooltip } from '@mui/material';

import {
  STATES,
  STORE_LABELS,
} from '@/pages/GovernancePage/components/CredentialsTab/constants/credentials.constants';
import FilterSelect from '@/pages/GovernancePage/components/FilterSelect';
import ProjectPicker from '@/pages/GovernancePage/components/ProjectPicker';
import ProjectUserPicker from '@/pages/GovernancePage/components/ProjectUserPicker';
import { OWNERSHIP_CLASS_LABELS } from '@/pages/GovernancePage/constants/governance.constants';
import { stateLabel } from '@/pages/GovernancePage/helpers/governance.helpers';

const STATE_OPTIONS = STATES.map(value => ({ value, label: stateLabel(value) }));
const CLASS_OPTIONS = Object.entries(OWNERSHIP_CLASS_LABELS).map(([value, label]) => ({ value, label }));
const STORE_OPTIONS = Object.entries(STORE_LABELS).map(([value, label]) => ({ value, label }));

/** Project, filters and the register button of the Credentials tab. */
const CredentialsToolbar = memo(props => {
  const {
    project,
    onProjectChange,
    search,
    onSearchChange,
    state,
    onStateChange,
    ownershipClass,
    onClassChange,
    storeKind,
    onStoreChange,
    owner,
    onOwnerChange,
    canCreate,
    onCreate,
  } = props;

  const styles = credentialsToolbarStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="credentials-toolbar"
    >
      <ProjectPicker
        value={project}
        onChange={onProjectChange}
      />
      <TextField
        size="small"
        label="Credential"
        placeholder="Search by configuration or provider"
        value={search}
        onChange={onSearchChange}
        disabled={!project}
        sx={styles.search}
        inputProps={{ 'data-testid': 'credentials-search' }}
      />
      <FilterSelect
        label="State"
        value={state}
        onChange={onStateChange}
        options={STATE_OPTIONS}
        anyLabel="Any state"
        disabled={!project}
        testId="credentials-state-filter"
        itemTestIdPrefix="credentials-state"
      />
      <FilterSelect
        label="Class"
        value={ownershipClass}
        onChange={onClassChange}
        options={CLASS_OPTIONS}
        anyLabel="Any class"
        disabled={!project}
        testId="credentials-class-filter"
        itemTestIdPrefix="credentials-class"
      />
      <FilterSelect
        label="Store"
        value={storeKind}
        onChange={onStoreChange}
        options={STORE_OPTIONS}
        anyLabel="Any store"
        disabled={!project}
        testId="credentials-store-filter"
        itemTestIdPrefix="credentials-store"
      />
      <ProjectUserPicker
        projectId={project?.id}
        value={owner}
        onChange={onOwnerChange}
        label="Owner"
        testId="credentials-owner-filter"
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
              data-testid="credentials-create"
            >
              Register credential
            </Button>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
});

CredentialsToolbar.displayName = 'CredentialsToolbar';

/** @type {MuiSx} */
const credentialsToolbarStyles = () => ({
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

export default CredentialsToolbar;
