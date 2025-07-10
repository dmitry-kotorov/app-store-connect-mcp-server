import { AppStoreConnectClient } from '../services/index.js';
import { 
  ListBetaGroupsResponse, 
  ListBetaTestersResponse, 
  AddTesterRequest,
  RemoveTesterRequest,
  ListBetaFeedbackScreenshotSubmissionsRequest,
  ListBetaFeedbackScreenshotSubmissionsResponse
} from '../types/index.js';
import { validateRequired, sanitizeLimit } from '../utils/index.js';

export class BetaHandlers {
  constructor(private client: AppStoreConnectClient) {}

  async listBetaGroups(args: { limit?: number } = {}): Promise<ListBetaGroupsResponse> {
    const { limit = 100 } = args;
    
    return this.client.get<ListBetaGroupsResponse>('/betaGroups', {
      limit: sanitizeLimit(limit),
      include: 'app,betaTesters'
    });
  }

  async listGroupTesters(args: { 
    groupId: string; 
    limit?: number;
  }): Promise<ListBetaTestersResponse> {
    const { groupId, limit = 100 } = args;
    
    validateRequired(args, ['groupId']);

    return this.client.get<ListBetaTestersResponse>(`/betaGroups/${groupId}/betaTesters`, {
      limit: sanitizeLimit(limit)
    });
  }

  async addTesterToGroup(args: {
    groupId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<ListBetaTestersResponse> {
    const { groupId, email, firstName, lastName } = args;
    
    validateRequired(args, ['groupId', 'email', 'firstName', 'lastName']);

    const requestBody: AddTesterRequest = {
      data: {
        type: "betaTesters",
        attributes: {
          email,
          firstName,
          lastName
        },
        relationships: {
          betaGroups: {
            data: [{
              id: groupId,
              type: "betaGroups"
            }]
          }
        }
      }
    };

    return this.client.post<ListBetaTestersResponse>('/betaTesters', requestBody);
  }

  async removeTesterFromGroup(args: {
    groupId: string;
    testerId: string;
  }): Promise<{ success: boolean; message: string }> {
    const { groupId, testerId } = args;
    
    validateRequired(args, ['groupId', 'testerId']);

    const requestBody: RemoveTesterRequest = {
      data: [{
        id: testerId,
        type: "betaTesters"
      }]
    };

    await this.client.delete(`/betaGroups/${groupId}/relationships/betaTesters`, requestBody);

    return { 
      success: true, 
      message: "Tester removed from group successfully" 
    };
  }

  async listBetaFeedbackScreenshots(args: ListBetaFeedbackScreenshotSubmissionsRequest): Promise<ListBetaFeedbackScreenshotSubmissionsResponse> {
    const { 
      appId, 
      buildId,
      devicePlatform,
      appPlatform,
      deviceModel,
      osVersion,
      testerId,
      limit = 50,
      sort = "-createdDate",
      includeBuilds = false,
      includeTesters = false
    } = args;
    
    validateRequired(args, ['appId']);

    // Build query parameters
    const params: Record<string, any> = {
      limit: sanitizeLimit(limit),
      sort
    };

    // Add filters if provided
    if (buildId) {
      params['filter[build]'] = buildId;
    }
    if (devicePlatform) {
      params['filter[devicePlatform]'] = devicePlatform;
    }
    if (appPlatform) {
      params['filter[appPlatform]'] = appPlatform;
    }
    if (deviceModel) {
      params['filter[deviceModel]'] = deviceModel;
    }
    if (osVersion) {
      params['filter[osVersion]'] = osVersion;
    }
    if (testerId) {
      params['filter[tester]'] = testerId;
    }

    // Add includes if requested
    const includes: string[] = [];
    if (includeBuilds) includes.push('build');
    if (includeTesters) includes.push('tester');
    if (includes.length > 0) {
      params.include = includes.join(',');
    }

    // Add field selections for better performance
    params['fields[betaFeedbackScreenshotSubmissions]'] = 'createdDate,comment,email,deviceModel,osVersion,locale,timeZone,architecture,connectionType,pairedAppleWatch,appUptimeInMilliseconds,diskBytesAvailable,diskBytesTotal,batteryPercentage,screenWidthInPoints,screenHeightInPoints,appPlatform,devicePlatform,deviceFamily,buildBundleId,screenshots,build,tester';

    return this.client.get<ListBetaFeedbackScreenshotSubmissionsResponse>(
      `/apps/${appId}/betaFeedbackScreenshotSubmissions`, 
      params
    );
  }
}