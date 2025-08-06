import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import '@testing-library/jest-dom';
import Statistics from '../components/Statistics.tsx';

// Initialize i18n for testing
i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        statistics: {
          title: 'Learning Statistics',
          totalSets: 'Total Sets',
          totalFlashcards: 'Total Flashcards',
          knownCards: 'Known Cards',
          notKnownYet: 'Not Known Yet',
          learningProgress: 'Learning Progress',
          mastered: 'mastered',
          noFlashcardsYet: 'No flashcards yet',
          breakdownBySets: 'Breakdown by sets',
          noSetsCreated: 'No sets created yet.',
          total: 'Total',
          known: 'Known',
          unknown: 'Unknown',
          noCardsInSet: 'No cards in this set',
          loadingStatistics: 'Loading statistics...',
          errorLoadingStatistics: 'Error loading statistics'
        }
      }
    }
  }
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

const localStorageMock: Storage = 
{
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

global.localStorage = localStorageMock;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  </BrowserRouter>
);

//Helper function to render component with Router and i18n
const renderWithRouter = (component: React.ReactElement) => 
{
  return render(component, { wrapper: TestWrapper });
};

describe('Statistics Component', () => 
{
    beforeEach(() => 
    {
        vi.clearAllMocks();
        (localStorageMock.getItem as any).mockReturnValue('mock-token');
    });

    it('Renders loading state initially', () => 
    {
        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => (
            {
                totalSets: 0,
                totalFlashcards: 0,
                totalKnownCards: 0,
                totalUnknownCards: 0,
                setStatistics: []
            })
        });

        renderWithRouter(<Statistics />);
        expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
     });

    it('Displays statistics data correctly', async () => 
    {
        const mockData = 
        {
            totalSets: 3,
            totalFlashcards: 15,
            totalKnownCards: 8,
            totalUnknownCards: 7,
            setStatistics: [
                {
                setId: '1',
                setName: 'Polish Basics',
                totalCards: 5,
                knownCards: 3,
                unknownCards: 2
                },
                {
                setId: '2',
                setName: 'English Vocabulary',
                totalCards: 10,
                knownCards: 5,
                unknownCards: 5
                }
            ]
        };

    mockFetch.mockResolvedValueOnce(
    {
      ok: true,
      json: async () => mockData
    });

    renderWithRouter(<Statistics />);

    await waitFor(() => 
    {
      expect(screen.getByText('3')).toBeInTheDocument(); 
      expect(screen.getByText('15')).toBeInTheDocument(); 
      expect(screen.getByText('8')).toBeInTheDocument(); 
      expect(screen.getByText('7')).toBeInTheDocument(); 
    });

    expect(screen.getByText('Polish Basics')).toBeInTheDocument();
    expect(screen.getByText('English Vocabulary')).toBeInTheDocument();

    //Check progress percentage
    expect(screen.getByText('53% mastered')).toBeInTheDocument(); // 8/15
  });

    it('Displays "No sets created yet" when no sets exist', async () => 
    {
        const mockData = 
        {
        totalSets: 0,
        totalFlashcards: 0,
        totalKnownCards: 0,
        totalUnknownCards: 0,
        setStatistics: []
        };

        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => mockData
        });

        renderWithRouter(<Statistics />);

        await waitFor(() => 
        {
            expect(screen.getByText('No sets created yet.')).toBeInTheDocument();
        });
    });

    it('Handles API error gracefully', async () => 
    {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        renderWithRouter(<Statistics />);

        await waitFor(() => {
        expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
        });
    });

    it('Handles HTTP error response', async () => 
    {
        mockFetch.mockResolvedValueOnce(
        {
            ok: false,
            status: 500
        });

        renderWithRouter(<Statistics />);

        await waitFor(() => 
        {
            expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
        });
    });

    it('Displays correct progress bar width', async () => 
    {
        const mockData = 
        {
            totalSets: 1,
            totalFlashcards: 10,
            totalKnownCards: 3,
            totalUnknownCards: 7,
            setStatistics: 
            [
                {
                setId: '1',
                setName: 'Test Set',
                totalCards: 10,
                knownCards: 3,
                unknownCards: 7
                }
            ]
        };

        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => mockData
        });

        renderWithRouter(<Statistics />);

        await waitFor(() => {
        const progressFill = document.querySelector('.progress-fill');
        expect(progressFill).toHaveStyle('width: 30%'); // 3/10 = 30%
        });
    });

    it('Handles sets with zero flashcards', async () => 
    {
        const mockData = 
        {
            totalSets: 1,
            totalFlashcards: 0,
            totalKnownCards: 0,
            totalUnknownCards: 0,
            setStatistics: 
            [
                {
                setId: '1',
                setName: 'Empty Set',
                totalCards: 0,
                knownCards: 0,
                unknownCards: 0
                }
            ]
        };

        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => mockData
        });

        renderWithRouter(<Statistics />);

        await waitFor(() => 
        {
            expect(screen.getByText('Empty Set')).toBeInTheDocument();
            expect(screen.getByText('No cards in this set')).toBeInTheDocument();
            expect(screen.getByText('No flashcards yet')).toBeInTheDocument();
        });
    });

    it('Calculates progress correctly for 100% completion', async () => 
    {
        const mockData = 
        {
            totalSets: 1,
            totalFlashcards: 5,
            totalKnownCards: 5,
            totalUnknownCards: 0,
            setStatistics: 
            [
                {
                setId: '1',
                setName: 'Completed Set',
                totalCards: 5,
                knownCards: 5,
                unknownCards: 0
                }
            ]
        };

        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => mockData
        });

        renderWithRouter(<Statistics />);

        await waitFor(() => 
        {
            expect(screen.getAllByText('100% mastered')).toHaveLength(2); // One for overall, one for the set
            const progressFill = document.querySelector('.progress-fill');
            expect(progressFill).toHaveStyle('width: 100%');
        });
    });

    it('Makes API call with correct authorization header', async () => 
    {
        const mockData = 
        {
            totalSets: 0,
            totalFlashcards: 0,
            totalKnownCards: 0,
            totalUnknownCards: 0,
            setStatistics: []
        };

        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => mockData
        });

        renderWithRouter(<Statistics />);

        await waitFor(() => 
        {
            expect(mockFetch).toHaveBeenCalledWith('/api/statistics', 
            {
                headers: 
                {
                    Authorization: 'Bearer mock-token'
                }
            });
        });
    });

    it('Handles missing token gracefully', async () => 
    {
        (localStorageMock.getItem as any).mockReturnValue(null);

        mockFetch.mockResolvedValueOnce(
        {
            ok: false,
            status: 401
        });

        renderWithRouter(<Statistics />);

        await waitFor(() => 
        {
            expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
        });
    });

    it('Displays correct section titles and labels', async () => 
    {
        const mockData = 
        {
            totalSets: 1,
            totalFlashcards: 5,
            totalKnownCards: 3,
            totalUnknownCards: 2,
            setStatistics: 
            [
                {
                setId: '1',
                setName: 'Test Set',
                totalCards: 5,
                knownCards: 3,
                unknownCards: 2
                }
            ]
        };

        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => mockData
        });

        renderWithRouter(<Statistics />);

        await waitFor(() => 
        {
            // Check main section titles
            expect(screen.getByText('Learning Statistics')).toBeInTheDocument();
            expect(screen.getByText('Learning Progress')).toBeInTheDocument();
            expect(screen.getByText('Breakdown by sets')).toBeInTheDocument();
            
            // Check stat labels
            expect(screen.getByText('Total Sets')).toBeInTheDocument();
            expect(screen.getByText('Total Flashcards')).toBeInTheDocument();
            expect(screen.getByText('Known Cards')).toBeInTheDocument();
            expect(screen.getByText('Not Known Yet')).toBeInTheDocument();
        });
    });

    it('Displays individual set information correctly', async () => 
    {
        const mockData = 
        {
            totalSets: 2,
            totalFlashcards: 15,
            totalKnownCards: 8,
            totalUnknownCards: 7,
            setStatistics: 
            [
                {
                setId: '1',
                setName: 'German Basics',
                totalCards: 8,
                knownCards: 5,
                unknownCards: 3
                },
                {
                setId: '2',
                setName: 'Spanish Verbs',
                totalCards: 7,
                knownCards: 3,
                unknownCards: 4
                }
            ]
        };

        mockFetch.mockResolvedValueOnce(
        {
            ok: true,
            json: async () => mockData
        });

        renderWithRouter(<Statistics />);

        await waitFor(() => 
        {
            // Check set names
            expect(screen.getByText('German Basics')).toBeInTheDocument();
            expect(screen.getByText('Spanish Verbs')).toBeInTheDocument();
            
            // Check individual progress percentages
            expect(screen.getByText('63% mastered')).toBeInTheDocument(); // 5/8 for German Basics
            expect(screen.getByText('43% mastered')).toBeInTheDocument(); // 3/7 for Spanish Verbs
            
            // Check that the sets section contains the expected structure
            const setsSection = screen.getByText('Breakdown by sets');
            expect(setsSection).toBeInTheDocument();
        });
    });
});