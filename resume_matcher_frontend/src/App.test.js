import React, { useCallback } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppShell from './AppShell';

// Mock the API client so no real network calls are made.
// We'll control postJson and postMultipart to resolve predictable payloads.
jest.mock('./api/client', () => {
  return {
    __esModule: true,
    // Minimal default export shape if imported default in any submodule
    default: {
      postJson: jest.fn(),
      postMultipart: jest.fn(),
      get: jest.fn(),
      request: jest.fn(),
      createApiClient: jest.fn(),
    },
    // Named exports used by hooks/pages
    postJson: jest.fn(),
    postMultipart: jest.fn(),
    get: jest.fn(),
    request: jest.fn(),
    createApiClient: jest.fn(),
  };
});

// Utility to render AppShell with a starting route without depending on window._CONFIG
function renderWithRoute(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppShell />
    </MemoryRouter>
  );
}

describe('App sidebar navigation', () => {
  test('renders sidebar links and highlights active route', () => {
    renderWithRoute('/');

    // Sidebar links present
    const dashboard = screen.getByRole('link', { name: /dashboard/i });
    const resume = screen.getByRole('link', { name: /resume optimizer/i });
    const matcher = screen.getByRole('link', { name: /job matcher/i });
    const settings = screen.getByRole('link', { name: /settings/i });

    expect(dashboard).toBeInTheDocument();
    expect(resume).toBeInTheDocument();
    expect(matcher).toBeInTheDocument();
    expect(settings).toBeInTheDocument();

    // Active class on Dashboard when at "/"
    expect(dashboard.className).toMatch(/active/);
    expect(resume.className).not.toMatch(/active/);
    expect(matcher.className).not.toMatch(/active/);
    expect(settings.className).not.toMatch(/active/);
  });

  test('active link updates when route changes', () => {
    renderWithRoute('/resume');

    const dashboard = screen.getByRole('link', { name: /dashboard/i });
    const resume = screen.getByRole('link', { name: /resume optimizer/i });
    const matcher = screen.getByRole('link', { name: /job matcher/i });
    const settings = screen.getByRole('link', { name: /settings/i });

    expect(resume.className).toMatch(/active/);
    expect(dashboard.className).not.toMatch(/active/);
    expect(matcher.className).not.toMatch(/active/);
    expect(settings.className).not.toMatch(/active/);

    // Navigate to Job Matcher by clicking link
    fireEvent.click(matcher);
    // Active class should move to Job Matcher
    expect(matcher.className).toMatch(/active/);
    expect(resume.className).not.toMatch(/active/);
  });
});

describe('useApi smoke flow with mocked api/client', () => {
  test('renders loading then success state for a simple mocked request', async () => {
    const { postJson } = require('./api/client');

    // Arrange mock to resolve a predictable payload
    postJson.mockResolvedValueOnce({
      data: { hello: 'world' },
      status: 200,
      headers: {},
    });

    // Minimal test component leveraging useApi semantics without Router dependency
    const TestUseApiComponent = () => {
      // inline require to avoid breaking jest hoists
      const useApi = require('./hooks/useApi').default;

      const fn = useCallback(async (_args, _opts) => {
        const res = await postJson('/api/test', { ping: true }, _opts);
        return res.data;
      }, []);

      const { isLoading, data, request } = useApi(fn);

      return (
        <div>
          <button onClick={() => request()} aria-label="Run API">Run</button>
          {isLoading && <div role="status">Loading…</div>}
          {data && <div data-testid="data-out">{JSON.stringify(data)}</div>}
        </div>
      );
    };

    render(<TestUseApiComponent />);

    // Start request
    fireEvent.click(screen.getByRole('button', { name: /run api/i }));

    // Loading shows
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);

    // Success renders predictable data without network
    await waitFor(() =>
      expect(screen.getByTestId('data-out')).toHaveTextContent(
        JSON.stringify({ hello: 'world' })
      )
    );
  });
});
