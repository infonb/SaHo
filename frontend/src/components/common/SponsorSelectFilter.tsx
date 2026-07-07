import { useEffect, useRef } from 'react';

export interface SponsorSelectOption {
  value: string;
  label: string;
}

interface SponsorSelectFilterProps {
  filterKey: string;
  label: string;
  value: string;
  options: SponsorSelectOption[];
  openFilter: string | null;
  setOpenFilter: (value: string | null) => void;
  onChange: (value: string) => void;
}

export default function SponsorSelectFilter({
  filterKey,
  label,
  value,
  options,
  openFilter,
  setOpenFilter,
  onChange,
}: SponsorSelectFilterProps) {
  const isOpen = openFilter === filterKey;
  const filterRef = useRef<HTMLDetailsElement>(null);
  const summary = options.find(option => option.value === value)?.label ?? label;

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isOpen, setOpenFilter]);

  return (
    <details ref={filterRef} className={`multiSelectFilter${value ? ' hasValue' : ''}`} open={isOpen}>
      <summary
        className="multiSelectTrigger"
        onClick={(event) => {
          event.preventDefault();
          setOpenFilter(isOpen ? null : filterKey);
        }}
      >
        <span>{summary}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="multiSelectMenu">
        <div className="multiSelectOptions">
          {options.map(option => (
            <button
              type="button"
              className={`multiSelectOption${value === option.value ? ' isSelected' : ''}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpenFilter(null);
              }}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
