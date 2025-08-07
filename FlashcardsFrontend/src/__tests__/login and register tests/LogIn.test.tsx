import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import LogIn from '../../components/login and register/LogIn';
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

describe('LogIn component', () => 
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

  it('Renders all required fields and buttons', () => 
  {
    render(
      <MemoryRouter>
        <LogIn />
      </MemoryRouter>
    );
    
    expect(screen.getByLabelText(/Your username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Join us!/i })).toBeInTheDocument();
    expect(screen.getByText(/Not yet with us\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Please log in/i)).toBeInTheDocument();
  });

  it('Handles successful login', async () => 
  {
    const mockResponse = { success: true, token: 'fake-token' };
    (global.fetch as any).mockResolvedValueOnce(
    {
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <MemoryRouter>
        <LogIn />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Your username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Your password/i), { target: { value: 'testpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    await waitFor(() => 
    {
      expect(global.fetch).toHaveBeenCalledWith('/api/login', 
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'testpass' }),
      });
    });
  });

  it('Shows error message when login fails', async () => 
  {
    const mockResponse = { success: false, message: 'Invalid credentials' };
    (global.fetch as any).mockResolvedValueOnce(
    {
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <MemoryRouter>
        <LogIn />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Your username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Your password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    await waitFor(() => 
    {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('Shows fallback error message when login fails without message', async () => 
  {
    const mockResponse = { success: false }; //line 38 
    (global.fetch as any).mockResolvedValueOnce(
    {
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <MemoryRouter>
        <LogIn />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Your username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Your password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    await waitFor(() => 
    {
      expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
    });
  });

  it('Shows error message when network error occurs', async () => 
  {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <LogIn />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Your username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Your password/i), { target: { value: 'testpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    await waitFor(() => 
    {
      expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
    });
  });

  it('Navigates to /register when Join us! button is clicked', () => 
  {
    render(
      <MemoryRouter>
        <LogIn />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Join us!/i }));
    expect(navigateMock).toHaveBeenCalledWith('/register');
  });

  it('Resets the form after submit', async () => 
  {
    const mockResponse = { success: false, message: 'Login failed' };
    (global.fetch as any).mockResolvedValueOnce(
    {
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <MemoryRouter>
        <LogIn />
      </MemoryRouter>
    );
    
    const usernameInput = screen.getByLabelText(/Your username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Your password/i) as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'resetuser' } });
    fireEvent.change(passwordInput, { target: { value: 'resetpass' } });
    
    expect(usernameInput.value).toBe('resetuser');
    expect(passwordInput.value).toBe('resetpass');
    
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    await waitFor(() => 
    {
      expect(usernameInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });
});