import type { SuggestedQuestion } from './types';

type Props = {
  items: SuggestedQuestion[];
  onSelect: (prompt: string) => void;
};

export default function SuggestedQuestions({ items, onSelect }: Props) {
  return (
    <section className="aiSuggestions" aria-label="Suggested questions">
      <div className="aiSuggestionGrid">
        {items.map((item) => (
          <button
            key={item.prompt}
            type="button"
            className="aiSuggestionChip"
            onClick={() => onSelect(item.prompt)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
