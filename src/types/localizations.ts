// App Store Version Localization Types

export interface AppStoreVersionLocalization {
  id: string;
  type: 'appStoreVersionLocalizations';
  attributes: {
    description?: string;
    keywords?: string;
    locale: string;
    marketingUrl?: string;
    promotionalText?: string;
    supportUrl?: string;
    whatsNew?: string;
  };
  relationships?: {
    appStoreVersion?: {
      data: {
        type: 'appStoreVersions';
        id: string;
      };
    };
  };
}

export interface ListAppStoreVersionLocalizationsResponse {
  data: AppStoreVersionLocalization[];
  links?: {
    self: string;
    next?: string;
  };
  meta?: {
    paging: {
      total: number;
      limit: number;
    };
  };
}

export type AppStoreVersionLocalizationFieldOption =
  | 'description'
  | 'keywords'
  | 'locale'
  | 'marketingUrl'
  | 'promotionalText'
  | 'supportUrl'
  | 'whatsNew';

export interface ListAppStoreVersionLocalizationsParams {
  appStoreVersionId: string;
  limit?: number;
  filter?: {
    locale?: string;
  };
  fields?: {
    appStoreVersionLocalizations?: AppStoreVersionLocalizationFieldOption[];
  };
}

export interface AppStoreVersionLocalizationResponse {
  data: AppStoreVersionLocalization;
  included?: any[];
  links?: {
    self: string;
  };
}

export interface AppStoreVersionLocalizationUpdateRequest {
  data: {
    type: 'appStoreVersionLocalizations';
    id: string;
    attributes: {
      description?: string;
      keywords?: string;
      marketingUrl?: string;
      promotionalText?: string;
      supportUrl?: string;
      whatsNew?: string;
    };
  };
}

export type AppStoreVersionLocalizationField = 
  | 'description'
  | 'keywords' 
  | 'marketingUrl'
  | 'promotionalText'
  | 'supportUrl'
  | 'whatsNew';

export interface AppStoreVersion {
  id: string;
  type: 'appStoreVersions';
  attributes: {
    platform: string;
    versionString?: string;
    appStoreState?: string;
    copyright?: string;
    releaseType?: string;
    earliestReleaseDate?: string;
    downloadable?: boolean;
    createdDate?: string;
  };
  relationships?: {
    app?: {
      data: {
        type: 'apps';
        id: string;
      };
    };
    appStoreVersionLocalizations?: {
      data: Array<{
        type: 'appStoreVersionLocalizations';
        id: string;
      }>;
    };
  };
}

export interface ListAppStoreVersionsResponse {
  data: AppStoreVersion[];
  links?: {
    self: string;
    next?: string;
  };
  meta?: {
    paging: {
      total: number;
      limit: number;
    };
  };
}

export interface AppStoreVersionCreateRequest {
  data: {
    type: 'appStoreVersions';
    attributes: {
      platform: 'IOS' | 'MAC_OS' | 'TV_OS' | 'VISION_OS';
      versionString: string;
      copyright?: string;
      releaseType?: 'MANUAL' | 'AFTER_APPROVAL' | 'SCHEDULED';
      earliestReleaseDate?: string; // ISO 8601 date string
    };
    relationships: {
      app: {
        data: {
          type: 'apps';
          id: string;
        };
      };
      build?: {
        data: {
          type: 'builds';
          id: string;
        };
      };
    };
  };
}

export interface AppStoreVersionResponse {
  data: AppStoreVersion;
  included?: any[];
  links?: {
    self: string;
  };
}

// App Info Localization Types

export interface AppInfoLocalization {
  id: string;
  type: 'appInfoLocalizations';
  attributes: {
    locale: string;
    name?: string;
    subtitle?: string;
    privacyPolicyUrl?: string;
    privacyChoicesUrl?: string;
    privacyPolicyText?: string;
  };
  relationships?: {
    appInfo?: {
      data: {
        type: 'appInfos';
        id: string;
      };
    };
  };
}

export interface ListAppInfoLocalizationsResponse {
  data: AppInfoLocalization[];
  links?: {
    self: string;
    next?: string;
  };
  meta?: {
    paging: {
      total: number;
      limit: number;
    };
  };
}

export interface AppInfoLocalizationResponse {
  data: AppInfoLocalization;
  included?: any[];
  links?: {
    self: string;
  };
}

export interface AppInfoLocalizationUpdateRequest {
  data: {
    type: 'appInfoLocalizations';
    id: string;
    attributes: {
      name?: string;
      subtitle?: string;
      privacyPolicyUrl?: string;
      privacyChoicesUrl?: string;
      privacyPolicyText?: string;
    };
  };
}

export type AppInfoLocalizationField =
  | 'name'
  | 'subtitle'
  | 'privacyPolicyUrl'
  | 'privacyChoicesUrl'
  | 'privacyPolicyText';

export type AppInfoLocalizationFieldOption =
  | 'locale'
  | 'name'
  | 'subtitle'
  | 'privacyPolicyUrl'
  | 'privacyChoicesUrl'
  | 'privacyPolicyText';

