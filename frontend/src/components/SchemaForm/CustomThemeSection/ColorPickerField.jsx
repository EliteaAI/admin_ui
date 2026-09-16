import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Box, Popover, TextField, Tooltip, Typography, useTheme } from "@mui/material";
import { InfoOutlined as InfoOutlinedIcon } from "@mui/icons-material";
import { Sketch } from "@uiw/react-color";
import PropTypes from "prop-types";

import { isValidColor } from "./constants";

const ColorPickerField = memo((props) => {
  const { label, hint, value, onChange, colorKey } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [localValue, setLocalValue] = useState(value || "");
  const inputRef = useRef(null);
  const theme = useTheme();

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleSwatchClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleColorChange = useCallback(
    (color) => {
      const newValue = color.hexa || color.hex;
      setLocalValue(newValue);
      onChange(colorKey, newValue);
    },
    [colorKey, onChange],
  );

  const handleInputChange = useCallback(
    (event) => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      // Only update parent if valid color or gradient
      if (isValidColor(newValue) || newValue === "") {
        onChange(colorKey, newValue);
      }
    },
    [colorKey, onChange],
  );

  const handleInputBlur = useCallback(() => {
    // Restore to last valid value if invalid
    if (!isValidColor(localValue) && localValue !== "") {
      setLocalValue(value || "");
    }
  }, [localValue, value]);

  const open = Boolean(anchorEl);
  const isGradient =
    localValue?.startsWith("linear-gradient") ||
    localValue?.startsWith("radial-gradient");
  const hasColor = localValue && isValidColor(localValue);
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <Box sx={styles.root}>
      <Box sx={styles.labelRow}>
        <Typography variant="body2" sx={styles.label}>
          {label}
        </Typography>
        {hint && (
          <Tooltip title={hint} arrow placement="top">
            <InfoOutlinedIcon sx={styles.infoIcon} />
          </Tooltip>
        )}
      </Box>

      <Box sx={styles.inputRow}>
        <Tooltip title={isGradient ? "Gradients can't use picker" : "Click to pick color"}>
          <Box
            sx={[
              styles.swatch,
              isGradient && styles.swatchGradient,
              !hasColor && styles.swatchEmpty,
            ]}
            style={hasColor ? { background: localValue } : undefined}
            onClick={isGradient ? undefined : handleSwatchClick}
          />
        </Tooltip>

        <TextField
          ref={inputRef}
          size="small"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="#000000"
          sx={styles.input}
          slotProps={{
            input: {
              sx: styles.inputInner,
            },
          }}
        />
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: styles.popover,
          },
        }}
      >
        <Box sx={styles.sketchWrapper(isDarkMode)}>
          <Sketch
            color={localValue || "#000000"}
            onChange={handleColorChange}
            disableAlpha={false}
          />
        </Box>
      </Popover>
    </Box>
  );
});

ColorPickerField.displayName = "ColorPickerField";

ColorPickerField.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  colorKey: PropTypes.string.isRequired,
};

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    minWidth: "12rem",
  },
  labelRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  infoIcon: ({ palette }) => ({
    fontSize: "0.875rem",
    color: palette.text.secondary,
    cursor: "help",
  }),
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  swatch: ({ palette }) => ({
    width: "1.75rem",
    height: "1.75rem",
    borderRadius: "0.25rem",
    border: `1px solid ${palette.border.default}`,
    cursor: "pointer",
    flexShrink: 0,
    transition: "transform 0.1s ease",
    "&:hover": {
      transform: "scale(1.1)",
    },
  }),
  swatchGradient: {
    cursor: "not-allowed",
    "&:hover": {
      transform: "none",
    },
  },
  swatchEmpty: ({ palette }) => ({
    background: `
      linear-gradient(45deg, ${palette.border.default} 25%, transparent 25%),
      linear-gradient(-45deg, ${palette.border.default} 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, ${palette.border.default} 75%),
      linear-gradient(-45deg, transparent 75%, ${palette.border.default} 75%)
    `,
    backgroundSize: "8px 8px",
    backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
  }),
  input: {
    flex: 1,
    "& .MuiInputBase-input": {
      fontSize: "0.8125rem",
      fontFamily: "monospace",
      padding: "0.375rem 0.5rem",
    },
  },
  inputInner: {
    height: "1.75rem",
  },
  popover: {
    overflow: "visible",
  },
  sketchWrapper: (isDarkMode) => ({
    "& .w-color-sketch": {
      backgroundColor: isDarkMode ? "#1e1e1e !important" : "#ffffff !important",
      boxShadow: isDarkMode
        ? "0 0 0 1px rgba(255,255,255,0.1), 0 8px 16px rgba(0,0,0,0.4) !important"
        : "0 0 0 1px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.15) !important",
    },
    "& .w-color-sketch input": {
      backgroundColor: isDarkMode ? "#2d2d2d !important" : "#f5f5f5 !important",
      color: isDarkMode ? "#e0e0e0 !important" : "#333333 !important",
      border: isDarkMode ? "1px solid #444 !important" : "1px solid #ccc !important",
    },
    "& .w-color-sketch label": {
      color: isDarkMode ? "#aaa !important" : "#666 !important",
    },
  }),
};

export default ColorPickerField;
