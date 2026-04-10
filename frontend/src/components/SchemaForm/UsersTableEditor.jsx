import { memo, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

/**
 * Edits an array of user objects shaped as:
 *   [{ login: "...", password: "...", attributes: { email: "..." } }]
 *
 * Renders a compact table with Login, Email, Password columns.
 */
const UsersTableEditor = memo(function UsersTableEditor({ value, onChange }) {
  const users = Array.isArray(value) ? value : [];

  const handleAdd = useCallback(() => {
    onChange([...users, { login: '', password: '', attributes: { email: '' } }]);
  }, [users, onChange]);

  const handleDelete = useCallback(
    (index) => {
      onChange(users.filter((_, i) => i !== index));
    },
    [users, onChange],
  );

  const handleFieldChange = useCallback(
    (index, field, val) => {
      const updated = users.map((user, i) => {
        if (i !== index) return user;
        if (field === 'email') {
          return {
            ...user,
            attributes: { ...(user.attributes || {}), email: val },
          };
        }
        return { ...user, [field]: val };
      });
      onChange(updated);
    },
    [users, onChange],
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={styles.headerRow}>
        <Typography variant="caption" sx={[styles.headerCell, { flex: 1.2 }]}>
          Login
        </Typography>
        <Typography variant="caption" sx={[styles.headerCell, { flex: 1.5 }]}>
          Email
        </Typography>
        <Typography variant="caption" sx={[styles.headerCell, { flex: 1.2 }]}>
          Password
        </Typography>
        <Box sx={{ width: '2rem' }} />
      </Box>

      {/* Rows */}
      {users.map((user, index) => (
        <UserRow
          key={index}
          user={user}
          index={index}
          onChange={handleFieldChange}
          onDelete={handleDelete}
        />
      ))}

      {users.length === 0 && (
        <Typography variant="caption" sx={styles.emptyHint}>
          No users configured. Add one below.
        </Typography>
      )}

      {/* Add button */}
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={styles.addButton}
      >
        Add user
      </Button>
    </Box>
  );
});

const UserRow = memo(function UserRow({ user, index, onChange, onDelete }) {
  const [showPassword, setShowPassword] = useState(false);
  const email = user?.attributes?.email || '';

  return (
    <Box sx={styles.row}>
      <TextField
        size="small"
        placeholder="login"
        value={user.login || ''}
        onChange={(e) => onChange(index, 'login', e.target.value)}
        sx={[styles.field, { flex: 1.2 }]}
      />
      <TextField
        size="small"
        placeholder="user@example.com"
        value={email}
        onChange={(e) => onChange(index, 'email', e.target.value)}
        sx={[styles.field, { flex: 1.5 }]}
      />
      <TextField
        size="small"
        placeholder="password"
        type={showPassword ? 'text' : 'password'}
        value={user.password || ''}
        onChange={(e) => onChange(index, 'password', e.target.value)}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setShowPassword((s) => !s)}
                  edge="end"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <VisibilityOff sx={{ fontSize: '0.875rem' }} />
                  ) : (
                    <Visibility sx={{ fontSize: '0.875rem' }} />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={[styles.field, { flex: 1.2 }]}
      />
      <IconButton size="small" onClick={() => onDelete(index)} sx={styles.deleteBtn}>
        <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
      </IconButton>
    </Box>
  );
});

const styles = {
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.25rem',
    paddingLeft: '0.125rem',
  },
  headerCell: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: palette.text.metrics,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  }),
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.375rem',
  },
  field: ({ palette }) => ({
    '& .MuiOutlinedInput-root': {
      fontSize: '0.8125rem',
      backgroundColor: palette.background.default,
    },
  }),
  deleteBtn: ({ palette }) => ({
    color: palette.error?.main || palette.text.metrics,
    flexShrink: 0,
  }),
  emptyHint: ({ palette }) => ({
    display: 'block',
    color: palette.text.metrics,
    padding: '0.5rem 0',
    fontSize: '0.75rem',
  }),
  addButton: {
    textTransform: 'none',
    fontSize: '0.8125rem',
    marginTop: '0.25rem',
  },
};

export default UsersTableEditor;
