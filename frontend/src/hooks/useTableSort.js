import { useCallback, useState } from 'react';

export const useTableSort = (options) => {
  const { defaultField = 'name', defaultDirection = 'asc', comparators = {} } = options || {};

  const [sortConfig, setSortConfig] = useState({
    field: defaultField,
    direction: defaultDirection,
  });

  const handleSort = useCallback((field) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const sortData = useCallback(
    (data) => {
      if (!data || data.length === 0) {
        return data;
      }

      const sorted = [...data];
      const { field, direction } = sortConfig;

      sorted.sort((a, b) => {
        let aValue = a[field];
        let bValue = b[field];

        if (comparators[field]) {
          const result = comparators[field](aValue, bValue, a, b);
          return direction === 'asc' ? result : -result;
        }

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return direction === 'asc' ? 1 : -1;
        if (bValue == null) return direction === 'asc' ? -1 : 1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });

      return sorted;
    },
    [sortConfig, comparators],
  );

  return {
    sortConfig,
    handleSort,
    sortData,
  };
};
