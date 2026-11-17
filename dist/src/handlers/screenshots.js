import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { PREVIEW_TYPES, SCREENSHOT_DISPLAY_TYPES } from '../types/index.js';
import { pathId, validateEnum } from '../utils/index.js';
const parentPath = (args) => {
    const { appStoreVersionLocalizationId: versionLoc, appCustomProductPageLocalizationId: cppLoc } = args;
    if (!versionLoc === !cppLoc) {
        throw new McpError(ErrorCode.InvalidParams, 'Provide exactly one of appStoreVersionLocalizationId or appCustomProductPageLocalizationId');
    }
    return versionLoc
        ? `/appStoreVersionLocalizations/${pathId(versionLoc, 'appStoreVersionLocalizationId')}`
        : `/appCustomProductPageLocalizations/${pathId(cppLoc, 'appCustomProductPageLocalizationId')}`;
};
/** Apple's image templateUrl has {w}, {h} and {f} placeholders; fill them for a full-size PNG. */
const imageUrl = (asset) => asset?.templateUrl && asset.width && asset.height
    ? asset.templateUrl
        .replace('{w}', String(asset.width))
        .replace('{h}', String(asset.height))
        .replace('{f}', 'png')
    : undefined;
const stateErrors = (state) => {
    const errors = (state?.errors ?? []).map(e => [e.code, e.description].filter(Boolean).join(': '));
    return errors.length ? errors : undefined;
};
/**
 * Join sets with their included items, keeping the set's own item order (the
 * order shown on the product page).
 */
const summarizeSets = (response, setTypeAttr, itemsRelationship, summarizeItem) => {
    const included = new Map((response.included ?? []).map(r => [`${r.type}/${r.id}`, r]));
    const data = response.data.map(set => {
        const refs = set.relationships?.[itemsRelationship]?.data ?? [];
        const items = refs
            .map(ref => included.get(`${ref.type}/${ref.id}`))
            .filter((r) => Boolean(r))
            .map(summarizeItem);
        return { id: set.id, type: String(set.attributes?.[setTypeAttr] ?? ''), count: items.length, items };
    });
    return { total: response.meta?.paging?.total ?? data.length, data };
};
export class ScreenshotHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    async listAppScreenshotSets(args) {
        const displayType = validateEnum(args.screenshotDisplayType, SCREENSHOT_DISPLAY_TYPES, 'screenshotDisplayType');
        const params = {
            limit: 200,
            include: 'appScreenshots',
            'limit[appScreenshots]': 50,
            'fields[appScreenshotSets]': 'screenshotDisplayType,appScreenshots',
            'fields[appScreenshots]': 'fileName,fileSize,sourceFileChecksum,imageAsset,assetDeliveryState',
        };
        if (displayType)
            params['filter[screenshotDisplayType]'] = displayType;
        const response = await this.client.get(`${parentPath(args)}/appScreenshotSets`, params);
        return summarizeSets(response, 'screenshotDisplayType', 'appScreenshots', shot => {
            const a = shot.attributes ?? {};
            return {
                id: shot.id,
                fileName: a.fileName,
                fileSize: a.fileSize,
                sourceFileChecksum: a.sourceFileChecksum,
                width: a.imageAsset?.width,
                height: a.imageAsset?.height,
                state: a.assetDeliveryState?.state,
                errors: stateErrors(a.assetDeliveryState),
                imageUrl: args.includeImageUrls ? imageUrl(a.imageAsset) : undefined,
            };
        });
    }
    async listAppPreviewSets(args) {
        const previewType = validateEnum(args.previewType, PREVIEW_TYPES, 'previewType');
        const params = {
            limit: 200,
            include: 'appPreviews',
            'limit[appPreviews]': 50,
            'fields[appPreviewSets]': 'previewType,appPreviews',
            'fields[appPreviews]': 'fileName,fileSize,sourceFileChecksum,mimeType,previewFrameTimeCode,videoUrl,previewImage,assetDeliveryState,videoDeliveryState',
        };
        if (previewType)
            params['filter[previewType]'] = previewType;
        const response = await this.client.get(`${parentPath(args)}/appPreviewSets`, params);
        return summarizeSets(response, 'previewType', 'appPreviews', preview => {
            const a = preview.attributes ?? {};
            return {
                id: preview.id,
                fileName: a.fileName,
                fileSize: a.fileSize,
                sourceFileChecksum: a.sourceFileChecksum,
                mimeType: a.mimeType,
                previewFrameTimeCode: a.previewFrameTimeCode,
                width: a.previewImage?.width,
                height: a.previewImage?.height,
                state: a.assetDeliveryState?.state,
                videoState: a.videoDeliveryState?.state,
                errors: stateErrors(a.assetDeliveryState) ?? stateErrors(a.videoDeliveryState),
                posterUrl: args.includeUrls ? imageUrl(a.previewImage) : undefined,
                videoUrl: args.includeUrls ? a.videoUrl : undefined,
            };
        });
    }
}
