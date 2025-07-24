import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import LogIn from '../components/LogIn';
import { MemoryRouter, useNavigate } from 'react-router-dom';

// Properly mock react-router-dom and preserve MemoryRouter
vi.mock('react-router-dom', async (importOriginal) => 
{
  const actual = await importOriginal();
  const actualTyped = actual as Record<string, any>;
  return {
    ...actualTyped,
    useNavigate: () => vi.fn(),
    MemoryRouter: actualTyped.MemoryRouter,
  };
});

describe('LogIn component', () => 
{
  it('renders all required fields and buttons', () => 
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
    expect(screen.getByLabelText(/Not yet with us\?/i)).toBeInTheDocument();
  });

  it('calls onSubmit with username and password when Log in button is clicked', () => {
    const handleSubmit = vi.fn();
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

  it('navigates to /register when Join us! button is clicked', () => 
  {
    const navigate = useNavigate();
    render(
      <MemoryRouter>
        <LogIn onSubmit={() => {}} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Join us!/i }));
    expect(navigate).toHaveBeenCalledWith('/register');
  });

  it('resets the form after submit', () => 
  {
    const handleSubmit = vi.fn();
    render(
      <MemoryRouter>
        <LogIn onSubmit={handleSubmit} />
      </MemoryRouter>
    );
    const usernameInput = screen.getByLabelText(/Your username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Your password/i) as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'resetuser' } });
    fireEvent.change(passwordInput, { target: { value: 'resetpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    expect(usernameInput.value).toBe('');
    expect(passwordInput.value).toBe('');
  });
});