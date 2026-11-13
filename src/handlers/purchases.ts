import { AppStoreConnectClient, ASC_V2_BASE } from '../services/index.js';
import {
  InAppPurchaseState,
  InAppPurchaseType,
  SubscriptionState,
  PurchaseVersionState,
  PURCHASE_VERSION_STATES,
  ListInAppPurchasesResponse,
  ListSubscriptionGroupsResponse,
  ListSubscriptionsResponse,
  ListPurchaseVersionsResponse,
  PurchaseVersionResponse,
} from '../types/index.js';
import { validateRequired, validateEnum, sanitizeLimit } from '../utils/index.js';

/**
 * In-App Purchases & subscriptions, built on the version-based resources Apple
 * introduced in July 2026. Localizations and images are reached only through a
 * version (inAppPurchaseVersions / subscriptionVersions / subscriptionGroupVersions);
 * the parent-level v1 localization/image/submission resources are deprecated and
 * are deliberately never included or traversed here.
 *
 * Version resources have no collection GET, so all reads go via relationship
 * traversal from the parent.
 */
export class PurchaseHandlers {
  constructor(private client: AppStoreConnectClient) {}

  async listInAppPurchases(args: {
    appId: string;
    state?: InAppPurchaseState[];
    inAppPurchaseType?: InAppPurchaseType[];
    productId?: string[];
    includeVersions?: boolean;
    limit?: number;
  }): Promise<ListInAppPurchasesResponse> {
    validateRequired(args, ['appId']);
    const { appId, state, inAppPurchaseType, productId, includeVersions = true, limit = 100 } = args;

    const params: Record<string, any> = { limit: sanitizeLimit(limit, 200) };
    if (state?.length) params['filter[state]'] = state.join(',');
    if (inAppPurchaseType?.length) params['filter[inAppPurchaseType]'] = inAppPurchaseType.join(',');
    if (productId?.length) params['filter[productId]'] = productId.join(',');
    if (includeVersions) {
      params['include'] = 'versions';
      params['limit[versions]'] = 50;
    }

    return this.client.get<ListInAppPurchasesResponse>(`/apps/${appId}/inAppPurchasesV2`, params);
  }

  async listSubscriptionGroups(args: {
    appId: string;
    includeSubscriptions?: boolean;
    includeVersions?: boolean;
    limit?: number;
  }): Promise<ListSubscriptionGroupsResponse> {
    validateRequired(args, ['appId']);
    const { appId, includeSubscriptions = true, includeVersions = true, limit = 100 } = args;

    const params: Record<string, any> = { limit: sanitizeLimit(limit, 200) };
    const include: string[] = [];
    if (includeSubscriptions) {
      include.push('subscriptions');
      params['limit[subscriptions]'] = 50;
    }
    if (includeVersions) {
      include.push('versions');
      params['limit[versions]'] = 50;
    }
    if (include.length) params['include'] = include.join(',');

    return this.client.get<ListSubscriptionGroupsResponse>(`/apps/${appId}/subscriptionGroups`, params);
  }

  async listSubscriptions(args: {
    subscriptionGroupId: string;
    state?: SubscriptionState[];
    productId?: string[];
    includeVersions?: boolean;
    limit?: number;
  }): Promise<ListSubscriptionsResponse> {
    validateRequired(args, ['subscriptionGroupId']);
    const { subscriptionGroupId, state, productId, includeVersions = true, limit = 100 } = args;

    const params: Record<string, any> = { limit: sanitizeLimit(limit, 200) };
    if (state?.length) params['filter[state]'] = state.join(',');
    if (productId?.length) params['filter[productId]'] = productId.join(',');
    if (includeVersions) {
      params['include'] = 'versions';
      params['limit[versions]'] = 50;
    }

    return this.client.get<ListSubscriptionsResponse>(
      `/subscriptionGroups/${subscriptionGroupId}/subscriptions`,
      params,
    );
  }

  async listInAppPurchaseVersions(args: {
    inAppPurchaseId: string;
    state?: PurchaseVersionState;
    includeLocalizations?: boolean;
    limit?: number;
  }): Promise<ListPurchaseVersionsResponse> {
    validateRequired(args, ['inAppPurchaseId']);
    return this.client.get<ListPurchaseVersionsResponse>(
      `${ASC_V2_BASE}/inAppPurchases/${args.inAppPurchaseId}/versions`,
      this.versionListParams(args),
    );
  }

  async listSubscriptionVersions(args: {
    subscriptionId: string;
    state?: PurchaseVersionState;
    includeLocalizations?: boolean;
    limit?: number;
  }): Promise<ListPurchaseVersionsResponse> {
    validateRequired(args, ['subscriptionId']);
    return this.client.get<ListPurchaseVersionsResponse>(
      `/subscriptions/${args.subscriptionId}/versions`,
      this.versionListParams(args),
    );
  }

  async listSubscriptionGroupVersions(args: {
    subscriptionGroupId: string;
    state?: PurchaseVersionState;
    includeLocalizations?: boolean;
    limit?: number;
  }): Promise<ListPurchaseVersionsResponse> {
    validateRequired(args, ['subscriptionGroupId']);
    return this.client.get<ListPurchaseVersionsResponse>(
      `/subscriptionGroups/${args.subscriptionGroupId}/versions`,
      this.versionListParams(args),
    );
  }

  /** Create a new editable version of an IAP (e.g. to change metadata of an approved product). */
  async createInAppPurchaseVersion(args: { inAppPurchaseId: string }): Promise<PurchaseVersionResponse> {
    validateRequired(args, ['inAppPurchaseId']);
    return this.client.post<PurchaseVersionResponse>('/inAppPurchaseVersions', {
      data: {
        type: 'inAppPurchaseVersions',
        relationships: {
          inAppPurchase: { data: { type: 'inAppPurchases', id: args.inAppPurchaseId } },
        },
      },
    });
  }

  async createSubscriptionVersion(args: { subscriptionId: string }): Promise<PurchaseVersionResponse> {
    validateRequired(args, ['subscriptionId']);
    return this.client.post<PurchaseVersionResponse>('/subscriptionVersions', {
      data: {
        type: 'subscriptionVersions',
        relationships: {
          subscription: { data: { type: 'subscriptions', id: args.subscriptionId } },
        },
      },
    });
  }

  async createSubscriptionGroupVersion(args: { subscriptionGroupId: string }): Promise<PurchaseVersionResponse> {
    validateRequired(args, ['subscriptionGroupId']);
    return this.client.post<PurchaseVersionResponse>('/subscriptionGroupVersions', {
      data: {
        type: 'subscriptionGroupVersions',
        relationships: {
          subscriptionGroup: { data: { type: 'subscriptionGroups', id: args.subscriptionGroupId } },
        },
      },
    });
  }

  private versionListParams(args: {
    state?: string;
    includeLocalizations?: boolean;
    limit?: number;
  }): Record<string, any> {
    const { state, includeLocalizations = false, limit = 100 } = args;
    const params: Record<string, any> = { limit: sanitizeLimit(limit, 200) };
    const validState = validateEnum(state, PURCHASE_VERSION_STATES, 'state');
    if (validState) params['filter[state]'] = validState;
    if (includeLocalizations) {
      params['include'] = 'localizations';
      params['limit[localizations]'] = 50;
    }
    return params;
  }
}
