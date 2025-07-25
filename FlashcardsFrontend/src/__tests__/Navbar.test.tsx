import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Navbar from '../components/Navbar';
import { MemoryRouter } from 'react-router-dom';

// Mock function for navigation
const navigateMock = vi.fn();

// Add this before your test
beforeEach(() => 
{
  Object.defineProperty(window, 'localStorage', 
  {
    value: 
    {
      removeItem: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });
});

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

describe('Navbar component', () =>
{
    it('Renders Logo and buttons', () =>
    {
        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        // Logo check
        expect(screen.getByText(/Flashcards/i)).toBeInTheDocument();

        // Buttons check
        expect(screen.getByRole('button', { name: /Statistics/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Log out/i })).toBeInTheDocument();

        // Check if the logo is clickable and navigates to /dashboard
        const logo = screen.getByText(/Flashcards/i);
        logo.click();
        expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });

    it('Navigates to /statistics when Statistics button is clicked', () => 
    {
        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: /Statistics/i }));
        expect(navigateMock).toHaveBeenCalledWith('/statistics');
    });

    it('Navigates to /logout when Log out button is clicked', () => 
    {
        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: /Log out/i }));
        expect(navigateMock).toHaveBeenCalledWith('/login');
    });

    it('Removes token from localStorage when Log out is clicked', () => 
    {
        const removeItemMock = vi.spyOn(window.localStorage, 'removeItem');
        render(
            <MemoryRouter>
            <Navbar />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: /Log out/i }));
        expect(removeItemMock).toHaveBeenCalledWith('token');
        removeItemMock.mockRestore();
    });

    it('Reloads page when logo is clicked on /dashboard', () => 
    {
        const reloadMock = vi.fn();
        Object.defineProperty(window, 'location', 
        {
            value: { pathname: '/dashboard', reload: reloadMock },
            writable: true,
        });
        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText(/Flashcards/i));
        expect(reloadMock).toHaveBeenCalled();
    });

});
