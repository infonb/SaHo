interface Props {
  total: number;
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const pageSizeOptions = [10, 25, 50, 100];

export default function Pagination({ total, page, pageSize, onChange, onPageSizeChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(total, page * pageSize);
  const firstVisiblePage = Math.min(Math.max(page - 2, 1), Math.max(pages - 4, 1));
  const visiblePages = Array.from({ length: Math.min(5, pages) }, (_, i) => firstVisiblePage + i);

  const goTo = (nextPage: number) => {
    onChange(Math.min(Math.max(nextPage, 1), pages));
  };

  return (
    <div className="pagination">
      <span className="paginationSummary">Showing {start} to {end} of {total} Records</span>
      <div className="pageControls" aria-label="Pagination">
        <button className="pageNav" type="button" onClick={() => goTo(1)} disabled={page === 1} aria-label="First page">&lt;&lt;</button>
        <button className="pageNav" type="button" onClick={() => goTo(page - 1)} disabled={page === 1} aria-label="Previous page">&lt;</button>
        <div className="pageBtns">
          {visiblePages.map(p => (
            <button className={`pageBtn ${p === page ? 'active' : ''}`} key={p} type="button" onClick={() => goTo(p)}>
              {p}
            </button>
          ))}
        </div>
        <button className="pageNav" type="button" onClick={() => goTo(page + 1)} disabled={page === pages} aria-label="Next page">&gt;</button>
        <button className="pageNav" type="button" onClick={() => goTo(pages)} disabled={page === pages} aria-label="Last page">&gt;&gt;</button>
        <select
          className="pageSizeSelect"
          value={pageSize}
          onChange={event => onPageSizeChange?.(Number(event.target.value))}
          aria-label="Rows per page"
        >
          {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
        </select>
      </div>
    </div>
  );
}
