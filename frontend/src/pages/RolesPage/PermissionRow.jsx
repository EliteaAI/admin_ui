import { memo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';

const PermissionRow = memo(function PermissionRow({ permission, roles, values, onChange }) {
  const shortName = permission.split('.').slice(2).join('.') || permission;

  const handleChange = useCallback(
    (role) => {
      onChange(permission, role, !values[role]);
    },
    [permission, values, onChange],
  );

  return (
    <Box sx={styles.row}>
      <Box sx={styles.nameCell}>
        <Typography variant="bodySmall" color="text.secondary" sx={styles.nameText}>
          {shortName}
        </Typography>
      </Box>
      {roles.map((role) => (
        <Box key={role} sx={styles.checkboxCell}>
          <Checkbox
            size="small"
            checked={!!values[role]}
            onChange={() => handleChange(role)}
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
    minHeight: '2.25rem',
    paddingLeft: '2.5rem',
    '&:hover': {
      backgroundColor: palette.background.userInputBackgroundActive,
    },
  }),
  nameCell: {
    overflow: 'hidden',
    paddingRight: '0.5rem',
  },
  nameText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  checkboxCell: {
    display: 'flex',
    justifyContent: 'center',
  },
  checkbox: {
    padding: '0.25rem',
  },
};

export default PermissionRow;
