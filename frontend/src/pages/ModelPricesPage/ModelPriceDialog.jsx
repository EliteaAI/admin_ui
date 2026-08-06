import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";

import {
  useModelPriceCreateMutation,
  useModelPriceUpdateMutation,
} from "@/api/modelPricesApi";

import {
  MODEL_MODES,
  PRICE_FIELDS,
  fromPerMillion,
  toPerMillion,
} from "./constants";

const EMPTY = {
  model_name: "",
  provider: "",
  mode: "",
  input_cost_per_token: "",
  output_cost_per_token: "",
  cache_read_input_token_cost: "",
  cache_creation_input_token_cost: "",
  max_input_tokens: "",
  max_output_tokens: "",
};

function ModelPriceDialog({ open, target, onClose, onSaved }) {
  const isEdit = !!target;
  const [form, setForm] = useState(EMPTY);
  const [customMode, setCustomMode] = useState(false);
  const [error, setError] = useState("");

  const [createPrice, { isLoading: isCreating }] =
    useModelPriceCreateMutation();
  const [updatePrice, { isLoading: isUpdating }] =
    useModelPriceUpdateMutation();
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (target) {
      setForm({
        model_name: target.model_name || "",
        provider: target.provider || "",
        mode: target.mode || "",
        input_cost_per_token: toPerMillion(target.input_cost_per_token),
        output_cost_per_token: toPerMillion(target.output_cost_per_token),
        cache_read_input_token_cost: toPerMillion(
          target.cache_read_input_token_cost,
        ),
        cache_creation_input_token_cost: toPerMillion(
          target.cache_creation_input_token_cost,
        ),
        max_input_tokens: target.max_input_tokens ?? "",
        max_output_tokens: target.max_output_tokens ?? "",
      });
      setCustomMode(!!target.is_custom);
    } else {
      setForm(EMPTY);
      setCustomMode(true);
    }
    setError("");
  }, [open, target]);

  // Editing an imported row is gated behind switching on custom mode; create
  // is always custom. Fields lock whenever custom mode is off.
  const fieldsLocked = isLoading || !customMode;

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const payload = useMemo(() => {
    const body = {};
    if (form.provider.trim()) body.provider = form.provider.trim();
    if (form.mode) body.mode = form.mode;
    for (const { key } of PRICE_FIELDS) {
      const converted = fromPerMillion(form[key]);
      if (converted !== undefined) body[key] = converted;
    }
    if (form.max_input_tokens !== "") {
      body.max_input_tokens = Number(form.max_input_tokens);
    }
    if (form.max_output_tokens !== "") {
      body.max_output_tokens = Number(form.max_output_tokens);
    }
    return body;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    setError("");
    const modelName = form.model_name.trim();
    if (!modelName) {
      setError("Model name is required.");
      return;
    }
    try {
      if (isEdit) {
        await updatePrice({ modelName, ...payload }).unwrap();
      } else {
        await createPrice({ model_name: modelName, ...payload }).unwrap();
      }
      onSaved?.(
        (isEdit ? "Custom price updated." : "Custom price created.") +
          " Restart the pylons to apply the change to cost estimation.",
      );
      onClose();
    } catch (err) {
      const detail = err?.data?.details?.[0]?.msg;
      setError(
        detail ??
          err?.data?.error ??
          err?.data?.message ??
          err?.error ??
          "Failed to save custom price.",
      );
    }
  }, [form, isEdit, payload, createPrice, updatePrice, onSaved, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? `Edit price — ${target.model_name}` : "Add custom price"}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus={!isEdit}
          margin="dense"
          label="Model name"
          fullWidth
          value={form.model_name}
          onChange={(e) => setField("model_name", e.target.value)}
          disabled={isLoading || isEdit}
          helperText={
            isEdit
              ? "Canonical model key (read-only)"
              : "Canonical model key, e.g. gpt-4o"
          }
        />
        {isEdit && !target.is_custom && (
          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Switch
                checked={customMode}
                onChange={(e) => setCustomMode(e.target.checked)}
                disabled={isLoading}
              />
            }
            label="Custom price"
          />
        )}
        <Box sx={styles.row}>
          <TextField
            margin="dense"
            label="Provider"
            fullWidth
            value={form.provider}
            onChange={(e) => setField("provider", e.target.value)}
            disabled={fieldsLocked}
          />
          <TextField
            margin="dense"
            label="Mode"
            fullWidth
            select
            value={form.mode}
            onChange={(e) => setField("mode", e.target.value)}
            disabled={fieldsLocked}
          >
            <MenuItem value="">
              <em>Unspecified</em>
            </MenuItem>
            {MODEL_MODES.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        {PRICE_FIELDS.map(({ key, label }) => (
          <TextField
            key={key}
            margin="dense"
            label={label}
            fullWidth
            type="number"
            value={form[key]}
            onChange={(e) => setField(key, e.target.value)}
            disabled={fieldsLocked}
            inputProps={{ min: 0, step: "any" }}
          />
        ))}
        <Box sx={styles.row}>
          <TextField
            margin="dense"
            label="Max input tokens"
            fullWidth
            type="number"
            value={form.max_input_tokens}
            onChange={(e) => setField("max_input_tokens", e.target.value)}
            disabled={fieldsLocked}
            inputProps={{ min: 0, step: 1 }}
          />
          <TextField
            margin="dense"
            label="Max output tokens"
            fullWidth
            type="number"
            value={form.max_output_tokens}
            onChange={(e) => setField("max_output_tokens", e.target.value)}
            disabled={fieldsLocked}
            inputProps={{ min: 0, step: 1 }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || !customMode}
        >
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const styles = {
  row: {
    display: "flex",
    gap: "1rem",
  },
};

ModelPriceDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  target: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
};

export default ModelPriceDialog;
