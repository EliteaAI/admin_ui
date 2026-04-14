import { memo, useCallback, useState } from "react";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import { useProjectCreateMutation } from "@/api/projectsApi";

const CreateProjectDialog = memo((props) => {
  const { open, onClose } = props;

  const [name, setName] = useState("");
  const [adminEmails, setAdminEmails] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const [createProject, { isLoading }] = useProjectCreateMutation();

  const handleCreate = useCallback(async () => {
    setError("");

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    const emails = inputValue.trim()
      ? [...adminEmails, inputValue.trim()]
      : adminEmails;

    const getProjectAdminEmail = () => {
      if (emails.length === 1) return emails[0];
      if (emails.length > 1) return emails;
      return undefined;
    };

    try {
      await createProject({
        name: name.trim(),
        project_admin_email: getProjectAdminEmail(),
      }).unwrap();

      setName("");
      setAdminEmails([]);
      setInputValue("");
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.error ?? "Failed to create project.");
    }
  }, [name, adminEmails, inputValue, createProject, onClose]);

  const handleClose = useCallback(() => {
    setName("");
    setAdminEmails([]);
    setInputValue("");
    setError("");
    onClose();
  }, [onClose]);

  const handleEmailKeyDown = useCallback(
    (event) => {
      // Tab key: add email as chip if there's input value
      if (event.key === "Tab" && inputValue.trim()) {
        event.preventDefault();
        setAdminEmails((prev) => [...prev, inputValue.trim()]);
        setInputValue("");
        return;
      }

      // Arrow keys: disable chip navigation, only allow text caret movement
      if (event.key === "ArrowLeft" || event.key === "ArrowRight")
        event.stopPropagation();
    },
    [inputValue],
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Project</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Project Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={adminEmails}
          inputValue={inputValue}
          onInputChange={(_, value) => setInputValue(value)}
          onChange={(_, value) => setAdminEmails(value)}
          disabled={isLoading}
          renderValue={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                key={option}
                label={option}
                size="small"
                {...getTagProps({ index })}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              margin="dense"
              label="Admin Email(s)"
              type="email"
              placeholder={adminEmails.length === 0 ? "user@example.com" : ""}
              helperText="Press Enter or Tab to add multiple emails"
              onKeyDown={handleEmailKeyDown}
            />
          )}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleCreate} variant="contained" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default CreateProjectDialog;
