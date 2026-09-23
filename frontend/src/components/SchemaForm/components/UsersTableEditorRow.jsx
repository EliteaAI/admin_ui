import { memo, useCallback, useState } from 'react';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Box, IconButton, InputAdornment, TextField } from '@mui/material';

const UsersTableEditorRow = memo(props => {
  const { user, index, onChange, onDelete } = props;

  const [showPassword, setShowPassword] = useState(false);
  const email = user?.attributes?.email || '';

  const handleLoginChange = useCallback(e => onChange(index, 'login', e.target.value), [onChange, index]);
  const handleEmailChange = useCallback(e => onChange(index, 'email', e.target.value), [onChange, index]);
  const handlePasswordChange = useCallback(
    e => onChange(index, 'password', e.target.value),
    [onChange, index],
  );
  const handleToggleShow = useCallback(() => setShowPassword(s => !s), []);
  const handleDelete = useCallback(() => onDelete(index), [onDelete, index]);

  const styles = usersTableEditorRowStyles();

  return (
    <Box sx={styles.row}>
      <TextField
        size="small"
        placeholder="login"
        value={user.login || ''}
        onChange={handleLoginChange}
        sx={styles.field(1.2)}
      />
      <TextField
        size="small"
        placeholder="user@example.com"
        value={email}
        onChange={handleEmailChange}
        sx={styles.field(1.5)}
      />
      <TextField
        size="small"
        placeholder="password"
        type={showPassword ? 'text' : 'password'}
        value={user.password || ''}
        onChange={handlePasswordChange}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleToggleShow}
                  edge="end"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <VisibilityOff sx={styles.visibilityIcon} />
                  ) : (
                    <Visibility sx={styles.visibilityIcon} />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={styles.field(1.2)}
      />
      <IconButton
        size="small"
        onClick={handleDelete}
        sx={styles.deleteBtn}
      >
        <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
      </IconButton>
    </Box>
  );
});

UsersTableEditorRow.displayName = 'UsersTableEditorRow';

/** @type {MuiSx} */
const usersTableEditorRowStyles = () => ({
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.375rem',
  },
  field:
    flex =>
    ({ palette }) => ({
      flex,
      '& .MuiOutlinedInput-root': {
        fontSize: '0.8125rem',
        backgroundColor: palette.background.default,
      },
    }),
  visibilityIcon: {
    fontSize: '0.875rem',
  },
  deleteBtn: ({ palette }) => ({
    color: palette.error.main,
    flexShrink: 0,
  }),
});

export default UsersTableEditorRow;
