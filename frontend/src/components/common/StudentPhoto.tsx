import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { resolveImageUrl } from '../../utils/imageUrl';

interface Props { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg'; button?: boolean; onClick?: () => void; }

export default function StudentPhoto({ name, src, size = 'md', button, onClick }: Props) {
  const resolvedSrc = resolveImageUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    setFailedSrc(null);
  }, [resolvedSrc]);

  const showPhoto = resolvedSrc && failedSrc !== resolvedSrc;
  const photo = showPhoto ? (
    <img className={`studentPhoto ${size}`} src={resolvedSrc} alt={name} onError={() => setFailedSrc(resolvedSrc)} />
  ) : (
    <Avatar name={name} size={size} />
  );
  if (!button) return photo;
  return <button className="photoButton" type="button" onClick={onClick} aria-label={`View ${name} photo`}>{photo}</button>;
}
