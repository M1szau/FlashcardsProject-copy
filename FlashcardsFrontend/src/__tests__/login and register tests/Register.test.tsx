import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Register from '../../components/login and register/Register';
import { AuthProvider } from '../../contexts/AuthContext';
import type { ReactNode } from 'react';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => 
{
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../../components/login and register/Header', () => 
({
    default: ({ image, children }: { image: { src: string; alt: string }; children: ReactNode }) => (
        <header data-testid="header">
            <img src={image.src} alt={image.alt} data-testid="header-image" />
            {children}
        </header>
    ),
}));

vi.mock('../../assets/logo.png', () => 
({
    default: '/mock-logo.png',
}));

function renderWithProviders(ui: ReactNode) 
{
    return render(
        <BrowserRouter>
            <AuthProvider>
                {ui}
            </AuthProvider>
        </BrowserRouter>
    );
}

const mockFetch = vi.fn();
global.fetch = mockFetch;
const localStorageMock = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() };
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Register Component', () => 
{
    beforeEach(() => 
    {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
    });

    it('renders all form elements correctly', () => 
    {
        renderWithProviders(<Register />);
        
        expect(screen.getByText('Please register')).toBeInTheDocument();
        expect(screen.getByLabelText('Choose your username')).toHaveAttribute('type', 'text');
        expect(screen.getByLabelText('Choose your password')).toHaveAttribute('type', 'password');
        expect(screen.getByRole('button', { name: 'Register' })).toHaveAttribute('type', 'submit');
        expect(screen.getByRole('button', { name: 'Log in' })).toHaveAttribute('type', 'button');
        expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    });

    it('renders header with correct image props', () => 
    {
        renderWithProviders(<Register />);
        
        const image = screen.getByTestId('header-image');
        expect(image).toHaveAttribute('src', '/mock-logo.png');
        expect(image).toHaveAttribute('alt', 'Registration sheet');
    });

    it('allows typing in form fields', () => 
    {
        renderWithProviders(<Register />);
        
        const usernameInput = screen.getByLabelText('Choose your username') as HTMLInputElement;
        const passwordInput = screen.getByLabelText('Choose your password') as HTMLInputElement;
        
        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'testpass' } });
        
        expect(usernameInput.value).toBe('testuser');
        expect(passwordInput.value).toBe('testpass');
    });

    it('navigates to login when "Log in" button is clicked', () => 
    {
        renderWithProviders(<Register />);
        
        const loginButton = screen.getByRole('button', { name: 'Log in' });
        fireEvent.click(loginButton);
        
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('handles successful registration', async () => 
    {
        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => ({ success: true, token: 'mock-token' }),
        });

        renderWithProviders(<Register />);
        
        const usernameInput = screen.getByLabelText('Choose your username');
        const passwordInput = screen.getByLabelText('Choose your password');
        const submitButton = screen.getByRole('button', { name: 'Register' });
        
        fireEvent.change(usernameInput, { target: { value: 'newuser' } });
        fireEvent.change(passwordInput, { target: { value: 'newpass' } });
        fireEvent.click(submitButton);
        
        expect(mockFetch).toHaveBeenCalledWith('/api/register', 
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'newuser', password: 'newpass' }),
        });
        
        await waitFor(() => 
        {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock-token');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('username', 'newuser');
        });
    });

    it('resets form after successful submission', async () => 
    {
        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => ({ success: true, token: 'mock-token' }),
        });

        renderWithProviders(<Register />);
        
        const usernameInput = screen.getByLabelText('Choose your username') as HTMLInputElement;
        const passwordInput = screen.getByLabelText('Choose your password') as HTMLInputElement;
        const submitButton = screen.getByRole('button', { name: 'Register' });
        
        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'testpass' } });
        fireEvent.click(submitButton);
        
        await waitFor(() => 
        {
            expect(usernameInput.value).toBe('');
            expect(passwordInput.value).toBe('');
        });
    });

    //Failed Registration
    it('displays error message when registration fails', async () => 
    {
        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => ({ success: false, message: 'Username already exists' }),
        });

        renderWithProviders(<Register />);
        
        const submitButton = screen.getByRole('button', { name: 'Register' });
        fireEvent.click(submitButton);
        
        await waitFor(() => 
        {
            expect(screen.getByText('Username already exists')).toBeInTheDocument();
        });
        
        expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
    });

    it('displays generic error for failed registration without message', async () => 
    {
        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => ({ success: false }),
        });

        renderWithProviders(<Register />);
        
        const submitButton = screen.getByRole('button', { name: 'Register' });
        fireEvent.click(submitButton);
        
        await waitFor(() => 
        {
            expect(screen.getByText('Registration failed')).toBeInTheDocument();
        });
    });

    it('handles network errors gracefully', async () => 
    {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        renderWithProviders(<Register />);
        
        const submitButton = screen.getByRole('button', { name: 'Register' });
        fireEvent.click(submitButton);
        
        await waitFor(() => 
        {
            expect(screen.getByText('Registration failed')).toBeInTheDocument();
        });
    });

    //Error Display
    it('displays error message with correct styling', async () => 
    {
        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => ({ success: false, message: 'Test error' }),
        });

        renderWithProviders(<Register />);
        
        const submitButton = screen.getByRole('button', { name: 'Register' });
        fireEvent.click(submitButton);
        
        await waitFor(() => 
        {
            const errorElement = screen.getByText('Test error');
            expect(errorElement).toBeInTheDocument();
            expect(errorElement).toHaveClass('error-box');
            expect(errorElement).toHaveStyle({ 
                color: 'rgb(255, 0, 0)',
                marginTop: '5px', 
                fontSize: '14px' 
            });
        });
    });

    //Form Submission 
    it('handles form submission with empty fields', async () => 
    {
        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => ({ success: true, token: 'mock-token' }),
        });

        renderWithProviders(<Register />);
        
        const submitButton = screen.getByRole('button', { name: 'Register' });
        fireEvent.click(submitButton);
        
        expect(mockFetch).toHaveBeenCalledWith('/api/register', 
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: '', password: '' }),
        });
    });

    //Accessibility
    it('provides proper form accessibility', () => 
    {
        renderWithProviders(<Register />);
        
        const usernameInput = screen.getByLabelText('Choose your username');
        const passwordInput = screen.getByLabelText('Choose your password');
        const heading = screen.getByRole('heading', { level: 1 });
        
        expect(usernameInput).toBeInTheDocument();
        expect(passwordInput).toBeInTheDocument();
        expect(heading).toHaveTextContent('Please register');
    });

    //Integration 
    it('does not call login function when registration fails', async () => 
    {
        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => ({ success: false, message: 'Registration failed' }),
        });

        renderWithProviders(<Register />);
        
        const submitButton = screen.getByRole('button', { name: 'Register' });
        fireEvent.click(submitButton);
        
        await waitFor(() => 
        {
            expect(screen.getByText('Registration failed')).toBeInTheDocument();
        });
        
        expect(localStorageMock.setItem).not.toHaveBeenCalledWith('token', expect.anything());
    });
});
