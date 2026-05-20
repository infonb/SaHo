import { useEffect, useMemo, useState } from 'react';

export const usePagination = <T,>(items: T[], initialPageSize = 5) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => {
    setPage(current => Math.min(current, totalPages));
  }, [totalPages]);
  const current = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);
  const changePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };
  return { page, setPage, pageSize, setPageSize: changePageSize, totalPages, current };
};
