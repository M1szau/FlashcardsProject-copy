import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Statistics from '../components/Statistics';
import { renderWithProviders } from './test-utils';
import type { Statistics as StatisticsType } from '../types and interfaces/types';


vi.mock('../components/Navbar', () => 
({
    default: () => <nav data-testid="navbar">Navbar</nav>
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockStatisticsData: StatisticsType = 
{
    totalSets: 3,
    totalFlashcards: 15,
    totalKnownCards: 8,
    totalUnknownCards: 7,
    setStatistics: [
        {
            setId: '1',
            setName: 'Spanish Basics',
            totalCards: 10,
            knownCards: 6,
            unknownCards: 4
        },
        {
            setId: '2', 
            setName: 'German Verbs',
            totalCards: 5,
            knownCards: 2,
            unknownCards: 3
        },
        {
            setId: '3',
            setName: 'Empty Set',
            totalCards: 0,
            knownCards: 0,
            unknownCards: 0
        }
    ]
};

const emptyStatisticsData: StatisticsType = 
{
    totalSets: 0,
    totalFlashcards: 0,
    totalKnownCards: 0,
    totalUnknownCards: 0,
    setStatistics: []
};

describe('Statistics Component', () => 
{
    beforeEach(() => 
    {
        vi.clearAllMocks();
        mockFetch.mockClear();
    });

    afterEach(() => 
    {
        vi.clearAllMocks();
    });

    // Component Structure Tests
    describe('Component Structure', () => 
    {
        it('renders navbar component', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('navbar')).toBeInTheDocument();
            });
        });

        it('renders statistics title', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('Learning Statistics')).toBeInTheDocument();
            });
        });

        it('renders all overview stat cards', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('Total Sets')).toBeInTheDocument();
                expect(screen.getByText('Total Flashcards')).toBeInTheDocument();
                expect(screen.getByText('Known Cards')).toBeInTheDocument();
                expect(screen.getByText('Not Known Yet')).toBeInTheDocument();
            });
        });
    });

    describe('Loading State', () => 
    {
        it('displays loading message initially', () => 
        {
            mockFetch.mockImplementation(() => new Promise(() => {}));

            renderWithProviders(<Statistics />);

            expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
            expect(screen.getByTestId('navbar')).toBeInTheDocument();
        });

        it('does not show statistics content while loading', () => 
        {
            mockFetch.mockImplementation(() => new Promise(() => {})); 

            renderWithProviders(<Statistics />);

            expect(screen.queryByText('Learning Statistics')).not.toBeInTheDocument();
            expect(screen.queryByText('Total Sets')).not.toBeInTheDocument();
        });
    });

    //Error State 
    describe('Error State', () => 
    {
        it('displays error message when API call fails', async () => 
        {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
            });
        });

        it('displays error message when API returns non-ok status', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: false,
                status: 500,
                json: async () => ({ error: 'Server error' })
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
            });
        });

        it('renders navbar even in error state', async () => 
        {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByTestId('navbar')).toBeInTheDocument();
            });
        });
    });

    //Statistics Display 
    describe('Statistics Display', () => 
    {
        it('displays correct overview statistics', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('3')).toBeInTheDocument();
                expect(screen.getByText('15')).toBeInTheDocument();
                expect(screen.getByText('8')).toBeInTheDocument();
                expect(screen.getByText('7')).toBeInTheDocument(); 
            });
        });

        it('displays zero statistics correctly', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => emptyStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                const zeroElements = screen.getAllByText('0');
                expect(zeroElements).toHaveLength(4); 
            });
        });

        it('displays learning progress section', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('Learning Progress')).toBeInTheDocument();
            });
        });

        it('displays breakdown by sets section', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('Breakdown by sets')).toBeInTheDocument();
            });
        });
    });

    //Progress Bar
    describe('Progress Bar Calculations', () => 
    {
        it('calculates and displays correct progress percentage', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('53% mastered')).toBeInTheDocument();
            });
        });

        it('handles zero flashcards scenario', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => emptyStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('No flashcards yet')).toBeInTheDocument();
            });
        });

        it('renders progress bar with correct width', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                const progressBar = document.querySelector('.progress-fill');
                expect(progressBar).toHaveStyle('width: 53.333333333333336%');
            });
        });
    });

    //Set Statistics
    describe('Set Statistics', () => 
    {
        it('displays all set names', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
                expect(screen.getByText('German Verbs')).toBeInTheDocument();
                expect(screen.getByText('Empty Set')).toBeInTheDocument();
            });
        });

        it('displays correct statistics for each set', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('Total: 10')).toBeInTheDocument();
                expect(screen.getByText('Known: 6')).toBeInTheDocument();
                expect(screen.getByText('Unknown: 4')).toBeInTheDocument();

                expect(screen.getByText('Total: 5')).toBeInTheDocument();
                expect(screen.getByText('Known: 2')).toBeInTheDocument();
                expect(screen.getByText('Unknown: 3')).toBeInTheDocument();
            });
        });

        it('calculates correct progress for each set', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('60% mastered')).toBeInTheDocument();
                expect(screen.getByText('40% mastered')).toBeInTheDocument();
                expect(screen.getByText('No cards in this set')).toBeInTheDocument();
            });
        });

        it('displays no sets message when no sets exist', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => emptyStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('No sets created yet.')).toBeInTheDocument();
            });
        });

        it('renders progress bars for each set with correct width', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                const progressBars = document.querySelectorAll('.set-progress-fill');
                
                expect(progressBars[0]).toHaveStyle('width: 60%');
                expect(progressBars[1]).toHaveStyle('width: 40%');
                expect(progressBars[2]).toHaveStyle('width: 0%');
            });
        });
    });

    //CSS Classes
    describe('CSS Classes and Styling', () => 
    {
        it('applies correct CSS classes to overview cards', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                const statCards = document.querySelectorAll('.stat-card');
                expect(statCards).toHaveLength(4);
                
                expect(statCards[2]).toHaveClass('known');
                expect(statCards[3]).toHaveClass('unknown');
            });
        });

        it('applies correct container classes', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(document.querySelector('.statistics-container')).toBeInTheDocument();
                expect(document.querySelector('.statistics-overview')).toBeInTheDocument();
                expect(document.querySelector('.learning-progress')).toBeInTheDocument();
                expect(document.querySelector('.sets-breakdown')).toBeInTheDocument();
            });
        });
    });

    //API Integration 
    describe('API Integration', () => 
    {
        it('makes API call with authorization header', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalledWith('/api/statistics', 
                    expect.objectContaining(
                    {
                        headers: expect.objectContaining(
                        {
                            Authorization: expect.stringContaining('Bearer')
                        })
                    })
                );
            });
        });

        it('handles missing token gracefully', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />, { initialToken: null });

            await waitFor(() => 
            {
                expect(mockFetch).toHaveBeenCalledWith('/api/statistics', 
                {
                    headers: 
                    {
                        Authorization: 'Bearer null'
                    }
                });
            });
        });
    });

    //Edge Cases
    describe('Edge Cases', () => 
    {
        it('handles network timeout gracefully', async () => 
        {
            mockFetch.mockImplementation(() => 
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 100)
                )
            );

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
            });
        });

        it('handles sets with high percentage values', async () => 
        {
            const highPercentageData: StatisticsType = 
            {
                totalSets: 1,
                totalFlashcards: 100,
                totalKnownCards: 100,
                totalUnknownCards: 0,
                setStatistics: [
                    {
                        setId: '1',
                        setName: 'Complete Set',
                        totalCards: 100,
                        knownCards: 100,
                        unknownCards: 0
                    }
                ]
            };

            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => highPercentageData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                const masteredTexts = screen.getAllByText('100% mastered');
                expect(masteredTexts).toHaveLength(2); 
            });
        });

        it('renders correctly with single set', async () => 
        {
            const singleSetData: StatisticsType = 
            {
                totalSets: 1,
                totalFlashcards: 5,
                totalKnownCards: 3,
                totalUnknownCards: 2,
                setStatistics: [
                    {
                        setId: '1',
                        setName: 'Only Set',
                        totalCards: 5,
                        knownCards: 3,
                        unknownCards: 2
                    }
                ]
            };

            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => singleSetData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('Only Set')).toBeInTheDocument();
                expect(screen.getByText('Total: 5')).toBeInTheDocument();
                expect(screen.getByText('Known: 3')).toBeInTheDocument();
                expect(screen.getByText('Unknown: 2')).toBeInTheDocument();
                
                const masteredTexts = screen.getAllByText('60% mastered');
                expect(masteredTexts).toHaveLength(2); 
            });
        });
    });

    //Component Lifecycle 
    describe('Component Lifecycle', () => 
    {
        it('fetches statistics on component mount', () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('does not refetch on re-render without dependency changes', async () => 
        {
            mockFetch.mockResolvedValueOnce(
            {
                ok: true,
                json: async () => mockStatisticsData
            });

            renderWithProviders(<Statistics />);

            await waitFor(() => 
            {
                expect(screen.getByText('Learning Statistics')).toBeInTheDocument();
            });

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });
});
