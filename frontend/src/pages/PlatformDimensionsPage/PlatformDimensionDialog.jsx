import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { ENGINES, POLARITIES, SCALE_TYPES, TARGET_OPERATORS } from "./constants";

const EMPTY = {
  name: "",
  description: "",
  allowed_engines: ["ai"],
  scale_type: "continuous",
  scale_min: "0",
  scale_max: "100",
  // No default: polarity is applied last in normalization, so an inverse metric left on
  // "higher is better" scores a good answer 0. The author must state which way it runs.
  polarity: "",
  default_weight: "1",
  default_target: "",
  default_target_operator: "",
};

const toForm = (dimension) => ({
  name: dimension.name ?? "",
  description: dimension.description ?? "",
  allowed_engines: dimension.allowed_engines?.length
    ? dimension.allowed_engines
    : EMPTY.allowed_engines,
  scale_type: dimension.scale_type ?? EMPTY.scale_type,
  scale_min: String(dimension.scale_min ?? 0),
  scale_max: String(dimension.scale_max ?? 100),
  polarity: dimension.polarity ?? EMPTY.polarity,
  default_weight: String(dimension.default_weight ?? 1),
  default_target:
    dimension.default_target === null || dimension.default_target === undefined
      ? ""
      : String(dimension.default_target),
  default_target_operator: dimension.default_target_operator ?? "",
});

/**
 * Create or edit a platform-wide evaluation dimension.
 *
 * The definition lives at platform level; the description is the rubric every project's
 * judge will see once that project attaches the dimension.
 */
export default function PlatformDimensionDialog(props) {
  const { open, dimension, isSaving, onClose, onSave } = props;

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const isEdit = !!dimension;

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(dimension ? toForm(dimension) : EMPTY);
  }, [open, dimension]);

  const setField = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const toggleEngine = (engine) =>
    setForm((prev) => ({
      ...prev,
      allowed_engines: prev.allowed_engines.includes(engine)
        ? prev.allowed_engines.filter((value) => value !== engine)
        : [...prev.allowed_engines, engine],
    }));

  const numbers = useMemo(
    () => ({
      scale_min: Number(form.scale_min),
      scale_max: Number(form.scale_max),
      default_weight: Number(form.default_weight),
      default_target:
        form.default_target.trim() === "" ? null : Number(form.default_target),
    }),
    [form],
  );

  const validationError = useMemo(() => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.description.trim())
      return "Description is required — it is the rubric the judge follows.";
    if (!form.allowed_engines.length) return "Select at least one engine.";
    if (!form.polarity)
      return "Pick a polarity — inverse metrics (toxicity, latency) must be “Lower is better”.";
    if (Number.isNaN(numbers.scale_min) || Number.isNaN(numbers.scale_max))
      return "Scale bounds must be numbers.";
    if (numbers.scale_min >= numbers.scale_max)
      return "Scale min must be lower than scale max.";
    if (Number.isNaN(numbers.default_weight) || numbers.default_weight < 0)
      return "Default weight must be zero or more.";
    if (numbers.default_target !== null && Number.isNaN(numbers.default_target))
      return "Default target must be a number.";
    if (numbers.default_target !== null && !form.default_target_operator)
      return "Pick an operator for the default target.";
    return "";
  }, [form, numbers]);

  const handleSave = async () => {
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim(),
        allowed_engines: form.allowed_engines,
        scale_type: form.scale_type,
        scale_min: numbers.scale_min,
        scale_max: numbers.scale_max,
        polarity: form.polarity,
        default_weight: numbers.default_weight,
        default_target: numbers.default_target,
        default_target_operator:
          numbers.default_target === null
            ? null
            : form.default_target_operator,
      });
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.error ?? "Failed to save the dimension.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? "Edit platform dimension" : "New platform dimension"}
      </DialogTitle>

      <DialogContent>
        <Box sx={styles.content}>
          <TextField
            label="Name"
            value={form.name}
            onChange={setField("name")}
            size="small"
            fullWidth
            helperText="Shown in every project's Platform catalog. Must be unique."
          />

          <TextField
            label="Description (judge rubric)"
            value={form.description}
            onChange={setField("description")}
            size="small"
            fullWidth
            multiline
            minRows={4}
            helperText="Tell the judge what to look for and how to score it."
          />

          <Box>
            <Typography variant="body2" color="text.secondary">
              Scored by
            </Typography>
            <Box sx={styles.row}>
              {ENGINES.map((option) => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      checked={form.allowed_engines.includes(option.value)}
                      onChange={() => toggleEngine(option.value)}
                      size="small"
                    />
                  }
                  label={option.label}
                />
              ))}
            </Box>
          </Box>

          <Box sx={styles.row}>
            <TextField
              select
              label="Scale type"
              value={form.scale_type}
              onChange={setField("scale_type")}
              size="small"
              fullWidth
            >
              {SCALE_TYPES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              required
              label="Polarity"
              value={form.polarity}
              onChange={setField("polarity")}
              size="small"
              fullWidth
              helperText="Toxicity, latency and other inverse metrics are “Lower is better”."
            >
              {POLARITIES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={styles.row}>
            <TextField
              label="Scale min"
              value={form.scale_min}
              onChange={setField("scale_min")}
              type="number"
              size="small"
              fullWidth
              sx={styles.numberField}
            />
            <TextField
              label="Scale max"
              value={form.scale_max}
              onChange={setField("scale_max")}
              type="number"
              size="small"
              fullWidth
              sx={styles.numberField}
            />
          </Box>

          <Box sx={styles.row}>
            <TextField
              label="Default weight"
              value={form.default_weight}
              onChange={setField("default_weight")}
              type="number"
              size="small"
              fullWidth
              sx={styles.numberField}
              helperText="Projects can override this per suite."
            />
            <TextField
              label="Default target"
              value={form.default_target}
              onChange={setField("default_target")}
              type="number"
              size="small"
              fullWidth
              sx={styles.numberField}
              helperText="Leave blank for no pass/fail threshold."
            />
            <TextField
              select
              label="Operator"
              value={form.default_target_operator}
              onChange={setField("default_target_operator")}
              size="small"
              fullWidth
              disabled={numbers.default_target === null}
            >
              {TARGET_OPERATORS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Alert severity="info">
            The definition is stored at platform level. A project gets its own
            copy when it attaches the dimension from the catalog, and can set
            its own weight and target but not edit the definition. Use Sync to
            push a later edit to the projects already using it.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || !!validationError}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const styles = {
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    paddingTop: "0.5rem",
  },
  row: {
    display: "flex",
    gap: "1rem",
  },
  numberField: {
    "& input[type=number]": {
      MozAppearance: "textfield",
    },
    "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
      {
        WebkitAppearance: "none",
        margin: 0,
      },
  },
};
