import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import FlashcardKnownStatus from '../../components/flashcards/FlashcardKnownStatus';
import type { Flashcard } from '../../types and interfaces/types';
import { renderWithProviders } from '../test-utils';

vi.mock('react-icons/ai', () => (
{
    AiFillCheckCircle: () => <span data-testid="check-icon">Check Icon</span>,
    AiFillCloseCircle: () => <span data-testid="close-icon">Close Icon</span>
}));

// Mock fetch
global.fetch = vi.fn();

describe('FlashcardKnownStatus', () => 
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
        onKnownStatusChange: vi.fn(),
        showButton: false
    };

    const mockFetch = vi.fn();
    const mockAlert = vi.fn();
    const mockLocalStorageGetItem = vi.fn();

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

        vi.clearAllMocks();
    });

    describe('Status display mode', () => 
    {
        it('Renders known status label when flashcard is known', () => 
        {
            const knownFlashcard = { ...mockFlashcard, known: true };
            const propsWithKnownCard = { ...mockProps, flashcard: knownFlashcard };
            
            renderWithProviders(<FlashcardKnownStatus {...propsWithKnownCard} />);
            
            expect(screen.getByText('Already Known')).toBeInTheDocument();
            expect(screen.getByText('Already Known')).toHaveClass('known-label', 'known');
        });

        it('Renders unknown status label when flashcard is not known', () => 
        {
            renderWithProviders(<FlashcardKnownStatus {...mockProps} />);
            
            expect(screen.getByText('Not Known Yet')).toBeInTheDocument();
            expect(screen.getByText('Not Known Yet')).toHaveClass('known-label', 'unknown');
        });

        it('Handles undefined known status as false', () => 
        {
            const flashcardWithUndefinedKnown = { ...mockFlashcard, known: undefined as any };
            const propsWithUndefined = { ...mockProps, flashcard: flashcardWithUndefinedKnown };
            
            renderWithProviders(<FlashcardKnownStatus {...propsWithUndefined} />);
            
            expect(screen.getByText('Not Known Yet')).toBeInTheDocument();
        });
    });

    describe('Button mode', () => 
    {
        const buttonProps = { ...mockProps, showButton: true };

        it('Renders button with correct icon for unknown flashcard', () => 
        {
            renderWithProviders(<FlashcardKnownStatus {...buttonProps} />);
            
            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            expect(button).toHaveClass('flashcard-known-button', 'unknown');
            expect(button).toHaveAttribute('aria-label', 'Mark as known');
            expect(screen.getByTestId('close-icon')).toBeInTheDocument();
        });

        it('Renders button with correct icon for known flashcard', () => 
        {
            const knownFlashcard = { ...mockFlashcard, known: true };
            const propsWithKnownCard = { ...buttonProps, flashcard: knownFlashcard };
            
            renderWithProviders(<FlashcardKnownStatus {...propsWithKnownCard} />);
            
            const button = screen.getByRole('button');
            expect(button).toHaveClass('flashcard-known-button', 'known');
            expect(button).toHaveAttribute('aria-label', 'Mark as unknown');
            expect(screen.getByTestId('check-icon')).toBeInTheDocument();
        });
    });

    describe('Toggle functionality', () => 
    {
        const buttonProps = { ...mockProps, showButton: true };

        beforeEach(() => 
        {
            mockLocalStorageGetItem.mockReturnValue('mock-token');
        });

        it('Toggles from unknown to known', async () => 
        {
            const onKnownStatusChangeMock = vi.fn();
            const propsWithMock = { ...buttonProps, onKnownStatusChange: onKnownStatusChangeMock };
            
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve({ ...mockFlashcard, known: true })
            });
            
            renderWithProviders(<FlashcardKnownStatus {...propsWithMock} />);
            
            fireEvent.click(screen.getByRole('button'));
            
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/sets/set-1/flashcards/flashcard-1/known',
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer mock-token'
                    },
                    body: JSON.stringify({ known: true })
                }
            );
            
            await waitFor(() => 
            {
                expect(onKnownStatusChangeMock).toHaveBeenCalledWith({ ...mockFlashcard, known: true });
            });
        });

        it('Toggles from known to unknown', async () => 
        {
            const knownFlashcard = { ...mockFlashcard, known: true };
            const onKnownStatusChangeMock = vi.fn();
            const propsWithKnownCard = { ...buttonProps, flashcard: knownFlashcard, onKnownStatusChange: onKnownStatusChangeMock };
            
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve({ ...knownFlashcard, known: false })
            });
            
            renderWithProviders(<FlashcardKnownStatus {...propsWithKnownCard} />);
            
            fireEvent.click(screen.getByRole('button'));
            
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/sets/set-1/flashcards/flashcard-1/known',
                expect.objectContaining({
                    body: JSON.stringify({ known: false })
                })
            );
            
            await waitFor(() => 
            {
                expect(onKnownStatusChangeMock).toHaveBeenCalledWith({ ...knownFlashcard, known: false });
            });
        });

        it('Handles undefined known status as false when toggling', async () => 
        {
            const flashcardWithUndefinedKnown = { ...mockFlashcard, known: undefined as any };
            const propsWithUndefined = { ...buttonProps, flashcard: flashcardWithUndefinedKnown };
            
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve({})
            });
            
            renderWithProviders(<FlashcardKnownStatus {...propsWithUndefined} />);
            
            fireEvent.click(screen.getByRole('button'));
            
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: JSON.stringify({ known: true })
                })
            );
        });
    });

    describe('API integration', () => 
    {
        const buttonProps = { ...mockProps, showButton: true };

        beforeEach(() => 
        {
            mockLocalStorageGetItem.mockReturnValue('mock-token');
        });

        it('handles API errors', async () => 
        {
            mockFetch.mockResolvedValue(
            {
                ok: false,
                status: 404
            });
            
            renderWithProviders(<FlashcardKnownStatus {...buttonProps} />);
            
            fireEvent.click(screen.getByRole('button'));
            
            await waitFor(() => 
            {
                expect(mockAlert).toHaveBeenCalledWith('Failed to update known status. Please try again.');
            });
            
            expect(mockProps.onKnownStatusChange).not.toHaveBeenCalled();
        });

        it('Handles network errors', async () => 
        {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            mockFetch.mockRejectedValue(new Error('Network error'));
            
            renderWithProviders(<FlashcardKnownStatus {...buttonProps} />);
            
            fireEvent.click(screen.getByRole('button'));
            
            await waitFor(() => 
            {
                expect(mockAlert).toHaveBeenCalledWith('Failed to update known status. Please try again.');
            });
            
            expect(consoleSpy).toHaveBeenCalledWith('Error updating known status:', expect.any(Error));
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
            
            renderWithProviders(<FlashcardKnownStatus {...buttonProps} />);
            
            fireEvent.click(screen.getByRole('button'));
            
            expect(mockLocalStorageGetItem).toHaveBeenCalledWith('token');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining(
                {
                    headers: expect.objectContaining(
                    {
                        Authorization: 'Bearer test-token'
                    })
                })
            );
        });
    });

    describe('Event handling', () => 
    {
        it('Stops event propagation when button is clicked', () => 
        {
            const buttonProps = { ...mockProps, showButton: true };
            mockLocalStorageGetItem.mockReturnValue('token');
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve({})
            });
            
            renderWithProviders(<FlashcardKnownStatus {...buttonProps} />);
            
            const stopPropagationSpy = vi.fn();
            const mockEvent = { stopPropagation: stopPropagationSpy } as any;
            
            fireEvent.click(screen.getByRole('button'), mockEvent);
            
            expect(mockFetch).toHaveBeenCalled();
        });
    });

    describe('ForwardRef and displayName', () => 
    {
        it('Forwards ref correctly', () => 
        {
            const ref = { current: null };
            renderWithProviders(<FlashcardKnownStatus {...mockProps} ref={ref} />);
            
            expect(ref.current).toBeDefined();
            expect(typeof ref.current).toBe('object');
        });

        it('Has correct displayName', () => 
        {
            expect(FlashcardKnownStatus.displayName).toBe('FlashcardKnownStatus');
        });
    });

    describe('Integration', () => 
    {
        it('Handles complete status toggle flow', async () => 
        {
            const onKnownStatusChangeMock = vi.fn();
            const buttonProps = 
            { 
                ...mockProps, 
                showButton: true, 
                onKnownStatusChange: onKnownStatusChangeMock 
            };

            mockLocalStorageGetItem.mockReturnValue('valid-token');
            const updatedFlashcard = { ...mockFlashcard, known: true };
            mockFetch.mockResolvedValue(
            {
                ok: true,
                json: () => Promise.resolve(updatedFlashcard)
            });
            
            renderWithProviders(<FlashcardKnownStatus {...buttonProps} />);
            
            expect(screen.getByTestId('close-icon')).toBeInTheDocument();
            expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Mark as known');
            
            fireEvent.click(screen.getByRole('button'));

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/sets/set-1/flashcards/flashcard-1/known',
                {
                    method: 'PATCH',
                    headers: 
                    {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer valid-token'
                    },
                    body: JSON.stringify({ known: true })
                }
            );
            
            await waitFor(() => 
            {
                expect(onKnownStatusChangeMock).toHaveBeenCalledWith(updatedFlashcard);
            });
            
            expect(mockAlert).not.toHaveBeenCalled();
        });
    });
});
