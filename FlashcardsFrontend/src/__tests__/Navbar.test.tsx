import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import Navbar from '../components/Navbar';
import { MemoryRouter } from 'react-router-dom';

// Mock function for navigation
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

    it('navigates to /statistics when Statistics button is clicked', () => 
    {
        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: /Statistics/i }));
        expect(navigateMock).toHaveBeenCalledWith('/statistics');
    });

    it('navigates to /logout when Log out button is clicked', () => 
    {
        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: /Log out/i }));
        expect(navigateMock).toHaveBeenCalledWith('/logout');
    });
});
