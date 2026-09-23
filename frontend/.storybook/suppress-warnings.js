// Suppress React testing warnings in Storybook
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = function (...args) {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: The current testing environment is not configured') ||
        args[0].includes('Warning: An update to') ||
        args[0].includes('act(...)'))
    ) {
      return;
    }
    return originalError.apply(console, args);
  };

  const originalWarn = console.warn;
  console.warn = function (...args) {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      args[0].includes('was preloaded using link preload but not used')
    ) {
      return;
    }
    return originalWarn.apply(console, args);
  };
}
