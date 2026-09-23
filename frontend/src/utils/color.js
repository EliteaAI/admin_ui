const CSS_COLOR_KEYWORDS = [
  'transparent',
  'none',
  'inherit',
  'initial',
  'unset',
  'green',
  'red',
  'blue',
  'white',
  'black',
];

/**
 * Validate if a string is a valid color (hex, rgb, rgba, hsl, hsla, or CSS gradient)
 * @param {string} value - The color string to validate
 * @returns {boolean} True if valid color
 */
export const isValidColor = value => {
  if (!value || typeof value !== 'string') return false;

  if (isGradient(value)) return true;

  // Hex color
  if (/^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(value)) {
    return true;
  }

  // rgb/rgba
  if (/^rgba?\s*\(/.test(value)) return true;

  // hsl/hsla
  if (/^hsla?\s*\(/.test(value)) return true;

  return CSS_COLOR_KEYWORDS.includes(value.toLowerCase());
};

/**
 * Check whether a color value is a CSS gradient, which the color picker cannot edit
 * @param {string} value - The color string to check
 * @returns {boolean} True if the value is a gradient
 */
export const isGradient = value =>
  typeof value === 'string' && (value.startsWith('linear-gradient') || value.startsWith('radial-gradient'));
