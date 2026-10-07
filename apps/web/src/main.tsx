import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { App } from './App';
import { AuthProvider } from './auth/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retry network blips, but not 4xx responses (they won't change on retry).
      retry: (count, err) => {
        const status = err instanceof AxiosError ? err.response?.status : undefined;
        return status !== undefined && status < 500 ? false : count < 2;
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                unstyled: true,
                classNames: {
                  // Layout only here; colours come from the per-type slots so they never compete.
                  toast: 'flex w-full items-center gap-12 rounded-card border px-16 py-14 text-body shadow-subtle',
                  default: 'border-line bg-surface text-ink',
                  info: 'border-line bg-surface text-ink',
                  success: 'border-panel bg-panel text-on-panel',
                  error: 'border-danger/30 bg-danger-soft text-danger',
                  warning: 'border-warning/30 bg-warning-soft text-warning',
                  description: 'text-label',
                },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
