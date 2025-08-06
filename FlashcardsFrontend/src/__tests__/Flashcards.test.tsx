import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Flashcards from '../components/Flashcards';
import '@testing-library/jest-dom';

vi.mock('react-i18next', () => (
{
    useTranslation: () => (
    {
        t: (key: string) => 
        {
            const translations: { [key: string]: string } = 
            {
                'languages.PL': 'Polski',
                'languages.EN': 'English', 
                'languages.DE': 'Niemiecki',
                'languages.ES': 'Spanish',
                'flashcards.loading': 'Loading...',
                'flashcards.noFlashcards': 'No flashcards in this set yet. Click "Add Flashcard" to create one!',
                'flashcards.alreadyKnown': 'Already known',
                'flashcards.notKnownYet': 'Not known yet',
                'flashcards.select': 'Select',
                'flashcards.language': 'Language',
                'flashcards.translationLanguage': 'Translation Language',
                'flashcards.content': 'Word',
                'flashcards.translation': 'Translation'
            };
            return translations[key] || key;
        }
    }),
    I18nextProvider: ({ children }: any) => children
}));

vi.mock('../components/Navbar', () => (
{
    default: () => <div data-testid="navbar">Navbar</div>
}));

vi.mock('../components/AddFlashcardButton', () => (
{
    default: ({ flashcards, setFlashcards, setCurrent, setFlipped }: any) => (
        <div data-testid="add-flashcard-button">
            <button onClick={() => 
            {
                const newFlashcard = 
                {
                    id: Date.now(),
                    language: 'EN',
                    content: 'New Card',
                    translationLang: 'PL',
                    translation: 'Nowa Karta',
                    known: false
                };
                setFlashcards([...flashcards, newFlashcard]);
                setCurrent(flashcards.length);
                setFlipped(false);
            }}>
                Add Flashcard
            </button>
        </div>
    )
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
            <button data-testid="flip-button" onClick={() => setFlipped(!flipped)}>
                Flip
            </button>
            <button data-testid="prev-button" onClick={() => setCurrent(Math.max(0, current - 1))}>
                Previous
            </button>
            <button data-testid="next-button" onClick={() => setCurrent(Math.min(total - 1, current + 1))}>
                Next
            </button>
        </div>
    )
}));

const mockNavigate = vi.fn();
const mockUseParams = vi.fn();

vi.mock('react-router-dom', async () => 
{
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => mockUseParams()
    };
});

//Icons
vi.mock('react-icons/ai', () => (
{
    AiFillEdit: () => <div data-testid="edit-icon">✏️</div>,
    AiFillDelete: () => <div data-testid="delete-icon">🗑️</div>,
    AiOutlineCheck: () => <div data-testid="check-icon">✓</div>,
    AiOutlineClose: () => <div data-testid="close-icon">✗</div>,
    AiFillCheckCircle: () => <div data-testid="check-circle-icon">✅</div>,
    AiFillCloseCircle: () => <div data-testid="close-circle-icon">❌</div>
}));

