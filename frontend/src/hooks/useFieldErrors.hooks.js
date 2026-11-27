import { useCallback, useState } from 'react';

/**
 * Fields that show an input error, reported by SchemaField through FieldErrorsContext. A page with a
 * shared Save bar provides reportFieldError and keeps Save disabled while hasFieldErrors is true.
 */
export const useFieldErrors = () => {
  const [erroredFieldIds, setErroredFieldIds] = useState(() => new Set());

  const reportFieldError = useCallback((fieldId, hasError) => {
    setErroredFieldIds(prev => {
      if (prev.has(fieldId) === hasError) return prev;
      const next = new Set(prev);
      if (hasError) next.add(fieldId);
      else next.delete(fieldId);
      return next;
    });
  }, []);

  return { hasFieldErrors: erroredFieldIds.size > 0, reportFieldError };
};
