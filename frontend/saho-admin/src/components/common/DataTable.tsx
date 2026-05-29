import type { ReactNode } from 'react';

interface Column { key: string; label: ReactNode; width?: string; }
interface Props { columns: Column[]; rows: ReactNode[][]; loading?: boolean; onRowClick?: (index: number) => void; rowClassName?: string | ((index: number) => string); }
export default function DataTable({ columns, rows, loading, onRowClick, rowClassName }: Props) {
  const getRowClassName = (index: number) => {
    const customClassName = typeof rowClassName === 'function' ? rowClassName(index) : rowClassName;
    return [onRowClick ? 'clickable' : '', customClassName].filter(Boolean).join(' ');
  };

  return <div className="tableWrap"><table><thead><tr>{columns.map(c => <th key={c.key} style={{ width: c.width }}>{c.label}</th>)}</tr></thead><tbody>{loading ? [0, 1, 2].map(i => <tr key={i}>{columns.map(c => <td key={c.key}><div className="skeleton" style={{ height: 16 }} /></td>)}</tr>) : rows.map((r, i) => <tr key={i} className={getRowClassName(i)} onClick={() => onRowClick?.(i)}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table>{!loading && rows.length === 0 && <div className="empty">No records found.</div>}</div>;
}
