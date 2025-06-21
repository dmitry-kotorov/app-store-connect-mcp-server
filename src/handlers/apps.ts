import { AppStoreConnectClient } from '../services/index.js';
import { ListAppsResponse, AppInfoResponse, AppIncludeOptions } from '../types/index.js';
import { validateRequired, sanitizeLimit } from '../utils/index.js';

export class AppHandlers {
  constructor(private client: AppStoreConnectClient) {}

  async listApps(args: { limit?: number } = {}): Promise<ListAppsResponse> {
    const { limit = 100 } = args;
    
    return this.client.get<ListAppsResponse>('/apps', {
      limit: sanitizeLimit(limit)
    });
  }

  async getAppInfo(args: { 
    appId: string; 
    include?: AppIncludeOptions[];
  }): Promise<AppInfoResponse> {
    const { appId, include } = args;
    
    validateRequired(args, ['appId']);

    const params: Record<string, any> = {};
    if (include?.length) {
      params.include = include.join(',');
    }

    return this.client.get<AppInfoResponse>(`/apps/${appId}`, params);
  }
}