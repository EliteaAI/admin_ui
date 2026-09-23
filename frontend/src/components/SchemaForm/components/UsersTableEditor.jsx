import { memo, useCallback, useMemo } from 'react';

import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Typography } from '@mui/material';

import UsersTableEditorRow from './UsersTableEditorRow';

/**
 * Edits an array of user objects shaped as:
 *   [{ login: "...", password: "...", attributes: { email: "..." } }]
 *
 * Renders a compact table with Login, Email, Password columns.
 */
const UsersTableEditor = memo(props => {
  const { value, onChange } = props;

  const users = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const handleAdd = useCallback(() => {
    onChange([...users, { login: '', password: '', attributes: { email: '' } }]);
  }, [users, onChange]);

  const handleDelete = useCallback(
    index => {
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

  const styles = usersTableEditorStyles();

  return (
    <Box>
      {/* Header */}
      <Box sx={styles.headerRow}>
        <Typography
          variant="caption"
          sx={styles.headerCell(1.2)}
        >
          Login
        </Typography>
        <Typography
          variant="caption"
          sx={styles.headerCell(1.5)}
        >
          Email
        </Typography>
        <Typography
          variant="caption"
          sx={styles.headerCell(1.2)}
        >
          Password
        </Typography>
        <Box sx={styles.actionsSpacer} />
      </Box>

      {/* Rows */}
      {users.map((user, index) => (
        <UsersTableEditorRow
          key={index}
          user={user}
          index={index}
          onChange={handleFieldChange}
          onDelete={handleDelete}
        />
      ))}

      {users.length === 0 && (
        <Typography
          variant="caption"
          sx={styles.emptyHint}
        >
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

UsersTableEditor.displayName = 'UsersTableEditor';

/** @type {MuiSx} */
const usersTableEditorStyles = () => ({
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.25rem',
    paddingLeft: '0.125rem',
  },
  headerCell:
    flex =>
    ({ palette }) => ({
      flex,
      fontSize: '0.6875rem',
      fontWeight: 600,
      color: palette.text.metrics,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
    }),
  actionsSpacer: {
    width: '2rem',
  },
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
});

export default UsersTableEditor;
