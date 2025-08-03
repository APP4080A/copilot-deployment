import React from 'react';
import { render, screen } from '@testing-library/react';
import Loader from '../Loader';

describe('Loader Component', () => {
  test('should render the spinner', () => {
    render(<Loader />);
    
    // Check if spinner element exists by role
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();

    // Check for visually hidden text
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
