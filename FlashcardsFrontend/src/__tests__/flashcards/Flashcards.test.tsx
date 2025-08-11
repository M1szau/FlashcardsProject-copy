import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import Flashcards from '../../components/flashcards/Flashcards';
import { renderWithProviders } from '../test-utils';

vi.mock('../../components/Navbar', () => (
{
  default: () => <div data-testid="navbar">Navbar</div>
}));

vi.mock('../../components/flashcards/AddFlashcardButton', () => (
{
  default: ({ selectedSetId, currentUser }: { selectedSetId: string | null, currentUser: string }) => 
    <button data-testid="add-flashcard-button" data-set-id={selectedSetId} data-user={currentUser}>
      Add Flashcard
    </button>
}));

vi.mock('../../components/flashcards/FlashcardViewer', () => (
{
  default: ({ current, total, flipped, isEditing, renderCardContent, renderActions }: any) => 
    <div data-testid="flashcard-viewer">
      <div data-testid="current-index">{current}</div>
      <div data-testid="total-count">{total}</div>
      <div data-testid="is-flipped">{flipped.toString()}</div>
      <div data-testid="is-editing">{isEditing.toString()}</div>
      <div data-testid="card-content-front">{renderCardContent("front")}</div>
      <div data-testid="card-content-back">{renderCardContent("back")}</div>
      <div data-testid="actions">{renderActions()}</div>
    </div>
}));

vi.mock('../../components/flashcards/FlashcardDeleteBtn', () => (
{
  default: ({ flashcard, selectedSetId, onDeleteSuccess, flashcardsLength }: any) => 
    <button 
      data-testid="delete-flashcard-button"
      onClick={() => onDeleteSuccess()}
      data-flashcard-id={flashcard?.id}
      data-set-id={selectedSetId}
      data-flashcards-length={flashcardsLength}
    >
      Delete
    </button>
}));

vi.mock('../../components/flashcards/FlashcardKnownStatus', () => (
{
  default: ({ flashcard, onKnownStatusChange, showButton }: any) => 
    <div data-testid="known-status">
      <span data-testid="known-value">{flashcard?.known?.toString()}</span>
      {showButton && (
        <button 
          data-testid="toggle-known-button"
          onClick={() => onKnownStatusChange({...flashcard, known: !flashcard.known})}
        >
          Toggle Known
        </button>
      )}
    </div>
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => 
{
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ setId: 'test-set-id' }),
    useNavigate: () => mockNavigate
  };
});

vi.mock('react-i18next', async () => 
{
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => (
    {
      t: (key: string) => 
    {
        const translations: { [key: string]: string } = 
        {
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
      }
    })
  };
});

const mockAuth =
{
  user: { username: 'testuser', id: '1' },
  token: 'test-token',
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn()
};

const mockFlashcardsContext = 
{
  flashcards: [] as any[],
  current: 0,
  flipped: false,
  loading: false,
  actions: {
    setCurrentSet: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    add: vi.fn(),
    setCurrent: vi.fn(),
    setFlipped: vi.fn()
  }
};

vi.mock('../../contexts', () => (
{
  useAuth: () => mockAuth,
  useFlashcards: () => mockFlashcardsContext
}));

