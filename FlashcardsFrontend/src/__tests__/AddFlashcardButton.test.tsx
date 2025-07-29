import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import AddFlashcardButton from '../components/AddFlashcardButton';
import type { Flashcard } from '../types/flashcard';

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
            language: 'English',
            content: 'Hello',
            translation: 'Hola',
            translationLang: 'Spanish',
            owner: 'testuser',
            known: false
        },
        {
            id: '2',
            setId: 'set-1',
            language: 'English',
            content: 'World',
            translation: 'Mundo',
            translationLang: 'Spanish',
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
                language: 'English',
                content: 'Test',
                translation: 'Prueba',
                translationLang: 'Spanish',
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
            render(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            expect(addButton).toBeInTheDocument();
            expect(addButton).toHaveTextContent('+ Add Flashcard');
        });

        it('Does not show modal initially', () => 
        {
            render(<AddFlashcardButton {...defaultProps} />);
            
            expect(screen.queryByText('Add New Flashcard')).not.toBeInTheDocument();
        });

        it('Has proper accessibility attributes', () => 
        {
            render(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            expect(addButton).toHaveAttribute('aria-label', 'Add Flashcard');
        });
    });

    describe('Modal Opening and Closing', () => 
    {
        it('Opens modal when add button is clicked', () => 
        {
            render(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            expect(screen.getByText('Add New Flashcard')).toBeInTheDocument();
        });

        it('Closes modal when cancel button is clicked', () => 
        {
            render(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            // Close modal
            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            fireEvent.click(cancelButton);
            
            expect(screen.queryByText('Add New Flashcard')).not.toBeInTheDocument();
        });

        it('Resets form values when opening modal', () => 
        {
            render(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            //Check that form fields are empty/default
            const contentInput = screen.getByPlaceholderText('Word');
            const translationInput = screen.getByPlaceholderText('Translation');
            const languageSelect = screen.getByLabelText(/^language$/i);
            const translationLangSelect = screen.getByLabelText(/translation language/i);
            
            expect(contentInput).toHaveValue('');
            expect(translationInput).toHaveValue('');
            expect(languageSelect).toHaveValue('');
            expect(translationLangSelect).toHaveValue('');
        });
    });

    describe('Form Interactions', () => 
    {
        beforeEach(() => 
        {
            render(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
        });

        it('Renders all form fields', () => 
        {
            expect(screen.getByLabelText(/^language$/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Word')).toBeInTheDocument();
            expect(screen.getByLabelText(/translation language/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Translation')).toBeInTheDocument();
        });

        it('Updates language field when changed', () => 
        {
            const languageSelect = screen.getByLabelText(/^language$/i);
            
            fireEvent.change(languageSelect, { target: { value: 'English' } });
            
            expect(languageSelect).toHaveValue('English');
        });

        it('updates content field when changed', () => 
        {
            const contentInput = screen.getByPlaceholderText('Word');
            
            fireEvent.change(contentInput, { target: { value: 'Hello' } });
            
            expect(contentInput).toHaveValue('Hello');
        });

        it('updates translation language field when changed', () => 
        {
            const translationLangSelect = screen.getByLabelText(/translation language/i);
            
            fireEvent.change(translationLangSelect, { target: { value: 'Spanish' } });
            
            expect(translationLangSelect).toHaveValue('Spanish');
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
    });

    describe('Form Validation', () => 
    {
        beforeEach(() => 
        {
            render(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
        });

        it('Requires all fields to be filled', () => 
        {
            const languageSelect = screen.getByLabelText(/^language$/i);
            const contentInput = screen.getByPlaceholderText('Word');
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
            fireEvent.change(screen.getByLabelText(/^language$/i), { target: { value: 'English' } });
            fireEvent.change(screen.getByPlaceholderText('Word'), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/translation language/i), { target: { value: 'Spanish' } });
            fireEvent.change(screen.getByPlaceholderText('Translation'), { target: { value: 'Prueba' } });
            
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalled();
            });
        });
    });

    describe('API Integration', () => 
    {
        beforeEach(() => 
        {
            render(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            fireEvent.change(screen.getByLabelText(/^language$/i), { target: { value: 'English' } });
            fireEvent.change(screen.getByPlaceholderText('Word'), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/translation language/i), { target: { value: 'Spanish' } });
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
                    language: 'English',
                    content: 'Test',
                    translation: 'Prueba',
                    translationLang: 'Spanish',
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
                expect(screen.queryByText('Add New Flashcard')).not.toBeInTheDocument();
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
    });

    describe('Edge cases', () => 
    {
        it('Handles null selectedSetId', () => 
        {
            const props = { ...defaultProps, selectedSetId: null };
            render(<AddFlashcardButton {...props} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            expect(screen.getByText('Add New Flashcard')).toBeInTheDocument(); //Still rendering modal
        });

        it('Handles empty flashcards array', () => 
        {
            const props = { ...defaultProps, flashcards: [] };
            render(<AddFlashcardButton {...props} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            expect(addButton).toBeInTheDocument();
        });

        it('Handles whitespace-only inputs', async () => 
        {
            render(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            //Whitespaces
            fireEvent.change(screen.getByLabelText(/^language$/i), { target: { value: 'English' } });
            fireEvent.change(screen.getByPlaceholderText('Word'), { target: { value: '   ' } });
            fireEvent.change(screen.getByLabelText(/translation language/i), { target: { value: 'Spanish' } });
            fireEvent.change(screen.getByPlaceholderText('Translation'), { target: { value: '   ' } });
            
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => 
    {
        it('Has proper form labels', () => 
        {
            render(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            expect(screen.getByLabelText(/^language$/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/translation language/i)).toBeInTheDocument();
        });

        it('Has proper button labels', () => 
        {
            render(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            expect(screen.getByRole('button', { name: /save/i })).toHaveAttribute('aria-label', 'Save');
            expect(screen.getByRole('button', { name: /cancel/i })).toHaveAttribute('aria-label', 'Cancel');
        });

        it('Supports "Enter" key', async () => 
        {
            render(<AddFlashcardButton {...defaultProps} />);
            
            const addButton = screen.getByRole('button', { name: /add flashcard/i });
            fireEvent.click(addButton);
            
            //Normal filling
            fireEvent.change(screen.getByLabelText(/^language$/i), { target: { value: 'English' } });
            fireEvent.change(screen.getByPlaceholderText('Word'), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText(/translation language/i), { target: { value: 'Spanish' } });
            fireEvent.change(screen.getByPlaceholderText('Translation'), { target: { value: 'Prueba' } });
            
            // Submit by pressing Enter on the form (simulate form submission)
            const form = document.querySelector('form');
            expect(form).toBeInTheDocument();
            fireEvent.submit(form!);
            
            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalled();
            });
        });
    });
});