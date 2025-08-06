import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import '@testing-library/jest-dom';
import LearnForm from '../components/LearnForm.tsx';

i18n.init(
{
  lng: 'en',
  fallbackLng: 'en',
  interpolation: 
  {
    escapeValue: false,
  },
  resources: 
  {
    en: 
    {
      translation: 
      {
        learnForm: 
        {
          loadingSets: "Loading your sets...",
          title: "Learn Flashcards",
          selectSet: "Select set",
          chooseSetPlaceholder: "Choose set to learn",
          learningMode: "Learning mode",
          practiceAll: "Practice all cards",
          practiceUnknown: "Practice unknown cards",
          startLearning: "Start Learning",
          noSetsCreated: "No sets created yet.",
          selectSetError: "Please select a set to learn from."
        },
        navbar: {
          appName: "FlashCards",
          learn: "Learn",
          statistics: "Statistics",
          logout: "Logout"
        }
      }
    }
  }
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => 
(
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  </BrowserRouter>
);

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => 
{
    const actual = await vi.importActual('react-router-dom'); 
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockSets = [
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
        })
    ));
    localStorage.setItem('token', 'test-token');
});

describe('LearnForm', () => 
{
    it('Renders loading state initially', async () => 
    {
        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        expect(screen.getByText('Loading your sets...')).toBeInTheDocument();
    });

    it('Renders sets after loading', async () => 
    {
        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('Learn Flashcards')).toBeInTheDocument();
        });

        expect(screen.getByText('Select set')).toBeInTheDocument();
        expect(screen.getByText('Learning mode')).toBeInTheDocument();
        expect(screen.getByText('Set One')).toBeInTheDocument();
        expect(screen.getByText('Set Two')).toBeInTheDocument();
    });

    it('Disables submit button when no sets are available', async () => 
    {
        vi.stubGlobal('fetch', vi.fn(() => 
            Promise.resolve(
            {
                ok: true,
                json: async () => [],
            })
        ));

        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('No sets created yet.')).toBeInTheDocument();
        });

        const startButton = screen.getByText('Start Learning');
        expect(startButton).toBeDisabled();
    });

    it('Navigates on form submit with correct parameters', async () => 
    {
        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('Learn Flashcards')).toBeInTheDocument();
        });

        const setSelect = screen.getByRole('combobox', { name: /select set/i });
        const startButton = screen.getByText('Start Learning');

        await act(async () => 
        {
            fireEvent.change(setSelect, { target: { value: '1' } });
            fireEvent.click(startButton);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/learn/practice/1?mode=all');
    });

    it('Changes learning mode and navigates with correct params', async () => 
    {
        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('Learn Flashcards')).toBeInTheDocument();
        });

        const setSelect = screen.getByRole('combobox', { name: /select set/i });
        const modeSelect = screen.getByRole('combobox', { name: /learning mode/i });
        const startButton = screen.getByText('Start Learning');

        await act(async () => 
        {
            fireEvent.change(setSelect, { target: { value: '2' } });
            fireEvent.change(modeSelect, { target: { value: 'unknown' } });
            fireEvent.click(startButton);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/learn/practice/2?mode=unknown');
    });

    it('Handles HTTP error response gracefully', async () => 
    {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        vi.stubGlobal('fetch', vi.fn(() => 
            Promise.resolve(
            {
                ok: false,
                status: 500,
            })
        ));

        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('No sets created yet.')).toBeInTheDocument();
        });

        const startButton = screen.getByText('Start Learning');
        expect(startButton).toBeDisabled();

        consoleSpy.mockRestore();
    });

    it('Handles network errors in fetch', async () => 
    {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        vi.stubGlobal('fetch', vi.fn(() => 
            Promise.reject(new Error('Network error'))
        ));

        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('No sets created yet.')).toBeInTheDocument();
        });

        const startButton = screen.getByText('Start Learning');
        expect(startButton).toBeDisabled();

        consoleSpy.mockRestore();
    });

    it('Handles response with data.sets property', async () => 
    {
        vi.stubGlobal('fetch', vi.fn(() => 
            Promise.resolve(
            {
                ok: true,
                json: async () => ({ sets: mockSets }),
            })
        ));

        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('Learn Flashcards')).toBeInTheDocument();
        });

        expect(screen.getByText('Set One')).toBeInTheDocument();
        expect(screen.getByText('Set Two')).toBeInTheDocument();
    });

    it('Handles response where data is directly an array', async () => 
    {
        const directArrayData = [
            { id: '3', name: 'Direct Set' }
        ];

        vi.stubGlobal('fetch', vi.fn(() => 
            Promise.resolve(
            {
                ok: true,
                json: async () => directArrayData,
            })
        ));

        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('Learn Flashcards')).toBeInTheDocument();
        });

        expect(screen.getByText('Direct Set')).toBeInTheDocument();
    });

    it('Handles response where data.sets is null but data is an array', async () => 
    {
        const fallbackData = [
            { id: '4', name: 'Fallback Set' }
        ];

        vi.stubGlobal('fetch', vi.fn(() => 
            Promise.resolve(
            {
                ok: true,
                json: async () => fallbackData,
            })
        ));

        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('Learn Flashcards')).toBeInTheDocument();
        });

        expect(screen.getByText('Fallback Set')).toBeInTheDocument();
    });

    it('Handles response where setsArray is not an array', async () => 
    {
        vi.stubGlobal('fetch', vi.fn(() => 
            Promise.resolve(
            {
                ok: true,
                json: async () => ({ sets: null }),
            })
        ));

        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('No sets created yet.')).toBeInTheDocument();
        });

        const startButton = screen.getByText('Start Learning');
        expect(startButton).toBeDisabled();
    });

    it('Prevents submission when no set is selected', async () => 
    {
        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('Learn Flashcards')).toBeInTheDocument();
        });

        const startButton = screen.getByText('Start Learning');
        
        await act(async () => 
        {
            fireEvent.click(startButton);
        });

        //Should not navigate since form validation prevents submission
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('Uses correct fetch request with authorization token', async () => 
    {
        const fetchSpy = vi.fn(() => 
            Promise.resolve(
            {
                ok: true,
                json: async () => mockSets,
            })
        );
        vi.stubGlobal('fetch', fetchSpy);

        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('Learn Flashcards')).toBeInTheDocument();
        });

        expect(fetchSpy).toHaveBeenCalledWith('/api/sets', 
        {
            headers: 
            {
                'Authorization': 'Bearer test-token'
            }
        });
    });

    it('Redirects to login when no authorization token is present', async () => 
    {
        localStorage.removeItem('token');

        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
        });
    });

    it('Shows alert when trying to submit with empty set selection', async () => 
    {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        
        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('Learn Flashcards')).toBeInTheDocument();
        });

        const form = document.querySelector('form');
        const setSelect = screen.getByRole('combobox', { name: /select set/i });
        
        setSelect.removeAttribute('required');
        
        //Create a submit event and dispatch it directly to test our validation
        await act(async () => 
        {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form?.dispatchEvent(submitEvent);
        });

        //Alert and not navigate
        expect(alertSpy).toHaveBeenCalledWith('Please select a set to learn from.');
        expect(mockNavigate).not.toHaveBeenCalled();
        
        alertSpy.mockRestore();
    });

    it('Shows alert when trying to submit with whitespace-only set selection', async () => 
    {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        
        render(
            <TestWrapper>
                <LearnForm />
            </TestWrapper>
        );

        await waitFor(() => 
        {
            expect(screen.getByText('Learn Flashcards')).toBeInTheDocument();
        });

        const form = document.querySelector('form');
        const setSelect = screen.getByRole('combobox', { name: /select set/i });
        
        await act(async () => 
        {
            fireEvent.change(setSelect, { target: { value: '   ' } });
        });
        
        setSelect.removeAttribute('required');
        
        //Create a submit event and dispatch it directly to test our validation
        await act(async () => 
        {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form?.dispatchEvent(submitEvent);
        });

        //Alert and not navigate
        expect(alertSpy).toHaveBeenCalledWith('Please select a set to learn from.');
        expect(mockNavigate).not.toHaveBeenCalled();
        
        alertSpy.mockRestore();
    });
});