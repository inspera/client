import i18next from 'i18next';
import deepmerge from 'deepmerge';

const localStorage = window.localStorage;
const fallbackLanguage = 'en-US';

const languageMapInsperaToIetf = {
  en_us: 'en-US',
  no_no: 'nb-NO',
  no_ny: 'nn-NO',
  no_no_ny: 'nn-NO',
  pl_pl: 'pl-PL',
  sv_se: 'sv-SE',
  es_co: 'es-CO',
  nl_nl: 'nl-NL',
};

const supportedLanguages = {
  'en-US': 'English',
  'nb-NO': 'Norsk - bokmål',
  'nn-NO': 'Norsk - nynorsk',
  'pl-PL': 'Polski',
  'sv-SE': 'Svenska',
  'es-CO': 'Español de América Latina',
  'nl-NL': 'Nederlands',
};

const marketplaceLanguageOverrides = {
  ielts: {
    'en-US': 'en-GB-ielts',
  },

  k12: {
    'en-US': 'en-GB-K12',
    'nn-NO': 'nn-NO-K12',
    'nb-NO': 'nb-NO-K12',
    'sv-SE': 'sv-SE-K12',
  },

  fjord: {
    'en-US': 'en-GB-fjord',
  },
};

const loadResourceBundle = () => {
  return require('../../i18n/index.json');
};

const getIetfLanguageCode = languageCode => {
  if (supportedLanguages[languageCode]) {
    return languageCode;
  }
  if (languageMapInsperaToIetf[languageCode]) {
    return languageMapInsperaToIetf[languageCode];
  }

  return undefined;
};

/**
 * Gets the language code to use for translations.
 * It may be in the languageId param.
 * If not, a fallback language is used.
 */
const getInitialLanguage = () => {
  const languageFromLocalStorage =
    languageMapInsperaToIetf[localStorage.getItem('locale')];
  let locale = fallbackLanguage;
  if (
    languageFromLocalStorage &&
    supportedLanguages[languageFromLocalStorage]
  ) {
    locale = languageFromLocalStorage;
  }

  return locale;
};

const returnTranslationsObject = (defaultLangCode, overrideLangCode) => {
  const resources = loadResourceBundle();

  if (resources[overrideLangCode]) {
    const captionsToOverride = resources[defaultLangCode].translation;
    const overrideCaptions = resources[overrideLangCode].translation;

    resources[defaultLangCode].translation = deepmerge(
      captionsToOverride,
      overrideCaptions
    );
    delete resources[overrideLangCode];

    return resources;
  }

  return resources;
};

const getOverrideLanguageCode = ietfLanguageCode => {
  const uiOverrideLang = localStorage.getItem('uiOverrideLanguage');

  if (uiOverrideLang && marketplaceLanguageOverrides[uiOverrideLang]) {
    return marketplaceLanguageOverrides[uiOverrideLang][ietfLanguageCode];
  }

  return undefined;
};

const buildResourceBundle = ietfLanguageCode => {
  const overrideLanguageCode = getOverrideLanguageCode(ietfLanguageCode);

  return returnTranslationsObject(ietfLanguageCode, overrideLanguageCode);
};

const translate = (key, options) => {
  return i18next.t(key, options);
};

const i18nService = {
  initI18n() {
    const locale = getInitialLanguage();
    const languageCode = getIetfLanguageCode(locale);

    i18next.init({
      resources: buildResourceBundle(languageCode),
      lng: languageCode,
      interpolation: { prefix: '__', suffix: '__' },
    });
  },

  changeLanguage(language, callback) {
    const langCode = getIetfLanguageCode(language);
    const resources = buildResourceBundle(langCode);
    i18next.addResourceBundle(language, 'translation', resources, true, true);
    i18next.changeLanguage(language, callback);
  },
};

export default i18nService;

export function t(key, options, fallback) {
  if (fallback && !i18next.exists(key)) {
    return fallback;
  }
  return translate(key, options);
}
