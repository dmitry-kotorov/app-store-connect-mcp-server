/** Screenshot display types from the API 4.6 spec (AppScreenshotSet.screenshotDisplayType). */
export const SCREENSHOT_DISPLAY_TYPES = [
  'APP_IPHONE_67', 'APP_IPHONE_61', 'APP_IPHONE_65', 'APP_IPHONE_58', 'APP_IPHONE_55',
  'APP_IPHONE_47', 'APP_IPHONE_40', 'APP_IPHONE_35', 'APP_IPAD_PRO_3GEN_129', 'APP_IPAD_PRO_3GEN_11',
  'APP_IPAD_PRO_129', 'APP_IPAD_105', 'APP_IPAD_97', 'APP_DESKTOP', 'APP_WATCH_ULTRA',
  'APP_WATCH_SERIES_10', 'APP_WATCH_SERIES_7', 'APP_WATCH_SERIES_4', 'APP_WATCH_SERIES_3',
  'APP_APPLE_TV', 'APP_APPLE_VISION_PRO', 'IMESSAGE_APP_IPHONE_67', 'IMESSAGE_APP_IPHONE_61',
  'IMESSAGE_APP_IPHONE_65', 'IMESSAGE_APP_IPHONE_58', 'IMESSAGE_APP_IPHONE_55',
  'IMESSAGE_APP_IPHONE_47', 'IMESSAGE_APP_IPHONE_40', 'IMESSAGE_APP_IPAD_PRO_3GEN_129',
  'IMESSAGE_APP_IPAD_PRO_3GEN_11', 'IMESSAGE_APP_IPAD_PRO_129', 'IMESSAGE_APP_IPAD_105',
  'IMESSAGE_APP_IPAD_97',
] as const;
export type ScreenshotDisplayType = typeof SCREENSHOT_DISPLAY_TYPES[number];

/** Preview types from the API 4.6 spec (AppPreviewSet.previewType). */
export const PREVIEW_TYPES = [
  'IPHONE_67', 'IPHONE_61', 'IPHONE_65', 'IPHONE_58', 'IPHONE_55', 'IPHONE_47', 'IPHONE_40',
  'IPHONE_35', 'IPAD_PRO_3GEN_129', 'IPAD_PRO_3GEN_11', 'IPAD_PRO_129', 'IPAD_105', 'IPAD_97',
  'DESKTOP', 'APPLE_TV', 'APPLE_VISION_PRO',
] as const;
export type PreviewType = typeof PREVIEW_TYPES[number];

export interface ImageAsset {
  templateUrl?: string;
  width?: number;
  height?: number;
}

export interface AppMediaState {
  state?: string;
  errors?: Array<{ code?: string; description?: string }>;
  warnings?: Array<{ code?: string; description?: string }>;
}

/** A JSON:API resource as returned in `data` / `included`. */
export interface MediaResource {
  id: string;
  type: string;
  attributes?: Record<string, any>;
  relationships?: Record<string, { data?: Array<{ id: string; type: string }> }>;
}

export interface MediaSetsResponse {
  data: MediaResource[];
  included?: MediaResource[];
  meta?: { paging?: { total: number; limit: number } };
}

/** One screenshot or preview, flattened for the tool result. */
export interface MediaItemSummary {
  id: string;
  fileName?: string;
  fileSize?: number;
  sourceFileChecksum?: string;
  width?: number;
  height?: number;
  state?: string;
  errors?: string[];
  [key: string]: unknown;
}

export interface MediaSetSummary {
  id: string;
  /** screenshotDisplayType or previewType */
  type: string;
  count: number;
  items: MediaItemSummary[];
}
