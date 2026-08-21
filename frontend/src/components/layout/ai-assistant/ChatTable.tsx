import type { AIMessageTableColumn, AIMessageTableRow } from './types';

type Props = {
  title?: string;
  columns: AIMessageTableColumn[];
  rows: AIMessageTableRow[];
};

export default function ChatTable({ title, columns, rows }: Props) {
  return (
    <section className="aiTableCard">
      {title ? <div className="aiBlockTitle">{title}</div> : null}
      <div className="aiTableShell">
        <table className="aiTable">
          <colgroup>
            {columns.map((column) => (
              <col key={column.key} style={{ width: column.width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} style={{ width: column.width, textAlign: column.align ?? 'left' }}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id}>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.id}-${index}`}>{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="aiTableEmptyRow">
                <td colSpan={columns.length}>No table data available yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