const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, 'addEventListener', 
{ 
  value: mockAddEventListener, 
  writable: true 
});
Object.defineProperty(window, 'removeEventListener', 
{ 
  value: mockRemoveEventListener, 
  writable: true 
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockAlert = vi.fn();
global.alert = mockAlert;

describe('Flashcards Component', () => 
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

  const longContentFlashcard = 
  {
    id: 'flashcard-2',
    setId: 'test-set-id',
    language: 'English',
    content: 'This is a very long content that should be truncated when displayed',
    translation: 'Esta es una traducción muy larga que debería ser truncada cuando se muestra',
    translationLang: 'Spanish',
    owner: 'user1',
    known: true
  };

  beforeEach(() => 
  {
    vi.clearAllMocks();
    mockFlashcardsContext.flashcards = [];
    mockFlashcardsContext.current = 0;
    mockFlashcardsContext.flipped = false;
    mockFlashcardsContext.loading = false;
    
    // Default successful fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => 
  {
    vi.clearAllMocks();
  });

  describe('Component Mounting and Setup', () => 
  {
    it('renders navbar component', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('calls setCurrentSet with setId on mount', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(mockFlashcardsContext.actions.setCurrentSet).toHaveBeenCalledWith('test-set-id');
    });

    it('sets up beforeunload event listener on mount', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('removes beforeunload event listener on unmount', () => 
    {
      const { unmount } = renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      unmount();
      expect(mockRemoveEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
  });

  describe('Loading State', () => 
  {
    it('displays loading message when loading is true', () => 
    {
      mockFlashcardsContext.loading = true;
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(screen.getByText('Loading flashcards...')).toBeInTheDocument();
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('does not show flashcard content when loading', () => 
    {
      mockFlashcardsContext.loading = true;
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(screen.queryByTestId('add-flashcard-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('flashcard-viewer')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => 
  {
    it('displays no flashcards message when flashcards array is empty', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(screen.getByText('No flashcards available. Add some!')).toBeInTheDocument();
    });

    it('shows add flashcard button when no flashcards exist', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      const addButton = screen.getByTestId('add-flashcard-button');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute('data-set-id', 'test-set-id');
      expect(addButton).toHaveAttribute('data-user', 'testuser');
    });

    it('does not show flashcard viewer when no flashcards exist', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(screen.queryByTestId('flashcard-viewer')).not.toBeInTheDocument();
    });
  });

  describe('Flashcard Display', () => 
  {
    beforeEach(() => 
    {
      mockFlashcardsContext.flashcards = [mockFlashcard];
    });

    it('renders flashcard viewer when flashcards exist', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
    });

    it('passes correct props to FlashcardViewer', () => 
    {
      mockFlashcardsContext.current = 0;
      mockFlashcardsContext.flipped = true;
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      expect(screen.getByTestId('current-index')).toHaveTextContent('0');
      expect(screen.getByTestId('total-count')).toHaveTextContent('1');
      expect(screen.getByTestId('is-flipped')).toHaveTextContent('true');
      expect(screen.getByTestId('is-editing')).toHaveTextContent('false');
    });

    it('displays flashcard content correctly', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('displays translation content correctly', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(screen.getByText('Spanish')).toBeInTheDocument();
      expect(screen.getByText('Hola Mundo')).toBeInTheDocument();
    });

    it('shows known status component', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(screen.getAllByTestId('known-status')).toHaveLength(3); 
    });

    it('truncates long content correctly', () => 
    {
      mockFlashcardsContext.flashcards = [longContentFlashcard];
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const truncatedContent = 'This is a very long content that should be truncat...';
      expect(screen.getByText(truncatedContent)).toBeInTheDocument();
    });

    it('provides full content in title attribute', () => 
    {
      mockFlashcardsContext.flashcards = [longContentFlashcard];
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const contentElement = screen.getByTitle(longContentFlashcard.content);
      expect(contentElement).toBeInTheDocument();
    });

    it('handles empty content gracefully', () => 
    {
      const emptyFlashcard = { ...mockFlashcard, content: '', translation: '' };
      mockFlashcardsContext.flashcards = [emptyFlashcard];
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
    });
  });

  describe('Language Handling', () => 
  {
    it('translates language codes to full names', () => 
    {
      const polishFlashcard = 
      { 
        ...mockFlashcard, 
        language: 'Polish', 
        translationLang: 'German' 
      };
      mockFlashcardsContext.flashcards = [polishFlashcard];
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      expect(screen.getByText('Polish')).toBeInTheDocument();
      expect(screen.getByText('German')).toBeInTheDocument();
    });

    it('displays untranslated language codes if no translation exists', () => 
    {
      const unknownLangFlashcard = 
     { 
        ...mockFlashcard, 
        language: 'Unknown', 
        translationLang: 'Mystery' 
      };
      mockFlashcardsContext.flashcards = [unknownLangFlashcard];
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      expect(screen.getByText('Unknown')).toBeInTheDocument();
      expect(screen.getByText('Mystery')).toBeInTheDocument();
    });
  });

  describe('Edit Functionality', () => 
  {
    beforeEach(() => 
    {
      mockFlashcardsContext.flashcards = [mockFlashcard];
    });

    it('enters edit mode when edit button is clicked', async () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(() => 
      {
        expect(screen.getByTestId('is-editing')).toHaveTextContent('true');
      });
    });

    it('displays edit form when in edit mode', async () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(() => 
      {
        expect(screen.getByDisplayValue('Hello World')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Hola Mundo')).toBeInTheDocument();
      });
    });

    it('shows language dropdowns in edit mode', async () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(() => 
      {
        const selects = screen.getAllByRole('combobox');
        expect(selects).toHaveLength(2);
        expect(screen.getByText('Select Language')).toBeInTheDocument();
        expect(screen.getByText('Select Translation Language')).toBeInTheDocument();
      });
    });

    it('populates edit form with current flashcard values', async () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(() => 
      {
        expect(screen.getByDisplayValue('Hello World')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Hola Mundo')).toBeInTheDocument();
        
        const selects = screen.getAllByRole('combobox');
        expect(selects[0]).toBeInTheDocument();
        expect(selects[1]).toBeInTheDocument();
      });
    });

    it('handles input changes in edit mode', async () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(() => 
      {
        const contentInput = screen.getByDisplayValue('Hello World');
        fireEvent.change(contentInput, { target: { value: 'Updated Content' } });
        expect(screen.getByDisplayValue('Updated Content')).toBeInTheDocument();
      });
    });

    it('enforces maxLength constraint on edit inputs', async () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(() => 
      {
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach(input => 
        {
          expect(input).toHaveAttribute('maxLength', '30');
        });
      });
    });

    it('shows save and cancel buttons in edit mode', async () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(() => 
      {
        expect(screen.getByLabelText('Save')).toBeInTheDocument();
        expect(screen.getByLabelText('Cancel')).toBeInTheDocument();
      });
    });

    it('saves changes when save button is clicked', async () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(async () => 
      {
        const contentInput = screen.getByDisplayValue('Hello World');
        fireEvent.change(contentInput, { target: { value: 'Updated Content' } });
        
        const saveButton = screen.getByLabelText('Save');
        fireEvent.click(saveButton);
        
        await waitFor(() => 
        {
          expect(mockFetch).toHaveBeenCalledWith(
            '/api/sets/test-set-id/flashcards/flashcard-1',
            expect.objectContaining(
            {
              method: 'PUT',
              headers: expect.objectContaining(
              {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
              }),
              body: expect.stringContaining('"content":"Updated Content"')
            })
          );
        });
      });
    });

    it('calls update action after successful save', async () => 
    {
      const updatedCard = { ...mockFlashcard, content: 'Updated Content' };
      mockFetch.mockResolvedValue(
      {
        ok: true,
        json: () => Promise.resolve(updatedCard)
      });
      
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(async () => 
      {
        const saveButton = screen.getByLabelText('Save');
        fireEvent.click(saveButton);
        
        await waitFor(() => 
        {
          expect(mockFlashcardsContext.actions.update).toHaveBeenCalledWith(updatedCard);
        });
      });
    });

    it('handles save errors gracefully', async () => 
    {
      mockFetch.mockResolvedValue(
      {
        ok: false,
        status: 400
      });
      
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(async () => 
      {
        const saveButton = screen.getByLabelText('Save');
        fireEvent.click(saveButton);
        
        await waitFor(() => 
        {
          expect(mockAlert).toHaveBeenCalledWith('Failed to update flashcard. Please try again.');
        });
      });
    });

    it('exits edit mode when cancel button is clicked', async () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(async () => 
      {
        const cancelButton = screen.getByLabelText('Cancel');
        fireEvent.click(cancelButton);
        
        await waitFor(() => 
        {
          expect(screen.getByTestId('is-editing')).toHaveTextContent('false');
        });
      });
    });

    it('prevents form submission with missing required fields', async () => 
    {
      mockFetch.mockClear();
      
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(() => 
      {
        const contentInput = screen.getByPlaceholderText('Content');
        fireEvent.change(contentInput, { target: { value: '' } });
        
        mockFetch.mockClear();
        
        const saveButton = screen.getByLabelText('Save');
        fireEvent.click(saveButton);
        
        expect(mockFetch).not.toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/sets\/.*\/flashcards\//),
          expect.any(Object)
        );
      });
    });
  });

  describe('Action Buttons', () => 
  {
    beforeEach(() => 
    {
      mockFlashcardsContext.flashcards = [mockFlashcard];
    });

    it('renders edit button in normal mode', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(screen.getByLabelText('Edit Flashcard')).toBeInTheDocument();
    });

    it('renders delete button', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      const deleteButton = screen.getByTestId('delete-flashcard-button');
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveAttribute('data-flashcard-id', 'flashcard-1');
      expect(deleteButton).toHaveAttribute('data-set-id', 'test-set-id');
      expect(deleteButton).toHaveAttribute('data-flashcards-length', '1');
    });

    it('renders known status toggle button', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(screen.getByTestId('toggle-known-button')).toBeInTheDocument();
    });

    it('handles delete action correctly', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const deleteButton = screen.getByTestId('delete-flashcard-button');
      fireEvent.click(deleteButton);
      
      expect(mockFlashcardsContext.actions.remove).toHaveBeenCalled();
    });

    it('handles known status toggle correctly', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const toggleButton = screen.getByTestId('toggle-known-button');
      fireEvent.click(toggleButton);
      
      expect(mockFlashcardsContext.actions.update).toHaveBeenCalledWith({
        ...mockFlashcard,
        known: true
      });
    });
  });

  describe('Multiple Flashcards', () => 
  {
    const secondFlashcard = 
    {
      id: 'flashcard-2',
      setId: 'test-set-id',
      language: 'Spanish',
      content: 'Hola',
      translation: 'Hello',
      translationLang: 'English',
      owner: 'user1',
      known: true
    };

    beforeEach(() => 
    {
      mockFlashcardsContext.flashcards = [mockFlashcard, secondFlashcard];
    });

    it('displays correct total count', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      expect(screen.getByTestId('total-count')).toHaveTextContent('2');
    });

    it('displays content for current flashcard', () => 
    {
      mockFlashcardsContext.current = 1;
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      expect(screen.getByText('Hola')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('shows correct known status for current flashcard', () => 
    {
      mockFlashcardsContext.current = 1;
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const knownStatuses = screen.getAllByTestId('known-value');
      knownStatuses.forEach(status => 
      {
        expect(status).toHaveTextContent('true');
      });
    });
  });

  describe('Error Handling', () => 
  {
    beforeEach(() => 
    {
      mockFlashcardsContext.flashcards = [mockFlashcard];
    });

    it('handles network errors during save', async () => 
    {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(async () => 
      {
        const saveButton = screen.getByLabelText('Save');
        fireEvent.click(saveButton);
        
        await waitFor(() => 
        {
          expect(mockAlert).toHaveBeenCalledWith('Failed to update flashcard. Please try again.');
        });
      });
    });

    it('handles missing auth token gracefully', async () => 
    {
      vi.mocked(mockAuth).token = null as any;
      
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(async () => 
      {
        const saveButton = screen.getByLabelText('Save');
        fireEvent.click(saveButton);
        
        await waitFor(() => 
        {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
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
      
      vi.mocked(mockAuth).token = 'test-token';
    });
  });

  describe('Accessibility', () => 
  {
    beforeEach(() => 
    {
      mockFlashcardsContext.flashcards = [mockFlashcard];
    });

    it('provides proper aria-labels for edit actions', async () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(() => 
      {
        expect(screen.getByLabelText('Save')).toBeInTheDocument();
        expect(screen.getByLabelText('Cancel')).toBeInTheDocument();
      });
    });

    it('provides proper form labels and structure', async () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(() => 
      {
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach(input => 
        {
          expect(input).toHaveAttribute('required');
          expect(input).toHaveAttribute('placeholder');
        });
        
        const selects = screen.getAllByRole('combobox');
        selects.forEach(select => {
          expect(select).toHaveAttribute('required');
        });
      });
    });

    it('prevents event bubbling on edit form clicks', async () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const editButton = screen.getByLabelText('Edit Flashcard');
      fireEvent.click(editButton);
      
      await waitFor(() => 
      {
        const forms = document.querySelectorAll('.flashcard-edit-form');
        expect(forms).toHaveLength(2); 
        fireEvent.click(forms[0] as Element);
        expect(forms[0]).toBeInTheDocument();
      });
    });
  });

  describe('Integration with Sub-components', () => 
  {
    beforeEach(() => 
    {
      mockFlashcardsContext.flashcards = [mockFlashcard];
    });

    it('passes all required props to AddFlashcardButton', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const addButton = screen.getByTestId('add-flashcard-button');
      expect(addButton).toHaveAttribute('data-set-id', 'test-set-id');
      expect(addButton).toHaveAttribute('data-user', 'testuser');
    });

    it('passes correct props to FlashcardDeleteBtn', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const deleteButton = screen.getByTestId('delete-flashcard-button');
      expect(deleteButton).toHaveAttribute('data-flashcard-id', mockFlashcard.id);
      expect(deleteButton).toHaveAttribute('data-set-id', mockFlashcard.setId);
      expect(deleteButton).toHaveAttribute('data-flashcards-length', '1');
    });

    it('provides render functions to FlashcardViewer', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      expect(screen.getByTestId('card-content-front')).toBeInTheDocument();
      expect(screen.getByTestId('card-content-back')).toBeInTheDocument();
      expect(screen.getByTestId('actions')).toBeInTheDocument();
    });

    it('handles FlashcardKnownStatus callbacks correctly', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const toggleButton = screen.getByTestId('toggle-known-button');
      fireEvent.click(toggleButton);
      
      expect(mockFlashcardsContext.actions.update).toHaveBeenCalledWith({
        ...mockFlashcard,
        known: true
      });
    });
  });

  describe('BeforeUnload Event Handling', () => 
  {
    it('prevents page unload when beforeunload event is triggered', () => 
    {
      renderWithProviders(<Flashcards />, { includeFlashcardsProvider: true });
      
      const beforeUnloadCall = mockAddEventListener.mock.calls.find(call => call[0] === 'beforeunload');
      expect(beforeUnloadCall).toBeTruthy();
      
      const beforeUnloadHandler = beforeUnloadCall![1];
      
      const mockEvent = 
      {
        preventDefault: vi.fn(),
        returnValue: undefined
      };
      
      beforeUnloadHandler(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.returnValue).toBe('');
    });
  });
});
