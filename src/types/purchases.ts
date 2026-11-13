// In-App Purchase & subscription types — App Store Connect API 4.6
// Built on the version-based resources (InAppPurchaseVersion, SubscriptionVersion,
// SubscriptionGroupVersion). The v1 localization/image/*Submissions resources are
// deprecated by Apple and are intentionally not used here.

import { BaseApiResponse } from './common.js';

export type InAppPurchaseType = 'CONSUMABLE' | 'NON_CONSUMABLE' | 'NON_RENEWING_SUBSCRIPTION';

export type InAppPurchaseState =
  | 'MISSING_METADATA'
  | 'WAITING_FOR_UPLOAD'
  | 'PROCESSING_CONTENT'
  | 'READY_TO_SUBMIT'
  | 'WAITING_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'DEVELOPER_ACTION_NEEDED'
  | 'PENDING_BINARY_APPROVAL'
  | 'APPROVED'
  | 'DEVELOPER_REMOVED_FROM_SALE'
  | 'REMOVED_FROM_SALE'
  | 'REJECTED';

export type SubscriptionState = Exclude<
  InAppPurchaseState,
  'WAITING_FOR_UPLOAD' | 'PROCESSING_CONTENT'
>;

/** State shared by inAppPurchaseVersions, subscriptionVersions and subscriptionGroupVersions. */
export type PurchaseVersionState =
  | 'PREPARE_FOR_SUBMISSION'
  | 'READY_FOR_REVIEW'
  | 'WAITING_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'ACCEPTED'
  | 'APPROVED'
  | 'REPLACED_WITH_NEW_VERSION'
  | 'REJECTED'
  | 'DEVELOPER_REJECTED';

export const PURCHASE_VERSION_STATES: readonly PurchaseVersionState[] = [
  'PREPARE_FOR_SUBMISSION',
  'READY_FOR_REVIEW',
  'WAITING_FOR_REVIEW',
  'IN_REVIEW',
  'ACCEPTED',
  'APPROVED',
  'REPLACED_WITH_NEW_VERSION',
  'REJECTED',
  'DEVELOPER_REJECTED',
];

export type PurchaseVersionType =
  | 'inAppPurchaseVersions'
  | 'subscriptionVersions'
  | 'subscriptionGroupVersions';

export interface PurchaseVersion {
  id: string;
  type: PurchaseVersionType;
  attributes: {
    version?: number;
    state?: PurchaseVersionState;
  };
  relationships?: Record<string, any>;
}

export interface InAppPurchaseV2 {
  id: string;
  type: 'inAppPurchases';
  attributes: {
    name?: string;
    productId?: string;
    inAppPurchaseType?: InAppPurchaseType;
    state?: InAppPurchaseState;
    reviewNote?: string;
    familySharable?: boolean;
    contentHosting?: boolean;
  };
  relationships?: Record<string, any>;
}

export interface SubscriptionGroup {
  id: string;
  type: 'subscriptionGroups';
  attributes: {
    referenceName?: string;
  };
  relationships?: Record<string, any>;
}

export interface Subscription {
  id: string;
  type: 'subscriptions';
  attributes: {
    name?: string;
    productId?: string;
    familySharable?: boolean;
    state?: SubscriptionState;
    subscriptionPeriod?: string;
    reviewNote?: string;
    groupLevel?: number;
  };
  relationships?: Record<string, any>;
}

export interface ListResponseWithIncluded<T> extends BaseApiResponse<T[]> {
  included?: any[];
}

export type ListInAppPurchasesResponse = ListResponseWithIncluded<InAppPurchaseV2>;
export type ListSubscriptionGroupsResponse = ListResponseWithIncluded<SubscriptionGroup>;
export type ListSubscriptionsResponse = ListResponseWithIncluded<Subscription>;
export type ListPurchaseVersionsResponse = ListResponseWithIncluded<PurchaseVersion>;
export type PurchaseVersionResponse = BaseApiResponse<PurchaseVersion>;
