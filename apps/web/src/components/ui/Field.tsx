import clsx from 'clsx';
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

/** Shared control styling: paper fill, stone hairline, forest focus with a mint-mist halo. */
export const controlClasses =
  'block w-full rounded-chip border bg-surface px-14 py-10 text-body text-ink placeholder:text-ink-muted/60 transition-colors focus:border-panel focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:bg-surface-warm disabled:text-ink-muted';

const borderFor = (error?: string) => (error ? 'border-danger' : 'border-line hover:border-line-strong');

interface FieldWrapperProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FieldWrapper({ id, label, error, hint, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-6">
      <label htmlFor={id} className="text-label text-ink-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-label text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-label text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface CommonProps {
  label: string;
  error?: string;
  hint?: string;
}

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export const TextField = forwardRef<HTMLInputElement, CommonProps & InputHTMLAttributes<HTMLInputElement>>(
  function TextField({ label, error, hint, className, ...rest }, ref) {
    const id = useId();
    return (
      <FieldWrapper id={id} label={label} error={error} hint={hint}>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy(id, error, hint)}
          className={clsx(controlClasses, borderFor(error), className)}
          {...rest}
        />
      </FieldWrapper>
    );
  },
);

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextAreaField({ label, error, hint, className, ...rest }, ref) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <textarea
        ref={ref}
        id={id}
        rows={3}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, hint)}
        className={clsx(controlClasses, borderFor(error), 'resize-y', className)}
        {...rest}
      />
    </FieldWrapper>
  );
});

export const SelectField = forwardRef<
  HTMLSelectElement,
  CommonProps & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }
>(function SelectField({ label, error, hint, options, className, ...rest }, ref) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <select
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, hint)}
        className={clsx(controlClasses, borderFor(error), className)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
});

/** Compact pill select for filter bars (label is visually hidden). */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'block w-full rounded-button border bg-surface px-16 py-10 text-body text-ink transition-colors focus:border-panel focus:outline-none focus:ring-4 focus:ring-accent-soft',
          value ? 'border-panel bg-surface-tint text-ink-brand' : 'border-line hover:border-line-strong',
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
