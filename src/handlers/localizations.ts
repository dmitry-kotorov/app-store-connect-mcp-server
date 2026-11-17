import { AppStoreConnectClient } from '../services/index.js';
import {
  ListAppStoreVersionLocalizationsResponse,
  AppStoreVersionLocalizationResponse,
  AppStoreVersionLocalizationUpdateRequest,
  AppStoreVersionLocalizationField,
  AppStoreVersionLocalization,
  ListAppStoreVersionsResponse,
  AppStoreVersionCreateRequest,
  AppStoreVersionResponse,
  ListAppCustomProductPagesResponse,
  AppCustomProductPageResponse,
  ListAppCustomProductPageVersionsResponse,
  AppCustomProductPageVersionResponse,
  ListAppCustomProductPageLocalizationsResponse,
  AppCustomProductPageLocalizationResponse,
  AppCustomProductPageLocalizationsByPageResponse,
  AppCustomProductPageCreateRequest,
  AppCustomProductPageVersionCreateRequest,
  AppCustomProductPageLocalizationCreateRequest,
  AppCustomProductPageLocalizationUpdateRequest,
  ListAppInfosResponse,
  ListAppInfoLocalizationsResponse,
  AppInfoLocalizationResponse,
  AppInfoLocalizationUpdateRequest,
  AppInfoLocalizationField,
  AppInfoLocalization,
  CompactList
} from '../types/index.js';
import { validateRequired, sanitizeLimit, buildFilterParams, buildFieldParams, pathId } from '../utils/index.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/** appStoreVersions attributes from the API 4.6 spec (fields[appStoreVersions]). */
const APP_STORE_VERSION_ATTRIBUTES = [
  'platform', 'versionString', 'appStoreState', 'appVersionState', 'copyright', 'reviewType',
  'releaseType', 'earliestReleaseDate', 'usesIdfa', 'downloadable', 'createdDate',
];

const DEFAULT_APP_STORE_VERSION_FIELDS = [
  'versionString', 'platform', 'appVersionState', 'releaseType', 'earliestReleaseDate', 'createdDate',
];

export class LocalizationHandlers {
  constructor(private client: AppStoreConnectClient) {}

