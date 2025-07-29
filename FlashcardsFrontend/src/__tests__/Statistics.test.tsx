import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Statistics from '../components/Statistics';

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

//Helper function to render component with Router
const renderWithRouter = (component: React.ReactElement) => 
{
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
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
        expect(screen.getByText('Error loading statistics.')).toBeInTheDocument();
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
            expect(screen.getByText('Error loading statistics.')).toBeInTheDocument();
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
            expect(screen.getByText('Error loading statistics.')).toBeInTheDocument();
        });
    });
});