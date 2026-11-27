import { useState } from 'react';

import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { RouteDefinitions } from '@/constants/routes.constants';
import { fireEvent, render, screen } from '@testing-library/react';

// Same shape as the Security routes in App.jsx: four routes render one component type, and each route element is
// keyed so the page remounts when the route changes. Without the keys React reuses one instance, which kept the old
// section on screen and saved to it.
const SectionPage = ({ label, keyed }) => {
  const [draft, setDraft] = useState('');
  return (
    <div>
      <div data-testid="header">{label}</div>
      <input
        aria-label="draft"
        value={draft}
        onChange={event => setDraft(event.target.value)}
      />
      <div data-testid="draft-value">{draft}</div>
      <div data-testid="keyed">{String(keyed)}</div>
    </div>
  );
};

const Nav = () => {
  const navigate = useNavigate();
  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(RouteDefinitions.Authentication)}
      >
        to-auth
      </button>
      <button
        type="button"
        onClick={() => navigate(RouteDefinitions.Guardrails)}
      >
        to-guardrails
      </button>
    </div>
  );
};

const renderRoutes = keyed => (
  <MemoryRouter initialEntries={[RouteDefinitions.Authentication]}>
    <Nav />
    <Routes>
      <Route
        path={RouteDefinitions.Authentication}
        element={
          <SectionPage
            key={keyed ? 'auth' : undefined}
            label="Authentication"
            keyed={keyed}
          />
        }
      />
      <Route
        path={RouteDefinitions.Guardrails}
        element={
          <SectionPage
            key={keyed ? 'guardrails' : undefined}
            label="Guardrails"
            keyed={keyed}
          />
        }
      />
    </Routes>
  </MemoryRouter>
);

describe('keyed Security routes', () => {
  it('shows the new section with no carried-over unsaved edit', () => {
    render(renderRoutes(true));

    fireEvent.change(screen.getByLabelText('draft'), { target: { value: 'unsaved' } });
    expect(screen.getByTestId('draft-value')).toHaveTextContent('unsaved');

    fireEvent.click(screen.getByText('to-guardrails'));

    expect(screen.getByTestId('header')).toHaveTextContent('Guardrails');
    expect(screen.getByTestId('draft-value')).toHaveTextContent('');
  });

  it('does not reuse the previous route instance without keys', () => {
    // Documents the failure the keys prevent: the unkeyed routes share one instance, so the edit carries over
    render(renderRoutes(false));

    fireEvent.change(screen.getByLabelText('draft'), { target: { value: 'unsaved' } });
    fireEvent.click(screen.getByText('to-guardrails'));

    expect(screen.getByTestId('header')).toHaveTextContent('Guardrails');
    expect(screen.getByTestId('draft-value')).toHaveTextContent('unsaved');
  });
});
