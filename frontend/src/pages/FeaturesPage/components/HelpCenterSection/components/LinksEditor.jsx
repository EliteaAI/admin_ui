import { memo, useCallback, useMemo } from 'react';

import AddIcon from '@mui/icons-material/Add';
import { Box, Button } from '@mui/material';

import LinkRow from './LinkRow';

const LinksEditor = memo(props => {
  const { value, onChange } = props;

  const links = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const handleAdd = useCallback(() => {
    onChange([...links, { title: '', url: '' }]);
  }, [links, onChange]);

  const handleDelete = useCallback(
    index => {
      const next = links.filter((_, i) => i !== index);
      onChange(next);
    },
    [links, onChange],
  );

  const handleChange = useCallback(
    (index, field, newValue) => {
      const next = links.map((link, i) => (i === index ? { ...link, [field]: newValue } : link));
      onChange(next);
    },
    [links, onChange],
  );

  const styles = linksEditorStyles();

  return (
    <Box sx={styles.root}>
      {links.map((link, index) => (
        <LinkRow
          key={index}
          index={index}
          link={link}
          onDelete={handleDelete}
          onChange={handleChange}
        />
      ))}
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={styles.addButton}
      >
        Add Link
      </Button>
    </Box>
  );
});

LinksEditor.displayName = 'LinksEditor';

/** @type {MuiSx} */
const linksEditorStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  addButton: {
    alignSelf: 'flex-start',
    fontSize: '0.8125rem',
    marginTop: '0.25rem',
  },
});

export default LinksEditor;