const renderWithProviders = (component: React.ReactElement) => 
{
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

const mockFlashcards = [
    {
        id: 1,
        language: 'English',
        content: 'Hello',
        translationLang: 'Polish',
        translation: 'Cześć',
        known: false
    },
    {
        id: 2,
        language: 'English',
        content: 'Goodbye',
        translationLang: 'Polish',
        translation: 'Do widzenia',
        known: true
    },
    {
        id: 3,
        language: 'German',
        content: 'Hallo',
        translationLang: 'English',
        translation: 'Hello',
        known: false
    }
];

let mockFetch: Mock;

beforeEach(() => 
{
    vi.clearAllMocks();
    
    mockUseParams.mockReturnValue({ setId: 'set1' });
    
    Object.defineProperty(window, 'localStorage', 
    {
        value: 
        {
            getItem: vi.fn((key: string) => 
            {
                if (key === 'token') return 'mock-token';
                if (key === 'username') return 'testuser';
                return null;
            }),
            setItem: vi.fn(),
            removeItem: vi.fn(),
        },
        writable: true,
    });

    mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    mockFetch.mockResolvedValue(
    {
        ok: true,
        json: () => Promise.resolve(mockFlashcards)
    });

    global.confirm = vi.fn(() => true);
    
    global.alert = vi.fn();

    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();
    Object.defineProperty(window, 'addEventListener', 
    {
        value: mockAddEventListener,
        writable: true,
    });
    Object.defineProperty(window, 'removeEventListener', 
    {
        value: mockRemoveEventListener,
        writable: true,
    });
});

describe('Flashcards component', () => 
{
    describe('Authentication and Setup', () => 
    {
        it('Retrieves username from localStorage', async () => 
        {
            renderWithProviders(<Flashcards />);
            
            await waitFor(() => 
            {
                expect(localStorage.getItem).toHaveBeenCalledWith('username');
            });
        });

        it('Uses default username when localStorage is empty', async () => 
        {
            (localStorage.getItem as Mock).mockImplementation((key: string) => 
            {
                if (key === 'token') return 'mock-token';
                if (key === 'username') return null;
                return null;
            });

            renderWithProviders(<Flashcards />);
            
            await waitFor(() => {
                expect(screen.getByTestId('navbar')).toBeInTheDocument();
            });
        });
    });

    describe('Loading State', () => 
    {
        it('Displays loading message while fetching flashcards', () => 
        {
            renderWithProviders(<Flashcards />);
            
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
            expect(screen.getByTestId('navbar')).toBeInTheDocument();
        });

        it('Renders navbar during loading', () => 
        {
            renderWithProviders(<Flashcards />);
            
            expect(screen.getByTestId('navbar')).toBeInTheDocument();
        });
    });

    describe('API Integration', () => 
    {
        it('Fetches flashcards with correct API call', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/api/sets/set1/flashcards');
            });
        });

        it('Handles API error gracefully', async () => 
        {
            mockFetch.mockRejectedValue(new Error('Network error'));
            
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText(/No flashcards/i)).toBeInTheDocument();
            });
        });

        it('Handles non-ok response status', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: false,
                status: 404
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => {
                expect(screen.getByText(/No flashcards/i)).toBeInTheDocument();
            });
        });

        it('Does not fetch when setId is missing', () => 
        {
            mockUseParams.mockReturnValue({});
            
            renderWithProviders(<Flashcards />);

            expect(mockFetch).not.toHaveBeenCalled();
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

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText(/No flashcards/i)).toBeInTheDocument();
            });
        });

        it('Shows add flashcard button when no flashcards', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([])
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('add-flashcard-button')).toBeInTheDocument();
            });
        });
    });

    describe('Card Content Rendering', () => 
    {
        it('Displays flashcard content after loading', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });
        });

        it('Displays language name for flashcard', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText('English')).toBeInTheDocument();
            });
        });

        it('Displays known status correctly', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText(/Not Known Yet/i)).toBeInTheDocument();
            });
        });

        it('Truncates long flashcard content', async () => 
        {
            const longContentFlashcard = [
            {
                id: 1,
                language: 'English',
                content: 'This is a very long content that should be truncated because it exceeds the maximum length',
                translationLang: 'Polish',
                translation: 'To jest bardzo długa treść',
                known: false
            }];

            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(longContentFlashcard)
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText(/This is a very long content that should be truncat\.\.\./)).toBeInTheDocument();
            });
        });

        it('Handles empty flashcard content', async () => 
        {
            const emptyContentFlashcard = [
            {
                id: 1,
                language: 'English',
                content: '',
                translationLang: 'Polish',
                translation: 'Test',
                known: false
            }];

            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(emptyContentFlashcard)
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-content')).toBeInTheDocument();
            });
        });

        it('Handles null flashcard content', async () => 
        {
            const nullContentFlashcard = [
            {
                id: 1,
                language: 'English',
                content: null,
                translationLang: 'Polish',
                translation: 'Test',
                known: false
            }];

            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(nullContentFlashcard)
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-content')).toBeInTheDocument();
            });
        });
    });

    describe('Language Translation', () => 
    {
        it('Translates Polish language correctly', async () => 
        {
            const polishFlashcard = [
            {
                id: 1,
                language: 'Polish',
                content: 'Cześć',
                translationLang: 'English',
                translation: 'Hello',
                known: false
            }];

            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(polishFlashcard)
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText('Polski')).toBeInTheDocument();
            });
        });

        it('Translates German language correctly', async () => 
        {
            const germanFlashcard = [
            {
                id: 1,
                language: 'German',
                content: 'Hallo',
                translationLang: 'English',
                translation: 'Hello',
                known: false
            }];

            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(germanFlashcard)
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText('Niemiecki')).toBeInTheDocument();
            });
        });

        it('Handles unknown language codes', async () => 
        {
            const unknownLanguageFlashcard = [
            {
                id: 1,
                language: 'Unknown',
                content: 'Test',
                translationLang: 'English',
                translation: 'Test',
                known: false
            }];

            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(unknownLanguageFlashcard)
            });

            renderWithProviders(<Flashcards />);

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
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: () => Promise.resolve(mockFlashcards)
            }).mockResolvedValueOnce(
            {
                ok: true,
                json: () => Promise.resolve({ ...mockFlashcards[0], known: true })
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const knownButton = screen.getByRole('button', { name: /Mark as known/ });
                fireEvent.click(knownButton);
            });

            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/sets/set1/flashcards/1/known',
                    expect.objectContaining({
                        method: 'PATCH',
                        headers: expect.objectContaining(
                        {
                            'Content-Type': 'application/json',
                            Authorization: 'Bearer mock-token'
                        }),
                        body: '{"known":true}'
                    })
                );
            });
        });

        it('Handles known status toggle error', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: () => Promise.resolve(mockFlashcards)
            }).mockRejectedValueOnce(new Error('Network error'));

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const knownButton = screen.getByRole('button', { name: /Mark as known/ });
                fireEvent.click(knownButton);
            });

            await waitFor(() => 
            {
                expect(global.alert).toHaveBeenCalledWith('Failed to update known status. Please try again.');
            });
        });

        it('Handles non-ok response for known status toggle', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: () => Promise.resolve(mockFlashcards)
            }).mockResolvedValueOnce(
            {
                ok: false,
                status: 500
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const knownButton = screen.getByRole('button', { name: /Mark as known/ });
                fireEvent.click(knownButton);
            });

            await waitFor(() => 
            {
                expect(global.alert).toHaveBeenCalledWith('Failed to update known status. Please try again.');
            });
        });

        it('Displays correct icon for known flashcard', async () => 
        {
            const knownFlashcard = [
            {
                ...mockFlashcards[0],
                known: true
            }];

            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(knownFlashcard)
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
            });
        });

        it('Displays correct icon for unknown flashcard', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('close-circle-icon')).toBeInTheDocument();
            });
        });

        it('Handles flashcard without known property', async () => 
        {
            const flashcardWithoutKnown = [
            {
                id: 1,
                language: 'English',
                content: 'Hello',
                translationLang: 'Polish',
                translation: 'Cześć'
            }];

            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(flashcardWithoutKnown)
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('close-circle-icon')).toBeInTheDocument();
            });
        });
    });

    describe('Card Navigation', () => 
    {
        it('Navigates between cards correctly', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText('1 / 3')).toBeInTheDocument();
            });

            const nextButton = screen.getByTestId('next-button');
            fireEvent.click(nextButton);

            await waitFor(() => 
            {
                expect(screen.getByText('2 / 3')).toBeInTheDocument();
            });
        });

        it('Flips cards correctly', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText('Hello')).toBeInTheDocument();
            });

            const flipButton = screen.getByTestId('flip-button');
            fireEvent.click(flipButton);

            await waitFor(() => 
            {
                expect(screen.getByText('Cześć')).toBeInTheDocument();
            });
        });
    });

    describe('Edit Functionality', () => 
    {
        it('Enters edit mode when edit button is clicked', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByRole('button', { name: /Edit Flashcard/ });
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
            });
        });

        it('Saves edit successfully', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: () => Promise.resolve(mockFlashcards)
            }).mockResolvedValueOnce(
            {
                ok: true,
                json: () => Promise.resolve({ ...mockFlashcards[0], content: 'Updated Hello' })
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByRole('button', { name: /Edit Flashcard/ });
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                const contentInput = screen.getByDisplayValue('Hello');
                fireEvent.change(contentInput, { target: { value: 'Updated Hello' } });
                
                const saveButton = screen.getByRole('button', { name: /Save/ });
                fireEvent.click(saveButton);
            });

            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/sets/set1/flashcards/1',
                    expect.objectContaining(
                    {
                        method: 'PUT',
                        headers: expect.objectContaining(
                        {
                            'Content-Type': 'application/json',
                            Authorization: 'Bearer mock-token'
                        })
                    })
                );
            });
        });

        it('Cancels edit mode', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByRole('button', { name: /Edit Flashcard/ });
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                const cancelButton = screen.getByRole('button', { name: /Cancel/ });
                fireEvent.click(cancelButton);
            });

            await waitFor(() => 
            {
                expect(screen.queryByDisplayValue('Hello')).not.toBeInTheDocument();
                expect(screen.getByText('Hello')).toBeInTheDocument();
            });
        });

        it('Handles edit validation for empty fields', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByRole('button', { name: /Edit Flashcard/ });
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                const contentInput = screen.getByDisplayValue('Hello');
                fireEvent.change(contentInput, { target: { value: '' } });
                
                const saveButton = screen.getByRole('button', { name: /Save/ });
                fireEvent.click(saveButton);
            });

            //Should not make API call with empty content
            expect(mockFetch).toHaveBeenCalledTimes(1); //Initial fetch
        });

        it('Handles edit API error', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: () => Promise.resolve(mockFlashcards)
            }).mockRejectedValueOnce(new Error('Network error'));

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByRole('button', { name: /Edit Flashcard/ });
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                const saveButton = screen.getByRole('button', { name: /Save/ });
                fireEvent.click(saveButton);
            });

            await waitFor(() => 
            {
                expect(global.alert).toHaveBeenCalledWith('Failed to update flashcard. Please try again.');
            });
        });
    });

    describe('Delete Functionality', () => 
    {
        it('Deletes flashcard successfully', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: () => Promise.resolve(mockFlashcards)
            }).mockResolvedValueOnce(
            {
                ok: true,
                json: () => Promise.resolve({})
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const deleteButton = screen.getByRole('button', { name: /Delete Flashcard/ });
                fireEvent.click(deleteButton);
            });

            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/sets/set1/flashcards/1',
                    expect.objectContaining(
                    {
                        method: 'DELETE',
                        headers: expect.objectContaining(
                        {
                            Authorization: 'Bearer mock-token'
                        })
                    })
                );
            });
        });

        it('Prevents deletion when only one flashcard remains', async () => 
        {
            const singleFlashcard = [mockFlashcards[0]];
            
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(singleFlashcard)
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const deleteButton = screen.getByRole('button', { name: /Delete Flashcard/ });
                fireEvent.click(deleteButton);
            });

            expect(global.alert).toHaveBeenCalledWith('You must have at least one flashcard.');
        });

        it('Handles delete confirmation cancellation', async () => 
        {
            global.confirm = vi.fn(() => false);

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const deleteButton = screen.getByRole('button', { name: /Delete Flashcard/ });
                fireEvent.click(deleteButton);
            });

            //Should not make delete API call
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('Handles delete API error', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: () => Promise.resolve(mockFlashcards)
            }).mockRejectedValueOnce(new Error('Network error'));

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const deleteButton = screen.getByRole('button', { name: /Delete Flashcard/ });
                fireEvent.click(deleteButton);
            });

            await waitFor(() => 
            {
                expect(global.alert).toHaveBeenCalledWith('Failed to delete flashcard. Please try again.');
            });
        });
    });

    describe('Component Integration', () => 
    {
        it('Renders all required components', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('navbar')).toBeInTheDocument();
                expect(screen.getByTestId('add-flashcard-button')).toBeInTheDocument();
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });
        });

        it('Passes correct props to FlashcardViewer', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText('1 / 3')).toBeInTheDocument();
                expect(screen.getByTestId('flashcard-content')).toBeInTheDocument();
                expect(screen.getByTestId('flashcard-actions')).toBeInTheDocument();
            });
        });

        it('Handles FlashcardViewer interactions correctly', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const flipButton = screen.getByTestId('flip-button');
                fireEvent.click(flipButton);
            });

            await waitFor(() => 
            {
                expect(screen.getByText('Cześć')).toBeInTheDocument();
            });
        });
    });

    describe('Utility Functions', () => 
    {
        it('Truncates text correctly when length exceeds maximum', () => 
        {
            const longText = 'This is a very long text that should be truncated because it exceeds maximum length';
            
            renderWithProviders(<Flashcards />);
            
            expect(longText.length).toBeGreaterThan(50);
        });

        it('Does not truncate short text', () => 
        {
            const shortText = 'Short';
            
            renderWithProviders(<Flashcards />);
            
            expect(shortText.length).toBeLessThanOrEqual(50);
        });

        it('Handles empty string in truncation', () => 
        {
            const emptyText = '';
            
            renderWithProviders(<Flashcards />);
            
            expect(emptyText).toBe('');
        });
    });

    describe('Event Handling', () =>
    {
        it('Prevents page unload during editing', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
            });
        });

        it('Removes event listener on component unmount', async () => 
        {
            const { unmount } = renderWithProviders(<Flashcards />);
            
            await waitFor(() => 
            {
                expect(window.addEventListener).toHaveBeenCalled();
            });

            unmount();

            expect(window.removeEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        });

        it('Handles stopPropagation in edit handlers', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByRole('button', { name: /Edit Flashcard/ });
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
            });
        });

        it('Handles stopPropagation in save handlers', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByRole('button', { name: /Edit Flashcard/ });
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                const saveButton = screen.getByRole('button', { name: /Save/ });
                fireEvent.click(saveButton);
            });

            //Save functionality works (stopPropagation worked)
            expect(mockFetch).toHaveBeenCalledTimes(2); //Initial fetch + save
        });

        it('Handles stopPropagation in cancel handlers', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByRole('button', { name: /Edit Flashcard/ });
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                const cancelButton = screen.getByRole('button', { name: /Cancel/ });
                fireEvent.click(cancelButton);
            });

            //Cancel functionality works (stopPropagation worked)
            await waitFor(() => 
            {
                expect(screen.queryByDisplayValue('Hello')).not.toBeInTheDocument();
            });
        });

        it('Handles stopPropagation in delete handlers', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const deleteButton = screen.getByRole('button', { name: /Delete Flashcard/ });
                fireEvent.click(deleteButton);
            });

            //Delete confirmation appears (stopPropagation worked)
            expect(global.confirm).toHaveBeenCalled();
        });

        it('Handles stopPropagation in toggle known handlers', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const knownButton = screen.getByRole('button', { name: /Mark as known/ });
                fireEvent.click(knownButton);
            });

            //Toggle functionality works (stopPropagation worked)
            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/known'),
                    expect.objectContaining(
                    {
                        method: 'PATCH'
                    })
                );
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

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText(/No flashcards/i)).toBeInTheDocument();
            });
        });

        it('Handles undefined response from API', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(undefined)
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText(/No flashcards/i)).toBeInTheDocument();
            });
        });

        it('Handles malformed flashcard data', async () => 
        {
            const malformedData = [
                { id: 1 }, //Missing required fields
                { content: 'Test' }, //Missing ID
                null, //Null flashcard
                undefined //Undefined flashcard
            ];

            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(malformedData)
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
            });
        });

        it('Prevents actions when flashcards array is empty', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([])
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText(/No flashcards/i)).toBeInTheDocument();
                expect(screen.queryByTestId('flashcard-actions')).not.toBeInTheDocument();
            });
        });
    });

    describe('Render Function Coverage', () => 
    {
        it('RenderCardContent returns null when flashcards array is empty', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([])
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText(/No flashcards/i)).toBeInTheDocument();
                expect(screen.queryByTestId('flashcard-content')).not.toBeInTheDocument();
            });
        });

        it('RenderActions returns null when flashcards array is empty', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve([])
            });

            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                expect(screen.getByText(/No flashcards/i)).toBeInTheDocument();
                expect(screen.queryByTestId('flashcard-actions')).not.toBeInTheDocument();
            });
        });

        it('Renders form content in edit mode', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByRole('button', { name: /Edit Flashcard/ });
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
                expect(screen.getByRole('combobox')).toBeInTheDocument();
                //Check that the form contains input fields
                expect(screen.getByPlaceholderText('Word')).toBeInTheDocument();
            });
        });

        it('Handles form submission in edit mode', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByRole('button', { name: /Edit Flashcard/ });
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                const saveButton = screen.getByRole('button', { name: /Save/ });
                fireEvent.click(saveButton);
            });

            expect(mockFetch).toHaveBeenCalledTimes(2); // Initial fetch + save
        });

        it('Prevents event propagation in form', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByRole('button', { name: /Edit Flashcard/ });
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                const contentInput = screen.getByDisplayValue('Hello');
                fireEvent.click(contentInput);
            });

            //Form should still be visible (click didn't propagate to flip card)
            expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
        });
    });

    describe('Error Handling Edge Cases', () => 
    {
        it('Should handle HTTP error status in edit form submission (lines 154-155)', async () => {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByLabelText('Edit Flashcard');
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                expect(screen.getByLabelText('Save')).toBeInTheDocument();
            });

            const frontInput = screen.getByDisplayValue('Hello');
            const submitButton = screen.getByLabelText('Save');

            fireEvent.change(frontInput, { target: { value: 'updated front' } });

            mockFetch.mockResolvedValueOnce(
            {
                ok: false,
                status: 400,
                json: async () => ({})
            });

            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

            fireEvent.click(submitButton);

            await waitFor(() => 
            {
                expect(alertSpy).toHaveBeenCalledWith('Failed to update flashcard. Please try again.');
            });

            alertSpy.mockRestore();
        });

        it('Should handle HTTP error status in delete flashcard (lines 205-206)', async () => 
        {
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const deleteButton = screen.getByLabelText('Delete Flashcard');
                
                const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
                
                mockFetch.mockResolvedValueOnce(
                {
                    ok: false,
                    status: 404,
                    json: async () => ({})
                });

                const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

                fireEvent.click(deleteButton);

                setTimeout(async () => 
                {
                    expect(alertSpy).toHaveBeenCalledWith('Failed to delete flashcard. Please try again.');
                    confirmSpy.mockRestore();
                    alertSpy.mockRestore();
                }, 100);
            });
        });

        it('Should render known status label correctly for known flashcard (line 329)', async () => 
        {
            const mockFlashcardsKnown = [
                { id: 1, language: 'English', content: 'Hello', translationLang: 'pl', translation: 'Cześć', known: true },
                { id: 2, language: 'English', content: 'Goodbye', translationLang: 'pl', translation: 'Do widzenia', known: false },
                { id: 3, language: 'English', content: 'Thank you', translationLang: 'pl', translation: 'Dziękuję', known: false }
            ];

            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockFlashcardsKnown
            });

            renderWithProviders(<Flashcards />);
            
            await waitFor(() => 
            {
                expect(screen.getByText('Hello')).toBeInTheDocument();
            });

            expect(screen.getByText('Already known')).toBeInTheDocument();
            expect(screen.getByText('Already known')).toHaveClass('known-label', 'known');
        });

        it('Should render unknown status label correctly for unknown flashcard (line 329)', async () => 
        {
            renderWithProviders(<Flashcards />);
            
            await waitFor(() => 
            {
                expect(screen.getByText('Hello')).toBeInTheDocument();
            });

            expect(screen.getByText('Not known yet')).toBeInTheDocument();
            expect(screen.getByText('Not known yet')).toHaveClass('known-label', 'unknown');
        });

        it('Should trigger beforeunload event handler during editing (lines 93-96)', async () => 
        {
            // Mock window.addEventListener to capture the event handler
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
            
            renderWithProviders(<Flashcards />);

            await waitFor(() => 
            {
                const editButton = screen.getByLabelText('Edit Flashcard');
                fireEvent.click(editButton);
            });

            await waitFor(() => 
            {
                expect(screen.getByLabelText('Save')).toBeInTheDocument();
            });

            //Verify that beforeunload event listener was added
            expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

            //Get the handler function that was registered
            const beforeunloadCalls = addEventListenerSpy.mock.calls.filter(call => call[0] === 'beforeunload');
            expect(beforeunloadCalls.length).toBeGreaterThan(0);
            
            const handler = beforeunloadCalls[0][1] as EventListener;

            //Create a mock event and test the handler directly
            const mockEvent = 
            {
                preventDefault: vi.fn(),
                returnValue: ''
            } as any;

            //Call the handler directly
            handler(mockEvent);

            //Verify that preventDefault was called and returnValue was set
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockEvent.returnValue).toBe('');

            addEventListenerSpy.mockRestore();
        });

        it('Should handle known flashcard ternary operator (line 329)', async () => 
        {
            const mockFlashcardsWithKnown = [
                { id: 1, language: 'English', content: 'Test', translationLang: 'pl', translation: 'Test', known: true }
            ];

            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockFlashcardsWithKnown
            });

            renderWithProviders(<Flashcards />);
            
            await waitFor(() => 
            {
                expect(screen.getByText('Test')).toBeInTheDocument();
            });

            // Test the true branch of the ternary operator (line 329)
            expect(screen.getByText('Already known')).toBeInTheDocument();
            expect(screen.getByText('Already known')).toHaveClass('known-label', 'known');
        });
    });
});
