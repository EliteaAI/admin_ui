import { useCallback, useState } from 'react';

import { DEFAULT_PAGE_SIZE, DEFAULT_SORT } from '@/pages/GovernancePage/constants/governance.constants';

// The page, page size and sort of a server-side list. Any change of the sort or the size goes back to the first page.
export const useGovernanceTable = (initialSort = DEFAULT_SORT) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState(initialSort);

  const resetPage = useCallback(() => setPage(0), []);

  const handleSort = useCallback(field => {
    setSort(prev =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' },
    );
    setPage(0);
  }, []);

  const handlePageSizeChange = useCallback(value => {
    setPageSize(value);
    setPage(0);
  }, []);

  return { page, setPage, resetPage, pageSize, handlePageSizeChange, sort, handleSort };
};
