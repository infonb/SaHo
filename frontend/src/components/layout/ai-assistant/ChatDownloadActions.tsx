type Props = {
  title?: string;
  items: Array<{
    label: string;
    type: 'pdf' | 'excel';
  }>;
};

export default function ChatDownloadActions({ title, items }: Props) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="aiDownloadCard">
      {title ? <div className="aiBlockTitle">{title}</div> : null}
      <div className="aiDownloadActions">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`aiDownloadButton ${item.type === 'pdf' ? 'primary' : 'secondary'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
