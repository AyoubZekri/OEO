import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import arTranslation from './ar/translation.json';
import enTranslation from './en/translation.json';

const resources = {
  ar: {
    translation: arTranslation,
  },
  en: {
    translation: enTranslation,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
