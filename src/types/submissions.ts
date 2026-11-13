// Review submission types — App Store Connect API 4.6
// /v1/reviewSubmissions + /v1/reviewSubmissionItems: the unified submission flow
// that groups app versions, IAP/subscription versions, CPPs, in-app events, etc.
// (up to 200 items per submission).

import { BaseApiResponse } from './common.js';

export type ReviewPlatform = 'IOS' | 'MAC_OS' | 'TV_OS' | 'VISION_OS';
export const REVIEW_PLATFORMS: readonly ReviewPlatform[] = ['IOS', 'MAC_OS', 'TV_OS', 'VISION_OS'];

export type ReviewSubmissionState =
  | 'READY_FOR_REVIEW'
  | 'WAITING_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'UNRESOLVED_ISSUES'
  | 'CANCELING'
  | 'COMPLETING'
  | 'COMPLETE';

export const REVIEW_SUBMISSION_STATES: readonly ReviewSubmissionState[] = [
  'READY_FOR_REVIEW',
  'WAITING_FOR_REVIEW',
  'IN_REVIEW',
  'UNRESOLVED_ISSUES',
  'CANCELING',
  'COMPLETING',
  'COMPLETE',
];

/**
 * Relationship key on ReviewSubmissionItemCreateRequest -> JSON:API resource type.
 * Taken verbatim from the spec; note appStoreVersionExperimentV2 maps to the
 * same type as appStoreVersionExperiment, so keys cannot be derived by pluralizing.
 */
export const REVIEW_ITEM_TYPES = {
  appStoreVersion: 'appStoreVersions',
  appCustomProductPageVersion: 'appCustomProductPageVersions',
  appStoreVersionExperiment: 'appStoreVersionExperiments',
  appStoreVersionExperimentV2: 'appStoreVersionExperiments',
  appEvent: 'appEvents',
  appAssetLibraryImage: 'appAssetLibraryImages',
  appAssetLibraryVideo: 'appAssetLibraryVideos',
  backgroundAssetVersion: 'backgroundAssetVersions',
  gameCenterAchievementVersion: 'gameCenterAchievementVersions',
  gameCenterActivityVersion: 'gameCenterActivityVersions',
  gameCenterChallengeVersion: 'gameCenterChallengeVersions',
  gameCenterLeaderboardSetVersion: 'gameCenterLeaderboardSetVersions',
  gameCenterLeaderboardVersion: 'gameCenterLeaderboardVersions',
  inAppPurchaseVersion: 'inAppPurchaseVersions',
  subscriptionVersion: 'subscriptionVersions',
  subscriptionGroupVersion: 'subscriptionGroupVersions',
  retentionMessageVersion: 'retentionMessageVersions',
} as const;

export type ReviewItemKind = keyof typeof REVIEW_ITEM_TYPES;

export type ReviewSubmissionItemState =
  | 'READY_FOR_REVIEW'
  | 'ACCEPTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REMOVED';

export interface ReviewSubmission {
  id: string;
  type: 'reviewSubmissions';
  attributes: {
    platform?: ReviewPlatform;
    submittedDate?: string;
    state?: ReviewSubmissionState;
  };
  relationships?: Record<string, any>;
}

export interface ReviewSubmissionItem {
  id: string;
  type: 'reviewSubmissionItems';
  attributes: {
    state?: ReviewSubmissionItemState;
  };
  relationships?: Record<string, any>;
}

export interface ListReviewSubmissionsResponse extends BaseApiResponse<ReviewSubmission[]> {
  included?: any[];
}
export type ReviewSubmissionResponse = BaseApiResponse<ReviewSubmission>;

export interface ListReviewSubmissionItemsResponse extends BaseApiResponse<ReviewSubmissionItem[]> {
  included?: any[];
}
export type ReviewSubmissionItemResponse = BaseApiResponse<ReviewSubmissionItem>;
