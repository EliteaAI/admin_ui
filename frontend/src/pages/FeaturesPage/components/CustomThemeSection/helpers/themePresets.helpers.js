import { THEME_PRESETS } from '@/pages/FeaturesPage/components/CustomThemeSection/constants/themePresets.constants';

/**
 * Deep-compare two palette values (plain objects and primitives), ignoring key order
 * @param {*} a - First value
 * @param {*} b - Second value
 * @returns {boolean} True if both values hold the same tokens
 */
export const isSamePalette = (a, b) => {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;

  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;

  return aKeys.every(key => Object.hasOwn(b, key) && isSamePalette(a[key], b[key]));
};

/**
 * Find the preset a saved theme was created from, if it is still unmodified
 * @param {string} mode - Theme base mode
 * @param {object} palette - Theme palette
 * @returns {string} The matching preset id, or '' when none matches
 */
export const findMatchingPresetId = (mode, palette) =>
  THEME_PRESETS.find(preset => preset.mode === mode && isSamePalette(preset.palette, palette))?.id ?? '';
