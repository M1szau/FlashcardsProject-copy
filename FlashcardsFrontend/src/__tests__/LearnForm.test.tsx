import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import LearnForm from '../components/LearnForm.tsx';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => 
{
    const actual = await vi.importActual('react-router-dom'); 
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockSets = 
[
    { id: '1', name: 'Set One' },
    { id: '2', name: 'Set Two' },
];

beforeEach(() => 
{
    vi.resetAllMocks();
    vi.stubGlobal('fetch', vi.fn(() => 
    Promise.resolve(
        {
            ok: true,
            json: async () => mockSets,
        }
    )));
    localStorage.setItem('token', 'test-token');
});


describe('LearnForm', () =>
{
    it('Renders loading state initially', () =>
    {
        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        expect(screen.getByText(/Loading your sets/i)).toBeInTheDocument();
    });

    it('Renders sets after loading', async () =>
    {
        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor( () =>
        {
            expect(screen.getByText(/Choose set to learn/i)).toBeInTheDocument();
            expect(screen.getByText('Set One')).toBeInTheDocument();
            expect(screen.getByText('Set Two')).toBeInTheDocument();
        });
    });

    it('Disables submit button if there is no sets', async () =>
    {
        vi.stubGlobal('fetch', () => 
        {
            return Promise.resolve(
                {
                    ok: true,
                    json: () => Promise.resolve({ sets: [] })
                }
            );
        });

        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor(() =>
        {
            expect(screen.getByText((/You don't have any sets yet. Please create one in Dashboard./i))).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Start Learning/i })).toBeDisabled();
        });
    });

    it('Navigates on submit', async () =>
    {
        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor( () => screen.getByText('Set One'));

        fireEvent.change(screen.getByLabelText(/Select set/i), { target: { value: '1' } });
        fireEvent.click(screen.getByRole('button', { name: /Start Learning/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/learn/practice/1?mode=all');
    });

    it('Changes learning mode and navigates with correct params', async () => 
    {
        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor(() => screen.getByText('Set One'));

        fireEvent.change(screen.getByLabelText(/Select set/i), { target: { value: '2' } });
        fireEvent.change(screen.getByLabelText(/Learning Mode/i), { target: { value: 'unknown' } });
        fireEvent.click(screen.getByRole('button', { name: /Start Learning/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/learn/practice/2?mode=unknown');
    });

    it('Shows alert if no set is selected', async () => 
    {
        window.alert = vi.fn();
        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor(() => screen.getByText('Set One'));

        const select = screen.getByLabelText(/Select set/i);
        select.removeAttribute('required');

        fireEvent.click(screen.getByRole('button', { name: /Start Learning/i }));
        expect(window.alert).toHaveBeenCalledWith('Please select a set to learn from.');
    });

    it('Redirects to login if no token', async () => 
    {
        localStorage.removeItem('token');
        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor(() => 
        {
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
        });
    });

    it('Handles fetch error gracefully', async () =>
    {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));
        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor(() => 
        {
            expect(screen.getByText(/You don't have any sets yet/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Start Learning/i })).toBeDisabled();
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching sets:', expect.any(Error));
        
        consoleErrorSpy.mockRestore();
    });

    //HTTP error
    it('Handles HTTP error response gracefully', async () => 
    {
        vi.stubGlobal('fetch', vi.fn(() =>
            Promise.resolve(
            {
                ok: false,
                status: 500,
                json: async () => ({})
            })
        ));

        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor(() => 
        {
            expect(screen.getByText(/You don't have any sets yet/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Start Learning/i })).toBeDisabled();
        });
    });

    it('Handles network errors in catch block', async () => 
    {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        vi.stubGlobal('fetch', vi.fn(() => 
        {
            throw new Error('Network connection failed');
        }));

        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor(() => 
        {
            expect(screen.getByText(/You don't have any sets yet/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Start Learning/i })).toBeDisabled();
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching sets:', expect.any(Error));
        
        consoleErrorSpy.mockRestore();
    });

    it('Handles response with data.sets being null but data being array', async () => 
    {
        //Test line 45
        vi.stubGlobal('fetch', vi.fn(() => 
            Promise.resolve(
            {
                ok: true,
                json: async () => ({ sets: null, otherData: 'test' })
            })
        ));

        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor(() => 
        {
            expect(screen.getByText(/You don't have any sets yet/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Start Learning/i })).toBeDisabled();
        });
    });

    it('Handles response where data is directly an array (no sets property)', async () => 
    {
        //Test line 45 - the middle part "|| data ||" when data.sets is undefined but data is an array
        const directArrayData = [{ id: '3', name: 'Direct Set' }];
        
        vi.stubGlobal('fetch', vi.fn(() => 
            Promise.resolve(
            {
                ok: true,
                json: async () => directArrayData 
            })
        ));

        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor(() => 
        {
            expect(screen.getByText(/Choose set to learn/i)).toBeInTheDocument();
            expect(screen.getByText('Direct Set')).toBeInTheDocument();
        });
    });

    it('Handles response where data.sets is null but data is an array', async () => 
    {
        //Test line 45 - specifically the "|| data ||" branch when data.sets is null but data is an array
        const mockData = [{ id: '4', name: 'Fallback Set' }];
        Object.defineProperty(mockData, 'sets', { value: null, writable: true });
        
        vi.stubGlobal('fetch', vi.fn(() => 
            Promise.resolve(
            {
                ok: true,
                json: async () => mockData
            })
        ));

        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor(() => 
        {
            expect(screen.getByText(/Choose set to learn/i)).toBeInTheDocument();
            expect(screen.getByText('Fallback Set')).toBeInTheDocument();
        });
    });

    it('Handles response where setsArray is not an array', async () => 
    {
        //Test line 46
        vi.stubGlobal('fetch', vi.fn(() => 
            Promise.resolve(
            {
                ok: true,
                json: async () => ({ sets: "invalid_string_instead_of_array" })  
            })
        ));

        render(
            <BrowserRouter>
                <LearnForm />
            </BrowserRouter>
        );

        await waitFor(() => 
        {
            expect(screen.getByText(/You don't have any sets yet/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Start Learning/i })).toBeDisabled();
        });
    });
});