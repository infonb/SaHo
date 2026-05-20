interface Props { name: string; size?: 'sm' | 'md' | 'lg'; }
export default function Avatar({ name, size = 'md' }: Props) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return <span className={`avatar ${size}`}>{initials}</span>;
}
