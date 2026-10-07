import { Component, type ErrorInfo, type ReactNode } from 'react';
import { buttonClasses } from './ui/Button';

interface State {
  hasError: boolean;
}

/** Last line of defence: a render error shows a friendly screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  override render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-24 text-center">
        <h1 className="text-heading-sm text-ink-brand">Something went wrong</h1>
        <p className="mt-8 text-body text-ink-muted">An unexpected error occurred. Reloading usually fixes it.</p>
        <button type="button" onClick={() => window.location.assign('/')} className={buttonClasses('primary', 'md', 'mt-24')}>
          Reload ProjectFlow
        </button>
      </div>
    );
  }
}
