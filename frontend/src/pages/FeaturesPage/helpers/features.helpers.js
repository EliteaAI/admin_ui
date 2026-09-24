/** Resolves the URL hash to a nav page, and the block to expand when it is a former standalone section. */
export const resolveSectionFromHash = (hash, sections, redirects) => {
  const redirect = redirects[hash];
  if (redirect) return redirect;

  if (sections.some(s => s.id === hash)) return { page: hash, block: null };

  return { page: sections[0].id, block: null };
};

/** Empty link rows are editor placeholders and must not be persisted. */
export const cleanValuesForSave = values =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (key.endsWith('_links') && Array.isArray(value)) {
        return [key, value.filter(link => link.title?.trim() !== '' || link.url?.trim() !== '')];
      }
      return [key, value];
    }),
  );

/** Normalizes requires_restart entries from several saves into one entry per pylon. */
export const mergeRequiredRestarts = entries => {
  const byPylon = new Map();

  entries.forEach(entry => {
    const { pylon_id: pylonId, plugins = [] } = typeof entry === 'string' ? { pylon_id: entry } : entry;
    const existing = byPylon.get(pylonId);
    // No plugin list means the whole pylon restarts, which covers any plugin-only reload
    const wholePylon = !plugins.length || (existing && !existing.plugins.length);

    byPylon.set(pylonId, {
      pylon_id: pylonId,
      plugins: wholePylon ? [] : [...new Set([...(existing?.plugins ?? []), ...plugins])],
    });
  });

  return [...byPylon.values()];
};
