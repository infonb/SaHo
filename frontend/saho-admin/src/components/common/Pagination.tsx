import { useEffect, useRef, useState } from 'react';
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowRight
} from "react-icons/md";

interface Props {
  total: number;
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const pageSizeOptions = [5, 10, 25, 50, 100];

export default function Pagination({ total, page, pageSize, onChange, onPageSizeChange }: Props) {
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const pageSizeRef = useRef<HTMLDetailsElement | null>(null);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(total, page * pageSize);
  const firstVisiblePage = Math.min(Math.max(page - 2, 1), Math.max(pages - 4, 1));
  const visiblePages = Array.from({ length: Math.min(5, pages) }, (_, i) => firstVisiblePage + i);

  const goTo = (nextPage: number) => {
    onChange(Math.min(Math.max(nextPage, 1), pages));
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (pageSizeRef.current && !pageSizeRef.current.contains(event.target as Node)) {
        setPageSizeOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPageSizeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="pagination">
      <span className="paginationSummary">Showing {start} to {end} of {total} Records</span>
      <div className="pageControls" aria-label="Pagination">
       
        <button
  className="pageNav"
  type="button"
  onClick={() => goTo(1)}
  disabled={page === 1}
  aria-label="First page"
>
  <MdKeyboardDoubleArrowLeft />
</button>

<button
  className="pageNav"
  type="button"
  onClick={() => goTo(page - 1)}
  disabled={page === 1}
  aria-label="Previous page"
>
  <MdKeyboardArrowLeft />
</button>
        <div className="pageBtns">
          {visiblePages.map(p => (
            <button className={`pageBtn ${p === page ? 'active' : ''}`} key={p} type="button" onClick={() => goTo(p)}>
              {p}
            </button>
          ))}
        </div>
       
<button
  className="pageNav"
  type="button"
  onClick={() => goTo(page + 1)}
  disabled={page === pages}
  aria-label="Next page"
>
  <MdKeyboardArrowRight />
</button>

<button
  className="pageNav"
  type="button"
  onClick={() => goTo(pages)}
  disabled={page === pages}
  aria-label="Last page"
>
  <MdKeyboardDoubleArrowRight />
</button>
        <details
          ref={pageSizeRef}
          className={`multiSelectFilter${pageSize ? ' hasValue' : ''}`}
          open={pageSizeOpen}
        >
          <summary
            className="multiSelectTrigger"
            aria-label="Rows per page"
            onClick={(event) => {
              event.preventDefault();
              setPageSizeOpen((current) => !current);
            }}
          >
            <span>{pageSize}</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </summary>
          <div className="multiSelectMenu">
            <div className="multiSelectMenuHead">
              <span>Rows per page</span>
            </div>
            <div className="multiSelectOptions">
              {pageSizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`multiSelectOption${size === pageSize ? ' selected' : ''}`}
                  onClick={() => {
                    onPageSizeChange?.(size);
                    setPageSizeOpen(false);
                  }}
                >
                  <span>{size}</span>
                </button>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
