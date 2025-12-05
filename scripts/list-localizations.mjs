import { AppStoreConnectClient } from '../dist/src/services/appstore-client.js';
import { LocalizationHandlers } from '../dist/src/handlers/localizations.js';

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
const TARGET_VERSION = process.argv[2] ?? '2025.12.1';

const toKey = (locale) => locale;

const main = async () => {
  const versions = await localizationHandlers.listAppStoreVersions({
    appId: APP_ID,
    filter: { versionString: TARGET_VERSION },
    limit: 10
  });

  for (const version of versions.data) {
    console.log(`\nPlatform: ${version.attributes.platform}`);
    const locs = await localizationHandlers.listAppStoreVersionLocalizations({
      appStoreVersionId: version.id,
      limit: 200
    });

    for (const localization of locs.data) {
      console.log(
        `${toKey(localization.attributes.locale)} | ${localization.id} | ${localization.attributes.whatsNew ?? '<empty>'}`
      );
    }
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