  async listAppStoreVersions(args: {
    appId: string;
    limit?: number;
    filter?: {
      platform?: string;
      versionString?: string;
      appStoreState?: string;
      appVersionState?: string;
    };
    fields?: string[];
    raw?: boolean;
  }): Promise<ListAppStoreVersionsResponse | CompactList> {
    const { appId, limit = 100, filter, raw = false } = args;

    validateRequired(args, ['appId']);

    const fields = args.fields?.length ? args.fields : (raw ? [] : DEFAULT_APP_STORE_VERSION_FIELDS);
    const unknown = fields.filter(f => !APP_STORE_VERSION_ATTRIBUTES.includes(f));
    if (unknown.length) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Unknown appStoreVersions field(s): ${unknown.join(', ')}. Valid fields: ${APP_STORE_VERSION_ATTRIBUTES.join(', ')}`
      );
    }

    const params: Record<string, any> = {
      limit: sanitizeLimit(limit, 200),
      ...buildFilterParams({
        platform: filter?.platform,
        versionString: filter?.versionString,
        appStoreState: filter?.appStoreState,
        appVersionState: filter?.appVersionState,
      }),
    };
    // Naming only attributes also makes Apple leave out the relationships block.
    if (fields.length) params['fields[appStoreVersions]'] = fields.join(',');

    const path = `/apps/${pathId(appId, 'appId')}/appStoreVersions`;
    const response = await this.client.get<ListAppStoreVersionsResponse>(path, params);
    if (raw) return response;

    const liveIds = await this.findLiveVersionIds(path, filter?.platform);
    return {
      total: response.meta?.paging?.total,
      data: response.data.map(v => ({ id: v.id, ...v.attributes, isLive: liveIds.has(v.id) })),
    };
  }

  /**
   * Neither appStoreState (every released version stays READY_FOR_SALE) nor
   * appVersionState (READY_FOR_DISTRIBUTION) tells the live version from the
   * ones it replaced, so the live version is inferred: per platform, the most
   * recently created version that is READY_FOR_DISTRIBUTION. Looked up across
   * all versions, so the result does not depend on the caller's filters or limit.
   */
  private async findLiveVersionIds(path: string, platform?: string): Promise<Set<string>> {
    const released = await this.client.get<ListAppStoreVersionsResponse>(path, {
      limit: 200,
      'filter[appVersionState]': 'READY_FOR_DISTRIBUTION',
      ...(platform ? { 'filter[platform]': platform } : {}),
      'fields[appStoreVersions]': 'platform,createdDate',
    });
    const newest = new Map<string, { id: string; created: string }>();
    for (const v of released.data) {
      const key = v.attributes.platform ?? '';
      const created = v.attributes.createdDate ?? '';
      const current = newest.get(key);
      if (!current || Date.parse(created) > Date.parse(current.created)) {
        newest.set(key, { id: v.id, created });
      }
    }
    return new Set([...newest.values()].map(v => v.id));
  }

  async listAppStoreVersionLocalizations(args: {
    appStoreVersionId: string;
    limit?: number;
    filter?: {
      locale?: string;
    };
    fields?: {
      appStoreVersionLocalizations?: (
        'description' |
        'keywords' |
        'locale' |
        'marketingUrl' |
        'promotionalText' |
        'supportUrl' |
        'whatsNew'
      )[];
    };
  }): Promise<ListAppStoreVersionLocalizationsResponse> {
    const { appStoreVersionId, limit = 100, filter, fields } = args;
    
    validateRequired(args, ['appStoreVersionId']);

    const sanitizedLimit = sanitizeLimit(limit);

    const params: Record<string, any> = {
      limit: sanitizedLimit
    };

    Object.assign(params, buildFilterParams(filter));
    Object.assign(params, buildFieldParams(fields));

    const response = await this.client.get<ListAppStoreVersionLocalizationsResponse>(
      `/appStoreVersions/${pathId(appStoreVersionId, 'appStoreVersionId')}/appStoreVersionLocalizations`,
      params
    );

    // Fallback enforcement: if the upstream API ignores filter/fields/limit/offset, trim locally
    let data = response.data ?? [];
    let changed = false;

    if (filter?.locale) {
      data = data.filter((loc) => loc.attributes?.locale === filter.locale);
      changed = true;
    }

    if (fields?.appStoreVersionLocalizations?.length) {
      const keepFields = new Set([
        ...fields.appStoreVersionLocalizations,
        'locale' // always keep locale so the record stays identifiable
      ]);
      data = data.map((loc) => ({
        ...loc,
        attributes: Object.fromEntries(
          Object.entries(loc.attributes || {}).filter(([key]) => keepFields.has(key as any))
        ) as AppStoreVersionLocalization['attributes']
      }));
      changed = true;
    }

    // Enforce limit locally in case the upstream ignores it
    if (data.length > sanitizedLimit) {
      data = data.slice(0, sanitizedLimit);
      changed = true;
    }

    if (!changed) {
      return response;
    }

    const meta = {
      ...(response.meta || {}),
      paging: {
        total: data.length,
        limit: sanitizedLimit
      }
    };

    const links = response.links ? { ...response.links } : undefined;
    if (links?.next) {
      delete links.next;
    }

    return {
      ...response,
      data,
      meta,
      links
    };
  }

  async getAppStoreVersionLocalization(args: {
    localizationId: string;
  }): Promise<AppStoreVersionLocalizationResponse> {
    const { localizationId } = args;
    
    validateRequired(args, ['localizationId']);
    
    return this.client.get<AppStoreVersionLocalizationResponse>(
      `/appStoreVersionLocalizations/${pathId(localizationId, 'localizationId')}`
    );
  }

  async updateAppStoreVersionLocalization(args: {
    localizationId: string;
    field: AppStoreVersionLocalizationField;
    value: string;
  }): Promise<AppStoreVersionLocalizationResponse> {
    const { localizationId, field, value } = args;
    
    validateRequired(args, ['localizationId', 'field', 'value']);
    
    // Validate field
    const validFields: AppStoreVersionLocalizationField[] = [
      'description', 'keywords', 'marketingUrl', 
      'promotionalText', 'supportUrl', 'whatsNew'
    ];
    
    if (!validFields.includes(field)) {
      throw new Error(`Invalid field: ${field}. Must be one of: ${validFields.join(', ')}`);
    }
    
    const requestData: AppStoreVersionLocalizationUpdateRequest = {
      data: {
        type: 'appStoreVersionLocalizations',
        id: localizationId,
        attributes: {
          [field]: value
        }
      }
    };
    
    return this.client.patch<AppStoreVersionLocalizationResponse>(
      `/appStoreVersionLocalizations/${pathId(localizationId, 'localizationId')}`,
      requestData
    );
  }

  async createAppStoreVersion(args: {
    appId: string;
    platform: 'IOS' | 'MAC_OS' | 'TV_OS' | 'VISION_OS';
    versionString: string;
    copyright?: string;
    releaseType?: 'MANUAL' | 'AFTER_APPROVAL' | 'SCHEDULED';
    earliestReleaseDate?: string;
    buildId?: string;
  }): Promise<AppStoreVersionResponse> {
    const { 
      appId, 
      platform, 
      versionString, 
      copyright, 
      releaseType, 
      earliestReleaseDate,
      buildId 
    } = args;
    
    validateRequired(args, ['appId', 'platform', 'versionString']);
    
    // Validate version string format
    const versionRegex = /^\d+\.\d+(\.\d+)?$/;
    if (!versionRegex.test(versionString)) {
      throw new Error('Version string must be in format X.Y or X.Y.Z (e.g., 1.0 or 1.0.0)');
    }
    
    // Validate release date if provided
    if (earliestReleaseDate) {
      const date = new Date(earliestReleaseDate);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid release date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)');
      }
      if (releaseType !== 'SCHEDULED') {
        throw new Error('earliestReleaseDate can only be set when releaseType is SCHEDULED');
      }
    }
    
    const requestData: AppStoreVersionCreateRequest = {
      data: {
        type: 'appStoreVersions',
        attributes: {
          platform,
          versionString,
          ...(copyright && { copyright }),
          ...(releaseType && { releaseType }),
          ...(earliestReleaseDate && { earliestReleaseDate })
        },
        relationships: {
          app: {
            data: {
              type: 'apps',
              id: appId
            }
          },
          ...(buildId && {
            build: {
              data: {
                type: 'builds',
                id: buildId
              }
            }
          })
        }
      }
    };
    
    return this.client.post<AppStoreVersionResponse>(
      '/appStoreVersions',
      requestData
    );
  }

  // App Info Localization Methods

  async listAppInfos(args: {
    appId: string;
    limit?: number;
  }): Promise<ListAppInfosResponse> {
    const { appId, limit = 100 } = args;

    validateRequired(args, ['appId']);

    const params: Record<string, any> = {
      limit: sanitizeLimit(limit)
    };

    return this.client.get<ListAppInfosResponse>(
      `/apps/${pathId(appId, 'appId')}/appInfos`,
      params
    );
  }

  async listAppInfoLocalizations(args: {
    appInfoId: string;
    limit?: number;
    filter?: {
      locale?: string;
    };
    fields?: {
      appInfoLocalizations?: (
        'locale' |
        'name' |
        'subtitle' |
        'privacyPolicyUrl' |
        'privacyChoicesUrl' |
        'privacyPolicyText'
      )[];
    };
  }): Promise<ListAppInfoLocalizationsResponse> {
    const { appInfoId, limit = 100, filter, fields } = args;

    validateRequired(args, ['appInfoId']);

    const sanitizedLimit = sanitizeLimit(limit);

    const params: Record<string, any> = {
      limit: sanitizedLimit
    };

    Object.assign(params, buildFilterParams(filter));
    Object.assign(params, buildFieldParams(fields));

    const response = await this.client.get<ListAppInfoLocalizationsResponse>(
      `/appInfos/${pathId(appInfoId, 'appInfoId')}/appInfoLocalizations`,
      params
    );

    // Fallback enforcement: if the upstream API ignores filter/fields/limit, trim locally
    let data = response.data ?? [];
    let changed = false;

    if (filter?.locale) {
      data = data.filter((loc) => loc.attributes?.locale === filter.locale);
      changed = true;
    }

    if (fields?.appInfoLocalizations?.length) {
      const keepFields = new Set([
        ...fields.appInfoLocalizations,
        'locale' // always keep locale so the record stays identifiable
      ]);
      data = data.map((loc) => ({
        ...loc,
        attributes: Object.fromEntries(
          Object.entries(loc.attributes || {}).filter(([key]) => keepFields.has(key as any))
        ) as AppInfoLocalization['attributes']
      }));
      changed = true;
    }

    if (data.length > sanitizedLimit) {
      data = data.slice(0, sanitizedLimit);
      changed = true;
    }

    if (!changed) {
      return response;
    }

    const meta = {
      ...(response.meta || {}),
      paging: {
        total: data.length,
        limit: sanitizedLimit
      }
    };

    const links = response.links ? { ...response.links } : undefined;
    if (links?.next) {
      delete links.next;
    }

    return {
      ...response,
      data,
      meta,
      links
    };
  }

  async getAppInfoLocalization(args: {
    localizationId: string;
  }): Promise<AppInfoLocalizationResponse> {
    const { localizationId } = args;

    validateRequired(args, ['localizationId']);

    return this.client.get<AppInfoLocalizationResponse>(
      `/appInfoLocalizations/${pathId(localizationId, 'localizationId')}`
    );
  }

  async updateAppInfoLocalization(args: {
    localizationId: string;
    field: AppInfoLocalizationField;
    value: string;
  }): Promise<AppInfoLocalizationResponse> {
    const { localizationId, field, value } = args;

    validateRequired(args, ['localizationId', 'field', 'value']);

    const validFields: AppInfoLocalizationField[] = [
      'name', 'subtitle', 'privacyPolicyUrl',
      'privacyChoicesUrl', 'privacyPolicyText'
    ];

    if (!validFields.includes(field)) {
      throw new Error(`Invalid field: ${field}. Must be one of: ${validFields.join(', ')}`);
    }

    const requestData: AppInfoLocalizationUpdateRequest = {
      data: {
        type: 'appInfoLocalizations',
        id: localizationId,
        attributes: {
          [field]: value
        }
      }
    };

    return this.client.patch<AppInfoLocalizationResponse>(
      `/appInfoLocalizations/${pathId(localizationId, 'localizationId')}`,
      requestData
    );
  }

  // Custom Product Page Methods

  async listAppCustomProductPages(args: {
    appId: string;
    visible?: boolean;
    limit?: number;
  }): Promise<ListAppCustomProductPagesResponse> {
    const { appId, visible, limit = 100 } = args;

    validateRequired(args, ['appId']);

    const params: Record<string, any> = {
      limit: sanitizeLimit(limit)
    };

    if (visible !== undefined) {
      params['filter[visible]'] = String(visible);
    }

    return this.client.get<ListAppCustomProductPagesResponse>(
      `/apps/${pathId(appId, 'appId')}/appCustomProductPages`,
      params
    );
  }

  async listAppCustomProductPageVersions(args: {
    appCustomProductPageId: string;
    limit?: number;
  }): Promise<ListAppCustomProductPageVersionsResponse> {
    const { appCustomProductPageId, limit = 100 } = args;

    validateRequired(args, ['appCustomProductPageId']);

    // The appCustomProductPageVersions resource forbids GET_COLLECTION; the
    // supported read is the relationship path off the parent page.
    const params: Record<string, any> = {
      limit: sanitizeLimit(limit)
    };

    return this.client.get<ListAppCustomProductPageVersionsResponse>(
      `/appCustomProductPages/${pathId(appCustomProductPageId, 'appCustomProductPageId')}/appCustomProductPageVersions`,
      params
    );
  }

  async listAppCustomProductPageVersionLocalizations(args: {
    appCustomProductPageVersionId: string;
    limit?: number;
  }): Promise<ListAppCustomProductPageLocalizationsResponse> {
    const { appCustomProductPageVersionId, limit = 200 } = args;

    validateRequired(args, ['appCustomProductPageVersionId']);

    // Same GET_COLLECTION restriction applies to appCustomProductPageLocalizations;
    // traverse the relationship off the version instead.
    const params: Record<string, any> = {
      limit: sanitizeLimit(limit)
    };

    return this.client.get<ListAppCustomProductPageLocalizationsResponse>(
      `/appCustomProductPageVersions/${pathId(appCustomProductPageVersionId, 'appCustomProductPageVersionId')}/appCustomProductPageLocalizations`,
      params
    );
  }

  async listAppCustomProductPageLocalizations(args: {
    appCustomProductPageId: string;
    versionLimit?: number;
    localizationLimit?: number;
  }): Promise<AppCustomProductPageLocalizationsByPageResponse> {
    const { appCustomProductPageId, versionLimit = 100, localizationLimit = 200 } = args;

    validateRequired(args, ['appCustomProductPageId']);

    const versionsResponse = await this.listAppCustomProductPageVersions({
      appCustomProductPageId,
      limit: versionLimit
    });

    const versionsWithLocalizations = await Promise.all(
      versionsResponse.data.map(async (version) => {
        const localizationsResponse = await this.listAppCustomProductPageVersionLocalizations({
          appCustomProductPageVersionId: version.id,
          limit: localizationLimit
        });

        return {
          version,
          localizations: localizationsResponse.data,
          links: localizationsResponse.links,
          meta: localizationsResponse.meta
        };
      })
    );

    return {
      appCustomProductPageId,
      versions: versionsWithLocalizations,
      links: versionsResponse.links,
      meta: versionsResponse.meta
    };
  }

  // Custom Product Page Write Methods

  async createAppCustomProductPage(args: {
    appId: string;
    name: string;
  }): Promise<AppCustomProductPageResponse> {
    const { appId, name } = args;

    validateRequired(args, ['appId', 'name']);

    const requestData: AppCustomProductPageCreateRequest = {
      data: {
        type: 'appCustomProductPages',
        attributes: { name },
        relationships: {
          app: {
            data: { type: 'apps', id: appId }
          }
        }
      }
    };

    return this.client.post<AppCustomProductPageResponse>(
      '/appCustomProductPages',
      requestData
    );
  }

  async createAppCustomProductPageVersion(args: {
    appCustomProductPageId: string;
  }): Promise<AppCustomProductPageVersionResponse> {
    const { appCustomProductPageId } = args;

    validateRequired(args, ['appCustomProductPageId']);

    const requestData: AppCustomProductPageVersionCreateRequest = {
      data: {
        type: 'appCustomProductPageVersions',
        relationships: {
          appCustomProductPage: {
            data: { type: 'appCustomProductPages', id: appCustomProductPageId }
          }
        }
      }
    };

    return this.client.post<AppCustomProductPageVersionResponse>(
      '/appCustomProductPageVersions',
      requestData
    );
  }

  async createAppCustomProductPageLocalization(args: {
    appCustomProductPageVersionId: string;
    locale: string;
    promotionalText?: string;
  }): Promise<AppCustomProductPageLocalizationResponse> {
    const { appCustomProductPageVersionId, locale, promotionalText } = args;

    validateRequired(args, ['appCustomProductPageVersionId', 'locale']);

    const requestData: AppCustomProductPageLocalizationCreateRequest = {
      data: {
        type: 'appCustomProductPageLocalizations',
        attributes: {
          locale,
          ...(promotionalText !== undefined ? { promotionalText } : {})
        },
        relationships: {
          appCustomProductPageVersion: {
            data: { type: 'appCustomProductPageVersions', id: appCustomProductPageVersionId }
          }
        }
      }
    };

    return this.client.post<AppCustomProductPageLocalizationResponse>(
      '/appCustomProductPageLocalizations',
      requestData
    );
  }

  async updateAppCustomProductPageLocalization(args: {
    localizationId: string;
    promotionalText: string;
  }): Promise<AppCustomProductPageLocalizationResponse> {
    const { localizationId, promotionalText } = args;

    validateRequired(args, ['localizationId']);
    // Explicit string check (not validateRequired's falsy check) so an empty
    // string — the spec-valid way to clear promotional text via PATCH — is allowed.
    if (typeof promotionalText !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: promotionalText'
      );
    }

    const requestData: AppCustomProductPageLocalizationUpdateRequest = {
      data: {
        type: 'appCustomProductPageLocalizations',
        id: localizationId,
        attributes: { promotionalText }
      }
    };

    return this.client.patch<AppCustomProductPageLocalizationResponse>(
      `/appCustomProductPageLocalizations/${pathId(localizationId, 'localizationId')}`,
      requestData
    );
  }
}
