export type FilterOption = { value: string; label: string };

export const csvValues = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export const toggleCsvValue = (value: string, next: string) => {
  const values = csvValues(value);
  return values.includes(next)
    ? values.filter((v) => v !== next).join(",")
    : [...values, next].join(",");
};

export default function MultiSelectFilter({
  filterKey,
  label,
  value,
  options,
  openFilter,
  setOpenFilter,
  onChange,
}: {
  filterKey: string;
  label: string;
  value: string;
  options: FilterOption[];
  openFilter: string | null;
  setOpenFilter: (value: string | null) => void;
  onChange: (value: string) => void;
}) {
  const selected = csvValues(value);
  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label);
  const summary =
    selectedLabels.length === 0
      ? label
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} selected`;
  const isOpen = openFilter === filterKey;

  return (
    <details
      className={`multiSelectFilter${selected.length ? " hasValue" : ""}`}
      open={isOpen}
    >
      <summary
        className="multiSelectTrigger"
        onClick={(event) => {
          event.preventDefault();
          setOpenFilter(isOpen ? null : filterKey);
        }}
      >
        <span>{summary}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="multiSelectMenu">
        <div className="multiSelectMenuHead">
          <span>{label}</span>
          {selected.length ? (
            <button type="button" onClick={() => onChange("")}>
              Clear
            </button>
          ) : null}
        </div>
        <div className="multiSelectOptions">
          {options.length ? (
            options.map((option) => (
              <label className="multiSelectOption" key={option.value}>
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => onChange(toggleCsvValue(value, option.value))}
                />
                <span>{option.label}</span>
              </label>
            ))
          ) : (
            <div className="multiSelectEmpty">No options available</div>
          )}
        </div>
      </div>
    </details>
  );
}
