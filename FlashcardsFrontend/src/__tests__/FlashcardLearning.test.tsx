import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import FlashcardLearning from '../components/FlashcardLearning';
import type { Flashcard } from '../types/flashcard';

vi.mock('../components/Navbar', () => (
{
    default: () => <div data-testid="navbar">Navbar</div>
}));

vi.mock('../components/FlashcardViewer', () => (
{
    default: (
    { 
        current, 
        total, 
        flipped, 
        setCurrent, 
        setFlipped,
        renderCardContent,
        renderActions 
    }: any) => (
        <div data-testid="flashcard-viewer">
            <div data-testid="flashcard-counter">{current + 1} / {total}</div>
            <div data-testid="flashcard-content">
                {renderCardContent(flipped ? "back" : "front")}
            </div>
            <div data-testid="flashcard-actions">
                {renderActions()}
            </div>
            <button 
                data-testid="flip-button" 
                onClick={() => setFlipped(!flipped)}
            >
                Flip
            </button>
            <button 
                data-testid="prev-button" 
                onClick={() => setCurrent(Math.max(0, current - 1))}
            >
                Previous
            </button>
            <button 
                data-testid="next-button" 
                onClick={() => setCurrent(Math.min(total - 1, current + 1))}
            >
                Next
            </button>
        </div>
    )
}));

//Icons
vi.mock('react-icons/ai', () => (
{
    AiFillCheckCircle: () => <div data-testid="check-icon">✓</div>,
    AiFillCloseCircle: () => <div data-testid="close-icon">✗</div>
}));

const mockNavigate = vi.fn();
const mockUseParams = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => mockUseParams(),
        useSearchParams: () => mockUseSearchParams()
    };
});

//i18n
const mockTranslations = 
{
    'flashcardLearning.alreadyKnown': 'Already Known',
    'flashcardLearning.notKnownYet': 'Not Known Yet',
    'flashcardLearning.loadingFlashcards': 'Loading flashcards...',
    'flashcardLearning.noUnknownFlashcards': 'No unknown flashcards in this set.',
    'flashcardLearning.allFlashcardsKnown': 'All flashcards are already known!',
    'flashcardLearning.noFlashcardsInSet': 'No flashcards in this set.',
    'flashcardLearning.returnToDashboard': 'Click to return to dashboard.',
    'flashcardLearning.learningMode': 'Learning Mode',
    'flashcardLearning.allFlashcards': 'All Flashcards',
    'flashcardLearning.unknownFlashcards': 'Unknown Flashcards',
    'languages.PL': 'Polish',
    'languages.EN': 'English',
    'languages.DE': 'German',
    'languages.ES': 'Spanish'
};

