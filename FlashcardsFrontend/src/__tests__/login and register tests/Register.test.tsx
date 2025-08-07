import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Register from '../../components/login and register/Register';
import { MemoryRouter } from 'react-router-dom';

//Mock function for navigation
const navigateMock = vi.fn();

global.fetch = vi.fn();

//Properly mock react-router-dom and preserve MemoryRouter
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
  beforeEach(() => 
  {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', 
    {
      value: 
      {
        href: '',
      },
      writable: true,
    });
  });

  //Test that all form fields and buttons are rendered
  it('Renders all required fields and buttons', () => 
  {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Choose your username/i)).toBeInTheDocument(); // username field
    expect(screen.getByLabelText(/Choose your password/i)).toBeInTheDocument(); // password field
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument(); // register button
    expect(screen.getByText(/Already have an account\?/i)).toBeInTheDocument(); // info text
    expect(screen.getByRole('button', { name: /Log in/i })).toBeInTheDocument(); // log in button
    expect(screen.getByText(/Please register/i)).toBeInTheDocument();
  });

  it('Handles successful registration', async () =>
  {
    const mockResponse = { success: true, token: 'fake-token' };
    (global.fetch as any).mockResolvedValueOnce(
    {
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Choose your username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Choose your password/i), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    await waitFor(() => 
    {
      expect(global.fetch).toHaveBeenCalledWith('/api/register', 
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'newuser', password: 'newpass' }),
      });
    });
  });

  it('Shows error message when registration fails', async () => 
  {
    const mockResponse = { success: false, message: 'Registration failed' };
    (global.fetch as any).mockResolvedValueOnce(
    {
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Choose your username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Choose your password/i), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    await waitFor(() => 
    {
      expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
    });
  });

  //line 37
  it('Shows fallback error message when registration fails without message', async () => 
  {
    const mockResponse = { success: false }; 
    (global.fetch as any).mockResolvedValueOnce(
    {
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Choose your username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Choose your password/i), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    await waitFor(() => 
    {
      expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
    });
  });

  it('Shows error message when network error occurs', async () => 
  {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Choose your username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Choose your password/i), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    await waitFor(() => 
    {
      expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
    });
  });

  //Navigation to Log in when button is clicked
  it('Navigates to Log in when button is clicked', () => 
  {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('Resets the form after submit', async () => 
  {
    const mockResponse = { success: false, message: 'Registration failed' };
    (global.fetch as any).mockResolvedValueOnce(
    {
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    const usernameInput = screen.getByLabelText(/Choose your username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Choose your password/i) as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'resetuser' } });
    fireEvent.change(passwordInput, { target: { value: 'resetpass' } });
    
    expect(usernameInput.value).toBe('resetuser');
    expect(passwordInput.value).toBe('resetpass');
    
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    await waitFor(() => 
    {
      expect(usernameInput.value).toBe(''); 
      expect(passwordInput.value).toBe(''); 
    });
  });
});
