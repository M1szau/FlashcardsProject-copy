import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom'
import LogIn from '../components/LogIn';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

describe('LogIn component', () => 
{
  it('renders username and password fields', () => 
  {
    render(
      <MemoryRouter>
        <LogIn onSubmit={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Your username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Join us!/i })).toBeInTheDocument();
  });

  it('calls onSubmit with username and password', () => 
  {
    const handleSubmit = vi.fn(); // <-- Use vi.fn() instead of jest.fn()
    render(
      <MemoryRouter>
        <LogIn onSubmit={handleSubmit} />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Your username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Your password/i), { target: { value: 'testpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));
    expect(handleSubmit).toHaveBeenCalledWith('testuser', 'testpass');
  });

  it('shows error message when error prop is set', () => 
  {
    render(
      <MemoryRouter>
        <LogIn onSubmit={() => {}} error="Invalid credentials" />
      </MemoryRouter>
    );
    expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
  });
});