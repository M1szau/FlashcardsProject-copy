import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './src/languages/en.json';
import pl from './src/languages/pl.json';
import de from './src/languages/de.json';

const resources = 
{
  en: 
  {
    translation: en
  },
  pl: 
  {
    translation: pl
  },    
  de: 
  {
    translation: de
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('selectedLanguage') || 'en',
    fallbackLng: 'en',
    interpolation: 
    {
      escapeValue: false
    }
  });

export default i18n;