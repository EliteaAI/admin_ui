import { useCallback, useEffect, useMemo, useState } from 'react';

import { useConfigValuesQuery } from '@/api/configuration.api';

const EMPTY_VALUES = {};

/**
 * Unsaved edits for one backend config section: the server copy plus a local draft.
 * Saving is left to the caller so a page can save several sections as separate requests.
 */
export const useConfigSectionDraft = (sectionId, { skip }) => {
  const { data, isLoading } = useConfigValuesQuery({ sectionId }, { refetchOnMountOrArgChange: true, skip });

  const [serverValues, setServerValues] = useState(EMPTY_VALUES);
  const [values, setValues] = useState(EMPTY_VALUES);

  useEffect(() => {
    if (data?.values) {
      setServerValues(data.values);
      setValues(data.values);
    }
  }, [data]);

  const isDirty = useMemo(
    () => !skip && JSON.stringify(values) !== JSON.stringify(serverValues),
    [skip, values, serverValues],
  );

  const onChange = useCallback((key, value) => {
    setValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const discard = useCallback(() => {
    setValues(serverValues);
  }, [serverValues]);

  const markSaved = useCallback(savedValues => {
    setServerValues(savedValues);
    setValues({ ...savedValues });
  }, []);

  return useMemo(
    () => ({ sectionId, values, isDirty, isLoading: !skip && isLoading, onChange, discard, markSaved }),
    [sectionId, values, isDirty, skip, isLoading, onChange, discard, markSaved],
  );
};
