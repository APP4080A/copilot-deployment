import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../Navbar';
import { MemoryRouter } from 'react-router-dom';

// Mocks
jest.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    user: null,
    loading: false,
  }),
}));

jest.mock('../../contexts/SearchContext', () => ({
  useSearch: () => ({
    searchTerm: '',
    setSearchTerm: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
    useLocation: () => ({
      pathname: '/dashboard',
    }),
  };
});

describe('Navbar Component', () => {
  test('renders logo and nav links', () => {
    render(<Navbar />, { wrapper: MemoryRouter });

    expect(screen.getByText('Co-Pilot')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Task Board')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(<Navbar />, { wrapper: MemoryRouter });

    const input = screen.getByPlaceholderText(/search tasks, teams, users/i);
    expect(input).toBeInTheDocument();
  });

});
