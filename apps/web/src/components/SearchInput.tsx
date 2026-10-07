import { Search } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useDebounce } from '../hooks/useUrlState';

/** Pill search box that reports its value 300ms after the user stops typing. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, 300);

  useEffect(() => {
    if (debounced !== value) onChange(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => setText(value), [value]);

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-16 size-16 -translate-y-1/2 text-ink-muted"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={text}
        maxLength={100}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-button border border-line bg-surface py-10 pr-16 pl-40 text-body text-ink placeholder:text-ink-muted/70 transition-colors hover:border-line-strong focus:border-panel focus:outline-none focus:ring-4 focus:ring-accent-soft"
      />
    </div>
  );
}
