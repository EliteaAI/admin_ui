/**
 * Helpers for reading and writing values addressed by a dot-notation path,
 * e.g. "background.default.primary".
 *
 * Keys that could reach Object.prototype are rejected, so a path coming from
 * an imported file can never pollute the prototype chain.
 */

/**
 * Get a nested value from an object using dot notation
 * @param {object} obj - The object to get the value from
 * @param {string} path - Dot-notation path (e.g., "background.default.primary")
 * @returns {*} The value at the path, or undefined if not found
 */
export const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
};

/**
 * Set a nested value in an object using dot notation.
 * Only the objects along the path are cloned, the rest is shared with the input.
 * @param {object} obj - The object to set the value in
 * @param {string} path - Dot-notation path
 * @param {*} value - The value to set
 * @returns {object} A new object with the value set, or the input when the path is unusable
 */
export const setNestedValue = (obj, path, value) => {
  if (!path) return obj;

  const keys = path.split(".");
  const result = { ...(obj || {}) };
  let current = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return obj;
    }

    const child = current[key];
    current[key] =
      child && typeof child === "object" && !Array.isArray(child)
        ? { ...child }
        : {};
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  if (
    lastKey === "__proto__" ||
    lastKey === "constructor" ||
    lastKey === "prototype"
  ) {
    return obj;
  }

  current[lastKey] = value;
  return result;
};

/**
 * Remove a nested value from an object using dot notation.
 * @param {object} obj - The object to remove the value from
 * @param {string} path - Dot-notation path
 * @returns {object} A new object without the value at the path
 */
export const unsetNestedValue = (obj, path) => {
  if (!obj || !path) return obj;

  const keys = path.split(".");
  const result = { ...obj };
  let current = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return obj;
    }

    const child = current[key];
    if (!child || typeof child !== "object" || Array.isArray(child)) {
      return obj;
    }

    current[key] = { ...child };
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  if (
    lastKey === "__proto__" ||
    lastKey === "constructor" ||
    lastKey === "prototype"
  ) {
    return obj;
  }

  delete current[lastKey];
  return result;
};
