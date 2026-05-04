import { memo, useCallback } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const LinksEditor = memo((props) => {
  const { value, onChange } = props;

  const links = Array.isArray(value) ? value : [];

  const handleAdd = useCallback(() => {
    onChange([...links, { title: "", url: "" }]);
  }, [links, onChange]);

  const handleDelete = useCallback(
    (index) => {
      const next = links.filter((_, i) => i !== index);
      onChange(next);
    },
    [links, onChange],
  );

  const handleChange = useCallback(
    (index, field, newValue) => {
      const next = links.map((link, i) =>
        i === index ? { ...link, [field]: newValue } : link,
      );
      onChange(next);
    },
    [links, onChange],
  );

  return (
    <Box sx={styles.root}>
      {links.map((link, index) => (
        <LinkRow
          // eslint-disable-next-line react/no-array-index-key
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

LinksEditor.displayName = "LinksEditor";

const LinkRow = memo((props) => {
  const { index, link, onDelete, onChange } = props;

  const handleTitleChange = useCallback(
    (e) => onChange(index, "title", e.target.value),
    [index, onChange],
  );

  const handleUrlChange = useCallback(
    (e) => onChange(index, "url", e.target.value),
    [index, onChange],
  );

  const handleDelete = useCallback(() => onDelete(index), [index, onDelete]);

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
      <IconButton size="small" onClick={handleDelete} sx={styles.deleteBtn}>
        <DeleteOutlineIcon sx={{ fontSize: "1rem" }} />
      </IconButton>
    </Box>
  );
});

LinkRow.displayName = "LinkRow";

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  titleField: {
    width: "12rem",
    "& .MuiInputBase-input": { fontSize: "0.8125rem" },
  },
  urlField: {
    flex: 1,
    "& .MuiInputBase-input": { fontSize: "0.8125rem" },
  },
  deleteBtn: ({ palette }) => ({
    color: palette.text.secondary,
    "&:hover": { color: palette.error.main },
  }),
  addButton: {
    alignSelf: "flex-start",
    fontSize: "0.8125rem",
    marginTop: "0.25rem",
  },
};

export default LinksEditor;
