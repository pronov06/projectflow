import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { AuthProvider } from '../auth/AuthContext';
import { http } from '../lib/api';

function renderApp(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('routing', () => {
  it('sends anonymous users from a protected page to the login page', async () => {
    // No session cookie: the refresh call fails.
    vi.spyOn(http, 'post').mockRejectedValue(new Error('401'));
    renderApp('/projects');
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });
});

describe('login form', () => {
  it('shows validation errors without calling the API', async () => {
    const post = vi.spyOn(http, 'post').mockRejectedValue(new Error('401'));
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Welcome back' });
    post.mockClear();

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    await waitFor(() => expect(post).not.toHaveBeenCalled());
  });
});
