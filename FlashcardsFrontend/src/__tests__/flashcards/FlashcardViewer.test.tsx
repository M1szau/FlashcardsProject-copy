import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import FlashcardViewer from '../../components/flashcards/FlashcardViewer';
import { renderWithProviders } from '../test-utils';

describe('FlashcardViewer component', () => 
{
    const mockSetCurrent = vi.fn();
    const mockSetFlipped = vi.fn();
    const mockRenderCardContent = vi.fn();
    const mockRenderActions = vi.fn();

    const defaultProps = 
    {
        current: 0,
        total: 3,
        flipped: false,
        isEditing: false,
        setCurrent: mockSetCurrent,
        setFlipped: mockSetFlipped,
        renderCardContent: mockRenderCardContent,
        renderActions: mockRenderActions
    };

    beforeEach(() => 
    {
        vi.clearAllMocks();
        mockRenderCardContent.mockReturnValue(<div>Mock card content</div>);
        mockRenderActions.mockReturnValue(<div>Mock actions</div>);
    });

    describe('Rendering', () => 
    {
        it('Renders flashcard counter correctly', () => 
        {
            renderWithProviders(<FlashcardViewer {...defaultProps} />, { includeFlashcardsProvider: true });
            
            expect(screen.getByText('1 / 3')).toBeInTheDocument();
        });

        it('Renders navigation arrows', () => 
        {
            renderWithProviders(<FlashcardViewer {...defaultProps} />, { includeFlashcardsProvider: true });
            
            const prevButton = screen.getByLabelText('Previous Flashcard');
            const nextButton = screen.getByLabelText('Next Flashcard');
            
            expect(prevButton).toBeInTheDocument();
            expect(nextButton).toBeInTheDocument();
        });

        it('Renders flashcard box with proper accessibility', () => 
        {
            renderWithProviders(<FlashcardViewer {...defaultProps} />, { includeFlashcardsProvider: true });
            
            const flashcardBox = screen.getByLabelText('Flip flashcard');
            expect(flashcardBox).toBeInTheDocument();
            expect(flashcardBox).toHaveAttribute('tabIndex', '0');
        });

        it('Renders both front and back sides of flashcard', () => 
        {
            renderWithProviders(<FlashcardViewer {...defaultProps} />, { includeFlashcardsProvider: true });
            
            expect(mockRenderCardContent).toHaveBeenCalledWith('front');
            expect(mockRenderCardContent).toHaveBeenCalledWith('back');
            expect(mockRenderActions).toHaveBeenCalledTimes(6); // Updated for context providers
        });
    });

    describe('Navigation functionality', () => 
    {
        it('Calls setCurrent with previous index when prev button is clicked', () => 
        {
            const props = { ...defaultProps, current: 1 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const prevButton = screen.getByLabelText('Previous Flashcard');
            fireEvent.click(prevButton);
            
            expect(mockSetCurrent).toHaveBeenCalledWith(expect.any(Function));
            expect(mockSetFlipped).toHaveBeenCalledWith(false);
        });

        it('Calls setCurrent with next index when next button is clicked', () => 
        {
            const props = { ...defaultProps, current: 1 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const nextButton = screen.getByLabelText('Next Flashcard');
            fireEvent.click(nextButton);
            
            expect(mockSetCurrent).toHaveBeenCalledWith(expect.any(Function));
            expect(mockSetFlipped).toHaveBeenCalledWith(false);
        });

        it('Does not change current when at first card and prev is clicked', () => 
        {
            const props = { ...defaultProps, current: 0 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const prevButton = screen.getByLabelText('Previous Flashcard');
            
            //Button should be disabled, so clicking shouldn't call setCurrent
            expect(prevButton).toBeDisabled();
            fireEvent.click(prevButton);
            expect(mockSetCurrent).not.toHaveBeenCalled();
        });

        it('Does not change current when at last card and next is clicked', () => 
        {
            const props = { ...defaultProps, current: 2, total: 3 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const nextButton = screen.getByLabelText('Next Flashcard');
            
            //Button should be disabled, so clicking shouldn't call setCurrent
            expect(nextButton).toBeDisabled();
            fireEvent.click(nextButton);
            expect(mockSetCurrent).not.toHaveBeenCalled();
        });

        it('Correctly calculates previous index when enabled', () => 
        {
            const props = { ...defaultProps, current: 2 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const prevButton = screen.getByLabelText('Previous Flashcard');
            expect(prevButton).not.toBeDisabled();
            fireEvent.click(prevButton);
            
            //Passed to setCurrent
            const setCurrentCall = mockSetCurrent.mock.calls[0][0];
            expect(setCurrentCall(2)).toBe(1); // Should go from 2 to 1
        });

        it('Correctly calculates next index when enabled', () => 
        {
            const props = { ...defaultProps, current: 0 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const nextButton = screen.getByLabelText('Next Flashcard');
            expect(nextButton).not.toBeDisabled();
            fireEvent.click(nextButton);
            
            //Passed to setCurrent
            const setCurrentCall = mockSetCurrent.mock.calls[0][0];
            expect(setCurrentCall(0)).toBe(1); // Should go from 0 to 1
        });
    });

    describe('Button disabled states', () => 
    {
        it('Disables prev button when at first card', () => 
        {
            const props = { ...defaultProps, current: 0 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const prevButton = screen.getByLabelText('Previous Flashcard');
            expect(prevButton).toBeDisabled();
        });

        it('Disables next button when at last card', () => 
        {
            const props = { ...defaultProps, current: 2, total: 3 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const nextButton = screen.getByLabelText('Next Flashcard');
            expect(nextButton).toBeDisabled();
        });

        it('Disables both buttons when flipped', () => 
        {
            const props = { ...defaultProps, flipped: true };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const prevButton = screen.getByLabelText('Previous Flashcard');
            const nextButton = screen.getByLabelText('Next Flashcard');
            
            expect(prevButton).toBeDisabled();
            expect(nextButton).toBeDisabled();
        });

        it('Disables both buttons when editing', () => 
        {
            const props = { ...defaultProps, isEditing: true };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const prevButton = screen.getByLabelText('Previous Flashcard');
            const nextButton = screen.getByLabelText('Next Flashcard');
            
            expect(prevButton).toBeDisabled();
            expect(nextButton).toBeDisabled();
        });
    });

    describe('Flip functionality', () => {
        it('Calls setFlipped when flashcard box is clicked', () => 
        {
            renderWithProviders(<FlashcardViewer {...defaultProps} />, { includeFlashcardsProvider: true });
            
            const flashcardBox = screen.getByLabelText('Flip flashcard');
            fireEvent.click(flashcardBox);
            
            expect(mockSetFlipped).toHaveBeenCalledWith(expect.any(Function));
        });

        it('Does not flip when total is 0', () => 
        {
            const props = { ...defaultProps, total: 0 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const flashcardBox = screen.getByLabelText('Flip flashcard');
            fireEvent.click(flashcardBox);
            
            expect(mockSetFlipped).not.toHaveBeenCalled();
        });

        it('Changes cursor style when editing', () => 
        {
            const props = { ...defaultProps, isEditing: true };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const flashcardBox = screen.getByLabelText('Flip flashcard');
            expect(flashcardBox).toHaveStyle({ cursor: 'default' });
        });

        it('Has pointer cursor when not editing', () => 
        {
            renderWithProviders(<FlashcardViewer {...defaultProps} />, { includeFlashcardsProvider: true });
            
            const flashcardBox = screen.getByLabelText('Flip flashcard');
            expect(flashcardBox).toHaveStyle({ cursor: 'pointer' });
        });
    });

    describe('CSS classes and styling', () => 
    {
        it('Applies flipped class when flipped is true', () => 
        {
            const props = { ...defaultProps, flipped: true };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const flashcardInner = document.querySelector('.flashcard-inner');
            expect(flashcardInner).toHaveClass('flashcard-inner flipped');
        });

        it('Does not apply flipped class when flipped is false', () => 
        {
            renderWithProviders(<FlashcardViewer {...defaultProps} />, { includeFlashcardsProvider: true });
            
            const flashcardInner = document.querySelector('.flashcard-inner');
            expect(flashcardInner).toHaveClass('flashcard-inner');
            expect(flashcardInner).not.toHaveClass('flipped');
        });

        it('Has correct CSS classes for structure', () => 
        {
            renderWithProviders(<FlashcardViewer {...defaultProps} />, { includeFlashcardsProvider: true });
            
            expect(document.querySelector('.flashcard-counter')).toBeInTheDocument();
            expect(document.querySelector('.flashcard-box')).toBeInTheDocument();
            expect(document.querySelector('.flashcard-inner')).toBeInTheDocument();
            expect(document.querySelector('.flashcard-front')).toBeInTheDocument();
            expect(document.querySelector('.flashcard-back')).toBeInTheDocument();
        });
    });

    describe('Counter display', () => 
    {
        it('Displays correct counter for first card', () => 
        {
            const props = { ...defaultProps, current: 0, total: 5 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            expect(screen.getByText('1 / 5')).toBeInTheDocument();
        });

        it('Displays correct counter for middle card', () => 
        {
            const props = { ...defaultProps, current: 2, total: 10 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            expect(screen.getByText('3 / 10')).toBeInTheDocument();
        });

        it('Displays correct counter for last card', () => 
        {
            const props = { ...defaultProps, current: 4, total: 5 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            expect(screen.getByText('5 / 5')).toBeInTheDocument();
        });
    });

    describe('Edge cases', () => 
    {
        it('Handles zero total cards', () => 
        {
            const props = { ...defaultProps, total: 0 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            expect(screen.getByText('1 / 0')).toBeInTheDocument();
        });

        it('Hndles single card scenario', () => 
        {
            const props = { ...defaultProps, current: 0, total: 1 };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const prevButton = screen.getByLabelText('Previous Flashcard');
            const nextButton = screen.getByLabelText('Next Flashcard');
            
            expect(prevButton).toBeDisabled();
            expect(nextButton).toBeDisabled();
        });
    });

    describe('Accessibility', () => 
    {
        it('Has proper ARIA labels for all interactive elements', () => 
        {
            renderWithProviders(<FlashcardViewer {...defaultProps} />, { includeFlashcardsProvider: true });
            
            expect(screen.getByLabelText('Previous Flashcard')).toBeInTheDocument();
            expect(screen.getByLabelText('Next Flashcard')).toBeInTheDocument();
            expect(screen.getByLabelText('Flip flashcard')).toBeInTheDocument();
        });

        it('Supports keyboard navigation with tabIndex', () => 
        {
            renderWithProviders(<FlashcardViewer {...defaultProps} />, { includeFlashcardsProvider: true });
            
            const flashcardBox = screen.getByLabelText('Flip flashcard');
            expect(flashcardBox).toHaveAttribute('tabIndex', '0');
        });

        it('Does not decrement current when already at first card (edge case)', () => 
        {
            //Test when at first card (current = 0) but button is enabled due to flipped state
            const props = 
            { 
                ...defaultProps, 
                current: 0,
                flipped: false,
                isEditing: false,
                total: 1 
            };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const prevButton = screen.getByLabelText('Previous Flashcard');
            
            //Button should be disabled when current === 0
            expect(prevButton).toBeDisabled();
            
            fireEvent.click(prevButton);
            
            expect(mockSetCurrent).not.toHaveBeenCalled();
        });

        it('Does not increment current when already at last card (edge case)', () => 
        {
            //Test when at last card but we want to trigger the nextCard logic
            const props = 
            { 
                ...defaultProps, 
                current: 2,
                total: 3,
                flipped: false,
                isEditing: false
            };
            renderWithProviders(<FlashcardViewer {...props} />, { includeFlashcardsProvider: true });
            
            const nextButton = screen.getByLabelText('Next Flashcard');
            
            //Button should be disabled when current === total - 1
            expect(nextButton).toBeDisabled();
            
            fireEvent.click(nextButton);
            
            expect(mockSetCurrent).not.toHaveBeenCalled();
        });

        it('Tests prevCard edge case when button is enabled but at boundary', () => 
        {
            //Create scenario where button is enabled but test is for edge case
            const props = 
            { 
                ...defaultProps, 
                current: 1, 
                flipped: false,
                isEditing: false
            };
            
            const testSetCurrent = vi.fn((updateFn) => 
            {
                const mockPrev = 0;
                const result = typeof updateFn === 'function' ? updateFn(mockPrev) : updateFn;
                //Rresult should be 0 (unchanged) when prev = 0
                expect(result).toBe(0);
            });
            
            const testProps = { ...props, setCurrent: testSetCurrent };
            renderWithProviders(<FlashcardViewer {...testProps} />, { includeFlashcardsProvider: true });
            
            const prevButton = screen.getByLabelText('Previous Flashcard');
            fireEvent.click(prevButton);
            
            expect(testSetCurrent).toHaveBeenCalled();
        });

        it('Tests nextCard edge case when button is enabled but at boundary', () => 
        {
            //Test the nextCard edge case logic
            const props = 
            { 
                ...defaultProps, 
                current: 1,  
                total: 3,
                flipped: false,
                isEditing: false
            };
            
            const testSetCurrent = vi.fn((updateFn) => 
            {
                const mockPrev = 2; //Last card index for total = 3
                const result = typeof updateFn === 'function' ? updateFn(mockPrev) : updateFn;
                expect(result).toBe(2);
            });
            
            const testProps = { ...props, setCurrent: testSetCurrent };
            renderWithProviders(<FlashcardViewer {...testProps} />, { includeFlashcardsProvider: true });
            
            const nextButton = screen.getByLabelText('Next Flashcard');
            fireEvent.click(nextButton);
            
            expect(testSetCurrent).toHaveBeenCalled();
        });
    });
});
