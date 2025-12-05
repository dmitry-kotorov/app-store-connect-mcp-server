import fs from 'node:fs';

const text = "This is a minor update to keep the app running smoothly. Please reach us at support@getwardrobe.com if you need support.";

const localeToLang = {
  'fr-FR': 'fr',
  'hi': 'hi',
  'es-ES': 'es',
  'it': 'it',
  'ca': 'ca',
  'en-CA': 'en',
  'en-AU': 'en',
  'es-MX': 'es',
  'ja': 'ja',
  'nl-NL': 'nl',
  'uk': 'uk',
  'pt-BR': 'pt',
  'da': 'da',
  'zh-Hant': 'zh-TW',
  'pt-PT': 'pt-PT',
  'en-GB': 'en',
  'de-DE': 'de',
  'ar-SA': 'ar',
  'fr-CA': 'fr',
  'ru': 'ru',
  'vi': 'vi',
  'no': 'no',
  'ro': 'ro',
  'th': 'th',
  'hr': 'hr',
  'ko': 'ko',
  'sk': 'sk',
  'el': 'el',
  'cs': 'cs',
  'zh-Hans': 'zh-CN',
  'fi': 'fi',
  'hu': 'hu',
  'ms': 'ms',
  'sv': 'sv',
  'he': 'he',
  'id': 'id',
  'tr': 'tr',
  'pl': 'pl'
};

const locales = Array.from(new Set(Object.keys(localeToLang)));

const englishText = text;

async function translate(langCode) {
  if (langCode === 'en') {
    return englishText;
  }
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(langCode)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Translation failed for ${langCode}: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data[0].map((segment) => segment[0]).join('');
}

const main = async () => {
  const translations = {};
  for (const locale of locales) {
    const lang = localeToLang[locale];
    translations[locale] = await translate(lang);
    console.log(`${locale} => ${translations[locale]}`);
  }
  fs.writeFileSync('scripts/whats-new-translations.json', JSON.stringify(translations, null, 2), 'utf8');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
