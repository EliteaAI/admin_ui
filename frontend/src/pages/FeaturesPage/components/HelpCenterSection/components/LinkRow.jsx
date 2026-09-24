import { memo, useCallback } from 'react';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, IconButton, TextField } from '@mui/material';

const LinkRow = memo(props => {
  const { index, link, onDelete, onChange } = props;

  const handleTitleChange = useCallback(e => onChange(index, 'title', e.target.value), [onChange, index]);
  const handleUrlChange = useCallback(e => onChange(index, 'url', e.target.value), [onChange, index]);
  const handleDelete = useCallback(() => onDelete(index), [onDelete, index]);

  const styles = linkRowStyles();

  return (
    <Box sx={styles.row}>
      <TextField
        size="small"
        placeholder="Title"
        value={link.title}
        onChange={handleTitleChange}
        sx={styles.titleField}
      />
      <TextField
        size="small"
        placeholder="URL"
        value={link.url}
        onChange={handleUrlChange}
        sx={styles.urlField}
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

LinkRow.displayName = 'LinkRow';

/** @type {MuiSx} */
const linkRowStyles = () => ({
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  titleField: {
    width: '12rem',
    '& .MuiInputBase-input': { fontSize: '0.8125rem' },
  },
  urlField: {
    flex: 1,
    '& .MuiInputBase-input': { fontSize: '0.8125rem' },
  },
  deleteBtn: ({ palette }) => ({
    color: palette.text.secondary,
    '&:hover': { color: palette.error.main },
  }),
});

export default LinkRow;
