import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'brand' | 'secondary' | 'soft' | 'quiet' | 'danger' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'icon';

const base =
  'inline-flex shrink-0 items-center justify-center gap-8 rounded-button text-body whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  /** Filled mint — the one primary action per view. */
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  /** Solid forest — strong action on light surfaces when mint would compete. */
  brand: 'bg-panel text-on-panel hover:bg-panel-hover',
  /** Outlined — secondary actions. */
  secondary: 'border border-ink/80 text-ink hover:bg-surface-tint',
  /** Mint-mist pill — tertiary actions and filters. */
  soft: 'bg-accent-soft text-ink-brand hover:bg-accent',
  /** Text-only — toolbar and icon actions. */
  quiet: 'text-ink-muted hover:bg-surface-tint hover:text-ink-brand',
  /** Destructive confirmation. */
  danger: 'bg-danger text-surface hover:bg-danger/90',
  /** Outlined on forest panels. */
  inverse: 'border border-on-panel/40 text-on-panel hover:bg-on-panel/10',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-14 py-6 text-label',
  md: 'px-24 py-10',
  icon: 'size-40',
};

/** Shared so links (react-router <Link>) can look exactly like buttons. */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string | false,
) {
  return clsx(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {loading && <Spinner className="size-16" />}
      {children}
    </button>
  );
}
