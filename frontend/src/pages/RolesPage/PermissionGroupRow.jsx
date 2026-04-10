import { memo, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const PermissionGroupRow = memo(function PermissionGroupRow({
  groupName,
  permissions,
  roles,
  expanded,
  onToggleExpand,
  onToggleGroupRole,
}) {
  const aggregates = useMemo(() => {
    const result = {};
    for (const role of roles) {
      const checked = permissions.filter((p) => p[role]).length;
      if (checked === 0) result[role] = 'none';
      else if (checked === permissions.length) result[role] = 'all';
      else result[role] = 'indeterminate';
    }
    return result;
  }, [roles, permissions]);

  const handleToggleExpand = useCallback(() => {
    onToggleExpand(groupName);
  }, [groupName, onToggleExpand]);

  const handleGroupToggle = useCallback(
    (role) => {
      const newValue = aggregates[role] !== 'all';
      onToggleGroupRole(groupName, role, newValue);
    },
    [groupName, aggregates, onToggleGroupRole],
  );

  return (
    <Box sx={styles.row}>
      <Box sx={styles.nameCell}>
        <IconButton size="small" onClick={handleToggleExpand} sx={styles.expandButton}>
          {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        </IconButton>
        <Typography variant="labelSmall" color="text.secondary" sx={styles.nameText}>
          {groupName}
        </Typography>
        <Typography variant="bodySmall" color="text.metrics" sx={styles.count}>
          ({permissions.length})
        </Typography>
      </Box>
      {roles.map((role) => (
        <Box key={role} sx={styles.checkboxCell}>
          <Checkbox
            size="small"
            checked={aggregates[role] === 'all'}
            indeterminate={aggregates[role] === 'indeterminate'}
            onChange={() => handleGroupToggle(role)}
            disabled={role === 'system'}
            sx={styles.checkbox}
          />
        </Box>
      ))}
    </Box>
  );
});

const styles = {
  row: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: 'var(--matrix-columns)',
    alignItems: 'center',
    minHeight: '2.5rem',
    backgroundColor: palette.background.tabPanel,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    borderTop: `0.0625rem solid ${palette.border.table}`,
  }),
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    overflow: 'hidden',
    paddingRight: '0.5rem',
  },
  expandButton: {
    padding: '0.125rem',
    flexShrink: 0,
  },
  nameText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 600,
  },
  count: {
    flexShrink: 0,
  },
  checkboxCell: {
    display: 'flex',
    justifyContent: 'center',
  },
  checkbox: {
    padding: '0.25rem',
  },
};

export default PermissionGroupRow;
