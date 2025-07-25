import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Dashboard from '../components/Dashboard';
import { MemoryRouter } from 'react-router-dom';

// Mock navigation
const navigateMock = vi.fn();

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock useNavigate
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

beforeEach(() => 
{
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('Dashboard component', () => 
{
    it('Redirects to login if no token', async () => 
    {
        render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
        );
        await waitFor(() => 
        {
            expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
        });
    });

    it('Renders add new set block and handles add set flow', async () => 
    {
        window.localStorage.setItem('token', 'testtoken');
        fetchMock.mockResolvedValueOnce(
        {
            status: 200,
            json: async () => ({ sets: [] })
        });
        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        // Add new set block
        expect(screen.getByText(/Add new set/i)).toBeInTheDocument();
        fireEvent.click(screen.getByText('+'));
        expect(screen.getByPlaceholderText(/Set name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Description/i)).toBeInTheDocument();

        // Fill and add set
        fireEvent.change(screen.getByPlaceholderText(/Set name/i), { target: { value: 'Test Set' } });
        fireEvent.change(screen.getByPlaceholderText(/Description/i), { target: { value: 'Test Desc' } });
        fetchMock.mockResolvedValueOnce(
        {
        ok: true,
        json: async () => ({ set: { id: '1', name: 'Test Set', description: 'Test Desc', defaultLanguage: 'PL', translationLanguage: 'EN', owner: 'admin' } })
        });
        fireEvent.click(screen.getByRole('button', { name: /Add/i }));
        await waitFor(() => {
        expect(screen.getByText(/Test Set/i)).toBeInTheDocument();
        });
    });

    // Test that add set fails (empty sets, blocks)
    it('renders add new set block when no sets and not adding', async () => 
    {
        window.localStorage.setItem('token', 'testtoken');
        fetchMock.mockResolvedValueOnce({
            status: 200,
            json: async () => ({ sets: [] })
        });
        render(
            <MemoryRouter>
            <Dashboard />
            </MemoryRouter>
        );
        await waitFor(() => 
        {
            expect(screen.getByText(/Add new set/i)).toBeInTheDocument();
        });
    });

    it('renders set blocks and handles navigation to set', async () => 
    {
        window.localStorage.setItem('token', 'testtoken');
        fetchMock.mockResolvedValueOnce(
        {
            status: 200,
            json: async () => ({ sets: [
                { id: '1', name: 'Set1', description: 'Desc1', defaultLanguage: 'PL', translationLanguage: 'EN', owner: 'admin' }
            ] })
        });
            render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );
        await waitFor(() => {
        expect(screen.getByText(/Set1/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText(/Set1/i));
        expect(navigateMock).toHaveBeenCalledWith('/set/1');
    });

    it('handles edit set flow', async () => 
    {
        window.localStorage.setItem('token', 'testtoken');
        fetchMock.mockResolvedValueOnce({
            status: 200,
            json: async () => ({ sets: [
                { id: '1', name: 'Set1', description: 'Desc1', defaultLanguage: 'PL', translationLanguage: 'EN', owner: 'admin' }
            ] })
        });
        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );
        await waitFor(() => 
        {
            expect(screen.getByText(/Set1/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTitle(/Edit set/i));
        expect(screen.getByPlaceholderText(/Set name/i)).toBeInTheDocument();
        fireEvent.change(screen.getByPlaceholderText(/Set name/i), { target: { value: 'Set1 Edited' } });
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ set: { id: '1', name: 'Set1 Edited', description: 'Desc1', defaultLanguage: 'PL', translationLanguage: 'EN', owner: 'admin' } })
        });
        fireEvent.click(screen.getByRole('button', { name: /Save/i }));
        await waitFor(() => 
        {
            expect(screen.getByText(/Set1 Edited/i)).toBeInTheDocument();
        });
    });

    // Test that edit set fails
    it('shows alert when edit set fails', async () => 
    {
        window.localStorage.setItem('token', 'testtoken');
        fetchMock.mockResolvedValueOnce({
            status: 200,
            json: async () => ({ sets: [
            { id: '1', name: 'Set1', description: 'Desc1', defaultLanguage: 'PL', translationLanguage: 'EN', owner: 'admin' }
            ] })
        });
        render(
            <MemoryRouter>
            <Dashboard />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText(/Set1/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTitle(/Edit set/i));
        fireEvent.change(screen.getByPlaceholderText(/Set name/i), { target: { value: 'Set1 Edited' } });
        // Simulate failed edit
        fetchMock.mockResolvedValueOnce({ ok: false });
        // Mock alert
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
        fireEvent.click(screen.getByRole('button', { name: /Save/i }));
        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('Failed to edit set.');
        });
        alertMock.mockRestore();
    });

    // Test that delete set flow works
    it('handles delete set flow', async () => 
    {
        window.localStorage.setItem('token', 'testtoken');
        fetchMock.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ sets: [
            { id: '1', name: 'Set1', description: 'Desc1', defaultLanguage: 'PL', translationLanguage: 'EN', owner: 'admin' }
        ] })
        });

        // Mock confirm dialog
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        fetchMock.mockResolvedValueOnce({ ok: true });
        render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
        );
        await waitFor(() => 
        {
        expect(screen.getByText(/Set1/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTitle(/Delete set/i));
        await waitFor(() => 
        {
        expect(screen.queryByText(/Set1/i)).not.toBeInTheDocument();
        });
    });
});
