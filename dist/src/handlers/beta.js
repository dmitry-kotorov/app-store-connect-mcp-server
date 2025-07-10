import { validateRequired, sanitizeLimit } from '../utils/index.js';
import { AppHandlers } from './apps.js';
export class BetaHandlers {
    client;
    appHandlers;
    constructor(client) {
        this.client = client;
        this.appHandlers = new AppHandlers(client);
    }
    async listBetaGroups(args = {}) {
        const { limit = 100 } = args;
        return this.client.get('/betaGroups', {
            limit: sanitizeLimit(limit),
            include: 'app,betaTesters'
        });
    }
    async listGroupTesters(args) {
        const { groupId, limit = 100 } = args;
        validateRequired(args, ['groupId']);
        return this.client.get(`/betaGroups/${groupId}/betaTesters`, {
            limit: sanitizeLimit(limit)
        });
    }
    async addTesterToGroup(args) {
        const { groupId, email, firstName, lastName } = args;
        validateRequired(args, ['groupId', 'email', 'firstName', 'lastName']);
        const requestBody = {
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
        return this.client.post('/betaTesters', requestBody);
    }
    async removeTesterFromGroup(args) {
        const { groupId, testerId } = args;
        validateRequired(args, ['groupId', 'testerId']);
        const requestBody = {
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
    async listBetaFeedbackScreenshots(args) {
        const { appId, bundleId, buildId, devicePlatform, appPlatform, deviceModel, osVersion, testerId, limit = 50, sort = "-createdDate", includeBuilds = false, includeTesters = false } = args;
        // Require either appId or bundleId
        if (!appId && !bundleId) {
            throw new Error('Either appId or bundleId must be provided');
        }
        // If bundleId is provided but not appId, look up the app
        let finalAppId = appId;
        if (!appId && bundleId) {
            const app = await this.appHandlers.findAppByBundleId(bundleId);
            if (!app) {
                throw new Error(`No app found with bundle ID: ${bundleId}`);
            }
            finalAppId = app.id;
        }
        // Build query parameters
        const params = {
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
        const includes = [];
        if (includeBuilds)
            includes.push('build');
        if (includeTesters)
            includes.push('tester');
        if (includes.length > 0) {
            params.include = includes.join(',');
        }
        // Add field selections for better performance
        params['fields[betaFeedbackScreenshotSubmissions]'] = 'createdDate,comment,email,deviceModel,osVersion,locale,timeZone,architecture,connectionType,pairedAppleWatch,appUptimeInMilliseconds,diskBytesAvailable,diskBytesTotal,batteryPercentage,screenWidthInPoints,screenHeightInPoints,appPlatform,devicePlatform,deviceFamily,buildBundleId,screenshots,build,tester';
        return this.client.get(`/apps/${finalAppId}/betaFeedbackScreenshotSubmissions`, params);
    }
    async getBetaFeedbackScreenshot(args) {
        const { feedbackId, includeBuilds = false, includeTesters = false } = args;
        if (!feedbackId) {
            throw new Error('feedbackId is required');
        }
        const params = {};
        // Add includes if requested
        const includes = [];
        if (includeBuilds)
            includes.push('build');
        if (includeTesters)
            includes.push('tester');
        if (includes.length > 0) {
            params.include = includes.join(',');
        }
        // Add field selections
        params['fields[betaFeedbackScreenshotSubmissions]'] = 'createdDate,comment,email,deviceModel,osVersion,locale,timeZone,architecture,connectionType,pairedAppleWatch,appUptimeInMilliseconds,diskBytesAvailable,diskBytesTotal,batteryPercentage,screenWidthInPoints,screenHeightInPoints,appPlatform,devicePlatform,deviceFamily,buildBundleId,screenshots,build,tester';
        return this.client.get(`/betaFeedbackScreenshotSubmissions/${feedbackId}`, params);
    }
}
