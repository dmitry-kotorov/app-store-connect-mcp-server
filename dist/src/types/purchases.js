// In-App Purchase & subscription types — App Store Connect API 4.6
// Built on the version-based resources (InAppPurchaseVersion, SubscriptionVersion,
// SubscriptionGroupVersion). The v1 localization/image/*Submissions resources are
// deprecated by Apple and are intentionally not used here.
export const PURCHASE_VERSION_STATES = [
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
