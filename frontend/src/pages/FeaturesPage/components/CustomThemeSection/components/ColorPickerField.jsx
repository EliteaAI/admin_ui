import { memo, useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import { Box, Chip, IconButton, Popover, TextField, Tooltip, Typography } from '@mui/material';

import {
  isGradient,
  isValidColor,
} from '@/pages/FeaturesPage/components/CustomThemeSection/helpers/color.helpers';
import { Sketch } from '@uiw/react-color';

const ColorPickerField = memo(props => {
  const { label, hint, value, baseModeLabel, onChange, colorKey } = props;

  const styles = colorPickerFieldStyles();

  const [anchorEl, setAnchorEl] = useState(null);
  const [localValue, setLocalValue] = useState(value || '');

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleSwatchClick = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleColorChange = useCallback(
    color => {
      const newValue = color.hexa || color.hex;
      setLocalValue(newValue);
      onChange(colorKey, newValue);
    },
    [colorKey, onChange],
  );

  const handleInputChange = useCallback(
    event => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      // Only update parent if valid color or gradient
      if (isValidColor(newValue) || newValue === '') {
        onChange(colorKey, newValue);
      }
    },
    [colorKey, onChange],
  );

  const handleReset = useCallback(() => {
    setLocalValue('');
    onChange(colorKey, '');
  }, [colorKey, onChange]);

  const handleInputBlur = useCallback(() => {
    // Restore to last valid value if invalid
    if (!isValidColor(localValue) && localValue !== '') {
      setLocalValue(value || '');
    }
  }, [localValue, value]);

  const open = Boolean(anchorEl);
  const gradient = isGradient(localValue);
  const hasColor = localValue && isValidColor(localValue);
  // Only a value stored in the theme overrides the base theme, an empty field inherits from it
  const isCustomized = Boolean(value);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.labelRow}>
        <Box sx={styles.labelGroup}>
          <Typography
            variant="body2"
            sx={styles.label}
          >
            {label}
          </Typography>
          {hint && (
            <Tooltip
              title={hint}
              arrow
              placement="top"
            >
              <InfoOutlinedIcon sx={styles.infoIcon} />
            </Tooltip>
          )}
        </Box>
        <Tooltip
          title={
            isCustomized
              ? `Overrides the ${baseModeLabel} base theme`
              : `Uses the ${baseModeLabel} base theme color`
          }
          arrow
          placement="top"
        >
          <Chip
            label={isCustomized ? 'Custom' : 'Inherited'}
            size="small"
            color={isCustomized ? 'primary' : 'default'}
            variant="outlined"
            sx={styles.statusChip}
          />
        </Tooltip>
      </Box>

      <Box sx={styles.inputRow}>
        <Tooltip
          title={
            gradient
              ? "Gradients can't use picker"
              : isCustomized
                ? 'Click to pick color'
                : `Inherited from ${baseModeLabel}, click to customize`
          }
        >
          <Box
            sx={[
              styles.swatch,
              gradient && styles.swatchGradient,
              !hasColor && styles.swatchEmpty,
              hasColor && styles.swatchColor(localValue),
            ]}
            onClick={gradient ? undefined : handleSwatchClick}
          />
        </Tooltip>

        <TextField
          size="small"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={`From ${baseModeLabel}`}
          sx={styles.input}
          slotProps={{
            input: {
              sx: styles.inputInner,
            },
          }}
        />

        {isCustomized && (
          <Tooltip title={`Reset to ${baseModeLabel}`}>
            <IconButton
              size="small"
              onClick={handleReset}
              aria-label={`Reset ${label} to ${baseModeLabel}`}
              sx={styles.resetButton}
            >
              <RestartAltOutlinedIcon sx={styles.resetIcon} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: styles.popover,
          },
        }}
      >
        <Box sx={styles.sketchWrapper}>
          <Sketch
            color={localValue || '#000000'}
            onChange={handleColorChange}
            disableAlpha={false}
          />
        </Box>
      </Popover>
    </Box>
  );
});

ColorPickerField.displayName = 'ColorPickerField';

ColorPickerField.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  value: PropTypes.string,
  baseModeLabel: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  colorKey: PropTypes.string.isRequired,
};

/** @type {MuiSx} */
const colorPickerFieldStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: '12rem',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  labelGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: 0,
  },
  statusChip: {
    flexShrink: 0,
    fontSize: '0.625rem',
    height: '1.125rem',
    '& .MuiChip-label': {
      padding: '0 0.375rem',
    },
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  infoIcon: ({ palette }) => ({
    fontSize: '0.875rem',
    color: palette.text.secondary,
    cursor: 'help',
  }),
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  swatch: ({ palette }) => ({
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: '0.25rem',
    border: `0.0625rem solid ${palette.border.table}`,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'transform 0.1s ease',
    '&:hover': {
      transform: 'scale(1.1)',
    },
  }),
  // The swatch previews the user-picked value, not a theme color
  swatchColor: color => ({
    background: color,
  }),
  swatchGradient: {
    cursor: 'not-allowed',
    '&:hover': {
      transform: 'none',
    },
  },
  swatchEmpty: ({ palette }) => ({
    background: `
      linear-gradient(45deg, ${palette.border.table} 25%, transparent 25%),
      linear-gradient(-45deg, ${palette.border.table} 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, ${palette.border.table} 75%),
      linear-gradient(-45deg, transparent 75%, ${palette.border.table} 75%)
    `,
    backgroundSize: '0.5rem 0.5rem',
    backgroundPosition: '0 0, 0 0.25rem, 0.25rem -0.25rem, -0.25rem 0rem',
  }),
  input: {
    flex: 1,
    '& .MuiInputBase-input': {
      fontSize: '0.8125rem',
      fontFamily: 'monospace',
      padding: '0.375rem 0.5rem',
    },
  },
  inputInner: {
    height: '1.75rem',
  },
  resetButton: {
    padding: '0.25rem',
  },
  resetIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.main,
  }),
  popover: {
    overflow: 'visible',
  },
  // The picker ships its own light styling, so the theme has to win here.
  // The Popover paper already carries the elevation shadow.
  sketchWrapper: ({ palette }) => ({
    '& .w-color-sketch': {
      backgroundColor: `${palette.background.secondary} !important`,
      boxShadow: 'none !important',
    },
    '& .w-color-sketch input': {
      backgroundColor: `${palette.background.userInputBackgroundActive} !important`,
      color: `${palette.text.primary} !important`,
      border: `0.0625rem solid ${palette.border.table} !important`,
    },
    '& .w-color-sketch label': {
      color: `${palette.text.metrics} !important`,
    },
  }),
});

export default ColorPickerField;
