import Avatar from './Avatar';

interface Props { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg'; button?: boolean; onClick?: () => void; }

export default function StudentPhoto({ name, src, size = 'md', button, onClick }: Props) {
  const photo = src ? <img className={`studentPhoto ${size}`} src={src} alt={name} /> : <Avatar name={name} size={size} />;
  if (!button) return photo;
  return <button className="photoButton" type="button" onClick={onClick} aria-label={`View ${name} photo`}>{photo}</button>;
}
