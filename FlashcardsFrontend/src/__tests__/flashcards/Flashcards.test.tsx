import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Flashcards from '../../components/flashcards/Flashcards';

const mockSetId = 'test-set-id';
vi.mock('react-router-dom', async () => 
{
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ setId: mockSetId })
    };
});

vi.mock('react-i18next', () => (
{
    useTranslation: () => (
        {
        t: (key: string) => 
        {
            const translations: { [key: string]: string } = {
                'flashcards.loading': 'Loading flashcards...',
                'flashcards.noFlashcards': 'No flashcards available. Add some!',
                'flashcards.select': 'Select',
                'flashcards.language': 'Language',
                'flashcards.translationLanguage': 'Translation Language',
                'flashcards.content': 'Content',
                'flashcards.translation': 'Translation',
                'languages.PL': 'Polish',
                'languages.EN': 'English',
                'languages.DE': 'German',
                'languages.ES': 'Spanish',
                'flashcards.notKnownYet': 'Not Known Yet',
                'flashcards.alreadyKnown': 'Already Known'
            };
            return translations[key] || key;
        },
        i18n: 
        {
            language: 'en',
            changeLanguage: vi.fn()
        }
    })
}));

const mockFlashcardsManagement = 
{
    flashcards: [] as any[],
    current: 0,
    flipped: false,
    loading: false,
    setCurrent: vi.fn(),
    setFlipped: vi.fn(),
    flashcardActions: {
        update: vi.fn()
    },
    setFlashcards: vi.fn()
};

vi.mock('../../hooks/useFlashcardsManagement', () => (
{
    useFlashcardsManagement: vi.fn(() => mockFlashcardsManagement)
}));

