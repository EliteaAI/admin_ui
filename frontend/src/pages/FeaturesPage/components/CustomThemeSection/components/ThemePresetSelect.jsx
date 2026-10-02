import { memo, useCallback, useMemo } from 'react';

import PropTypes from 'prop-types';

import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Tooltip, Typography } from '@mui/material';

import {
  PRESET_SWATCH_PATHS,
  THEME_PRESETS,
} from '@/pages/FeaturesPage/components/CustomThemeSection/constants/themePresets.constants';
import { getNestedValue } from '@/pages/FeaturesPage/components/CustomThemeSection/helpers/nestedValue.helpers';

const ThemePresetSelect = memo(props => {
  const { mode, value, isModified, onSelect, disabled } = props;

  const styles = themePresetSelectStyles();

  // Presets are tied to a base mode, so only the current mode's presets are offered
  const presets = useMemo(() => THEME_PRESETS.filter(preset => preset.mode === mode), [mode]);

  const handleChange = useCallback(
    event => {
      const preset = presets.find(item => item.id === event.target.value);
      if (preset) onSelect(preset);
    },
    [presets, onSelect],
  );

  const renderSwatches = useCallback(
    preset => (
      <Box sx={styles.swatches}>
        {PRESET_SWATCH_PATHS.map(path => (
          <Box
            key={path}
            sx={styles.swatch}
            style={{ background: getNestedValue(preset.palette, path) }}
          />
        ))}
      </Box>
    ),
    [styles.swatches, styles.swatch],
  );

  const renderValue = useCallback(
    selectedId => {
      const preset = presets.find(item => item.id === selectedId);
      if (!preset) {
        return (
          <Typography
            variant="body2"
            sx={styles.placeholder}
          >
            Select preset
          </Typography>
        );
      }

      return (
        <Box sx={styles.option}>
          {renderSwatches(preset)}
          <Typography
            variant="body2"
            noWrap
          >
            {preset.name}
          </Typography>
          {isModified && (
            <Tooltip
              title="Colors were changed after applying this preset"
              arrow
              placement="top"
            >
              <Chip
                label="Modified"
                size="small"
                color="warning"
                variant="outlined"
                sx={styles.modifiedChip}
              />
            </Tooltip>
          )}
        </Box>
      );
    },
    [presets, isModified, renderSwatches, styles.placeholder, styles.option, styles.modifiedChip],
  );

  return (
    <FormControl sx={styles.root}>
      <InputLabel shrink>Theme Preset</InputLabel>
      <Select
        value={presets.some(preset => preset.id === value) ? value : ''}
        onChange={handleChange}
        label="Theme Preset"
        displayEmpty
        notched
        renderValue={renderValue}
        disabled={disabled}
      >
        {presets.map(preset => (
          <MenuItem
            key={preset.id}
            value={preset.id}
          >
            <Box sx={styles.option}>
              {renderSwatches(preset)}
              <Typography variant="body2">{preset.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});

ThemePresetSelect.displayName = 'ThemePresetSelect';

ThemePresetSelect.propTypes = {
  mode: PropTypes.string.isRequired,
  value: PropTypes.string,
  isModified: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

/** @type {MuiSx} */
const themePresetSelectStyles = () => ({
  root: {
    minWidth: '15rem',
    '& .MuiInputBase-root': {
      height: '2.25rem',
      fontSize: '0.875rem',
    },
  },
  placeholder: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  swatches: {
    display: 'flex',
    flexShrink: 0,
  },
  swatch: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    borderRadius: '50%',
    border: `0.0625rem solid ${palette.border.table}`,
    '&:not(:first-of-type)': {
      marginLeft: '-0.25rem',
    },
  }),
  modifiedChip: {
    height: '1.25rem',
    fontSize: '0.6875rem',
  },
});

export default ThemePresetSelect;
