import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import Dashboard from '../components/Dashboard';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';

//i18n
i18n.init(
{
  lng: 'en',
  fallbackLng: 'en',
  interpolation: 
  {
    escapeValue: false,
  },
  resources: 
  {
    en: 
    {
      translation: 
      {
        dashboard: 
        {
          setName: "Set Name",
          description: "Description",
          characters: "characters",
          addNewSet: "Add New Set",
          add: "Add",
          adding: "Adding...",
          cancel: "Cancel",
          save: "Save",
          edit: "Edit",
          deleteSet: "Are you sure you want to delete this set?",
          noDescription: "No description",
          noSetsFound: "No sets found. Create your first set!",
          exportAction: "Export",
          export: {
            title: "Export Set",
            chooseFormat: "Choose export format:",
            jsonFormat: "JSON Format",
            csvFormat: "CSV Format"
          },
          import: {
            title: "Import Set",
            wrongFormat: "Invalid file format. Please select a JSON or CSV file.",
            invalidJson: "Invalid JSON format",
            unsupportedFormat: "Unsupported file format",
            missingSetInfo: "Missing set information in file",
            failedMessage: "Import failed: {{error}}",
            successMessage: "Successfully imported set '{{setName}}' with {{count}} flashcards",
            failedToRead: "Failed to read file",
            invalidCsv: "Invalid CSV format",
            insufficientColumns: "CSV must have at least 8 columns",
            supportedFormats: "Supported Formats",
            jsonFormat: "JSON Format",
            csvFormat: "CSV Format",
            csvHeaders: "CSV columns: Set Name, Description, Default Language, Translation Language, Content, Translation, Language, Translation Lang, Known, Date",
            selectedFile: "Selected file"
          }
        },
        languages: 
        {
          PL: "Polish",
          EN: "English",
          DE: "German",
          ES: "Spanish"
        }
      }
    }
  }
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/dashboard']}>
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  </MemoryRouter>
);

const navigateMock = vi.fn();

global.fetch = vi.fn();

global.FileReader = vi.fn(() => (
{
  readAsText: vi.fn(),
  onload: null,
  onerror: null,
  result: null
})) as any;

global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

Object.defineProperty(window, 'confirm', 
{
  value: vi.fn(),
  writable: true,
});

beforeEach(() => 
{
  //'en' for testing
  i18n.changeLanguage('en');
  
  Object.defineProperty(window, 'localStorage', 
  {
    value: 
    {
      removeItem: vi.fn(),
      getItem: vi.fn(() => 'mock-token'),
      setItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });

  vi.clearAllMocks();
  
  (global.fetch as any).mockResolvedValue(
    {
    ok: true,
    status: 200,
    json: () => Promise.resolve(
    {
      sets: [
        {
          id: '1',
          name: 'Test Set 1',
          description: 'Test Description 1',
          defaultLanguage: 'EN',
          translationLanguage: 'PL',
          owner: 'user1'
        },
        {
          id: '2',
          name: 'Test Set 2',
          description: 'Test Description 2',
          defaultLanguage: 'DE',
          translationLanguage: 'EN',
          owner: 'user1'
        }
      ]
    }),
    text: () => Promise.resolve('mock-csv-content')
  });
});

afterEach(() => 
{
  vi.resetAllMocks();
});

vi.mock('react-router-dom', async (importOriginal) => 
{
  const actual = await importOriginal();
  const actualTyped = actual as Record<string, any>;
  return {
    ...actualTyped,
    useNavigate: () => navigateMock,
    MemoryRouter: actualTyped.MemoryRouter,
  };
});

describe('Dashboard component', () => 
{
  describe('Initial render and authentication', () => 
  {
    it('Renders dashboard with sets when authenticated', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        expect(screen.getByText('Test Set 1')).toBeInTheDocument();
        expect(screen.getByText('Test Set 2')).toBeInTheDocument();
      });

      expect(screen.getByText('Add New Set')).toBeInTheDocument();
    });

    it('Redirects to login when no token is present', async () => 
    {
      (window.localStorage.getItem as any).mockReturnValue(null);

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('Redirects to login on 401 response', async () => 
    {
      (global.fetch as any).mockResolvedValueOnce(
      {
        ok: false,
        status: 401
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
      });
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('Shows alert on fetch error', async () => 
    {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        expect(alertSpy).toHaveBeenCalledWith('Failed to load sets.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Add new set functionality', () => 
  {
    it('Shows add set form when plus button is clicked', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        expect(screen.getByText('Add New Set')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add New Set'));

      expect(screen.getByPlaceholderText('Set Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('Handles add set form input changes', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      const nameInput = screen.getByPlaceholderText('Set Name') as HTMLInputElement;
      const descInput = screen.getByPlaceholderText('Description') as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'New Set Name' } });
      fireEvent.change(descInput, { target: { value: 'New Set Description' } });

      expect(nameInput.value).toBe('New Set Name');
      expect(descInput.value).toBe('New Set Description');
    });

    it('Shows character count for name and description inputs', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      const nameInput = screen.getByPlaceholderText('Set Name');
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      expect(screen.getByText('4/50 characters')).toBeInTheDocument();
    });

    it('Successfully adds a new set', async () => 
    {
      (global.fetch as any)
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve(
          {
            sets: []
          })
        })
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve(
          {
            set: 
            {
              id: '3',
              name: 'New Test Set',
              description: 'New Description',
              defaultLanguage: 'EN',
              translationLanguage: 'PL',
              owner: 'user1'
            }
          })
        });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      fireEvent.change(screen.getByPlaceholderText('Set Name'), 
    {
        target: { value: 'New Test Set' }
      });

      fireEvent.click(screen.getByText('Add'));

      await waitFor(() => 
      {
        expect(global.fetch).toHaveBeenCalledWith('/api/sets', 
        {
          method: 'POST',
          headers: 
          {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token'
          },
          body: JSON.stringify(
          {
            name: 'New Test Set',
            description: '',
            defaultLanguage: 'PL',
            translationLanguage: 'EN'
          })
        });
      });
    });

    it('Handles add set error', async () => 
    {
      (global.fetch as any)
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve({ sets: [] })
        })
        .mockResolvedValueOnce(
        {
          ok: false
        });

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      fireEvent.change(screen.getByPlaceholderText('Set Name'), 
      {
        target: { value: 'New Test Set' }
      });

      fireEvent.click(screen.getByText('Add'));

      await waitFor(() => 
      {
        expect(alertSpy).toHaveBeenCalledWith('Failed to add set.');
      });

      alertSpy.mockRestore();
    });

    it('Cancels add set form', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      fireEvent.change(screen.getByPlaceholderText('Set Name'), 
      {
        target: { value: 'Test Name' }
      });

      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByPlaceholderText('Set Name')).not.toBeInTheDocument();
      expect(screen.getByText('Add New Set')).toBeInTheDocument();
    });

    it('Handles Enter key in add set form', async () => 
    {
      (global.fetch as any)
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve({ sets: [] })
        })
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve(
          {
            set: 
            {
              id: '3',
              name: 'New Test Set',
              description: '',
              defaultLanguage: 'PL',
              translationLanguage: 'EN',
              owner: 'user1'
            }
          })
        });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      const nameInput = screen.getByPlaceholderText('Set Name');
      fireEvent.change(nameInput, { target: { value: 'New Test Set' } });
      fireEvent.keyDown(nameInput, { key: 'Enter', code: 'Enter' });

      await waitFor(() => 
      {
        expect(global.fetch).toHaveBeenCalledWith('/api/sets', expect.any(Object));
      });
    });

    it('Handles Escape key in add set form', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      const nameInput = screen.getByPlaceholderText('Set Name');
      fireEvent.keyDown(nameInput, { key: 'Escape', code: 'Escape' });

      expect(screen.queryByPlaceholderText('Set Name')).not.toBeInTheDocument();
    });
  });

  describe('Edit set functionality', () => 
  {
    it('Shows edit form when edit button is clicked', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        expect(screen.getByText('Test Set 1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByDisplayValue('Test Set 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description 1')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('Successfully edits a set', async () => 
    {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(
          {
            sets: [
              {
                id: '1',
                name: 'Test Set 1',
                description: 'Test Description 1',
                defaultLanguage: 'EN',
                translationLanguage: 'PL',
                owner: 'user1'
              }
            ]
          })
        })
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve({
            set: 
            {
              id: '1',
              name: 'Updated Set Name',
              description: 'Updated Description',
              defaultLanguage: 'EN',
              translationLanguage: 'PL',
              owner: 'user1'
            }
          })
        });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const editButtons = screen.getAllByTitle('Edit');
        fireEvent.click(editButtons[0]);
      });

      const nameInput = screen.getByDisplayValue('Test Set 1');
      fireEvent.change(nameInput, { target: { value: 'Updated Set Name' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => 
      {
        expect(global.fetch).toHaveBeenCalledWith('/api/sets/1', {
          method: 'PUT',
          headers: 
          {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token'
          },
          body: JSON.stringify(
          {
            name: 'Updated Set Name',
            description: 'Test Description 1'
          })
        });
      });
    });

    it('Handles edit set error', async () => 
    {
      (global.fetch as any)
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve({
            sets: [
              {
                id: '1',
                name: 'Test Set 1',
                description: 'Test Description 1',
                defaultLanguage: 'EN',
                translationLanguage: 'PL',
                owner: 'user1'
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: false
        });

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const editButtons = screen.getAllByTitle('Edit');
        fireEvent.click(editButtons[0]);
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => 
      {
        expect(alertSpy).toHaveBeenCalledWith('Failed to edit set.');
      });

      alertSpy.mockRestore();
    });

    it('Cancels edit mode', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const editButtons = screen.getAllByTitle('Edit');
        fireEvent.click(editButtons[0]);
      });

      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByDisplayValue('Test Set 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test Set 1')).toBeInTheDocument();
    });
  });

  describe('Delete set functionality', () => 
  {
    it('Deletes set when confirmed', async () => 
    {
      (window.confirm as any).mockReturnValue(true);
      
      (global.fetch as any)
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve({
            sets: [
              {
                id: '1',
                name: 'Test Set 1',
                description: 'Test Description 1',
                defaultLanguage: 'EN',
                translationLanguage: 'PL',
                owner: 'user1'
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true
        });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const deleteButtons = screen.getAllByTitle('Are you sure you want to delete this set?');
        fireEvent.click(deleteButtons[0]);
      });

      expect(window.confirm).toHaveBeenCalled();
      
      await waitFor(() => 
      {
        expect(global.fetch).toHaveBeenCalledWith('/api/sets/1', 
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer mock-token' }
        });
      });
    });

    it('Does not delete set when cancelled', async () => 
    {
      (window.confirm as any).mockReturnValue(false);

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const deleteButtons = screen.getAllByTitle('Are you sure you want to delete this set?');
        fireEvent.click(deleteButtons[0]);
      });

      expect(window.confirm).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalledWith('/api/sets/1', expect.objectContaining(
      {
        method: 'DELETE'
      }));
    });
  });

  describe('Export functionality', () => 
  {
    it('Opens export modal when export button is clicked', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const exportButtons = screen.getAllByTitle('Export');
        fireEvent.click(exportButtons[0]);
      });

      expect(screen.getByText('Export Set')).toBeInTheDocument();
      expect(screen.getByText('Choose export format:')).toBeInTheDocument();
      expect(screen.getByText('JSON Format')).toBeInTheDocument();
      expect(screen.getByText('CSV Format')).toBeInTheDocument();
    });

    it('Exports set in JSON format', async () => 
    {
      const mockJsonData = { set: { name: 'Test Set' }, flashcards: [] };
      (global.fetch as any)
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve(
          {
            sets: [
              {
                id: '1',
                name: 'Test Set 1',
                description: 'Test Description 1',
                defaultLanguage: 'EN',
                translationLanguage: 'PL',
                owner: 'user1'
              }
            ]
          })
        })
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve(mockJsonData)
        });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const exportButtons = screen.getAllByTitle('Export');
        fireEvent.click(exportButtons[0]);
      });

      fireEvent.click(screen.getByText('Export'));

      await waitFor(() => 
      {
        expect(global.fetch).toHaveBeenCalledWith('/api/sets/1/export?format=json', 
        {
          headers: { Authorization: 'Bearer mock-token' }
        });
      });
    });

    it('Exports set in CSV format', async () => 
    {
      (global.fetch as any)
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve(
          {
            sets: [
              {
                id: '1',
                name: 'Test Set 1',
                description: 'Test Description 1',
                defaultLanguage: 'EN',
                translationLanguage: 'PL',
                owner: 'user1'
              }
            ]
          })
        })
        .mockResolvedValueOnce(
        {
          ok: true,
          text: () => Promise.resolve('csv,data,here')
        });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const exportButtons = screen.getAllByTitle('Export');
        fireEvent.click(exportButtons[0]);
      });

      //CSV format
      fireEvent.click(screen.getByLabelText('CSV Format'));
      fireEvent.click(screen.getByText('Export'));

      await waitFor(() => 
      {
        expect(global.fetch).toHaveBeenCalledWith('/api/sets/1/export?format=csv', 
        {
          headers: { Authorization: 'Bearer mock-token' }
        });
      });
    });

    it('Cancels export modal', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const exportButtons = screen.getAllByTitle('Export');
        fireEvent.click(exportButtons[0]);
      });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByText('Export Set')).not.toBeInTheDocument();
    });

    it('Handles export error', async () => 
    {
      (global.fetch as any)
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve(
          {
            sets: [
              {
                id: '1',
                name: 'Test Set 1',
                description: 'Test Description 1',
                defaultLanguage: 'EN',
                translationLanguage: 'PL',
                owner: 'user1'
              }
            ]
          })
        })
        .mockResolvedValueOnce(
        {
          ok: false
        });

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const exportButtons = screen.getAllByTitle('Export');
        fireEvent.click(exportButtons[0]);
      });

      fireEvent.click(screen.getByText('Export'));

      await waitFor(() => 
      {
        expect(alertSpy).toHaveBeenCalledWith('Failed to export set.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Import functionality', () => 
  {
    it('Opens import modal when import button is clicked', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      const importButton = screen.getByTitle('Import Set');
      fireEvent.click(importButton);

      expect(screen.getByText('Import Set')).toBeInTheDocument();
      expect(screen.getByText('Supported Formats')).toBeInTheDocument();
    });

    it('Handles file selection', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      fireEvent.click(screen.getByTitle('Import Set'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      if (fileInput) {
        const file = new File(['test content'], 'test.json', { type: 'application/json' });
        Object.defineProperty(fileInput, 'files', 
        {
          value: [file],
          writable: false,
        });

        fireEvent.change(fileInput);
      }
    });

    it('Validates file type on selection', async () => 
    {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      fireEvent.click(screen.getByTitle('Import Set'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      if (fileInput) 
      {
        const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        Object.defineProperty(fileInput, 'files', 
        {
          value: [invalidFile],
          writable: false,
        });

        fireEvent.change(fileInput);

        expect(alertSpy).toHaveBeenCalledWith('Invalid file format. Please select a JSON or CSV file.');
      }

      alertSpy.mockRestore();
    });

    it('Cancels import modal', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      fireEvent.click(screen.getByTitle('Import Set'));
      fireEvent.click(screen.getAllByText('Cancel')[1]); // Second cancel button (import modal)

      expect(screen.queryByText('Import Set')).not.toBeInTheDocument();
    });
  });

  describe('Navigation and interaction', () => 
  {
    it('Navigates to set detail when set block is clicked', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const setBlock = screen.getByText('Test Set 1').closest('.setBlock');
        if (setBlock) 
        {
          fireEvent.click(setBlock);
        }
      });

      expect(navigateMock).toHaveBeenCalledWith('/set/1');
    });

    it('Prevents navigation when action buttons are clicked', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const editButtons = screen.getAllByTitle('Edit');
        fireEvent.click(editButtons[0]);
      });

      expect(navigateMock).not.toHaveBeenCalledWith('/set/1');
    });
  });

  describe('Language functionality', () => 
  {
    it('Displays language names correctly', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        const englishElements = screen.getAllByText('English');
        expect(englishElements.length).toBeGreaterThan(0);
        
        expect(screen.getByText('Polish')).toBeInTheDocument();
        expect(screen.getByText('German')).toBeInTheDocument();
      });
    });

    it('Handles language selection in add form', async () => 
    {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      const languageSelects = screen.getAllByRole('combobox');
      
      fireEvent.change(languageSelects[0], { target: { value: 'DE' } });
      fireEvent.change(languageSelects[1], { target: { value: 'ES' } });

      expect((languageSelects[0] as HTMLSelectElement).value).toBe('DE');
      expect((languageSelects[1] as HTMLSelectElement).value).toBe('ES');
    });
  });

  describe('Text truncation', () => 
  {
    it('Truncates long set names and descriptions', async () => 
    {
      (global.fetch as any).mockResolvedValueOnce(
      {
        ok: true,
        json: () => Promise.resolve(
        {
          sets: [
            {
              id: '1',
              name: 'This is a very long set name that should be truncated',
              description: 'This is a very long description that should also be truncated when displayed',
              defaultLanguage: 'EN',
              translationLanguage: 'PL',
              owner: 'user1'
            }
          ]
        })
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        expect(screen.getByText(/This is a very long set/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading states', () => 
  {
    it('Shows loading state when adding set', async () => 
    {
      (global.fetch as any)
        .mockResolvedValueOnce(
        {
          ok: true,
          json: () => Promise.resolve({ sets: [] })
        })
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        fireEvent.click(screen.getByText('Add New Set'));
      });

      fireEvent.change(screen.getByPlaceholderText('Set Name'), 
      {
        target: { value: 'Test Set' }
      });

      fireEvent.click(screen.getByText('Add'));

      expect(screen.getByText('Adding...')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => 
  {
    it('Shows message when no sets exist', async () => 
    {
      (global.fetch as any).mockResolvedValueOnce(
      {
        ok: true,
        json: () => Promise.resolve({ sets: [] })
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => 
      {
        expect(screen.getByText('No sets found. Create your first set!')).toBeInTheDocument();
      });
    });
  });
});