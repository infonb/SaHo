export default function Avatar({
  name,
  size = 'md'
}: {
  name?: string;
  size?: string;
}) {

  const initials = (name || 'SP')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`avatar ${size}`}>
      {initials}
    </div>
  );
}
