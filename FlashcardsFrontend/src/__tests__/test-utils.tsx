import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { vi } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import { SetsProvider } from '../contexts/SetsContext';
import { FlashcardsProvider } from '../contexts/FlashcardsContext';

export const mockLocalStorage = 
{
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

global.fetch = vi.fn();

Object.defineProperty(window, 'localStorage', 
{
  value: mockLocalStorage,
});

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
        // Common translations for testing
        navbar: {
          appName: "Flashcards",
          learn: "Learn",
          statistics: "Statistics",
          logout: "Log out"
        },
        addFlashcard: {
          addNewFlashcard: 'Add new flashcard',
          content: 'Content',
          translation: 'Translation',
          language: 'Language',
          translationLanguage: 'Translation Language',
          listLanguage: 'Select language',
          listTranslationLanguage: 'Select translation language',
          save: 'Save',
          cancel: 'Cancel'
        },
        languages: {
          PL: 'Polish',
          EN: 'English', 
          DE: 'German',
          ES: 'Spanish'
        },
        dashboard: {
          characters: 'characters'
        },
        flashcards: {
          alreadyKnown: 'Already Known',
          notKnownYet: 'Not Known Yet'
        },
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
        },
        learnForm: {
          loadingSets: "Loading your sets...",
          title: "Learn Flashcards",
          selectSet: "Select set",
          chooseSetPlaceholder: "Choose set to learn",
          learningMode: "Learning mode",
          practiceAll: "Practice all cards",
          practiceUnknown: "Practice unknown cards",
          startLearning: "Start Learning",
          noSetsCreated: "No sets created yet.",
          noSetsMessage: "No sets created yet.",
          selectSetError: "Please select a set to learn from."
        }
      }
    }
  }
});

interface RenderOptions 
{
  initialToken?: string | null;
  initialUser?: { username: string };
  initialRoute?: string;
  includeFlashcardsProvider?: boolean;
  includeSetsProvider?: boolean;
}

export const renderWithProviders = (
  component: ReactElement, 
  options: RenderOptions = {}
) => {
  const 
  {
    initialToken = 'mock-token',
    initialUser = { username: 'testuser' },
    initialRoute = '/',
    includeFlashcardsProvider = false,
    includeSetsProvider = false
  } = options;

  mockLocalStorage.getItem.mockImplementation((key: string) => 
  {
    if (key === 'token') return initialToken;
    if (key === 'username') return initialUser.username;
    return null;
  });

  let wrappedComponent = (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <I18nextProvider i18n={i18n}>
          {component}
        </I18nextProvider>
      </AuthProvider>
    </MemoryRouter>
  );

  if (includeSetsProvider) 
{
    wrappedComponent = (
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <SetsProvider>
            <I18nextProvider i18n={i18n}>
              {component}
            </I18nextProvider>
          </SetsProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  }

  if (includeFlashcardsProvider) 
  {
    wrappedComponent = (
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <SetsProvider>
            <FlashcardsProvider>
              <I18nextProvider i18n={i18n}>
                {component}
              </I18nextProvider>
            </FlashcardsProvider>
          </SetsProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  }

  return render(wrappedComponent);
};

export const setupLocalStorageMock = (options: RenderOptions = {}) => 
{
  const 
  {
    initialToken = 'mock-token',
    initialUser = { username: 'testuser' }
  } = options;

  mockLocalStorage.getItem.mockImplementation((key: string) => 
  {
    if (key === 'token') return initialToken;
    if (key === 'username') return initialUser.username;
    return null;
  });
};
