import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import Register from '../components/Register';
import { MemoryRouter } from 'react-router-dom';

// Mock funcition for navigation
const navigateMock = vi.fn();

// Properly mock react-router-dom and preserve MemoryRouter
vi.mock('react-router-dom', async (importOriginal) => 
{
  const actual = await importOriginal();
  const actualTyped = actual as Record<string, any>;
  return {
    ...actualTyped,
    useNavigate: () => navigateMock,
    MemoryRouter: actualTyped.MemoryRouter,
  };
});


describe('Register component', () => 
{
  // Test that all form fields and buttons are rendered
  it('renders all required fields and buttons', () => 
  {
    render(
      <MemoryRouter>
        <Register onSubmit={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument(); // username field
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument(); // password field
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument(); // register button
    expect(screen.getByText(/Already have an account\?/i)).toBeInTheDocument(); // info text
    expect(screen.getByRole('button', { name: /Log in/i })).toBeInTheDocument(); // log in button
  });

  
  it('calls onSubmit with username, password, and confirmPassword', () => 
  {
    const handleSubmit = vi.fn();
    render(
      <MemoryRouter>
        <Register onSubmit={handleSubmit} />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    expect(handleSubmit).toHaveBeenCalledWith('newuser', 'newpass');
  });

  it('shows error message when error prop is set', () => 
  {
    render(
      <MemoryRouter>
        <Register onSubmit={() => {}} error="Registration failed" />
      </MemoryRouter>
    );
    expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
  });

  // Test that navigation to  Log in when button is clicked
  it('navigates to Log in when button is clicked', () => 
{
    render(
      <MemoryRouter>
        <Register onSubmit={() => {}} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('resets the form after submit', () => 
  {
    const handleSubmit = vi.fn();
    render(
      <MemoryRouter>
        <Register onSubmit={handleSubmit} />
      </MemoryRouter>
    );
    const usernameInput = screen.getByLabelText(/Username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'resetuser' } });
    fireEvent.change(passwordInput, { target: { value: 'resetpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    expect(usernameInput.value).toBe(''); 
    expect(passwordInput.value).toBe(''); 
  });
});
