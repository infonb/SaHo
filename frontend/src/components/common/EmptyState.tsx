export default function EmptyState({ title = 'No records found' }: { title?: string }) { return <div className="empty">{title}</div>; }
