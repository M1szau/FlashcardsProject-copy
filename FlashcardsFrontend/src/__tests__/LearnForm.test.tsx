import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders, mockLocalStorage } from './test-utils';
import LearnForm from '../components/LearnForm';
import type { SetType } from '../types and interfaces/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => 
{
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

const mockSets: SetType[] = [
    {
        id: 'set1',
        name: 'Spanish Vocabulary',
        description: 'Basic Spanish words',
        defaultLanguage: 'EN',
        translationLanguage: 'ES',
        owner: 'testuser'
    },
    {
        id: 'set2',
        name: 'German Grammar',
        description: 'German grammar rules',
        defaultLanguage: 'EN',
        translationLanguage: 'DE',
        owner: 'testuser'
    }
];

describe('LearnForm Component', () => 
{
    beforeEach(() => 
    {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockImplementation((key) => 
        {
            if (key === 'token') return 'valid-token';
            if (key === 'username') return 'testuser';
            return null;
        });
    });

    afterEach(() => 
    {
        vi.resetAllMocks();
    });

    describe('Authentication and Basic Rendering', () => 
    {
        it('should redirect to login when no token exists', async () => 
        {
            mockLocalStorage.getItem.mockImplementation(() => null);
            renderWithProviders(<LearnForm />, { initialToken: null });
            
            await waitFor(() => 
            {
                expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
            });
        });

        it('should render loading state initially', () => 
        {
            (global.fetch as any).mockImplementation(() => new Promise(() => {}));
            renderWithProviders(<LearnForm />);
            expect(screen.getByText('Loading your sets...')).toBeInTheDocument();
        });

        it('should make API call with authorization header', async () => 
        {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ sets: mockSets })
            });
            global.fetch = mockFetch;

            renderWithProviders(<LearnForm />, { initialToken: 'valid-token' });

            expect(mockFetch).toHaveBeenCalledWith('/api/sets', {
                headers: { Authorization: 'Bearer valid-token' }
            });
        });
    });

    describe('Component Structure', () => 
    {
        it('should render all elements with proper CSS classes', async () => 
        {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sets: mockSets })
            });

            renderWithProviders(<LearnForm />);

            await waitFor(() => 
            {
                expect(screen.getByText('Learn Flashcards')).toBeInTheDocument();
            });

            expect(screen.getByText('Select set')).toBeInTheDocument();
            expect(screen.getByText('Learning mode')).toBeInTheDocument();
            expect(screen.getByText('Start Learning')).toBeInTheDocument();
            expect(screen.getByText('Flashcards')).toBeInTheDocument(); // Navbar

            const container = screen.getByText('Learn Flashcards').closest('.flashcard-center');
            expect(container).toBeInTheDocument();

            const form = screen.getByText('Learn Flashcards').closest('.flashcard-add-form');
            expect(form).toBeInTheDocument();
        });
    });

    describe('Sets Loading and Display', () => 
    {
        it('should handle different data scenarios correctly', async () => 
        {
            //Test successful sets loading
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sets: mockSets })
            });

            renderWithProviders(<LearnForm />);

            await waitFor(() => 
            {
                expect(screen.getByText('Spanish Vocabulary')).toBeInTheDocument();
                expect(screen.getByText('German Grammar')).toBeInTheDocument();
            });

            const selectElement = screen.getByDisplayValue('Choose set to learn');
            expect(selectElement).toHaveAttribute('required');
            expect(selectElement).toHaveClass('flashcard-edit-input');
        });

        it('should handle empty sets and errors gracefully', async () => 
        {
            //Test empty sets
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sets: [] })
            });

            renderWithProviders(<LearnForm />);

            await waitFor(() => 
            {
                expect(screen.getByText('No sets created yet.')).toBeInTheDocument();
            });

            const message = screen.getByText('No sets created yet.');
            expect(message).toHaveStyle('color: rgb(143, 0, 191)');
            expect(message).toHaveStyle('font-style: italic');

            //Test API error
            vi.clearAllMocks();
            (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));
            renderWithProviders(<LearnForm />);

            await waitFor(() => 
            {
                expect(screen.getByText('No sets created yet.')).toBeInTheDocument();
            });
        });
    });

    describe('Form Interactions', () => 
    {
        it('should handle form elements and button states correctly', async () => 
        {
            //Test with sets available
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sets: mockSets })
            });

            renderWithProviders(<LearnForm />);

            await waitFor(() => 
            {
                expect(screen.getByDisplayValue('Choose set to learn')).toBeInTheDocument();
            });

            //Test set selection
            const setSelect = screen.getByDisplayValue('Choose set to learn');
            expect(setSelect).toHaveAttribute('required');
            expect(setSelect).toHaveClass('flashcard-edit-input');
            fireEvent.change(setSelect, { target: { value: 'set1' } });
            expect(setSelect).toHaveValue('set1');

            //Test mode selection
            const modeSelect = screen.getByDisplayValue('Practice all cards');
            expect(modeSelect).toHaveValue('all');
            expect(modeSelect).toHaveAttribute('required');
            fireEvent.change(modeSelect, { target: { value: 'unknown' } });
            expect(modeSelect).toHaveValue('unknown');

            //Test button attributes
            const startButton = screen.getByText('Start Learning');
            expect(startButton).not.toBeDisabled();
            expect(startButton).toHaveAttribute('type', 'submit');
            expect(startButton).toHaveAttribute('aria-label', 'Start Learning');
        });

        it('should disable button when no sets available', async () => 
        {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sets: [] })
            });

            renderWithProviders(<LearnForm />);

            await waitFor(() => 
            {
                const startButton = screen.getByText('Start Learning');
                expect(startButton).toBeDisabled();
            });
        });
    });

    describe('Form Submission', () => 
    {
        it('should show alert when no set is selected', async () => 
        {
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
            
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sets: mockSets })
            });

            renderWithProviders(<LearnForm />);

            await waitFor(() => 
            {
                expect(screen.getByDisplayValue('Choose set to learn')).toBeInTheDocument();
            });
            const setSelect = screen.getByDisplayValue('Choose set to learn') as HTMLSelectElement;
            expect(setSelect.value).toBe('');

            //Submit the form, not just click the button
            const form = document.querySelector('.flashcard-add-form') as HTMLFormElement;
            fireEvent.submit(form);

            expect(alertSpy).toHaveBeenCalledWith('Please select a set to learn from.');
            alertSpy.mockRestore();
        });

        it('should navigate with correct parameters when valid selection made', async () => 
        {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sets: mockSets })
            });

            renderWithProviders(<LearnForm />);

            await waitFor(() => 
            {
                expect(screen.getByDisplayValue('Choose set to learn')).toBeInTheDocument();
            });

            //Select a set
            const setSelect = screen.getByDisplayValue('Choose set to learn');
            fireEvent.change(setSelect, { target: { value: 'set1' } });

            //Submit form
            const startButton = screen.getByText('Start Learning');
            fireEvent.click(startButton);

            expect(mockNavigate).toHaveBeenCalledWith('/learn/practice/set1?mode=all');
        });

        it('should navigate with unknown mode when selected', async () => 
        {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sets: mockSets })
            });

            renderWithProviders(<LearnForm />);

            await waitFor(() => 
            {
                expect(screen.getByDisplayValue('Choose set to learn')).toBeInTheDocument();
            });

            //Select set and change mode
            const setSelect = screen.getByDisplayValue('Choose set to learn');
            fireEvent.change(setSelect, { target: { value: 'set2' } });

            const modeSelect = screen.getByDisplayValue('Practice all cards');
            fireEvent.change(modeSelect, { target: { value: 'unknown' } });

            //Submit
            const startButton = screen.getByText('Start Learning');
            fireEvent.click(startButton);

            expect(mockNavigate).toHaveBeenCalledWith('/learn/practice/set2?mode=unknown');
        });

        it('should handle whitespace in selected set ID', async () => 
        {
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
            
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sets: mockSets })
            });

            renderWithProviders(<LearnForm />);

            await waitFor(() => 
            {
                expect(screen.getByDisplayValue('Choose set to learn')).toBeInTheDocument();
            });

            const setSelect = screen.getByDisplayValue('Choose set to learn');
            fireEvent.change(setSelect, { target: { value: '   ' } });

            const form = document.querySelector('.flashcard-add-form') as HTMLFormElement;
            fireEvent.submit(form);

            expect(alertSpy).toHaveBeenCalledWith('Please select a set to learn from.');
            alertSpy.mockRestore();
        });
    });

    describe('Edge Cases and Styling', () => 
    {
        it('should handle errors and apply correct styling', async () => 
        {
            //Test malformed JSON and HTTP error responses
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => { throw new Error('Invalid JSON'); }
            });

            renderWithProviders(<LearnForm />);

            await waitFor(() => 
            {
                expect(screen.getByText('No sets created yet.')).toBeInTheDocument();
            });

            //Test styling with valid data
            vi.clearAllMocks();
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sets: mockSets })
            });

            renderWithProviders(<LearnForm />);

            await waitFor(() => 
            {
                const modal = screen.getByText('Learn Flashcards').closest('.flashcard-add-modal');
                expect(modal).toHaveStyle('position: static');
                expect(modal).toHaveStyle('background: transparent');

                const actionsContainer = screen.getByText('Start Learning').closest('.flashcard-actions-bottom');
                expect(actionsContainer).toHaveStyle('justify-content: flex-end');
            });
        });
    });
});