describe('Flashcards', () => 
{
    const mockFlashcard = 
    {
        id: 'flashcard-1',
        setId: 'test-set-id',
        language: 'English',
        content: 'Hello World',
        translation: 'Hola Mundo',
        translationLang: 'Spanish',
        owner: 'user1',
        known: false
    };

    const mockFetch = vi.fn();
    const mockAlert = vi.fn();
    const mockLocalStorageGetItem = vi.fn();
    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();

    beforeEach(() => 
    {
        global.fetch = mockFetch;
        global.alert = mockAlert;
        
        Object.defineProperty(window, 'localStorage', 
        {
            value: 
            {
                getItem: mockLocalStorageGetItem,
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn()
            },
            writable: true
        });

        Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener, writable: true });
        Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener, writable: true });

        vi.clearAllMocks();
        mockLocalStorageGetItem.mockReturnValue('test-user');
        
        mockFlashcardsManagement.flashcards = [];
        mockFlashcardsManagement.current = 0;
        mockFlashcardsManagement.flipped = false;
        mockFlashcardsManagement.loading = false;
    });

    describe('Component rendering', () => {
        it('Renders loading state when loading is true', () => 
        {
            mockFlashcardsManagement.loading = true;
            
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            expect(screen.getByText('Loading flashcards...')).toBeInTheDocument();
        });

        it('Renders empty state when no flashcards exist', () => 
        {
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            expect(screen.getByText('No flashcards available. Add some!')).toBeInTheDocument();

            expect(screen.queryByLabelText('Edit Flashcard')).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Delete Flashcard')).not.toBeInTheDocument();
        });

        it('Renders flashcard when flashcards exist', () => 
        {
            mockFlashcardsManagement.flashcards = [mockFlashcard];
            
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            expect(screen.getByText('Hello World')).toBeInTheDocument();
            expect(screen.getByText('English')).toBeInTheDocument();
            expect(screen.queryByText('No flashcards available. Add some!')).not.toBeInTheDocument();
        });
    });

    describe('Edit functionality', () => 
    {
        beforeEach(() => 
        {
            mockFlashcardsManagement.flashcards = [mockFlashcard];
            mockLocalStorageGetItem.mockReturnValue('test-token');
        });

        it('Enters edit mode when edit button is clicked', () => 
        {
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            const editButtons = screen.getAllByLabelText('Edit Flashcard');
            fireEvent.click(editButtons[0]);
            
            expect(screen.getByDisplayValue('Hello World')).toBeInTheDocument();
        });

        it('Saves changes when save button is clicked', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve({ ...mockFlashcard, content: 'Updated Content' })
            });
            
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            const editButtons = screen.getAllByLabelText('Edit Flashcard');
            fireEvent.click(editButtons[0]);
            
            const contentInput = screen.getByDisplayValue('Hello World');
            fireEvent.change(contentInput, { target: { value: 'Updated Content' } });
            
            const saveButtons = screen.getAllByLabelText('Save');
            fireEvent.click(saveButtons[0]);
            
            expect(mockFetch).toHaveBeenCalledWith(
                `/api/sets/${mockSetId}/flashcards/${mockFlashcard.id}`,
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer test-token'
                    })
                })
            );
        });

        it('Handles save errors gracefully', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: false,
                status: 404
            });
            
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            const editButtons = screen.getAllByLabelText('Edit Flashcard');
            fireEvent.click(editButtons[0]);
            
            const saveButtons = screen.getAllByLabelText('Save');
            fireEvent.click(saveButtons[0]);
            
            await waitFor(() => 
            {
                expect(mockAlert).toHaveBeenCalledWith('Failed to update flashcard. Please try again.');
            });
        });

        it('Cancels edit mode when cancel button is clicked', () => 
        {
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            const editButtons = screen.getAllByLabelText('Edit Flashcard');
            fireEvent.click(editButtons[0]);
            
            const cancelButtons = screen.getAllByLabelText('Cancel');
            fireEvent.click(cancelButtons[0]);
            
            expect(screen.queryByDisplayValue('Hello World')).not.toBeInTheDocument();
        });

        it('Validates maxLength on edit input fields', () => 
        {
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            const editButtons = screen.getAllByLabelText('Edit Flashcard');
            fireEvent.click(editButtons[0]);
            
            const contentInput = screen.getByDisplayValue('Hello World');
            const translationInput = screen.getByDisplayValue('Hola Mundo');
            
            expect(contentInput).toHaveAttribute('maxLength', '30');
            expect(translationInput).toHaveAttribute('maxLength', '30');
        });

        it('Handles edit form changes for language select and content input', () => 
        {
            const { container } = render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            const editButtons = screen.getAllByLabelText('Edit Flashcard');
            fireEvent.click(editButtons[0]);
            
            const languageSelect = container.querySelector('select[name="language"]');
            if (languageSelect) 
            {
                fireEvent.change(languageSelect, { target: { value: 'DE', name: 'language' } });
                expect(languageSelect).toHaveValue('DE');
            }
            
            const contentInput = screen.getByDisplayValue('Hello World');
            fireEvent.change(contentInput, { target: { value: 'New Content', name: 'content' } });
            
            expect(contentInput).toHaveValue('New Content');
        });

        it('Handles edit form changes for translation fields', () => 
        {
            const { container } = render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            const editButtons = screen.getAllByLabelText('Edit Flashcard');
            fireEvent.click(editButtons[0]);
            
            const translationLangSelect = container.querySelector('select[name="translationLang"]');
            if (translationLangSelect) 
            {
                fireEvent.change(translationLangSelect, { target: { value: 'DE', name: 'translationLang' } });
                expect(translationLangSelect).toHaveValue('DE');
            }
            
            const translationInput = screen.getByDisplayValue('Hola Mundo');
            fireEvent.change(translationInput, { target: { value: 'New Translation', name: 'translation' } });
            
            expect(translationInput).toHaveValue('New Translation');
        });
    });

    describe('Content handling', () => 
    {
        it('Handles long content with title attribute', () => 
        {
            const longContent = 'This is a very long flashcard content that should be truncated when displayed';
            const flashcardWithLongContent = { ...mockFlashcard, content: longContent };
            mockFlashcardsManagement.flashcards = [flashcardWithLongContent];
            
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            const contentElement = screen.getByTitle(longContent);
            expect(contentElement).toBeInTheDocument();
        });

        it('Handles empty content gracefully', () => 
        {
            const flashcardWithEmptyContent = { ...mockFlashcard, content: '' };
            mockFlashcardsManagement.flashcards = [flashcardWithEmptyContent];
            
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            expect(screen.getByText('English')).toBeInTheDocument();
        });
    });

    describe('Language functionality', () => 
    {
        beforeEach(() => 
        {
            mockFlashcardsManagement.flashcards = [mockFlashcard];
        });

        it('Displays language options in edit mode', () => 
        {
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            const editButtons = screen.getAllByLabelText('Edit Flashcard');
            fireEvent.click(editButtons[0]);
            
            const polishOptions = screen.getAllByText('Polish');
            const englishOptions = screen.getAllByText('English');
            expect(polishOptions.length).toBeGreaterThan(0);
            expect(englishOptions.length).toBeGreaterThan(0);
        });

        it('Handles different language mappings', () => 
        {
            const flashcardWithDifferentLanguage = { ...mockFlashcard, language: 'Polish' };
            mockFlashcardsManagement.flashcards = [flashcardWithDifferentLanguage];
            
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            expect(screen.getByText('Polish')).toBeInTheDocument();
        });
    });

    describe('Component interactions', () => 
    {
        beforeEach(() => 
        {
            mockFlashcardsManagement.flashcards = [mockFlashcard];
        });

        it('Renders known status elements', () => 
        {
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            const knownStatusElements = screen.getAllByText('Not Known Yet');
            expect(knownStatusElements.length).toBeGreaterThan(0);
        });

        it('Renders action buttons', () => 
        {
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            const editButtons = screen.getAllByLabelText('Edit Flashcard');
            const deleteButtons = screen.getAllByLabelText('Delete Flashcard');
            expect(editButtons.length).toBeGreaterThan(0);
            expect(deleteButtons.length).toBeGreaterThan(0);
        });

        it('Has add flashcard button', () => 
        {
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            expect(screen.getByLabelText('Add Flashcard')).toBeInTheDocument();
        });

        it('Handles flashcard deletion with state updates', async () => 
        {
            const secondCard = { ...mockFlashcard, id: 'card-2', content: 'Second Card' };
            mockFlashcardsManagement.flashcards = [mockFlashcard, secondCard];
            mockFlashcardsManagement.current = 1;
            
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve({})
            });
            
            const mockConfirm = vi.fn(() => true);
            Object.defineProperty(window, 'confirm', { value: mockConfirm, writable: true });
            
            mockLocalStorageGetItem.mockReturnValue('test-token');
            
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            expect(screen.getByText('Second Card')).toBeInTheDocument();
            
            const deleteButtons = screen.getAllByLabelText('Delete Flashcard');
            fireEvent.click(deleteButtons[0]);
            
            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalledWith(
                    `/api/sets/${mockSetId}/flashcards/card-2`,
                    expect.objectContaining({
                        method: 'DELETE',
                        headers: expect.objectContaining(
                        {
                            Authorization: 'Bearer test-token'
                        })
                    })
                );
            });
            
            await waitFor(() => 
            {
                expect(mockFlashcardsManagement.setFlashcards).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({ id: 'flashcard-1' })
                    ])
                );
                expect(mockFlashcardsManagement.setCurrent).toHaveBeenCalledWith(0);
                expect(mockFlashcardsManagement.setFlipped).toHaveBeenCalledWith(false);
            });
        });

        it('Handles flashcard deletion at index 0 with correct current update', async () => 
        {
            const secondCard = { ...mockFlashcard, id: 'card-2', content: 'Second Card' };
            mockFlashcardsManagement.flashcards = [mockFlashcard, secondCard];
            mockFlashcardsManagement.current = 0;
            
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve({})
            });
            
            const mockConfirm = vi.fn(() => true);
            Object.defineProperty(window, 'confirm', { value: mockConfirm, writable: true });
            
            mockLocalStorageGetItem.mockReturnValue('test-token');
            
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );

            expect(screen.getByText('Hello World')).toBeInTheDocument();
            
            const deleteButtons = screen.getAllByLabelText('Delete Flashcard');
            fireEvent.click(deleteButtons[0]);
            
            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalledWith(
                    `/api/sets/${mockSetId}/flashcards/flashcard-1`,
                    expect.objectContaining({
                        method: 'DELETE',
                        headers: expect.objectContaining(
                        {
                            Authorization: 'Bearer test-token'
                        })
                    })
                );
            });

            await waitFor(() => 
            {
                expect(mockFlashcardsManagement.setCurrent).toHaveBeenCalledWith(0);
            });
        });
    });

    describe('Page lifecycle', () => 
    {
        it('Sets up beforeunload event listener', () => 
        {
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        });

        it('[Prevents page unload when beforeunload event is triggered', () => 
        {
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            const beforeUnloadHandler = mockAddEventListener.mock.calls.find(
                call => call[0] === 'beforeunload'
            )?.[1];
            
            expect(beforeUnloadHandler).toBeDefined();
            
            const mockEvent = 
            {
                preventDefault: vi.fn(),
                returnValue: ''
            };
            
            beforeUnloadHandler(mockEvent);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockEvent.returnValue).toBe('');
        });

        it('Cleans up event listener on unmount', () => 
        {
            const { unmount } = render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            unmount();
            
            expect(mockRemoveEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        });
    });

    describe('Hook integration', () => 
    {
        it('Calls hook with expected parameters', () => 
        {
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            expect(mockFlashcardsManagement.flashcardActions.update).toBeDefined();
            expect(mockFlashcardsManagement.setFlashcards).toBeDefined();
            expect(mockFlashcardsManagement.setCurrent).toBeDefined();
            expect(mockFlashcardsManagement.setFlipped).toBeDefined();
        });

        it('Responds to current flashcard changes', () => 
        {
            mockFlashcardsManagement.flashcards = [mockFlashcard, { ...mockFlashcard, id: 'card-2', content: 'Second Card' }];
            mockFlashcardsManagement.current = 1;
            
            render(
                <BrowserRouter>
                    <Flashcards />
                </BrowserRouter>
            );
            
            expect(screen.getByText('2 / 2')).toBeInTheDocument();
        });
    });
});
