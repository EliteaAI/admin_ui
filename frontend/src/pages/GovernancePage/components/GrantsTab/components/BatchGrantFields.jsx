import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import FilterSelect from '@/pages/GovernancePage/components/FilterSelect';
import ProjectUserPicker from '@/pages/GovernancePage/components/ProjectUserPicker';

const ROLE_OPTIONS = [
  { value: 'editor', label: 'Every editor' },
  { value: 'viewer', label: 'Every viewer' },
  { value: 'admin', label: 'Every admin' },
];

/**
 * "Also grant to" of a grant's approval (#7269): the same use for another member and/or every member of a project
 * role, approved with this one in one change. Each is filed under the request being approved, so the approver is
 * never its creator. A personal credential has no siblings (the server says so).
 */
const BatchGrantFields = memo(props => {
  const { projectId, user, onUserChange, role, onRoleChange } = props;

  const styles = batchGrantFieldsStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="grant-approve-also"
    >
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        Also grant to (optional)
      </Typography>
      <ProjectUserPicker
        projectId={projectId}
        value={user}
        onChange={onUserChange}
        label="Member"
        testId="grant-approve-also-user"
      />
      <FilterSelect
        label="Project role"
        value={role}
        onChange={event => onRoleChange(event.target.value)}
        options={ROLE_OPTIONS}
        anyLabel="No role"
        testId="grant-approve-also-role"
        itemTestIdPrefix="grant-approve-also-role"
      />
    </Box>
  );
});

BatchGrantFields.displayName = 'BatchGrantFields';

/** @type {MuiSx} */
const batchGrantFieldsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
});

export default BatchGrantFields;
