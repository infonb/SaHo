interface Props { label: string; value: string | number; note?: string; accentColor?: string; }
export default function StatCard({ label, value, note, accentColor = 'var(--color-primary)' }: Props) {
  return <div className="statCard" style={{ '--accent': accentColor } as React.CSSProperties}><div className="statLabel">{label}</div><div className="statValue">{value}</div>{note && <div className="statNote">{note}</div>}</div>;
}
