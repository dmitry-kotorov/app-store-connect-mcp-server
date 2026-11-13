import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { AppStoreConnectClient } from '../services/index.js';
import {
  ReviewPlatform,
  REVIEW_PLATFORMS,
  ReviewSubmissionState,
  REVIEW_SUBMISSION_STATES,
  REVIEW_ITEM_TYPES,
  ReviewItemKind,
  ListReviewSubmissionsResponse,
  ReviewSubmissionResponse,
  ListReviewSubmissionItemsResponse,
  ReviewSubmissionItemResponse,
} from '../types/index.js';
import { validateRequired, validateEnum, sanitizeLimit } from '../utils/index.js';

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
  constructor(private client: AppStoreConnectClient) {}

  async listReviewSubmissions(args: {
    appId: string;
    state?: ReviewSubmissionState[];
    platform?: ReviewPlatform;
    includeItems?: boolean;
    limit?: number;
  }): Promise<ListReviewSubmissionsResponse> {
    validateRequired(args, ['appId']);
    const { appId, state, platform, includeItems = true, limit = 50 } = args;

    const params: Record<string, any> = { limit: sanitizeLimit(limit, 200) };
    if (state?.length) {
      state.forEach(s => validateEnum(s, REVIEW_SUBMISSION_STATES, 'state'));
      params['filter[state]'] = state.join(',');
    }
    const validPlatform = validateEnum(platform, REVIEW_PLATFORMS, 'platform');
    if (validPlatform) params['filter[platform]'] = validPlatform;
    if (includeItems) {
      params['include'] = 'items';
      params['limit[items]'] = 50;
    }

    return this.client.get<ListReviewSubmissionsResponse>(`/apps/${appId}/reviewSubmissions`, params);
  }

  async listReviewSubmissionItems(args: {
    reviewSubmissionId: string;
    limit?: number;
  }): Promise<ListReviewSubmissionItemsResponse> {
    validateRequired(args, ['reviewSubmissionId']);
    const { reviewSubmissionId, limit = 200 } = args;

    // Include every item kind so each item's linked resource id/type is visible.
    return this.client.get<ListReviewSubmissionItemsResponse>(
      `/reviewSubmissions/${reviewSubmissionId}/items`,
      {
        limit: sanitizeLimit(limit, 200),
        include: Object.keys(REVIEW_ITEM_TYPES).join(','),
      },
    );
  }

  async createReviewSubmission(args: {
    appId: string;
    platform: ReviewPlatform;
  }): Promise<ReviewSubmissionResponse> {
    validateRequired(args, ['appId', 'platform']);
    const platform = validateEnum(args.platform, REVIEW_PLATFORMS, 'platform');

    return this.client.post<ReviewSubmissionResponse>('/reviewSubmissions', {
      data: {
        type: 'reviewSubmissions',
        attributes: { platform },
        relationships: {
          app: { data: { type: 'apps', id: args.appId } },
        },
      },
    });
  }

  async addReviewSubmissionItem(args: {
    reviewSubmissionId: string;
    itemKind: ReviewItemKind;
    itemId: string;
  }): Promise<ReviewSubmissionItemResponse> {
    validateRequired(args, ['reviewSubmissionId', 'itemKind', 'itemId']);
    const { reviewSubmissionId, itemKind, itemId } = args;

    const resourceType = REVIEW_ITEM_TYPES[itemKind as ReviewItemKind];
    if (!resourceType) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid itemKind: ${itemKind}. Valid values are: ${Object.keys(REVIEW_ITEM_TYPES).join(', ')}`,
      );
    }

    return this.client.post<ReviewSubmissionItemResponse>('/reviewSubmissionItems', {
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: reviewSubmissionId } },
          [itemKind]: { data: { type: resourceType, id: itemId } },
        },
      },
    });
  }

  async removeReviewSubmissionItem(args: { reviewSubmissionItemId: string }): Promise<{ success: true; reviewSubmissionItemId: string }> {
    validateRequired(args, ['reviewSubmissionItemId']);
    await this.client.delete(`/reviewSubmissionItems/${args.reviewSubmissionItemId}`);
    return { success: true, reviewSubmissionItemId: args.reviewSubmissionItemId };
  }

  async submitReviewSubmission(args: { reviewSubmissionId: string }): Promise<ReviewSubmissionResponse> {
    validateRequired(args, ['reviewSubmissionId']);
    return this.patchSubmission(args.reviewSubmissionId, { submitted: true });
  }

  async cancelReviewSubmission(args: { reviewSubmissionId: string }): Promise<ReviewSubmissionResponse> {
    validateRequired(args, ['reviewSubmissionId']);
    return this.patchSubmission(args.reviewSubmissionId, { canceled: true });
  }

  private patchSubmission(id: string, attributes: Record<string, boolean>): Promise<ReviewSubmissionResponse> {
    return this.client.patch<ReviewSubmissionResponse>(`/reviewSubmissions/${id}`, {
      data: { type: 'reviewSubmissions', id, attributes },
    });
  }
}
