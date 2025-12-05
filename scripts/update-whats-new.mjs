import fs from 'node:fs';
import { AppStoreConnectClient } from '../dist/src/services/appstore-client.js';
import { LocalizationHandlers } from '../dist/src/handlers/localizations.js';

const translations = JSON.parse(
  fs.readFileSync(new URL('./whats-new-translations.json', import.meta.url), 'utf8')
);

const requiredEnvVars = [
  'APP_STORE_CONNECT_KEY_ID',
  'APP_STORE_CONNECT_ISSUER_ID',
  'APP_STORE_CONNECT_P8_PATH'
];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

const config = {
  keyId: process.env.APP_STORE_CONNECT_KEY_ID,
  issuerId: process.env.APP_STORE_CONNECT_ISSUER_ID,
  privateKeyPath: process.env.APP_STORE_CONNECT_P8_PATH,
  vendorNumber: process.env.APP_STORE_CONNECT_VENDOR_NUMBER
};

const client = new AppStoreConnectClient(config);
const localizationHandlers = new LocalizationHandlers(client);

const APP_ID = '656212466';
const TARGET_VERSION = '2025.12.1';
const ENGLISH_TEXT = 'This is a minor update to keep the app running smoothly. Please reach us at support@getwardrobe.com if you need support.';
const ENGLISH_LOCALES = new Set(['en-US', 'en-GB', 'en-CA', 'en-AU']);

const main = async () => {
  const results = [];
  const versions = await localizationHandlers.listAppStoreVersions({
    appId: APP_ID,
    filter: { versionString: TARGET_VERSION },
    limit: 10
  });

  for (const version of versions.data) {
    const platform = version.attributes.platform;
    const locs = await localizationHandlers.listAppStoreVersionLocalizations({
      appStoreVersionId: version.id,
      limit: 200
    });

    for (const localization of locs.data) {
      const locale = localization.attributes.locale;
      const targetText = ENGLISH_LOCALES.has(locale)
        ? ENGLISH_TEXT
        : translations[locale] ?? ENGLISH_TEXT;

      if (!targetText) {
        console.warn(`Skipping ${platform} ${locale} - missing translation`);
        continue;
      }

      if (localization.attributes.whatsNew === targetText) {
        console.log(`No change needed for ${platform} ${locale}`);
        continue;
      }

      await localizationHandlers.updateAppStoreVersionLocalization({
        localizationId: localization.id,
        field: 'whatsNew',
        value: targetText
      });

      results.push({ platform, locale, localizationId: localization.id });
      console.log(`Updated ${platform} ${locale}`);
    }
  }

  console.log(`\nUpdated ${results.length} localizations`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
