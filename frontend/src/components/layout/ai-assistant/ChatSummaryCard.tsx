type Props = {
  title?: string;
  cards: Array<{
    label: string;
    value: string;
    tone?: 'purple' | 'green' | 'blue' | 'amber';
  }>;
};

export default function ChatSummaryCard({ title, cards }: Props) {
  return (
    <section className="aiSummaryCard">
      {title ? <div className="aiBlockTitle">{title}</div> : null}
      <div className="aiSummaryGrid">
        {cards.map((card) => (
          <article key={card.label} className={`aiSummaryTile tone-${card.tone ?? 'purple'}`}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
