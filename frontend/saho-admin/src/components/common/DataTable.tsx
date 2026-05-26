import type { ReactNode } from 'react';

interface Column { key: string; label: string; width?: string; }
interface Props {
  columns: Column[];
  rows: ReactNode[][];
  loading?: boolean;
  onRowClick?: (index: number) => void;
  rowClassName?: (index: number) => string | undefined;
}
export default function DataTable({ columns, rows, loading, onRowClick, rowClassName }: Props) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>{columns.map(c => <th key={c.key} style={{ width: c.width }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {loading
            ? [0, 1, 2].map(i => (
                <tr key={i}>
                  {columns.map(c => (
                    <td key={c.key}>
                      <div className="skeleton" style={{ height: 16 }} />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((r, i) => (
                <tr
                  key={i}
                  className={[onRowClick ? 'clickable' : '', rowClassName?.(i) ?? ''].filter(Boolean).join(' ')}
                  onClick={() => onRowClick?.(i)}
                >
                  {r.map((cell, j) => <td key={j}>{cell}</td>)}
                </tr>
              ))}
        </tbody>
      </table>

      {!loading && rows.length === 0 && <div className="empty">No records found.</div>}
    </div>
  );
}
