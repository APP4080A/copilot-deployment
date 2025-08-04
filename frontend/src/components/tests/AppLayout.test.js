import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from '../AppLayout';

// A dummy child to simulate <Outlet />
const DummyComponent = () => <div>Child content here</div>;

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <DummyComponent />,
  };
});

jest.mock('../Navbar', () => () => <nav>Mock Navbar</nav>);

describe('AppLayout Component', () => {
  test('renders without crashing', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );
    expect(screen.getByText(/Mock Navbar/i)).toBeInTheDocument();
  });

  test('renders Navbar always', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('renders child content via Outlet', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );
    expect(screen.getByText(/Child content here/i)).toBeInTheDocument();
  });

  test('has layout styling applied', () => {
    const { container } = render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );
    expect(container.firstChild).toHaveStyle('min-width: 1200px');
  });

  test('matches snapshot', () => {
    const { asFragment } = render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
