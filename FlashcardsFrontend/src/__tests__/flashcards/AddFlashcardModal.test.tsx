import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import AddFlashcardModal from '../../components/flashcards/AddFlashcardModal';
import type { Flashcard } from '../../types and interfaces/types';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';

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

const renderWithI18n = (component: React.ReactElement) => 
{
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('AddFlashcardModal', () => 
{
    const mockFlashcard: Flashcard = 
    {
        id: '',
        setId: 'set-1',
        language: 'EN',
        content: 'Hello',
        translation: 'Hola',
        translationLang: 'ES',
        owner: 'user1',
        known: false
    };

    const mockProps = 
    {
        addValues: mockFlashcard,
        onAddChange: vi.fn(),
        onSaveAdd: vi.fn(),
        onCancelAdd: vi.fn()
    };

    beforeEach(() => 
    {
        vi.clearAllMocks();
    });

    describe('Rendering', () => 
    {
        it('renders modal with all form elements', () => 
        {
            renderWithI18n(<AddFlashcardModal {...mockProps} />);
            
            expect(screen.getByRole('heading', { name: 'Add new flashcard' })).toBeInTheDocument();
            expect(screen.getByLabelText('Language')).toBeInTheDocument();
            expect(screen.getByLabelText('Translation Language')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Content')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Translation')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        });

        it('displays current values and character counters', () => 
        {
            renderWithI18n(<AddFlashcardModal {...mockProps} />);
            
            expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Hola')).toBeInTheDocument();
            expect(screen.getByText('5/30 characters')).toBeInTheDocument();
            expect(screen.getByText('4/30 characters')).toBeInTheDocument();
        });

        it('renders language options in both selects', () => 
        {
            renderWithI18n(<AddFlashcardModal {...mockProps} />);
            
            const languageOptions = ['Polish', 'English', 'German', 'Spanish'];
            languageOptions.forEach(lang => {
                expect(screen.getAllByText(lang)).toHaveLength(2);
            });
        });
    });

    describe('Form validation', () => 
    {
        it('has required attributes on all fields', () => 
        {
            renderWithI18n(<AddFlashcardModal {...mockProps} />);
            
            expect(screen.getByLabelText('Language')).toBeRequired();
            expect(screen.getByPlaceholderText('Content')).toBeRequired();
            expect(screen.getByLabelText('Translation Language')).toBeRequired();
            expect(screen.getByPlaceholderText('Translation')).toBeRequired();
        });

        it('enforces maxLength on input fields', () => 
        {
            renderWithI18n(<AddFlashcardModal {...mockProps} />);
            
            expect(screen.getByPlaceholderText('Content')).toHaveAttribute('maxLength', '30');
            expect(screen.getByPlaceholderText('Translation')).toHaveAttribute('maxLength', '30');
        });
    });

    describe('Event handling', () => 
    {
        it('calls onAddChange when form fields change', () => 
        {
            const onAddChangeMock = vi.fn();
            const propsWithMock = { ...mockProps, onAddChange: onAddChangeMock };
            
            renderWithI18n(<AddFlashcardModal {...propsWithMock} />);
            
            // Test each form field
            fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'DE' } });
            fireEvent.change(screen.getByPlaceholderText('Content'), { target: { value: 'Test' } });
            fireEvent.change(screen.getByLabelText('Translation Language'), { target: { value: 'PL' } });
            fireEvent.change(screen.getByPlaceholderText('Translation'), { target: { value: 'Test2' } });
            
            expect(onAddChangeMock).toHaveBeenCalledTimes(4);
        });

        it('calls onSaveAdd when form is submitted', () => 
        {
            const onSaveAddMock = vi.fn();
            const propsWithMock = { ...mockProps, onSaveAdd: onSaveAddMock };
            
            renderWithI18n(<AddFlashcardModal {...propsWithMock} />);
            
            fireEvent.submit(document.querySelector('.flashcard-add-form')!);
            
            expect(onSaveAddMock).toHaveBeenCalledTimes(1);
        });

        it('calls onCancelAdd when cancel button is clicked', () => 
        {
            const onCancelAddMock = vi.fn();
            const propsWithMock = { ...mockProps, onCancelAdd: onCancelAddMock };
            
            renderWithI18n(<AddFlashcardModal {...propsWithMock} />);
            
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            
            expect(onCancelAddMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('Accessibility', () => 
    {
        it('has proper form structure and labels', () => {
            renderWithI18n(<AddFlashcardModal {...mockProps} />);
            
            expect(document.querySelector('.flashcard-add-form')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-label', 'Save');
            expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('aria-label', 'Cancel');
        });
    });

    describe('Character counter edge cases', () => 
    {
        it('handles empty and maximum length strings', () => 
        {
            const emptyFlashcard = { ...mockFlashcard, content: '', translation: '' };
            const propsWithEmpty = { ...mockProps, addValues: emptyFlashcard };
            
            renderWithI18n(<AddFlashcardModal {...propsWithEmpty} />);
            
            expect(screen.getAllByText('0/30 characters')).toHaveLength(2);
            
            const maxFlashcard = { ...mockFlashcard, content: 'a'.repeat(30), translation: 'b'.repeat(30) };
            const propsWithMax = { ...mockProps, addValues: maxFlashcard };
            
            renderWithI18n(<AddFlashcardModal {...propsWithMax} />);
            
            expect(screen.getAllByText('30/30 characters')).toHaveLength(2);
        });
    });

    describe('Integration', () => 
    {
        it('handles complete form interaction flow', () => 
        {
            const mocks = 
        {
                onAddChange: vi.fn(),
                onSaveAdd: vi.fn(),
                onCancelAdd: vi.fn()
            };
            
            renderWithI18n(<AddFlashcardModal {...mockProps} {...mocks} />);
            
            fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'DE' } });
            fireEvent.change(screen.getByPlaceholderText('Content'), { target: { value: 'Guten Tag' } });
            fireEvent.change(screen.getByLabelText('Translation Language'), { target: { value: 'EN' } });
            fireEvent.change(screen.getByPlaceholderText('Translation'), { target: { value: 'Good day' } });
            
            fireEvent.click(screen.getByRole('button', { name: 'Save' }));
            
            expect(mocks.onAddChange).toHaveBeenCalledTimes(4);
            expect(mocks.onSaveAdd).toHaveBeenCalledTimes(1);
            expect(mocks.onCancelAdd).not.toHaveBeenCalled();
        });
    });
});
