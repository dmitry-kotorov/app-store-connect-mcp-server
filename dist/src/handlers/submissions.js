import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { REVIEW_PLATFORMS, REVIEW_SUBMISSION_STATES, REVIEW_ITEM_TYPES, } from '../types/index.js';
import { validateRequired, validateEnum, sanitizeLimit, pathId } from '../utils/index.js';
/**
 * Unified App Review submission flow (reviewSubmissions + reviewSubmissionItems).
 * Replaces the deprecated inAppPurchaseSubmissions / subscriptionSubmissions /
 * subscriptionGroupSubmissions resources. A submission groups up to 200 items:
 * app versions, IAP/subscription/subscription-group versions, CPP versions,
 * in-app events, Game Center versions, etc.
 *
 * Flow: create (or reuse an open READY_FOR_REVIEW) submission -> add items ->
 * submit. Submitting sends everything to App Review and cannot be undone
 * (only canceled).
 */
export class SubmissionHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    async listReviewSubmissions(args) {
        validateRequired(args, ['appId']);
        const { appId, state, platform, includeItems = true, limit = 50 } = args;
        const params = { limit: sanitizeLimit(limit, 200) };
        if (state?.length) {
            state.forEach(s => validateEnum(s, REVIEW_SUBMISSION_STATES, 'state'));
            params['filter[state]'] = state.join(',');
        }
        const validPlatform = validateEnum(platform, REVIEW_PLATFORMS, 'platform');
        if (validPlatform)
            params['filter[platform]'] = validPlatform;
        if (includeItems) {
            params['include'] = 'items';
            params['limit[items]'] = 50;
        }
        return this.client.get(`/apps/${pathId(appId, 'appId')}/reviewSubmissions`, params);
    }
    async listReviewSubmissionItems(args) {
        validateRequired(args, ['reviewSubmissionId']);
        const { reviewSubmissionId, limit = 200 } = args;
        // Include every item kind so each item's linked resource id/type is visible.
        return this.client.get(`/reviewSubmissions/${pathId(reviewSubmissionId, 'reviewSubmissionId')}/items`, {
            limit: sanitizeLimit(limit, 200),
            include: Object.keys(REVIEW_ITEM_TYPES).join(','),
        });
    }
    async createReviewSubmission(args) {
        validateRequired(args, ['appId', 'platform']);
        const platform = validateEnum(args.platform, REVIEW_PLATFORMS, 'platform');
        return this.client.post('/reviewSubmissions', {
            data: {
                type: 'reviewSubmissions',
                attributes: { platform },
                relationships: {
                    app: { data: { type: 'apps', id: args.appId } },
                },
            },
        });
    }
    async addReviewSubmissionItem(args) {
        validateRequired(args, ['reviewSubmissionId', 'itemKind', 'itemId']);
        const { reviewSubmissionId, itemKind, itemId } = args;
        const resourceType = REVIEW_ITEM_TYPES[itemKind];
        if (!resourceType) {
            throw new McpError(ErrorCode.InvalidParams, `Invalid itemKind: ${itemKind}. Valid values are: ${Object.keys(REVIEW_ITEM_TYPES).join(', ')}`);
        }
        return this.client.post('/reviewSubmissionItems', {
            data: {
                type: 'reviewSubmissionItems',
                relationships: {
                    reviewSubmission: { data: { type: 'reviewSubmissions', id: reviewSubmissionId } },
                    [itemKind]: { data: { type: resourceType, id: itemId } },
                },
            },
        });
    }
    async removeReviewSubmissionItem(args) {
        validateRequired(args, ['reviewSubmissionItemId']);
        await this.client.delete(`/reviewSubmissionItems/${pathId(args.reviewSubmissionItemId, 'reviewSubmissionItemId')}`);
        return { success: true, reviewSubmissionItemId: args.reviewSubmissionItemId };
    }
    async submitReviewSubmission(args) {
        validateRequired(args, ['reviewSubmissionId']);
        return this.patchSubmission(args.reviewSubmissionId, { submitted: true });
    }
    async cancelReviewSubmission(args) {
        validateRequired(args, ['reviewSubmissionId']);
        return this.patchSubmission(args.reviewSubmissionId, { canceled: true });
    }
    patchSubmission(id, attributes) {
        return this.client.patch(`/reviewSubmissions/${pathId(id, 'id')}`, {
            data: { type: 'reviewSubmissions', id, attributes },
        });
    }
}
