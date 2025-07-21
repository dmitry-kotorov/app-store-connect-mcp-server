import { AppStoreConnectClient } from '../services/index.js';
import { 
  ListAppStoreVersionLocalizationsResponse, 
  AppStoreVersionLocalizationResponse,
  AppStoreVersionLocalizationUpdateRequest,
  AppStoreVersionLocalizationField,
  ListAppStoreVersionsResponse
} from '../types/index.js';
import { validateRequired, sanitizeLimit } from '../utils/index.js';

export class LocalizationHandlers {
  constructor(private client: AppStoreConnectClient) {}

  async listAppStoreVersions(args: {
    appId: string;
    limit?: number;
    filter?: {
      platform?: string;
      versionString?: string;
      appStoreState?: string;
    };
  }): Promise<ListAppStoreVersionsResponse> {
    const { appId, limit = 100, filter } = args;
    
    validateRequired(args, ['appId']);
    
    const params: Record<string, any> = {
      limit: sanitizeLimit(limit),
      'filter[app]': appId
    };
    
    if (filter?.platform) {
      params['filter[platform]'] = filter.platform;
    }
    
    if (filter?.versionString) {
      params['filter[versionString]'] = filter.versionString;
    }
    
    if (filter?.appStoreState) {
      params['filter[appStoreState]'] = filter.appStoreState;
    }
    
    return this.client.get<ListAppStoreVersionsResponse>(
      '/appStoreVersions',
      params
    );
  }

  async listAppStoreVersionLocalizations(args: {
    appStoreVersionId: string;
    limit?: number;
  }): Promise<ListAppStoreVersionLocalizationsResponse> {
    const { appStoreVersionId, limit = 100 } = args;
    
    validateRequired(args, ['appStoreVersionId']);
    
    const params: Record<string, any> = {
      limit: sanitizeLimit(limit),
      'filter[appStoreVersion]': appStoreVersionId
    };
    
    return this.client.get<ListAppStoreVersionLocalizationsResponse>(
      '/appStoreVersionLocalizations',
      params
    );
  }

  async getAppStoreVersionLocalization(args: {
    localizationId: string;
  }): Promise<AppStoreVersionLocalizationResponse> {
    const { localizationId } = args;
    
    validateRequired(args, ['localizationId']);
    
    return this.client.get<AppStoreVersionLocalizationResponse>(
      `/appStoreVersionLocalizations/${localizationId}`
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
      `/appStoreVersionLocalizations/${localizationId}`,
      requestData
    );
  }
}