// App Info Types

export interface AppInfo {
  id: string;
  type: 'appInfos';
  attributes: {
    appStoreState?: string;
    appStoreAgeRating?: string;
    brazilAgeRating?: string;
    kidsAgeBand?: string;
  };
  relationships?: {
    app?: {
      data: {
        type: 'apps';
        id: string;
      };
    };
    appInfoLocalizations?: {
      data: Array<{
        type: 'appInfoLocalizations';
        id: string;
      }>;
    };
  };
}

export interface ListAppInfosResponse {
  data: AppInfo[];
  links?: {
    self: string;
    next?: string;
  };
  meta?: {
    paging: {
      total: number;
      limit: number;
    };
  };
}

// Custom Product Page Types

export interface AppCustomProductPage {
  id: string;
  type: 'appCustomProductPages';
  attributes: {
    name?: string;
    url?: string;
    visible?: boolean;
  };
  relationships?: {
    app?: {
      data?: {
        type: 'apps';
        id: string;
      };
    };
    appCustomProductPageVersions?: {
      data?: Array<{
        type: 'appCustomProductPageVersions';
        id: string;
      }>;
    };
  };
}

export interface ListAppCustomProductPagesResponse {
  data: AppCustomProductPage[];
  links?: {
    self: string;
    next?: string;
  };
  meta?: {
    paging: {
      total: number;
      limit: number;
    };
  };
}

export interface AppCustomProductPageResponse {
  data: AppCustomProductPage;
  links?: {
    self: string;
  };
}

// Custom Product Page Localization Types

export interface AppCustomProductPageLocalization {
  id: string;
  type: 'appCustomProductPageLocalizations';
  attributes: {
    // Per the App Store Connect API (v3.2), CPP localizations expose only
    // locale and promotionalText — not the full store-listing field set.
    locale?: string;
    promotionalText?: string;
  };
  relationships?: {
    appCustomProductPageVersion?: {
      data: {
        type: 'appCustomProductPageVersions';
        id: string;
      };
    };
  };
}

export interface AppCustomProductPageLocalizationResponse {
  data: AppCustomProductPageLocalization;
  links?: {
    self: string;
  };
}

export interface ListAppCustomProductPageLocalizationsResponse {
  data: AppCustomProductPageLocalization[];
  links?: {
    self: string;
    next?: string;
  };
  meta?: {
    paging: {
      total: number;
      limit: number;
    };
  };
}

export interface AppCustomProductPageVersion {
  id: string;
  type: 'appCustomProductPageVersions';
  attributes: {
    // Per the App Store Connect API (v3.2): version + state
    // (e.g. ACCEPTED, PREPARE_FOR_SUBMISSION).
    version?: string;
    state?: string;
  };
  relationships?: {
    appCustomProductPage?: {
      data: {
        type: 'appCustomProductPages';
        id: string;
      };
    };
    appCustomProductPageLocalizations?: {
      data: Array<{
        type: 'appCustomProductPageLocalizations';
        id: string;
      }>;
    };
  };
}

export interface ListAppCustomProductPageVersionsResponse {
  data: AppCustomProductPageVersion[];
  links?: {
    self: string;
    next?: string;
  };
  meta?: {
    paging: {
      total: number;
      limit: number;
    };
  };
}

export interface AppCustomProductPageVersionResponse {
  data: AppCustomProductPageVersion;
  links?: {
    self: string;
  };
}

export interface AppCustomProductPageLocalizationsByPageResponse {
  appCustomProductPageId: string;
  versions: Array<{
    version: AppCustomProductPageVersion;
    localizations: AppCustomProductPageLocalization[];
    links?: ListAppCustomProductPageLocalizationsResponse['links'];
    meta?: ListAppCustomProductPageLocalizationsResponse['meta'];
  }>;
  links?: ListAppCustomProductPageVersionsResponse['links'];
  meta?: ListAppCustomProductPageVersionsResponse['meta'];
}

// Custom Product Page Write Request Types

export interface AppCustomProductPageCreateRequest {
  data: {
    type: 'appCustomProductPages';
    attributes: {
      name: string;
    };
    relationships: {
      app: {
        data: {
          type: 'apps';
          id: string;
        };
      };
    };
  };
}

export interface AppCustomProductPageVersionCreateRequest {
  data: {
    type: 'appCustomProductPageVersions';
    relationships: {
      appCustomProductPage: {
        data: {
          type: 'appCustomProductPages';
          id: string;
        };
      };
    };
  };
}

export interface AppCustomProductPageLocalizationCreateRequest {
  data: {
    type: 'appCustomProductPageLocalizations';
    attributes: {
      locale: string;
      promotionalText?: string;
    };
    relationships: {
      appCustomProductPageVersion: {
        data: {
          type: 'appCustomProductPageVersions';
          id: string;
        };
      };
    };
  };
}

export interface AppCustomProductPageLocalizationUpdateRequest {
  data: {
    type: 'appCustomProductPageLocalizations';
    id: string;
    attributes: {
      promotionalText?: string;
    };
  };
}
