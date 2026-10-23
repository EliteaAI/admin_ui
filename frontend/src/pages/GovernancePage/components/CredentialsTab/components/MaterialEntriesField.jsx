import { memo, useCallback } from 'react';

import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';

/**
 * The entries of a map of passwords (a secret field written `<name>.*`): each has a key the operator names and a
 * write-only value. `entries` is `[{ id, key, value }]`; `testId` prefixes `-add`, `-key-<id>` and `-value-<id>`.
 */
const MaterialEntriesField = memo(props => {
  const { label, entries, onAdd, onChange, onRemove, testId } = props;

  const styles = materialEntriesFieldStyles();

  const handleKeyChange = useCallback(id => event => onChange(id, { key: event.target.value }), [onChange]);
  const handleValueChange = useCallback(
    id => event => onChange(id, { value: event.target.value }),
    [onChange],
  );
  const handleRemove = useCallback(id => () => onRemove(id), [onRemove]);

  return (
    <Box sx={styles.root}>
      <Typography variant="labelMedium">{label}</Typography>
      {entries.map(entry => (
        <Box
          key={entry.id}
          sx={styles.entry}
        >
          <TextField
            size="small"
            label="Name"
            value={entry.key}
            onChange={handleKeyChange(entry.id)}
            inputProps={{ 'data-testid': `${testId}-key-${entry.id}` }}
          />
          <TextField
            size="small"
            label="Value"
            type="password"
            autoComplete="new-password"
            value={entry.value}
            onChange={handleValueChange(entry.id)}
            sx={styles.value}
            inputProps={{ 'data-testid': `${testId}-value-${entry.id}` }}
          />
          <IconButton
            size="small"
            aria-label="Remove entry"
            onClick={handleRemove(entry.id)}
          >
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Box>
        <Button
          size="small"
          startIcon={<AddOutlined />}
          onClick={onAdd}
          data-testid={`${testId}-add`}
        >
          Add entry
        </Button>
      </Box>
    </Box>
  );
});

MaterialEntriesField.displayName = 'MaterialEntriesField';

/** @type {MuiSx} */
const materialEntriesFieldStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  entry: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  value: {
    flex: 1,
  },
});

export default MaterialEntriesField;
