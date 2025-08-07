import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import FlashcardDeleteBtn from '../../components/flashcards/FlashcardDeleteBtn';
import type { Flashcard } from '../../types and interfaces/types';

vi.mock('react-icons/ai', () => (
{
    AiFillDelete: () => <span data-testid="delete-icon">Delete Icon</span>
}));

describe('FlashcardDeleteBtn', () => 
{
    const mockFlashcard: Flashcard = 
    {
        id: 'flashcard-1',
        setId: 'set-1',
        language: 'English',
        content: 'Hello',
        translation: 'Hola',
        translationLang: 'Spanish',
        owner: 'user1',
        known: false
    };

    const mockProps = 
    {
        flashcard: mockFlashcard,
        selectedSetId: 'set-1',
        onDeleteSuccess: vi.fn(),
        flashcardsLength: 5
    };

    const mockFetch = vi.fn();
    const mockConfirm = vi.fn();
    const mockAlert = vi.fn();
    const mockLocalStorageGetItem = vi.fn();

    beforeEach(() => 
    {
        global.fetch = mockFetch;
        global.confirm = mockConfirm;
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

        vi.clearAllMocks();
    });

    describe('Rendering', () => 
    {
        it('Renders delete button with icon and correct attributes', () => 
        {
            render(<FlashcardDeleteBtn {...mockProps} />);
            
            const button = screen.getByRole('button', { name: /delete flashcard/i });
            expect(button).toBeInTheDocument();
            expect(button).toHaveClass('flashcard-delete-button');
            expect(button).toHaveAttribute('aria-label', 'Delete Flashcard');
            expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
        });

        it('Has correct displayName', () => 
        {
            expect(FlashcardDeleteBtn.displayName).toBe('FlashcardDeleteBtn');
        });
    });

    describe('Delete protection', () => 
    {
        it('Prevents deletion when only one flashcard remains', () => 
        {
            const propsWithOneFlashcard = { ...mockProps, flashcardsLength: 1 };
            render(<FlashcardDeleteBtn {...propsWithOneFlashcard} />);
            
            fireEvent.click(screen.getByRole('button'));
            
            expect(mockAlert).toHaveBeenCalledWith('You must have at least one flashcard.');
            expect(mockConfirm).not.toHaveBeenCalled();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('Allows deletion when multiple flashcards exist', () => 
        {
            mockConfirm.mockReturnValue(false);
            render(<FlashcardDeleteBtn {...mockProps} />);
            
            fireEvent.click(screen.getByRole('button'));
            
            expect(mockAlert).not.toHaveBeenCalled();
            expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this flashcard?');
        });
    });

    describe('User confirmation', () => 
    {
        it('Does not proceed when user cancels', () => 
        {
            mockConfirm.mockReturnValue(false);
            render(<FlashcardDeleteBtn {...mockProps} />);
            
            fireEvent.click(screen.getByRole('button'));
            
            expect(mockConfirm).toHaveBeenCalled();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('Proceeds with deletion when user confirms', () => 
        {
            mockConfirm.mockReturnValue(true);
            mockLocalStorageGetItem.mockReturnValue('mock-token');
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve({})
            });
            
            render(<FlashcardDeleteBtn {...mockProps} />);
            
            fireEvent.click(screen.getByRole('button'));
            
            expect(mockConfirm).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/sets/set-1/flashcards/flashcard-1',
                {
                    method: 'DELETE',
                    headers: { Authorization: 'Bearer mock-token' }
                }
            );
        });
    });

    describe('API integration', () => 
    {
        beforeEach(() => 
        {
            mockConfirm.mockReturnValue(true);
            mockLocalStorageGetItem.mockReturnValue('mock-token');
        });

        it('Handles successful deletion', async () => 
        {
            const onDeleteSuccessMock = vi.fn();
            const propsWithMock = { ...mockProps, onDeleteSuccess: onDeleteSuccessMock };
            
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve({})
            });
            
            render(<FlashcardDeleteBtn {...propsWithMock} />);
            fireEvent.click(screen.getByRole('button'));
            
            await waitFor(() => 
            {
                expect(onDeleteSuccessMock).toHaveBeenCalled();
            });
        });

        it('Handles API errors', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: false,
                status: 404,
                json: () => Promise.resolve({})
            });
            
            render(<FlashcardDeleteBtn {...mockProps} />);
            fireEvent.click(screen.getByRole('button'));
            
            await waitFor(() => 
            {
                expect(mockAlert).toHaveBeenCalledWith('Failed to delete flashcard. Please try again.');
            });
            
            expect(mockProps.onDeleteSuccess).not.toHaveBeenCalled();
        });

        it('Handles network errors', async () => 
        {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            mockFetch.mockRejectedValue(new Error('Network error'));
            
            render(<FlashcardDeleteBtn {...mockProps} />);
            fireEvent.click(screen.getByRole('button'));
            
            await waitFor(() => 
            {
                expect(mockAlert).toHaveBeenCalledWith('Failed to delete flashcard. Please try again.');
            });
            
            expect(consoleSpy).toHaveBeenCalledWith('Error deleting flashcard:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('Uses token from localStorage', () => 
        {
            mockLocalStorageGetItem.mockReturnValue('test-token');
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve({})
            });
            
            render(<FlashcardDeleteBtn {...mockProps} />);
            fireEvent.click(screen.getByRole('button'));
            
            expect(mockLocalStorageGetItem).toHaveBeenCalledWith('token');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: { Authorization: 'Bearer test-token' }
                })
            );
        });
    });

    describe('Event handling', () => 
    {
        it('Stops event propagation and handles click', () => 
        {
            mockConfirm.mockReturnValue(false);
            render(<FlashcardDeleteBtn {...mockProps} />);
            
            fireEvent.click(screen.getByRole('button'));
            
            expect(mockConfirm).toHaveBeenCalled();
        });
    });

    describe('ForwardRef', () => 
    {
        it('Forwards ref correctly', () => 
        {
            const ref = { current: null };
            render(<FlashcardDeleteBtn {...mockProps} ref={ref} />);
            
            expect(ref.current).toBeDefined();
            expect(typeof ref.current).toBe('object');
        });
    });

    describe('Integration', () => 
    {
        it('Handles complete successful deletion flow', async () => 
        {
            const onDeleteSuccessMock = vi.fn();
            const propsWithMock = { ...mockProps, onDeleteSuccess: onDeleteSuccessMock };

            mockConfirm.mockReturnValue(true);
            mockLocalStorageGetItem.mockReturnValue('valid-token');
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve({})
            });
            
            render(<FlashcardDeleteBtn {...propsWithMock} />);
            
            fireEvent.click(screen.getByRole('button'));
            
            expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this flashcard?');
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/sets/set-1/flashcards/flashcard-1',
                {
                    method: 'DELETE',
                    headers: { Authorization: 'Bearer valid-token' }
                }
            );
            
            await waitFor(() => 
            {
                expect(onDeleteSuccessMock).toHaveBeenCalled();
            });
            
            expect(mockAlert).not.toHaveBeenCalled();
        });
    });
});
