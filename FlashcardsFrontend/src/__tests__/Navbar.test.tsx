import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Navbar from '../components/Navbar';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { AuthProvider } from '../contexts/AuthContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Setup i18n for testing
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
        navbar: 
        {
          appName: "Flashcards",
          learn: "Learn",
          statistics: "Statistics",
          logout: "Log out",
          language: "Language"
        }
      }
    }
  }
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <AuthProvider>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </AuthProvider>
  </MemoryRouter>
);

const navigateMock = vi.fn();

beforeEach(() => 
{
  //Force language to 'en' for consistent testing
  i18n.changeLanguage('en');
  
  // Set default localStorage values
  mockLocalStorage.getItem.mockImplementation((key: string) => {
    if (key === 'token') return 'mock-token';
    if (key === 'username') return 'testuser';
    return null;
  });
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

describe('Navbar component', () =>
{
    it('Renders Logo and buttons', () =>
    {
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );

        //Logo check
        expect(screen.getByText('Flashcards')).toBeInTheDocument();

        //Buttons check
        expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Statistics' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();

        //Check if the logo is clickable and navigates to /dashboard
        const logo = screen.getByText('Flashcards');
        logo.click();
        expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });

    it('Navigates to /learnForm when Learn button is clicked', () => 
    {
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Learn' }));
        expect(navigateMock).toHaveBeenCalledWith('/learnForm');
    });

    it('Navigates to /statistics when Statistics button is clicked', () => 
    {
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Statistics' }));
        expect(navigateMock).toHaveBeenCalledWith('/statistics');
    });

    it('Navigates to /login when Log out button is clicked', () => 
    {
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
        expect(navigateMock).toHaveBeenCalledWith('/login');
    });

    it('Removes token from localStorage when Log out is clicked', () => 
    {
        const removeItemMock = vi.spyOn(window.localStorage, 'removeItem');
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
        expect(removeItemMock).toHaveBeenCalledWith('token');
        removeItemMock.mockRestore();
    });

    it('Reloads page when logo is clicked on /dashboard', () => 
    {
        const reloadMock = vi.fn();
        Object.defineProperty(window, 'location', 
        {
            value: { pathname: '/dashboard', reload: reloadMock },
            writable: true,
        });
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        fireEvent.click(screen.getByText('Flashcards'));
        expect(reloadMock).toHaveBeenCalled();
    });

    it('Displays language selector with current language', () => 
    {
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        
        //Check if language selector shows current language (EN by default)
        expect(screen.getByText('EN')).toBeInTheDocument();
        expect(screen.getByText('EN').closest('button')).toBeInTheDocument();
    });

    it('Shows language dropdown on hover', () => 
    {
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        
        const languageButton = screen.getByText('EN').closest('button')!;
        
        fireEvent.mouseEnter(languageButton);
        
        expect(screen.getByText('PL')).toBeInTheDocument();
        expect(screen.getByText('DE')).toBeInTheDocument();
    });

    it('Changes language when language option is clicked', () => 
    {
        const changeLanguageSpy = vi.spyOn(i18n, 'changeLanguage');
        const setItemSpy = vi.spyOn(localStorage, 'setItem');
        
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        
        const languageButton = screen.getByText('EN').closest('button')!;
        
        //Dropdown
        fireEvent.mouseEnter(languageButton);
        
        //Click on Polish language option
        fireEvent.click(screen.getByText('PL'));
        
        expect(changeLanguageSpy).toHaveBeenCalledWith('pl');
        expect(setItemSpy).toHaveBeenCalledWith('selectedLanguage', 'pl');
        
        changeLanguageSpy.mockRestore();
        setItemSpy.mockRestore();
    });

    it('Toggles language dropdown when language button is clicked', () => 
    {
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        
        const languageButton = screen.getByText('EN').closest('button')!;
        
        // Initially dropdown should not be visible
        expect(screen.queryByText('PL')).not.toBeInTheDocument();
        
        // Click to show dropdown
        fireEvent.click(languageButton);
        expect(screen.getByText('PL')).toBeInTheDocument();
        expect(screen.getByText('DE')).toBeInTheDocument();
        
        // Click again to hide dropdown
        fireEvent.click(languageButton);
        expect(screen.queryByText('PL')).not.toBeInTheDocument();
        expect(screen.queryByText('DE')).not.toBeInTheDocument();
    });

    it('Closes language dropdown when mouse leaves dropdown area', () => 
    {
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        
        const languageButton = screen.getByText('EN').closest('button')!;
        
        // Show dropdown
        fireEvent.mouseEnter(languageButton);
        expect(screen.getByText('PL')).toBeInTheDocument();
        
        // Get the dropdown element and trigger mouse leave
        const dropdown = screen.getByText('PL').closest('.languageDropdown');
        expect(dropdown).toBeInTheDocument();
        
        fireEvent.mouseLeave(dropdown!);
        
        // Dropdown should be hidden after mouse leave
        expect(screen.queryByText('PL')).not.toBeInTheDocument();
    });

    it('Closes language dropdown when clicking outside', () => 
    {
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        
        const languageButton = screen.getByText('EN').closest('button')!;
        
        // Show dropdown
        fireEvent.click(languageButton);
        expect(screen.getByText('PL')).toBeInTheDocument();
        
        // Click outside the dropdown (on document body)
        fireEvent.mouseDown(document.body);
        
        // Dropdown should be closed
        expect(screen.queryByText('PL')).not.toBeInTheDocument();
    });

    it('Highlights current language as active in dropdown', () => 
    {
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        
        const languageButton = screen.getByText('EN').closest('button')!;
        
        // Show dropdown
        fireEvent.mouseEnter(languageButton);
        
        // Find all language options
        const languageOptions = screen.getAllByRole('button');
        const enOption = languageOptions.find(button => button.textContent?.includes('EN') && button !== languageButton);
        
        expect(enOption).toBeInTheDocument();
        expect(enOption).toHaveClass('active');
    });

    it('Shows correct flag icon for current language', () => 
    {
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        
        // Check if flag icon is present (GB flag for EN language)
        const languageButton = screen.getByText('EN').closest('button')!;
        const flagIcon = languageButton.querySelector('.flagIcon');
        
        expect(flagIcon).toBeInTheDocument();
        expect(languageButton).toHaveTextContent('EN');
    });

    it('Closes dropdown when language is changed', () => 
    {
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        
        const languageButton = screen.getByText('EN').closest('button')!;
        
        // Show dropdown
        fireEvent.mouseEnter(languageButton);
        expect(screen.getByText('PL')).toBeInTheDocument();
        
        // Click on a language option
        fireEvent.click(screen.getByText('DE'));
        
        // Dropdown should be closed after language selection
        expect(screen.queryByText('PL')).not.toBeInTheDocument();
    });

    it('Falls back to default language when current language is not in supported languages', () => 
    {
        // Set i18n to an unsupported language
        i18n.changeLanguage('fr'); // French is not in our supported languages
        
        render(
            <TestWrapper>
                <Navbar />
            </TestWrapper>
        );
        
        // Should fall back to first language in array (EN)
        const languageButton = screen.getByText('EN').closest('button')!;
        expect(languageButton).toBeInTheDocument();
        expect(languageButton).toHaveTextContent('EN');
        
        // Reset language for other tests
        i18n.changeLanguage('en');
    });

    // Mobile Navigation Tests
    describe('Mobile Navigation', () => {
        beforeEach(() => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 600,
            });
        });

        it('Shows mobile menu button on mobile viewport', () => {
            render(
                <TestWrapper>
                    <Navbar />
                </TestWrapper>
            );

            const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
            expect(mobileMenuButton).toBeInTheDocument();
        });

        it('Initially hides mobile navigation menu', () => {
            render(
                <TestWrapper>
                    <Navbar />
                </TestWrapper>
            );

            // Mobile navigation should not be visible initially
            expect(screen.queryByText('Language:')).not.toBeInTheDocument();
        });

        it('Shows mobile navigation menu when mobile menu button is clicked', () => {
            render(
                <TestWrapper>
                    <Navbar />
                </TestWrapper>
            );

            const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
            fireEvent.click(mobileMenuButton);

            // Check if mobile menu items are visible
            const mobileLearnButtons = screen.getAllByText('Learn');
            const mobileStatisticsButtons = screen.getAllByText('Statistics');
            const mobileLogoutButtons = screen.getAllByText('Log out');
            
            expect(mobileLearnButtons.length).toBeGreaterThan(1); // Desktop + Mobile
            expect(mobileStatisticsButtons.length).toBeGreaterThan(1);
            expect(mobileLogoutButtons.length).toBeGreaterThan(1);
            expect(screen.getByText('Language:')).toBeInTheDocument();
        });

        it('Hides mobile navigation menu when mobile menu button is clicked again', () => {
            render(
                <TestWrapper>
                    <Navbar />
                </TestWrapper>
            );

            const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
            
            // Show menu
            fireEvent.click(mobileMenuButton);
            expect(screen.getByText('Language:')).toBeInTheDocument();
            
            // Hide menu
            fireEvent.click(mobileMenuButton);
            expect(screen.queryByText('Language:')).not.toBeInTheDocument();
        });

        it('Navigates correctly when mobile Learn button is clicked', () => {
            render(
                <TestWrapper>
                    <Navbar />
                </TestWrapper>
            );

            const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
            fireEvent.click(mobileMenuButton);

            // Find mobile navigation buttons (excluding desktop ones)
            const learnButtons = screen.getAllByText('Learn');
            const mobileLearnButton = learnButtons.find(button => 
                button.closest('.mobileNav')
            );

            expect(mobileLearnButton).toBeInTheDocument();
            fireEvent.click(mobileLearnButton!);
            expect(navigateMock).toHaveBeenCalledWith('/learnForm');
        });

        it('Navigates correctly when mobile Statistics button is clicked', () => {
            render(
                <TestWrapper>
                    <Navbar />
                </TestWrapper>
            );

            const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
            fireEvent.click(mobileMenuButton);

            const statisticsButtons = screen.getAllByText('Statistics');
            const mobileStatisticsButton = statisticsButtons.find(button => 
                button.closest('.mobileNav')
            );

            expect(mobileStatisticsButton).toBeInTheDocument();
            fireEvent.click(mobileStatisticsButton!);
            expect(navigateMock).toHaveBeenCalledWith('/statistics');
        });

        it('Logs out correctly when mobile logout button is clicked', () => {
            const removeItemMock = vi.spyOn(window.localStorage, 'removeItem');
            
            render(
                <TestWrapper>
                    <Navbar />
                </TestWrapper>
            );

            const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
            fireEvent.click(mobileMenuButton);

            const logoutButtons = screen.getAllByText('Log out');
            const mobileLogoutButton = logoutButtons.find(button => 
                button.closest('.mobileNav')
            );

            expect(mobileLogoutButton).toBeInTheDocument();
            fireEvent.click(mobileLogoutButton!);
            
            expect(removeItemMock).toHaveBeenCalledWith('token');
            expect(navigateMock).toHaveBeenCalledWith('/login');
            
            removeItemMock.mockRestore();
        });

        it('Changes language correctly when mobile language option is clicked', () => {
            const changeLanguageSpy = vi.spyOn(i18n, 'changeLanguage');
            const setItemSpy = vi.spyOn(localStorage, 'setItem');
            
            render(
                <TestWrapper>
                    <Navbar />
                </TestWrapper>
            );

            const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
            fireEvent.click(mobileMenuButton);

            // Find mobile language buttons
            const languageButtons = screen.getAllByText('PL');
            const mobileLanguageButton = languageButtons.find(button => 
                button.closest('.mobileNav')
            );

            expect(mobileLanguageButton).toBeInTheDocument();
            fireEvent.click(mobileLanguageButton!);

            expect(changeLanguageSpy).toHaveBeenCalledWith('pl');
            expect(setItemSpy).toHaveBeenCalledWith('selectedLanguage', 'pl');
            
            changeLanguageSpy.mockRestore();
            setItemSpy.mockRestore();
        });

        it('Closes mobile menu when window is resized to desktop size', () => {
            render(
                <TestWrapper>
                    <Navbar />
                </TestWrapper>
            );

            const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
            fireEvent.click(mobileMenuButton);

            // Verify mobile menu is open
            expect(screen.getByText('Language:')).toBeInTheDocument();

            // Simulate window resize to desktop size
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 800,
            });
            
            fireEvent(window, new Event('resize'));

            // Mobile menu should close automatically
            expect(screen.queryByText('Language:')).not.toBeInTheDocument();
        });

        it('Closes mobile menu when navigation button is clicked', () => {
            render(
                <TestWrapper>
                    <Navbar />
                </TestWrapper>
            );

            const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
            fireEvent.click(mobileMenuButton);

            // Verify mobile menu is open
            expect(screen.getByText('Language:')).toBeInTheDocument();

            // Click a navigation button
            const learnButtons = screen.getAllByText('Learn');
            const mobileLearnButton = learnButtons.find(button => 
                button.closest('.mobileNav')
            );
            fireEvent.click(mobileLearnButton!);

            // Mobile menu should close after navigation
            expect(screen.queryByText('Language:')).not.toBeInTheDocument();
        });
    });

});
