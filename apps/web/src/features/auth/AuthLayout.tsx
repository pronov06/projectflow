import clsx from 'clsx';
import { Pause, Play } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { Button, buttonClasses } from '../../components/ui/Button';
import { FlowIllustration } from './FlowIllustration';
import { StepIndicator } from './StepIndicator';
import { FLOW_STEP_MS, useFlowCycle } from './useFlowCycle';

const STEP_LABELS = ['Projects', 'Tasks', 'Dashboard'] as const;
const CAPTIONS = [
  'Organise every project — status, dates and live progress in one place.',
  'Break work into tasks with priorities and due dates. One tap marks them done.',
  'Your dashboard updates instantly, on the web and on Android.',
] as const;

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * Notched-panel auth screen (layout and motion modelled on the Flecto reference):
 * nav on the cream shoulders, headline in the raised tab, animated product flow + form in the
 * forest body, rotating caption in the lower tab, pause control and step indicator below.
 */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const [paused, setPaused] = useState(false);
  const { level, activeStep, cycle, running, reduced } = useFlowCycle(paused);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas p-12 lg:p-16">
      <div className="notched flex-1">
        {/* ---------------- Top: shoulders + raised tab ---------------- */}
        <div className="notched__row notched__row--top">
          <div className="notched__start flex items-start gap-24 px-8 pt-8 lg:px-16 lg:pt-16">
            <Link to="/login" aria-label="ProjectFlow home">
              <Logo />
            </Link>
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden pt-6 text-body text-ink-brand hover:underline sm:inline"
            >
              API docs
            </a>
          </div>
          <nav className="notched__end flex items-start justify-end gap-8 px-8 pt-8 lg:px-16 lg:pt-16" aria-label="Account">
            <NavLink
              to="/register"
              className={({ isActive }) =>
                buttonClasses('soft', 'md', clsx('hidden sm:inline-flex', isActive && 'ring-2 ring-panel'))
              }
            >
              Create account
            </NavLink>
            <NavLink
              to="/login"
              className={({ isActive }) => buttonClasses('primary', 'md', isActive && 'ring-2 ring-panel')}
            >
              Log in
            </NavLink>
          </nav>
          <div className="notched__tab flex items-end justify-center px-24 pt-32 pb-8 lg:min-h-notch">
            <h1 className="text-center text-heading-sm text-on-panel lg:text-heading-lg">{title}</h1>
          </div>
        </div>

        {/* ---------------- Body: story + form ---------------- */}
        <div className="notched__body flex flex-1 flex-col px-16 pt-16 pb-32 sm:px-24 lg:px-40 lg:pb-40">
          <p className="mx-auto max-w-prose text-center text-body-lg text-on-panel-muted">{subtitle}</p>
          <div className="mt-32 grid flex-1 items-center gap-40 lg:grid-cols-12">
            <div className="hidden lg:col-span-7 lg:block">
              <FlowIllustration level={level} />
              <p className="sr-only">
                ProjectFlow connects your workspace to projects, tasks and a live dashboard.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="mx-auto w-full max-w-form rounded-card bg-canvas p-24 text-ink animate-rise-in sm:p-32">
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- Bottom: shoulders + lowered tab ---------------- */}
        <div className="notched__row notched__row--bottom">
          <div className="notched__start hidden items-end px-16 pb-8 lg:flex">
            {!reduced && (
              <Button
                variant="secondary"
                size="icon"
                className="border-line"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Play feature animation' : 'Pause feature animation'}
                aria-pressed={paused}
              >
                {paused ? <Play className="size-16" aria-hidden="true" /> : <Pause className="size-16" aria-hidden="true" />}
              </Button>
            )}
          </div>
          <div className="notched__tab flex items-center justify-center px-24 pt-8 pb-24">
            <p key={activeStep} className="text-center text-body-lg text-on-panel animate-rise-in">
              {CAPTIONS[activeStep - 1]}
            </p>
          </div>
          <div className="notched__end hidden items-end px-16 pb-8 lg:flex">
            <StepIndicator
              steps={STEP_LABELS}
              active={activeStep}
              runKey={`${cycle}-${level}`}
              durationMs={FLOW_STEP_MS}
              running={running && level >= 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
