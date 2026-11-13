// Review submission types — App Store Connect API 4.6
// /v1/reviewSubmissions + /v1/reviewSubmissionItems: the unified submission flow
// that groups app versions, IAP/subscription versions, CPPs, in-app events, etc.
// (up to 200 items per submission).
export const REVIEW_PLATFORMS = ['IOS', 'MAC_OS', 'TV_OS', 'VISION_OS'];
export const REVIEW_SUBMISSION_STATES = [
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
};
