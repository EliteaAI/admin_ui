import { useCallback, useState } from 'react';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Paging for the drawers of this page. The query needs page and pageSize before the total is known, so the
// props for GridTablePagination are built from the total afterwards: `<GridTablePagination {...getPaginationProps(total)} />`
export const useDrawerPagination = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const handlePrevPage = useCallback(() => setPage(prev => Math.max(0, prev - 1)), []);
  const handleNextPage = useCallback(() => setPage(prev => prev + 1), []);
  const handlePageSizeChange = useCallback(value => {
    setPageSize(value);
    setPage(0);
  }, []);

  const getPaginationProps = useCallback(
    total => ({
      totalRows: total,
      pageSize,
      isFirstPage: page === 0,
      isLastPage: (page + 1) * pageSize >= total,
      startRow: total > 0 ? page * pageSize + 1 : 0,
      endRow: Math.min((page + 1) * pageSize, total),
      handlePrevPage,
      handleNextPage,
      handlePageSizeChange,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    }),
    [page, pageSize, handlePrevPage, handleNextPage, handlePageSizeChange],
  );

  return { page, pageSize, getPaginationProps };
};
