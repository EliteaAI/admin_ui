import { useCallback, useMemo, useState } from 'react';

import { draftFromSettings, isDraftDirty } from '../helpers/governanceSettings.helpers';

// The form's working copy of the stored settings. It follows the server only when the settings values change,
// so a preflight re-check does not throw away what the operator typed.
export const useGovernanceDraft = data => {
  const baseKey = data ? JSON.stringify(draftFromSettings(data)) : '';
  const base = useMemo(() => (baseKey ? JSON.parse(baseKey) : null), [baseKey]);

  const [draft, setDraft] = useState(base);
  const [syncedBase, setSyncedBase] = useState(base);

  // React re-renders at once after this, but the rest of this render still runs: hand out the new base meanwhile
  const isStale = syncedBase !== base;
  if (isStale) {
    setSyncedBase(base);
    setDraft(base);
  }

  const setField = useCallback((field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback(() => setDraft(base), [base]);

  const isDirty = useMemo(() => isDraftDirty(draft, base), [draft, base]);

  return { draft: isStale ? base : draft, isDirty, setField, reset };
};
