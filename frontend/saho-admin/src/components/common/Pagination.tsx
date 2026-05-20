interface Props { total: number; page: number; pageSize: number; onChange: (page: number) => void; }
export default function Pagination({ total, page, pageSize, onChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(total, page * pageSize);
  return <div className="pagination"><span>Showing {start}-{end} of {total}</span><div className="pageBtns">{Array.from({ length: pages }, (_, i) => i + 1).map(p => <button className={`pageBtn ${p === page ? 'active' : ''}`} key={p} onClick={() => onChange(p)}>{p}</button>)}</div></div>;
}
