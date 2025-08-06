import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import AddFlashcardButton from '../components/AddFlashcardButton';
import type { Flashcard } from '../types/flashcard';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';

// Mock i18n setup
i18n.init(
{
    lng: 'en',
    resources: 
    {
        en: 
        {
            translation: 
            {
                'addFlashcard.addNewFlashcard': 'Add new flashcard',
                'addFlashcard.content': 'Content',
                'addFlashcard.translation': 'Translation',
                'addFlashcard.language': 'Language',
                'addFlashcard.translationLanguage': 'Translation Language',
                'addFlashcard.listLanguage': 'Select language',
                'addFlashcard.listTranslationLanguage': 'Select translation language',
                'addFlashcard.save': 'Save',
                'addFlashcard.cancel': 'Cancel',
                'languages.PL': 'Polish',
                'languages.EN': 'English',
                'languages.DE': 'German',
                'languages.ES': 'Spanish',
                'dashboard.characters': 'characters'
            }
        }
    }
});

// Helper function to render component with i18n
const renderWithI18n = (component: React.ReactElement) => 
{
    return render(
        <I18nextProvider i18n={i18n}>
            {component}
        </I18nextProvider>
    );
};

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockLocalStorage = 
{
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', 
{
    value: mockLocalStorage
});

describe('AddFlashcardButton component', () => 
{
    const mockSetFlashcards = vi.fn();
    const mockSetCurrent = vi.fn();
    const mockSetFlipped = vi.fn();

    const mockFlashcards: Flashcard[] = 
    [
        {
            id: '1',
            setId: 'set-1',
            language: 'EN',
            content: 'Hello',
            translation: 'Hola',
            translationLang: 'ES',
            owner: 'testuser',
            known: false
        },
        {
            id: '2',
            setId: 'set-1',
            language: 'EN',
            content: 'World',
            translation: 'Mundo',
            translationLang: 'ES',
            owner: 'testuser',
            known: true
        }
    ];

    const defaultProps = 
    {
        selectedSetId: 'set-1',
        currentUser: 'testuser',
        flashcards: mockFlashcards,
        setFlashcards: mockSetFlashcards,
        setCurrent: mockSetCurrent,
        setFlipped: mockSetFlipped
    };

    beforeEach(() => 
    {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('mock-token');
        
        mockFetch.mockResolvedValue(
        {
            ok: true,
            json: () => Promise.resolve(
            {
                id: '3',
                setId: 'set-1',
                language: 'EN',
                content: 'Test',
                translation: 'Prueba',
                translationLang: 'ES',
                owner: 'testuser',
                known: false
            })
        });
    });

    afterEach(() => 
    {
        vi.restoreAllMocks();
    });

    describe('Initial Rendering', () => 
    {
        it('Renders add flashcard button', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            expect(addButton).toBeInTheDocument();
            expect(addButton).toHaveTextContent('+ Add new flashcard');
        });

        it('Does not show modal initially', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            expect(screen.queryByText('Add new flashcard')).not.toBeInTheDocument();
        });

        it('Has proper accessibility attributes', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            expect(addButton).toHaveAttribute('aria-label', 'Add Flashcard');
        });

        it('Has correct CSS class', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            expect(addButton).toHaveClass('flashcard-add-button');
        });
    });

    describe('Modal Opening and Closing', () => 
    {
        it('Opens modal when add button is clicked', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            expect(screen.getByText('Add new flashcard')).toBeInTheDocument();
            expect(document.querySelector('form.flashcard-add-form')).toBeInTheDocument();
        });

        it('Closes modal when cancel button is clicked', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            //Close modal
            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            fireEvent.click(cancelButton);
            
            expect(screen.queryByText('Add new flashcard')).not.toBeInTheDocument();
        });

        it('Resets form values when opening modal', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            //Check that form fields are empty/default
            const contentInput = screen.getByPlaceholderText('Content');
            const translationInput = screen.getByPlaceholderText('Translation');
            const languageSelect = screen.getByLabelText(/^language$/i);
            const translationLangSelect = screen.getByLabelText(/translation language/i);
            
            expect(contentInput).toHaveValue('');
            expect(translationInput).toHaveValue('');
            expect(languageSelect).toHaveValue('');
            expect(translationLangSelect).toHaveValue('');
        });

        it('Shows modal with correct CSS class', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            const modal = document.querySelector('.flashcard-add-modal');
            expect(modal).toBeInTheDocument();
            expect(modal).toHaveClass('flashcard-add-modal');
            
            const form = document.querySelector('form.flashcard-add-form');
            expect(form).toBeInTheDocument();
            expect(form).toHaveClass('flashcard-add-form');
        });
    });

    describe('Form Interactions', () => 
    {
        beforeEach(() => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
        });

        it('Renders all form fields', () => 
        {
            expect(screen.getByLabelText(/^language$/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Content')).toBeInTheDocument();
            expect(screen.getByLabelText(/translation language/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Translation')).toBeInTheDocument();
        });

        it('Updates language field when changed', () => 
        {
            const languageSelect = screen.getByLabelText(/^language$/i);
            
            fireEvent.change(languageSelect, { target: { value: 'EN' } });
            
            expect(languageSelect).toHaveValue('EN');
        });

        it('updates content field when changed', () => 
        {
            const contentInput = screen.getByPlaceholderText('Content');
            
            fireEvent.change(contentInput, { target: { value: 'Hello' } });
            
            expect(contentInput).toHaveValue('Hello');
        });

        it('updates translation language field when changed', () => 
        {
            const translationLangSelect = screen.getByLabelText(/translation language/i);
            
            fireEvent.change(translationLangSelect, { target: { value: 'ES' } });
            
            expect(translationLangSelect).toHaveValue('ES');
        });

        it('updates translation field when changed', () => 
        {
            const translationInput = screen.getByPlaceholderText('Translation');
            
            fireEvent.change(translationInput, { target: { value: 'Hola' } });
            
            expect(translationInput).toHaveValue('Hola');
        });

        it('shows all language options', () => 
        {
            //Check that language options exist in the language select
            const languageSelect = screen.getByLabelText(/^language$/i);
            expect(languageSelect).toBeInTheDocument();
            
            //Check that all options are available by looking at the select's options
            const languageOptions = screen.getAllByText('Polish');
            const englishOptions = screen.getAllByText('English');
            const germanOptions = screen.getAllByText('German');
            const spanishOptions = screen.getAllByText('Spanish');
            
            expect(languageOptions).toHaveLength(2);
            expect(englishOptions).toHaveLength(2);
            expect(germanOptions).toHaveLength(2);
            expect(spanishOptions).toHaveLength(2);
        });

        it('Shows character count for content field', () => 
        {
            const contentInput = screen.getByPlaceholderText('Content');
            fireEvent.change(contentInput, { target: { value: 'Hello' } });
            
            expect(screen.getByText('5/30 characters')).toBeInTheDocument();
        });

        it('Shows character count for translation field', () => 
        {
            const translationInput = screen.getByPlaceholderText('Translation');
            fireEvent.change(translationInput, { target: { value: 'Hola' } });
            
            expect(screen.getByText('4/30 characters')).toBeInTheDocument();
        });

        it('Enforces maxLength for content field', () => 
        {
            const contentInput = screen.getByPlaceholderText('Content');
            expect(contentInput).toHaveAttribute('maxLength', '30');
        });

        it('Enforces maxLength for translation field', () => 
        {
            const translationInput = screen.getByPlaceholderText('Translation');
            expect(translationInput).toHaveAttribute('maxLength', '30');
        });

        it('Has correct CSS classes for inputs', () => 
        {
            const contentInput = screen.getByPlaceholderText('Content');
            const translationInput = screen.getByPlaceholderText('Translation');
            const languageSelect = screen.getByLabelText(/^language$/i);
            const translationLangSelect = screen.getByLabelText(/translation language/i);
            
            expect(contentInput).toHaveClass('flashcard-edit-input');
            expect(translationInput).toHaveClass('flashcard-edit-input');
            expect(languageSelect).toHaveClass('flashcard-edit-input');
            expect(translationLangSelect).toHaveClass('flashcard-edit-input');
        });
    });

    describe('Form Validation', () => 
    {
        beforeEach(() => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
        });

        it('Requires all fields to be filled', () => 
        {
            const languageSelect = screen.getByLabelText(/^language$/i);
            const contentInput = screen.getByPlaceholderText('Content');
            const translationLangSelect = screen.getByLabelText(/translation language/i);
            const translationInput = screen.getByPlaceholderText('Translation');
            
            expect(languageSelect).toHaveAttribute('required');
            expect(contentInput).toHaveAttribute('required');
            expect(translationLangSelect).toHaveAttribute('required');
            expect(translationInput).toHaveAttribute('required');
        });

        it('Does not submit when fields are empty', async () => 
        {
            const saveButton = screen.getByRole('button', { name: /save/i });
            
            fireEvent.click(saveButton);
            
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('submits when all fields are filled', async () => 
        {
            fireEvent.change(screen.getByLabelText(/^language$/i), { target: { value: 'EN' } });
            fireEvent.change(screen.getByPlaceholderText('Content'), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/translation language/i), { target: { value: 'ES' } });
            fireEvent.change(screen.getByPlaceholderText('Translation'), { target: { value: 'Prueba' } });
            
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalled();
            });
        });

        it('Shows default option text for language selects', () => 
        {
            expect(screen.getByText('Select language')).toBeInTheDocument();
            expect(screen.getByText('Select translation language')).toBeInTheDocument();
        });

        it('Has correct button CSS classes', () => 
        {
            const saveButton = screen.getByRole('button', { name: /save/i });
            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            
            expect(saveButton).toHaveClass('flashcard-add-save-button');
            expect(cancelButton).toHaveClass('flashcard-add-cancel-button');
        });
    });

    describe('API Integration', () => 
    {
        beforeEach(() => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            fireEvent.change(screen.getByLabelText(/^language$/i), { target: { value: 'EN' } });
            fireEvent.change(screen.getByPlaceholderText('Content'), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/translation language/i), { target: { value: 'ES' } });
            fireEvent.change(screen.getByPlaceholderText('Translation'), { target: { value: 'Prueba' } });
        });

        it('Makes correct API call', async () => 
        {
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/sets/set-1/flashcards',
                    expect.objectContaining(
                    {
                        method: 'POST',
                        headers: 
                        {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer mock-token'
                        },
                        body: expect.stringContaining('"content":"Test"')
                    })
                );
            });
        });

        it('Includes correct data in request body', async () => 
        {
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            await waitFor(() => 
            {
                const callArgs = mockFetch.mock.calls[0];
                const requestBody = JSON.parse(callArgs[1].body);
                
                expect(requestBody).toMatchObject(
                {
                    setId: 'set-1',
                    language: 'EN',
                    content: 'Test',
                    translation: 'Prueba',
                    translationLang: 'ES',
                    owner: 'testuser',
                    known: false
                });
                expect(requestBody.id).toBeTruthy(); // Should have generated ID
            });
        });

        it('Updates state after successful submission', async () => 
        {
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            await waitFor(() => 
            {
                expect(mockSetFlashcards).toHaveBeenCalledWith(
                [
                    ...mockFlashcards,
                    expect.objectContaining(
                    {
                        id: '3',
                        content: 'Test',
                        translation: 'Prueba'
                    })
                ]);
                expect(mockSetCurrent).toHaveBeenCalledWith(mockFlashcards.length);
                expect(mockSetFlipped).toHaveBeenCalledWith(false);
            });
        });

        it('Closes modal after successful submission', async () => 
        {
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            await waitFor(() => 
            {
                expect(screen.queryByText('Add new flashcard')).not.toBeInTheDocument();
            });
        });

        it('Handles API error gracefully', async () => 
        {
            // Mock failed response
            mockFetch.mockRejectedValueOnce(new Error('API Error'));
            
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
            
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            await waitFor(() => 
            {
                expect(consoleSpy).toHaveBeenCalledWith('Error adding flashcard:', expect.any(Error));
                expect(alertSpy).toHaveBeenCalledWith('Failed to add flashcard. Please try again.');
            });
            
            consoleSpy.mockRestore();
            alertSpy.mockRestore();
        });

        it('Uses timestamp as ID for new flashcard', async () => 
        {
            // Mock Date.now to return a specific timestamp
            const mockTimestamp = 1234567890;
            const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
            
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            await waitFor(() => 
            {
                const callArgs = mockFetch.mock.calls[0];
                const requestBody = JSON.parse(callArgs[1].body);
                expect(requestBody.id).toBe(mockTimestamp.toString());
            });
            
            dateSpy.mockRestore();
        });
    });

    describe('Edge cases', () => 
    {
        it('Handles null selectedSetId', () => 
        {
            const props = { ...defaultProps, selectedSetId: null };
            renderWithI18n(<AddFlashcardButton {...props} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            expect(screen.getByText('Add new flashcard')).toBeInTheDocument(); //Still rendering modal
        });

        it('Handles empty flashcards array', () => 
        {
            const props = { ...defaultProps, flashcards: [] };
            renderWithI18n(<AddFlashcardButton {...props} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            expect(addButton).toBeInTheDocument();
        });

        it('Handles whitespace-only inputs', async () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            //Whitespaces
            fireEvent.change(screen.getByLabelText(/^language$/i), { target: { value: 'EN' } });
            fireEvent.change(screen.getByPlaceholderText('Content'), { target: { value: '   ' } });
            fireEvent.change(screen.getByLabelText(/translation language/i), { target: { value: 'ES' } });
            fireEvent.change(screen.getByPlaceholderText('Translation'), { target: { value: '   ' } });
            
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('Validates trimmed content and translation', async () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            // Valid content with trailing spaces
            fireEvent.change(screen.getByLabelText(/^language$/i), { target: { value: 'EN' } });
            fireEvent.change(screen.getByPlaceholderText('Content'), { target: { value: '  Hello  ' } });
            fireEvent.change(screen.getByLabelText(/translation language/i), { target: { value: 'ES' } });
            fireEvent.change(screen.getByPlaceholderText('Translation'), { target: { value: '  Hola  ' } });
            
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalled();
            });
        });

        it('Handles missing localStorage token', async () => 
        {
            mockLocalStorage.getItem.mockReturnValue(null);
            
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            fireEvent.change(screen.getByLabelText(/^language$/i), { target: { value: 'EN' } });
            fireEvent.change(screen.getByPlaceholderText('Content'), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/translation language/i), { target: { value: 'ES' } });
            fireEvent.change(screen.getByPlaceholderText('Translation'), { target: { value: 'Prueba' } });
            
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/sets/set-1/flashcards',
                    expect.objectContaining(
                    {
                        headers: expect.objectContaining(
                        {
                            'Authorization': 'Bearer null'
                        })
                    })
                );
            });
        });

        it('Resets form properly when reopening modal', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            // Open modal and fill form
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            fireEvent.change(screen.getByLabelText(/^language$/i), { target: { value: 'EN' } });
            fireEvent.change(screen.getByPlaceholderText('Content'), { target: { value: 'Test' } });
            
            // Cancel modal
            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            fireEvent.click(cancelButton);
            
            // Reopen modal
            fireEvent.click(addButton);
            
            // Check that form is reset
            expect(screen.getByLabelText(/^language$/i)).toHaveValue('');
            expect(screen.getByPlaceholderText('Content')).toHaveValue('');
        });
    });

    describe('Accessibility', () => 
    {
        it('Has proper form labels', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            expect(screen.getByLabelText(/^language$/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/translation language/i)).toBeInTheDocument();
        });

        it('Has proper button labels', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            expect(screen.getByRole('button', { name: /save/i })).toHaveAttribute('aria-label', 'Save');
            expect(screen.getByRole('button', { name: /cancel/i })).toHaveAttribute('aria-label', 'Cancel');
        });

        it('Supports "Enter" key submission', async () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            //Normal filling
            fireEvent.change(screen.getByLabelText(/^language$/i), { target: { value: 'EN' } });
            fireEvent.change(screen.getByPlaceholderText('Content'), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/translation language/i), { target: { value: 'ES' } });
            fireEvent.change(screen.getByPlaceholderText('Translation'), { target: { value: 'Prueba' } });
            
            //Submit by enter
            const form = document.querySelector('form.flashcard-add-form');
            expect(form).toBeInTheDocument();
            fireEvent.submit(form!);
            
            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalled();
            });
        });

        it('Has proper form structure', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            const form = document.querySelector('form.flashcard-add-form');
            expect(form).toBeInTheDocument();
            expect(form).toHaveClass('flashcard-add-form');
        });

        it('Has semantic HTML structure', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            // Check that inputs are properly associated with labels
            const languageSelect = screen.getByLabelText(/^language$/i);
            const translationLangSelect = screen.getByLabelText(/translation language/i);
            
            expect(languageSelect).toHaveAttribute('name', 'language');
            expect(translationLangSelect).toHaveAttribute('name', 'translationLang');
        });

        it('Provides proper input context with character counters', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            // Check that character counters are present for both text inputs
            expect(screen.getAllByText('0/30 characters')).toHaveLength(2);
            
            const contentInput = screen.getByPlaceholderText('Content');
            fireEvent.change(contentInput, { target: { value: 'Hello' } });
            
            expect(screen.getByText('5/30 characters')).toBeInTheDocument();
        });
    });

    describe('Internationalization', () => 
    {
        it('Uses translation keys for all text content', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            expect(addButton).toHaveTextContent('+ Add new flashcard');
            
            fireEvent.click(addButton);
            
            expect(screen.getByText('Add new flashcard')).toBeInTheDocument(); // Modal title
            expect(screen.getByText('Language')).toBeInTheDocument();
            expect(screen.getByText('Translation Language')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Content')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Translation')).toBeInTheDocument();
            expect(screen.getByText('Save')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
        });

        it('Shows translated language options', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            // Check that language options are translated
            expect(screen.getAllByText('Polish')).toHaveLength(2);
            expect(screen.getAllByText('English')).toHaveLength(2);
            expect(screen.getAllByText('German')).toHaveLength(2);
            expect(screen.getAllByText('Spanish')).toHaveLength(2);
        });

        it('Shows translated placeholder options', () => 
        {
            renderWithI18n(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            expect(screen.getByText('Select language')).toBeInTheDocument();
            expect(screen.getByText('Select translation language')).toBeInTheDocument();
        });
    });
});