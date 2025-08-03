import React from 'react';
import { render, screen } from '@testing-library/react';
import TaskCard from '../TaskCard';
import { MemoryRouter } from 'react-router-dom';
import { format } from 'date-fns';

describe('TaskCard', () => {
  const mockTask = {
    id: 1,
    title: 'Fix login bug',
    description: 'The login form is throwing an error on submit.',
    priority: 'High',
    status: 'In Progress',
    due_date: '2025-08-20',
    assignees: ['Alice', 'Bob']
  };

  test('renders task title and description', () => {
    render(<TaskCard task={mockTask} />, { wrapper: MemoryRouter });

    expect(screen.getByText(/fix login bug/i)).toBeInTheDocument();
    expect(screen.getByText(/login form is throwing/i)).toBeInTheDocument();
  });

  test('links to the task detail page', () => {
    render(<TaskCard task={mockTask} />, { wrapper: MemoryRouter });

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tasks/1');
  });

  test('shows correct priority badge', () => {
    render(<TaskCard task={mockTask} />, { wrapper: MemoryRouter });

    expect(screen.getByText('High')).toHaveClass('bg-danger');
  });

  test('formats due date correctly', () => {
    render(<TaskCard task={mockTask} />, { wrapper: MemoryRouter });

    const expectedDate = `Due: ${format(new Date(mockTask.due_date), 'MMM d')}`;
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  test('shows assignees correctly', () => {
    render(<TaskCard task={mockTask} />, { wrapper: MemoryRouter });

    expect(screen.getByText('Alice, Bob')).toBeInTheDocument();
  });

  test('renders "Unassigned" if no assignees', () => {
    const taskWithoutAssignees = { ...mockTask, assignees: null };
    render(<TaskCard task={taskWithoutAssignees} />, { wrapper: MemoryRouter });

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  test('renders nothing if task is null', () => {
  const { container } = render(<TaskCard task={null} />, { wrapper: MemoryRouter });
  expect(container).toBeEmptyDOMElement();
});

});
