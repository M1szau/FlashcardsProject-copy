import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import App from '../App.tsx';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location
const locationMock = 
{
  href: 'http://localhost/',
  origin: 'http://localhost',
  assign: vi.fn(),
  pathname: '/',
  search: '',
  hash: '',
  reload: vi.fn(),
};
Object.defineProperty(window, 'location', { value: locationMock, writable: true });

// Mock alert
const alertMock = vi.fn();
window.alert = alertMock;

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  locationMock.href = 'http://localhost/';
  locationMock.pathname = '/';
});

describe('App component', () => {
  it('Redirects from / to /login and renders login header', async () => 
  {
    window.history.pushState({}, '', '/');
    render(<App />);
    await waitFor(() => 
    {
      expect(screen.getByRole('heading', { name: /Please log in/i })).toBeInTheDocument();
    });
});

  it('Renders login page and handles successful login', async () => 
  {
    window.history.pushState({}, '', '/login');
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ success: true, token: 'testtoken' })
    });
    render(<App />);
    expect(screen.getByRole('heading', { name: /Please log in/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Your username/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText(/Your password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));
    await waitFor(() => {
      expect(window.localStorage.getItem('token')).toBe('testtoken');
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('Shows login error on failed login', async () => 
  {
    window.history.pushState({}, '', '/login');
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ success: false, message: 'Invalid credentials' })
    });
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Your username/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText(/Your password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('Renders register page and handles successful registration', async () => 
  {
    window.history.pushState({}, '', '/register');
    fetchMock.mockResolvedValueOnce(
    {
      json: async () => ({ success: true })
    });
    render(<App />);
    await waitFor(() => 
    {
      expect(screen.getByRole('heading', { name: /Please register yourself/i })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/Choose your username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Choose your password/i), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Registration successful');
      expect(window.location.href).toBe('/login');
    });
  });

  it('Shows register error on failed registration', async () => 
  {
    window.history.pushState({}, '', '/register');
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ success: false, message: 'User exists' })
    });
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    await waitFor(() => {
      expect(screen.getByText(/User exists/i)).toBeInTheDocument();
    });
  });

  it('Renders dashboard page', async () => 
  {
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Add new set/i)).toBeInTheDocument();
    });
  });

  it('Renders statistics page', async () => 
  {
    window.history.pushState({}, '', '/statistics');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Statistics/i)).toBeInTheDocument();
    });
  });

  it('Renders flashcards page', async () => 
  {
    window.history.pushState({}, '', '/set/1');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Flashcards/i)).toBeInTheDocument();
    });
  });
});