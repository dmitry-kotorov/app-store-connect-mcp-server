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

// Custom Product Page Localization Types

export interface AppCustomProductPageLocalization {
  id: string;
  type: 'appCustomProductPageLocalizations';
  attributes: {
    locale: string;
    header?: string;
    subheading?: string;
    body?: string;
    footer?: string;
    promotionalText?: string;
    marketingUrl?: string;
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
    state?: string;
    platform?: string;
    createdDate?: string;
    lastModifiedDate?: string;
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
