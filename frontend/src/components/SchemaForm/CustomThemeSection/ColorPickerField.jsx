import { memo, useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import { Box, Popover, TextField, Tooltip, Typography } from '@mui/material';

import { isGradient, isValidColor } from '@/utils/color';
import { Sketch } from '@uiw/react-color';

const ColorPickerField = memo(props => {
  const { label, hint, value, onChange, colorKey } = props;
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

  const handleInputBlur = useCallback(() => {
    // Restore to last valid value if invalid
    if (!isValidColor(localValue) && localValue !== '') {
      setLocalValue(value || '');
    }
  }, [localValue, value]);

  const open = Boolean(anchorEl);
  const gradient = isGradient(localValue);
  const hasColor = localValue && isValidColor(localValue);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.labelRow}>
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

      <Box sx={styles.inputRow}>
        <Tooltip title={gradient ? "Gradients can't use picker" : 'Click to pick color'}>
          <Box
            sx={[styles.swatch, gradient && styles.swatchGradient, !hasColor && styles.swatchEmpty]}
            style={hasColor ? { background: localValue } : undefined}
            onClick={gradient ? undefined : handleSwatchClick}
          />
        </Tooltip>

        <TextField
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
  onChange: PropTypes.func.isRequired,
  colorKey: PropTypes.string.isRequired,
};

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: '12rem',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
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
    border: `1px solid ${palette.border.table}`,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'transform 0.1s ease',
    '&:hover': {
      transform: 'scale(1.1)',
    },
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
    backgroundSize: '8px 8px',
    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
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
      border: `1px solid ${palette.border.table} !important`,
    },
    '& .w-color-sketch label': {
      color: `${palette.text.metrics} !important`,
    },
  }),
};

export default ColorPickerField;
