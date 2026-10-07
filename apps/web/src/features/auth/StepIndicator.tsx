import clsx from 'clsx';
import type { CSSProperties } from 'react';

interface StepIndicatorProps {
  steps: readonly string[];
  active: number; // 1-based
  /** Changes whenever the active segment should restart its fill animation. */
  runKey: string;
  durationMs: number;
  running: boolean;
}

/** "01 ——— 02 03" progress indicator: the active segment widens and fills over the step's duration. */
export function StepIndicator({ steps, active, runKey, durationMs, running }: StepIndicatorProps) {
  return (
    <ol className="flex w-full items-start gap-12" aria-label="Feature tour progress">
      {steps.map((label, i) => {
        const n = i + 1;
        const isActive = n === active;
        return (
          <li
            key={label}
            className={clsx('flex min-w-0 flex-col gap-6 transition-all', isActive ? 'flex-1' : 'w-24')}
            aria-current={isActive ? 'step' : undefined}
          >
            <span className="relative block h-2 overflow-hidden rounded-pill bg-line">
              {isActive && (
                <span
                  key={runKey}
                  className="step-fill absolute inset-0 bg-ink-brand"
                  data-paused={!running}
                  // Animation length is data shared with the JS timer, passed as a custom property.
                  style={{ '--step-duration': `${durationMs}ms` } as CSSProperties}
                />
              )}
            </span>
            <span className={clsx('text-label', isActive ? 'text-ink' : 'text-ink-muted/60')}>
              {String(n).padStart(2, '0')}
            </span>
            {isActive && <span className="truncate text-label text-ink">{label}</span>}
          </li>
        );
      })}
    </ol>
  );
}