i18n.init(
{
    lng: 'en',
    fallbackLng: 'en',
    resources: 
    {
        en: { translation: mockTranslations }
    },
    interpolation: { escapeValue: false }
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

const localStorageMock = 
{
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', 
{
    value: localStorageMock
});

describe('FlashcardLearning component', () => 
{
    const mockFlashcards: Flashcard[] = [
        {
            id: '1',
            setId: 'set1',
            language: 'English',
            content: 'Hello',
            translation: 'Hola',
            translationLang: 'Spanish',
            owner: 'user1',
            known: false
        },
        {
            id: '2',
            setId: 'set1',
            language: 'English',
            content: 'Goodbye',
            translation: 'Adiós',
            translationLang: 'Spanish',
            owner: 'user1',
            known: true
        },
        {
            id: '3',
            setId: 'set1',
            language: 'English',
            content: 'Thank you',
            translation: 'Gracias',
            translationLang: 'Spanish',
            owner: 'user1',
            known: false
        }
    ];

    beforeEach(() => 
    {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue('mock-token');
        
        mockFetch.mockResolvedValue(
        {
            ok: true,
            json: () => Promise.resolve(mockFlashcards)
        });

        mockUseParams.mockReturnValue({ setId: 'set1' });
        mockUseSearchParams.mockReturnValue([new URLSearchParams()]);
    });

    afterEach(() => 
    {
        vi.restoreAllMocks();
    });

    const renderWithProviders = (component: React.ReactElement) => 
    {
        return render(
            <MemoryRouter>
                <I18nextProvider i18n={i18n}>
                    {component}
                </I18nextProvider>
            </MemoryRouter>
        );
    };

    describe('Authentication', () => 
    {
        it('redirects to login when no token is present', () => 
        {
            localStorageMock.getItem.mockReturnValue(null);

            renderWithProviders(<FlashcardLearning />);

            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
        });

        it('Does not redirect when token is present', () => 
        {
            renderWithProviders(<FlashcardLearning />);

            expect(mockNavigate).not.toHaveBeenCalledWith('/login', { replace: true });
        });
    });

    describe('Loading State', () => 
    {
        it('Displays loading message while fetching flashcards', () => 
        {
            mockFetch.mockReturnValue(new Promise(() => {}));

            renderWithProviders(<FlashcardLearning />);

            expect(screen.getByText('Loading flashcards...')).toBeInTheDocument();
        });

        it('Renders navbar during loading', () => 
        {
            mockFetch.mockReturnValue(new Promise(() => {}));

            renderWithProviders(<FlashcardLearning />);

            expect(screen.getByTestId('navbar')).toBeInTheDocument();
        });
    });

    describe('API Integration', () => 
    {
        it('Fetches flashcards with correct API call', async () => 
        {
            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalledWith('/api/sets/set1/flashcards', 
                {
                    headers: 
                    {
                        Authorization: 'Bearer mock-token'
                    }
                });
            });
        });

        it('Handles API error gracefully', async () => 
        {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            mockFetch.mockRejectedValue(new Error('Network error'));

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(consoleSpy).toHaveBeenCalledWith('Fetch error:', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });

        it('Handles non-ok response status', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: false,
                status: 404
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(consoleSpy).toHaveBeenCalled();
            });

            consoleSpy.mockRestore();
        });

        it('Does not fetch when setId is missing', () => 
        {
            mockUseParams.mockReturnValue({ setId: undefined });

            renderWithProviders(<FlashcardLearning />);

            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('Learning Modes', () => 
    {
        it('Shows all flashcards in "all" mode', async () => 
        {
            mockUseSearchParams.mockReturnValue([new URLSearchParams('mode=all')]);

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByText('Learning Mode: All Flashcards')).toBeInTheDocument();
            });

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-counter')).toHaveTextContent('1 / 3');
            });
        });

        it('Shows only unknown flashcards in "unknown" mode', async () => 
        {
            mockUseSearchParams.mockReturnValue([new URLSearchParams('mode=unknown')]);

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByText('Learning Mode: Unknown Flashcards')).toBeInTheDocument();
            });

            //Should only show unknown cards (2 out of 3)
            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-counter')).toHaveTextContent('1 / 2');
            });
        });

        it('Defaults to "all" mode when no mode specified', async () => 
        {
            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByText('Learning Mode: All Flashcards')).toBeInTheDocument();
            });
        });
    });

    describe('Empty States', () => 
    {
        it('Shows message when no flashcards in set', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByRole('button', 
                { 
                    name: (_, element) => element?.textContent === 'No flashcards in this set.Click to return to dashboard.'
                })).toBeInTheDocument();
            });
        });

        it('Shows message when no unknown flashcards in unknown mode', async () => 
        {
            mockUseSearchParams.mockReturnValue([new URLSearchParams('mode=unknown')]);

            const allKnownCards = mockFlashcards.map(card => ({ ...card, known: true }));
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(allKnownCards)
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByRole('button', 
                { 
                    name: (_, element) => element?.textContent === 'No unknown flashcards in this set.All flashcards are already known!'
                })).toBeInTheDocument();
            });
        });

        it('Navigates to dashboard when clicking empty state button', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                const button = screen.getByRole('button');
                fireEvent.click(button);
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
            });
        });
    });

    describe('Card Content Rendering', () => 
    {
        it('Displays flashcard content after loading', async () => 
        {
            renderWithProviders(<FlashcardLearning />);
            
            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });

            await waitFor(() => 
            {
                const content = screen.getByTestId('flashcard-content');
                expect(content).toBeInTheDocument();
                expect(content.textContent).toBeTruthy();
            });
        });

        it('Displays language name for flashcard', async () => 
        {
            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByText('English')).toBeInTheDocument();
            });
        });

        it('Displays known status correctly', async () => 
        {
            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                const knownStatus = screen.getByText(/Already Known|Not Known Yet/);
                expect(knownStatus).toBeInTheDocument();
            });
        });

        it('Truncates long flashcard content', async () => 
        {
            const longContentCard = 
            {
                ...mockFlashcards[0],
                content: 'This is a very long flashcard content that should be truncated when displayed'
            };

            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([longContentCard])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                const content = screen.getByTestId('flashcard-content');
                expect(content.textContent).toContain('...');
            });
        });

        it('Handles empty flashcard content', async () => 
        {
            const emptyContentCard = { ...mockFlashcards[0], content: '', translation: '' };
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([emptyContentCard])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });
        });

        it('Handles null flashcard content', async () => 
        {
            const nullContentCard = { ...mockFlashcards[0], content: null as any, translation: null as any };
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([nullContentCard])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });
        });
    });

    describe('Language Translation', () => 
    {
        it('Translates Polish language correctly', async () => 
        {
            const polishCard = { ...mockFlashcards[0], language: 'Polish' };
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([polishCard])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByText('Polish')).toBeInTheDocument();
            });
        });

        it('Translates German language correctly', async () => 
        {
            const germanCard = { ...mockFlashcards[0], language: 'German' };
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([germanCard])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByText('German')).toBeInTheDocument();
            });
        });

        it('Handles unknown language codes', async () => 
        {
            const unknownLangCard = { ...mockFlashcards[0], language: 'Unknown' };
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([unknownLangCard])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByText('Unknown')).toBeInTheDocument();
            });
        });
    });

    describe('Known Status Toggle', () => 
    {
        it('Toggles known status successfully', async () => 
        {
            const updatedCard = { ...mockFlashcards[0], known: true };
            
            mockFetch
                .mockResolvedValueOnce(
                {
                    ok: true,
                    json: () => Promise.resolve(mockFlashcards)
                })
                .mockResolvedValueOnce(
                {
                    ok: true,
                    json: () => Promise.resolve(updatedCard)
                });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });

            // Wait for cards to load and check the initial status
            await waitFor(() => 
            {
                const knownButton = screen.getByRole('button', { name: /Mark as/ });
                expect(knownButton).toBeInTheDocument();
            });

            // Determine what the current status should be based on the UI
            const knownButton = screen.getByRole('button', { name: /Mark as/ });
            const isCurrentlyKnown = knownButton.getAttribute('aria-label')?.includes('unknown');
            const expectedToggleValue = !isCurrentlyKnown;

            fireEvent.click(knownButton);

            await waitFor(() => 
            {
                //Check that a PATCH call was made to any flashcard's known endpoint
                const patchCalls = mockFetch.mock.calls.filter(call => 
                    call[0]?.toString().includes('/known') && 
                    call[1]?.method === 'PATCH'
                );
                expect(patchCalls.length).toBeGreaterThan(0);
                
                //Verify the PATCH call has the correct structure
                const patchCall = patchCalls[0];
                const [url, options] = patchCall;
                
                expect(url).toContain('/known');
                expect(options.method).toBe('PATCH');
                expect(options.headers['Content-Type']).toBe('application/json');
                expect(options.headers.Authorization).toBe('Bearer mock-token');
                expect(options.body).toBe(JSON.stringify({ known: expectedToggleValue }));
            }, { timeout: 3000 });
        });

        it('Handles known status toggle error', async () => 
        {
            mockFetch
                .mockResolvedValueOnce(
                {
                    ok: true,
                    json: () => Promise.resolve(mockFlashcards)
                })
                .mockRejectedValueOnce(new Error('Network error'));

            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });

            await waitFor(() => 
            {
                const knownButton = screen.getByRole('button', { name: /Mark as/ });
                fireEvent.click(knownButton);
            });

            await waitFor(() => 
            {
                expect(consoleSpy).toHaveBeenCalledWith('Error updating known status:', expect.any(Error));
                expect(alertSpy).toHaveBeenCalledWith('Failed to update known status. Please try again.');
            });

            alertSpy.mockRestore();
            consoleSpy.mockRestore();
        });

        it('Handles non-ok response for known status toggle', async () => 
        {
            mockFetch
                .mockResolvedValueOnce(
                {
                    ok: true,
                    json: () => Promise.resolve(mockFlashcards)
                })
                .mockResolvedValueOnce(
                {
                    ok: false,
                    status: 500
                });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });

            await waitFor(() => 
            {
                const knownButton = screen.getByRole('button', { name: /Mark as/ });
                fireEvent.click(knownButton);
            });

            await waitFor(() => 
            {
                expect(consoleSpy).toHaveBeenCalled();
            });

            consoleSpy.mockRestore();
        });

        it('Displays correct icon for known flashcard', async () => 
        {
            const knownCard = { ...mockFlashcards[0], known: true };
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([knownCard])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('check-icon')).toBeInTheDocument();
            });
        });

        it('Displays correct icon for unknown flashcard', async () => 
        {
            const unknownCard = { ...mockFlashcards[0], known: false };
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([unknownCard])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('close-icon')).toBeInTheDocument();
            });
        });

        it('Handles flashcard without known property', async () => 
        {
            const cardWithoutKnown = { ...mockFlashcards[0] };
            delete cardWithoutKnown.known;

            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([cardWithoutKnown])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByText('Not Known Yet')).toBeInTheDocument();
            });
        });
    });

    describe('Card Navigation', () => 
    {
        it('Navigates between cards correctly', async () => 
        {
            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-counter')).toHaveTextContent('1 / 3');
            });

            const nextButton = screen.getByTestId('next-button');
            fireEvent.click(nextButton);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-counter')).toHaveTextContent('2 / 3');
            });

            const prevButton = screen.getByTestId('prev-button');
            fireEvent.click(prevButton);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-counter')).toHaveTextContent('1 / 3');
            });
        });

        it('Flips cards correctly', async () => 
        {
            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });

            await waitFor(() => 
            {
                const flipButton = screen.getByTestId('flip-button');
                fireEvent.click(flipButton);
                expect(flipButton).toBeInTheDocument();
            });
        });
    });

    describe('Array Shuffling', () => 
    {
        it('Maintains array length after shuffling', async () => 
        {
            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-counter')).toHaveTextContent('1 / 3');
            });
        });

        it('Handles empty array shuffling', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByRole('button', 
                { 
                    name: (_, element) => element?.textContent === 'No flashcards in this set.Click to return to dashboard.'
                })).toBeInTheDocument();
            });
        });
    });

    describe('Component Integration', () => 
    {
        it('Renders all required components', async () => 
        {
            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('navbar')).toBeInTheDocument();
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
                expect(screen.getByText('Learning Mode: All Flashcards')).toBeInTheDocument();
            });
        });

        it('Passes correct props to FlashcardViewer', async () => 
        {
            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
                expect(screen.getByTestId('flashcard-counter')).toHaveTextContent('1 / 3');
            });
        });

        it('Handles FlashcardViewer interactions correctly', async () => 
        {
            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                const flipButton = screen.getByTestId('flip-button');
                const nextButton = screen.getByTestId('next-button');
                const prevButton = screen.getByTestId('prev-button');

                expect(flipButton).toBeInTheDocument();
                expect(nextButton).toBeInTheDocument();
                expect(prevButton).toBeInTheDocument();
            });
        });
    });

    describe('Utility Functions', () => 
    {
        it('Truncates text correctly when length exceeds maximum', async () => 
        {
            //Create text longer than 50 characters
            const longText = 'This is a very long text that should be truncated because it exceeds fifty characters';
            const longContentCard = { ...mockFlashcards[0], content: longText };
            
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([longContentCard])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                const content = screen.getByTestId('flashcard-content');
                expect(content.textContent).toContain('...');
            });
        });

        it('Does not truncate short text', async () => 
        {
            const shortText = 'Short';
            const shortContentCard = { ...mockFlashcards[0], content: shortText };
            
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([shortContentCard])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                const content = screen.getByTestId('flashcard-content');
                expect(content.textContent).toContain('Short');
                expect(content.textContent).not.toContain('...');
            });
        });

        it('Handles empty string in truncation', async () => 
        {
            const emptyContentCard = { ...mockFlashcards[0], content: '' };
            
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([emptyContentCard])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });
        });
    });

    describe('Edge Cases and Error Handling', () => 
    {
        it('Handles null response from API', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(null)
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByRole('button', 
                { 
                    name: (_, element) => element?.textContent === 'No flashcards in this set.Click to return to dashboard.'
                })).toBeInTheDocument();
            });
        });

        it('Handles undefined response from API', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(undefined)
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByRole('button', 
                { 
                    name: (_, element) => element?.textContent === 'No flashcards in this set.Click to return to dashboard.'
                })).toBeInTheDocument();
            });
        });

        it('Handles malformed flashcard data', async () => 
        {
            const malformedCard = { id: '1' }; //Missing required fields
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([malformedCard])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });
        });

        it('Prevents toggle known when sessionFlashcards is empty', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([])
            });

            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByRole('button', 
                { 
                    name: (_, element) => element?.textContent === 'No flashcards in this set.Click to return to dashboard.'
                })).toBeInTheDocument();
            });

            //Should not have any known buttons to click
            const knownButtons = screen.queryAllByRole('button', { name: /Mark as/ });
            expect(knownButtons).toHaveLength(0);
        });

        it('Handles click event with stopPropagation', async () => 
        {
            renderWithProviders(<FlashcardLearning />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });

            await waitFor(() => 
            {
                const knownButton = screen.getByRole('button', { name: /Mark as/ });
                fireEvent(knownButton, new MouseEvent('click', { bubbles: true }));
            });

            expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
        });
    });
});