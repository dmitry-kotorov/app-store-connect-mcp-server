#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';

import { AppStoreConnectConfig } from './types/index.js';
import { AppStoreConnectClient } from './services/index.js';
import { agreementHint } from './utils/index.js';
import { 
  AppHandlers, 
  BetaHandlers, 
  BundleHandlers, 
  DeviceHandlers, 
  UserHandlers, 
  AnalyticsHandlers,
  XcodeHandlers,
  LocalizationHandlers,
  ReviewHandlers,
  PurchaseHandlers,
  SubmissionHandlers,
  ScreenshotHandlers
} from './handlers/index.js';

// Load environment variables
const config: AppStoreConnectConfig = {
  keyId: process.env.APP_STORE_CONNECT_KEY_ID!,
  issuerId: process.env.APP_STORE_CONNECT_ISSUER_ID!,
  privateKeyPath: process.env.APP_STORE_CONNECT_P8_PATH!,
  vendorNumber: process.env.APP_STORE_CONNECT_VENDOR_NUMBER, // Optional for sales/finance reports
};

class AppStoreConnectServer {
  private server: Server;
  private client: AppStoreConnectClient;
  private appHandlers: AppHandlers;
  private betaHandlers: BetaHandlers;
  private bundleHandlers: BundleHandlers;
  private deviceHandlers: DeviceHandlers;
  private userHandlers: UserHandlers;
  private analyticsHandlers: AnalyticsHandlers;
  private xcodeHandlers: XcodeHandlers;
  private localizationHandlers: LocalizationHandlers;
  private reviewHandlers: ReviewHandlers;
  private purchaseHandlers: PurchaseHandlers;
  private submissionHandlers: SubmissionHandlers;
  private screenshotHandlers: ScreenshotHandlers;

  constructor() {
    this.server = new Server({
      name: "appstore-connect-server",
      version: "1.0.0"
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.client = new AppStoreConnectClient(config);
    this.appHandlers = new AppHandlers(this.client);
    this.betaHandlers = new BetaHandlers(this.client);
    this.bundleHandlers = new BundleHandlers(this.client);
    this.deviceHandlers = new DeviceHandlers(this.client);
    this.userHandlers = new UserHandlers(this.client);
    this.analyticsHandlers = new AnalyticsHandlers(this.client, config);
    this.xcodeHandlers = new XcodeHandlers();
    this.localizationHandlers = new LocalizationHandlers(this.client);
    this.reviewHandlers = new ReviewHandlers(this.client);
    this.purchaseHandlers = new PurchaseHandlers(this.client);
    this.submissionHandlers = new SubmissionHandlers(this.client);
    this.screenshotHandlers = new ScreenshotHandlers(this.client);

    this.setupHandlers();
  }

  private buildToolsList() {
    const baseTools = [
        // App Management Tools
        {
          name: "list_apps",
          description: "Get a list of all apps in App Store Connect",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of apps to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            }
          }
        },
        {
          name: "get_app_info",
          description: "Get detailed information about a specific app",
          inputSchema: {
            type: "object", 
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app to get information for"
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "appClips", "appInfos", "appStoreVersions", "availableTerritories",
                    "betaAppReviewDetail", "betaGroups", "betaLicenseAgreement", "builds",
                    "endUserLicenseAgreement", "gameCenterEnabledVersions", "inAppPurchases",
                    "preOrder", "prices", "reviewSubmissions"
                  ]
                },
                description: "Optional relationships to include in the response"
              }
            },
            required: ["appId"]
          }
        },

        // Beta Testing Tools
        {
          name: "list_beta_groups",
          description: "Get a list of all beta groups (internal and external)",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of groups to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            }
          }
        },
        {
          name: "list_group_testers",
          description: "Get a list of all testers in a specific beta group",
          inputSchema: {
            type: "object",
            properties: {
              groupId: {
                type: "string",
                description: "The ID of the beta group"
              },
              limit: {
                type: "number",
                description: "Maximum number of testers to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["groupId"]
          }
        },
        {
          name: "add_tester_to_group",
          description: "Add a new tester to a beta group",
          inputSchema: {
            type: "object",
            properties: {
              groupId: {
                type: "string",
                description: "The ID of the beta group"
              },
              email: {
                type: "string",
                description: "Email address of the tester"
              },
              firstName: {
                type: "string",
                description: "First name of the tester"
              },
              lastName: {
                type: "string",
                description: "Last name of the tester"
              }
            },
            required: ["groupId", "email", "firstName", "lastName"]
          }
        },
        {
          name: "remove_tester_from_group",
          description: "Remove a tester from a beta group",
          inputSchema: {
            type: "object",
            properties: {
              groupId: {
                type: "string",
                description: "The ID of the beta group"
              },
              testerId: {
                type: "string",
                description: "The ID of the beta tester"
              }
            },
            required: ["groupId", "testerId"]
          }
        },
        {
          name: "list_beta_feedback_screenshots",
          description: "List all beta feedback screenshot submissions for an app. This includes feedback with screenshots, device information, and tester comments. You can identify the app using either appId or bundleId.",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app to get feedback for (e.g., '6747745091')"
              },
              bundleId: {
                type: "string",
                description: "The bundle ID of the app (e.g., 'com.example.app'). Can be used instead of appId."
              },
              buildId: {
                type: "string",
                description: "Filter by specific build ID (optional)"
              },
              devicePlatform: {
                type: "string",
                enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"],
                description: "Filter by device platform (optional)"
              },
              appPlatform: {
                type: "string",
                enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"],
                description: "Filter by app platform (optional)"
              },
              deviceModel: {
                type: "string",
                description: "Filter by device model (e.g., 'iPhone15_2') (optional)"
              },
              osVersion: {
                type: "string",
                description: "Filter by OS version (e.g., '18.4.1') (optional)"
              },
              testerId: {
                type: "string",
                description: "Filter by specific tester ID (optional)"
              },
              limit: {
                type: "number",
                description: "Maximum number of feedback items to return (default: 50, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                enum: ["createdDate", "-createdDate"],
                description: "Sort order for results (default: -createdDate for newest first)"
              },
              includeBuilds: {
                type: "boolean",
                description: "Include build information in response (optional)",
                default: false
              },
              includeTesters: {
                type: "boolean",
                description: "Include tester information in response (optional)",
                default: false
              }
            },
            required: []
          }
        },
        {
          name: "get_beta_feedback_screenshot",
          description: "Get detailed information about a specific beta feedback screenshot submission. By default, downloads and returns the screenshot image.",
          inputSchema: {
            type: "object",
            properties: {
              feedbackId: {
                type: "string",
                description: "The ID of the beta feedback screenshot submission"
              },
              includeBuilds: {
                type: "boolean",
                description: "Include build information in response (optional)",
                default: false
              },
              includeTesters: {
                type: "boolean",
                description: "Include tester information in response (optional)",
                default: false
              },
              downloadScreenshot: {
                type: "boolean",
                description: "Download and return the screenshot as an image (default: true)",
                default: true
              }
            },
            required: ["feedbackId"]
          }
        },
        
        // App Store Version Localization Tools
        {
          name: "create_app_store_version",
          description: "Create a new app store version for an app",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app"
              },
              platform: {
                type: "string",
                description: "The platform for this version",
                enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"]
              },
              versionString: {
                type: "string",
                description: "Version string in format X.Y or X.Y.Z (e.g., '1.0' or '1.0.0')"
              },
              copyright: {
                type: "string",
                description: "Copyright text for this version (optional)"
              },
              releaseType: {
                type: "string",
                description: "How the app should be released",
                enum: ["MANUAL", "AFTER_APPROVAL", "SCHEDULED"]
              },
              earliestReleaseDate: {
                type: "string",
                description: "Earliest release date in ISO 8601 format (required when releaseType is SCHEDULED)"
              },
              buildId: {
                type: "string",
                description: "ID of the build to associate with this version (optional)"
              }
            },
            required: ["appId", "platform", "versionString"]
          }
        },
        {
          name: "list_app_store_versions",
          description: "List an app's App Store versions as a compact list ({id, ...attributes, isLive}, one per line). isLive is inferred: per platform, the most recently created version in READY_FOR_DISTRIBUTION. Apple keeps every released version at appStoreState READY_FOR_SALE / appVersionState READY_FOR_DISTRIBUTION, so neither field identifies the live one",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app"
              },
              limit: {
                type: "number",
                description: "Maximum number of versions to return (default: 100)",
                minimum: 1,
                maximum: 200
              },
              fields: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["platform", "versionString", "appStoreState", "appVersionState", "copyright", "reviewType", "releaseType", "earliestReleaseDate", "usesIdfa", "downloadable", "createdDate"]
                },
                description: "Attributes to return (default: versionString, platform, appVersionState, releaseType, earliestReleaseDate, createdDate). appStoreState is deprecated by Apple"
              },
              raw: {
                type: "boolean",
                description: "Return Apple's full JSON:API response (all attributes, relationships and links unless fields is set) instead of the compact list. Large: ~5 KB per version",
                default: false
              },
              filter: {
                type: "object",
                properties: {
                  platform: {
                    type: "string",
                    description: "Filter by platform",
                    enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"]
                  },
                  versionString: {
                    type: "string",
                    description: "Filter by version string (e.g., '1.0.0')"
                  },
                  appVersionState: {
                    type: "string",
                    description: "Filter by version state",
                    enum: ["ACCEPTED", "DEVELOPER_REJECTED", "IN_REVIEW", "INVALID_BINARY", "METADATA_REJECTED", "PENDING_APPLE_RELEASE", "PENDING_DEVELOPER_RELEASE", "PREPARE_FOR_SUBMISSION", "PROCESSING_FOR_DISTRIBUTION", "READY_FOR_DISTRIBUTION", "READY_FOR_REVIEW", "REJECTED", "REPLACED_WITH_NEW_VERSION", "WAITING_FOR_EXPORT_COMPLIANCE", "WAITING_FOR_REVIEW"]
                  },
                  appStoreState: {
                    type: "string",
                    description: "Filter by app store state (deprecated by Apple; prefer appVersionState)",
                    enum: ["ACCEPTED", "DEVELOPER_REMOVED_FROM_SALE", "DEVELOPER_REJECTED", "IN_REVIEW", "INVALID_BINARY", "METADATA_REJECTED", "PENDING_APPLE_RELEASE", "PENDING_CONTRACT", "PENDING_DEVELOPER_RELEASE", "PREPARE_FOR_SUBMISSION", "PREORDER_READY_FOR_SALE", "PROCESSING_FOR_APP_STORE", "READY_FOR_REVIEW", "READY_FOR_SALE", "REJECTED", "REMOVED_FROM_SALE", "WAITING_FOR_EXPORT_COMPLIANCE", "WAITING_FOR_REVIEW", "REPLACED_WITH_NEW_VERSION", "NOT_APPLICABLE"]
                  }
                },
                description: "Optional filters for app store versions"
              }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_app_screenshot_sets",
          description: "List the screenshot sets of a version localization (or custom product page localization), each with its screenshots in display order: file name, size, source file checksum, dimensions, delivery state. Comparing checksums across versions shows when screenshots changed. A locale with no sets of its own falls back to another locale's screenshots on the store. Get the localization id with list_app_store_version_localizations using filter.locale and fields [\"locale\"] (unfiltered it returns every locale's full text)",
          inputSchema: {
            type: "object",
            properties: {
              appStoreVersionLocalizationId: {
                type: "string",
                description: "An App Store version localization ID (from list_app_store_version_localizations)"
              },
              appCustomProductPageLocalizationId: {
                type: "string",
                description: "Alternatively: a custom product page localization ID"
              },
              screenshotDisplayType: {
                type: "string",
                enum: ["APP_IPHONE_67", "APP_IPHONE_61", "APP_IPHONE_65", "APP_IPHONE_58", "APP_IPHONE_55", "APP_IPHONE_47", "APP_IPHONE_40", "APP_IPHONE_35", "APP_IPAD_PRO_3GEN_129", "APP_IPAD_PRO_3GEN_11", "APP_IPAD_PRO_129", "APP_IPAD_105", "APP_IPAD_97", "APP_DESKTOP", "APP_WATCH_ULTRA", "APP_WATCH_SERIES_10", "APP_WATCH_SERIES_7", "APP_WATCH_SERIES_4", "APP_WATCH_SERIES_3", "APP_APPLE_TV", "APP_APPLE_VISION_PRO", "IMESSAGE_APP_IPHONE_67", "IMESSAGE_APP_IPHONE_61", "IMESSAGE_APP_IPHONE_65", "IMESSAGE_APP_IPHONE_58", "IMESSAGE_APP_IPHONE_55", "IMESSAGE_APP_IPHONE_47", "IMESSAGE_APP_IPHONE_40", "IMESSAGE_APP_IPAD_PRO_3GEN_129", "IMESSAGE_APP_IPAD_PRO_3GEN_11", "IMESSAGE_APP_IPAD_PRO_129", "IMESSAGE_APP_IPAD_105", "IMESSAGE_APP_IPAD_97"],
                description: "Only this display type, e.g. APP_IPHONE_65 (6.5-inch iPhone) or APP_IPHONE_67"
              },
              includeImageUrls: {
                type: "boolean",
                description: "Add a full-size image URL per screenshot (default false)",
                default: false
              }
            }
          }
        },
        {
          name: "list_app_preview_sets",
          description: "List the app preview (video) sets of a version localization (or custom product page localization), each with its previews: file name, size, checksum, poster frame time code, delivery states",
          inputSchema: {
            type: "object",
            properties: {
              appStoreVersionLocalizationId: {
                type: "string",
                description: "An App Store version localization ID (from list_app_store_version_localizations)"
              },
              appCustomProductPageLocalizationId: {
                type: "string",
                description: "Alternatively: a custom product page localization ID"
              },
              previewType: {
                type: "string",
                enum: ["IPHONE_67", "IPHONE_61", "IPHONE_65", "IPHONE_58", "IPHONE_55", "IPHONE_47", "IPHONE_40", "IPHONE_35", "IPAD_PRO_3GEN_129", "IPAD_PRO_3GEN_11", "IPAD_PRO_129", "IPAD_105", "IPAD_97", "DESKTOP", "APPLE_TV", "APPLE_VISION_PRO"],
                description: "Only this preview type, e.g. IPHONE_65"
              },
              includeUrls: {
                type: "boolean",
                description: "Add poster image and video URLs per preview (default false)",
                default: false
              }
            }
          }
        },
        {
          name: "list_app_store_version_localizations",
          description: "Get all localizations for a specific app store version",
          inputSchema: {
            type: "object",
            properties: {
              appStoreVersionId: {
                type: "string",
                description: "The ID of the app store version"
              },
              limit: {
                type: "number",
                description: "Maximum number of localizations to return (default: 100)",
                minimum: 1,
                maximum: 200
              },
              filter: {
                type: "object",
                properties: {
                  locale: {
                    type: "string",
                    description: "Filter by locale (e.g., en-US)"
                  }
                },
                description: "Optional filters for localizations"
              },
              fields: {
                type: "object",
                properties: {
                  appStoreVersionLocalizations: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "description",
                        "keywords",
                        "locale",
                        "marketingUrl",
                        "promotionalText",
                        "supportUrl",
                        "whatsNew"
                      ]
                    },
                    description: "Fields to include for app store version localizations"
                  }
                },
                description: "Optional fields selection for localizations"
              }
            },
            required: ["appStoreVersionId"]
          }
        },
        {
          name: "get_app_store_version_localization",
          description: "Get detailed information about a specific app store version localization",
          inputSchema: {
            type: "object",
            properties: {
              localizationId: {
                type: "string",
                description: "The ID of the app store version localization"
              }
            },
            required: ["localizationId"]
          }
        },
        {
          name: "update_app_store_version_localization",
          description: "Update a specific field in an app store version localization",
          inputSchema: {
            type: "object",
            properties: {
              localizationId: {
                type: "string",
                description: "The ID of the app store version localization to update"
              },
              field: {
                type: "string",
                enum: ["description", "keywords", "marketingUrl", "promotionalText", "supportUrl", "whatsNew"],
                description: "The field to update"
              },
              value: {
                type: "string",
                description: "The new value for the field"
              }
            },
            required: ["localizationId", "field", "value"]
          }
        },
        {
          name: "list_app_custom_product_pages",
          description: "List all custom product pages (CPPs) for an app, each with its human-readable name, App Store URL, and visibility. The page id is the public ppid — the same value Apple Ads returns as productPageId on CUSTOM_PRODUCT_PAGE creatives — so this closes the UUID↔name gap.",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The app ID (e.g. 656212466)"
              },
              visible: {
                type: "boolean",
                description: "Optional filter: only pages with this visibility (true/false)"
              },
              limit: {
                type: "number",
                description: "Maximum number of pages to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_app_custom_product_page_localizations",
          description: "List all custom product page versions and their localizations for a specific page",
          inputSchema: {
            type: "object",
            properties: {
              appCustomProductPageId: {
                type: "string",
                description: "The ID of the custom product page"
              },
              versionLimit: {
                type: "number",
                description: "Maximum number of versions to return (default: 100)",
                minimum: 1,
                maximum: 200
              },
              localizationLimit: {
                type: "number",
                description: "Maximum number of localizations to return per version (default: 200)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["appCustomProductPageId"]
          }
        },
        {
          name: "create_app_custom_product_page",
          description: "Create a new custom product page (CPP) for an app. Returns the new page with its id (ppid). A version and localizations must be created separately (see create_app_custom_product_page_version).",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The app ID the page belongs to (e.g. 656212466)"
              },
              name: {
                type: "string",
                description: "Human-readable name for the page (internal, e.g. cpp-<intent>-<locale>-vN)"
              }
            },
            required: ["appId", "name"]
          }
        },
        {
          name: "create_app_custom_product_page_version",
          description: "Create a new version for an existing custom product page. Localizations attach to a version.",
          inputSchema: {
            type: "object",
            properties: {
              appCustomProductPageId: {
                type: "string",
                description: "The ID of the custom product page to add a version to"
              }
            },
            required: ["appCustomProductPageId"]
          }
        },
        {
          name: "create_app_custom_product_page_localization",
          description: "Create a locale-specific localization on a custom product page version. Only locale and promotionalText are supported for CPPs.",
          inputSchema: {
            type: "object",
            properties: {
              appCustomProductPageVersionId: {
                type: "string",
                description: "The ID of the custom product page version"
              },
              locale: {
                type: "string",
                description: "Locale code (e.g. en-US, en-GB)"
              },
              promotionalText: {
                type: "string",
                description: "Optional promotional text for this locale"
              }
            },
            required: ["appCustomProductPageVersionId", "locale"]
          }
        },
        {
          name: "update_app_custom_product_page_localization",
          description: "Update the promotional text of a custom product page localization.",
          inputSchema: {
            type: "object",
            properties: {
              localizationId: {
                type: "string",
                description: "The ID of the custom product page localization to update"
              },
              promotionalText: {
                type: "string",
                description: "The new promotional text"
              }
            },
            required: ["localizationId", "promotionalText"]
          }
        },

        // App Info Localization Tools
        {
          name: "list_app_infos",
          description: "List all appInfo objects for an app. Each appInfo represents a platform state and contains app-level metadata like age ratings. Use the returned appInfo ID to list or update appInfoLocalizations (subtitles, localized app names, etc.)",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app"
              },
              limit: {
                type: "number",
                description: "Maximum number of appInfos to return (default: 100)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_app_info_localizations",
          description: "List all localizations for an appInfo object. Returns app-level localized fields including subtitle, localized app name, and privacy policy information.",
          inputSchema: {
            type: "object",
            properties: {
              appInfoId: {
                type: "string",
                description: "The ID of the appInfo resource (get this from list_app_infos)"
              },
              limit: {
                type: "number",
                description: "Maximum number of localizations to return (default: 100)",
                minimum: 1,
                maximum: 200
              },
              filter: {
                type: "object",
                properties: {
                  locale: {
                    type: "string",
                    description: "Filter by locale (e.g., en-US)"
                  }
                },
                description: "Optional filters for localizations"
              },
              fields: {
                type: "object",
                properties: {
                  appInfoLocalizations: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "locale",
                        "name",
                        "subtitle",
                        "privacyPolicyUrl",
                        "privacyChoicesUrl",
                        "privacyPolicyText"
                      ]
                    },
                    description: "Fields to include for app info localizations"
                  }
                },
                description: "Optional fields selection for localizations"
              }
            },
            required: ["appInfoId"]
          }
        },
        {
          name: "get_app_info_localization",
          description: "Get detailed information about a specific app info localization, including subtitle, localized app name, and privacy policy fields",
          inputSchema: {
            type: "object",
            properties: {
              localizationId: {
                type: "string",
                description: "The ID of the app info localization"
              }
            },
            required: ["localizationId"]
          }
        },
        {
          name: "update_app_info_localization",
          description: "Update a specific field in an app info localization. Use this to update subtitles, localized app names, and privacy policy information.",
          inputSchema: {
            type: "object",
            properties: {
              localizationId: {
                type: "string",
                description: "The ID of the app info localization to update"
              },
              field: {
                type: "string",
                enum: ["name", "subtitle", "privacyPolicyUrl", "privacyChoicesUrl", "privacyPolicyText"],
                description: "The field to update"
              },
              value: {
                type: "string",
                description: "The new value for the field"
              }
            },
            required: ["localizationId", "field", "value"]
          }
        },

        // Bundle ID Tools
        {
          name: "create_bundle_id",
          description: "Register a new bundle ID for app development",
          inputSchema: {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                description: "The bundle ID string (e.g., 'com.example.app')"
              },
              name: {
                type: "string",
                description: "A name for the bundle ID"
              },
              platform: {
                type: "string",
                enum: ["IOS", "MAC_OS", "UNIVERSAL"],
                description: "The platform for this bundle ID"
              },
              seedId: {
                type: "string",
                description: "Your team's seed ID (optional)"
              }
            },
            required: ["identifier", "name", "platform"]
          }
        },
        {
          name: "list_bundle_ids",
          description: "Find and list bundle IDs that are registered to your team",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of bundle IDs to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: [
                  "name", "-name", "platform", "-platform", 
                  "identifier", "-identifier", "seedId", "-seedId", "id", "-id"
                ]
              },
              filter: {
                type: "object",
                properties: {
                  identifier: { type: "string", description: "Filter by bundle identifier" },
                  name: { type: "string", description: "Filter by name" },
                  platform: { 
                    type: "string", 
                    description: "Filter by platform",
                    enum: ["IOS", "MAC_OS", "UNIVERSAL"]
                  },
                  seedId: { type: "string", description: "Filter by seed ID" }
                }
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["profiles", "bundleIdCapabilities", "app"]
                },
                description: "Related resources to include in the response"
              }
            }
          }
        },
        {
          name: "get_bundle_id_info",
          description: "Get detailed information about a specific bundle ID",
          inputSchema: {
            type: "object",
            properties: {
              bundleIdId: {
                type: "string",
                description: "The ID of the bundle ID to get information for"
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["profiles", "bundleIdCapabilities", "app"]
                },
                description: "Optional relationships to include in the response"
              },
              fields: {
                type: "object",
                properties: {
                  bundleIds: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["name", "platform", "identifier", "seedId"]
                    },
                    description: "Fields to include for the bundle ID"
                  }
                },
                description: "Specific fields to include in the response"
              }
            },
            required: ["bundleIdId"]
          }
        },
        {
          name: "enable_bundle_capability",
          description: "Enable a capability for a bundle ID",
          inputSchema: {
            type: "object",
            properties: {
              bundleIdId: {
                type: "string",
                description: "The ID of the bundle ID"
              },
              capabilityType: {
                type: "string",
                description: "The type of capability to enable",
                enum: [
                  "ICLOUD", "IN_APP_PURCHASE", "GAME_CENTER", "PUSH_NOTIFICATIONS", "WALLET",
                  "INTER_APP_AUDIO", "MAPS", "ASSOCIATED_DOMAINS", "PERSONAL_VPN", "APP_GROUPS",
                  "HEALTHKIT", "HOMEKIT", "WIRELESS_ACCESSORY_CONFIGURATION", "APPLE_PAY",
                  "DATA_PROTECTION", "SIRIKIT", "NETWORK_EXTENSIONS", "MULTIPATH", "HOT_SPOT",
                  "NFC_TAG_READING", "CLASSKIT", "AUTOFILL_CREDENTIAL_PROVIDER", "ACCESS_WIFI_INFORMATION",
                  "NETWORK_CUSTOM_PROTOCOL", "COREMEDIA_HLS_LOW_LATENCY", "SYSTEM_EXTENSION_INSTALL",
                  "USER_MANAGEMENT", "APPLE_ID_AUTH"
                ]
              },
              settings: {
                type: "array",
                description: "Optional capability settings",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string", description: "The setting key" },
                    options: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          key: { type: "string" },
                          enabled: { type: "boolean" }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ["bundleIdId", "capabilityType"]
          }
        },
        {
          name: "disable_bundle_capability",
          description: "Disable a capability for a bundle ID",
          inputSchema: {
            type: "object",
            properties: {
              capabilityId: {
                type: "string",
                description: "The ID of the capability to disable"
              }
            },
            required: ["capabilityId"]
          }
        },

        // Device Management Tools
        {
          name: "list_devices",
          description: "Get a list of all devices registered to your team",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of devices to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: [
                  "name", "-name", "platform", "-platform", "status", "-status",
                  "udid", "-udid", "deviceClass", "-deviceClass", "model", "-model",
                  "addedDate", "-addedDate"
                ]
              },
              filter: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Filter by device name" },
                  platform: { 
                    type: "string", 
                    description: "Filter by platform",
                    enum: ["IOS", "MAC_OS"]
                  },
                  status: { 
                    type: "string", 
                    description: "Filter by status",
                    enum: ["ENABLED", "DISABLED"]
                  },
                  udid: { type: "string", description: "Filter by device UDID" },
                  deviceClass: { 
                    type: "string", 
                    description: "Filter by device class",
                    enum: ["APPLE_WATCH", "IPAD", "IPHONE", "IPOD", "APPLE_TV", "MAC"]
                  }
                }
              },
              fields: {
                type: "object",
                properties: {
                  devices: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["name", "platform", "udid", "deviceClass", "status", "model", "addedDate"]
                    },
                    description: "Fields to include for each device"
                  }
                }
              }
            }
          }
        },

        // User Management Tools
        {
          name: "list_users",
          description: "Get a list of all users registered on your App Store Connect team",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of users to return (default: 100, max: 200)",
                minimum: 1,
                maximum: 200
              },
              sort: {
                type: "string",
                description: "Sort order for the results",
                enum: ["username", "-username", "firstName", "-firstName", "lastName", "-lastName", "roles", "-roles"]
              },
              filter: {
                type: "object",
                properties: {
                  username: { type: "string", description: "Filter by username" },
                  roles: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "ADMIN", "FINANCE", "TECHNICAL", "SALES", "MARKETING", "DEVELOPER",
                        "ACCOUNT_HOLDER", "READ_ONLY", "APP_MANAGER", "ACCESS_TO_REPORTS", "CUSTOMER_SUPPORT"
                      ]
                    },
                    description: "Filter by user roles"
                  },
                  visibleApps: {
                    type: "array",
                    items: { type: "string" },
                    description: "Filter by apps the user can see (app IDs)"
                  }
                }
              },
              include: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["visibleApps"]
                },
                description: "Related resources to include in the response"
              }
            }
          }
        },

        // Analytics & Reports Tools
        {
          name: "create_analytics_report_request",
          description: "Create an analytics report request for an app. If Apple answers that one already exists (e.g. the app's ONGOING request), the existing request(s) are returned with alreadyExisted: true",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app to generate analytics reports for"
              },
              accessType: {
                type: "string",
                enum: ["ONGOING", "ONE_TIME_SNAPSHOT"],
                description: "Access type for the analytics report (ONGOING for daily data, ONE_TIME_SNAPSHOT for historical data)",
                default: "ONE_TIME_SNAPSHOT"
              }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_analytics_report_requests",
          description: "List an app's analytics report requests (id, accessType, stoppedDueToInactivity). Start of the chain: requests -> reports -> instances -> segments -> download",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The ID of the app"
              },
              accessType: {
                type: "string",
                enum: ["ONGOING", "ONE_TIME_SNAPSHOT"],
                description: "Only requests of this access type"
              },
              limit: {
                type: "number",
                description: "Maximum number of requests to return (default: 50)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_analytics_reports",
          description: "List the reports of an analytics report request (id, name, category). An ONGOING request has ~200 reports (~24k characters); filter by name or category when you know what you need",
          inputSchema: {
            type: "object",
            properties: {
              reportRequestId: {
                type: "string",
                description: "The ID of the analytics report request"
              },
              limit: {
                type: "number",
                description: "Maximum number of reports to return (default: 200)",
                minimum: 1,
                maximum: 200
              },
              filter: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["APP_USAGE", "APP_STORE_ENGAGEMENT", "COMMERCE", "FRAMEWORK_USAGE", "PERFORMANCE"],
                    description: "Filter by report category"
                  },
                  name: {
                    type: "string",
                    description: "Filter by exact report name, e.g. 'App Downloads Detailed'"
                  }
                }
              }
            },
            required: ["reportRequestId"]
          }
        },
        {
          name: "list_analytics_report_instances",
          description: "List the instances of an analytics report: one per granularity and processing date (not returned in date order; filter by processingDate to pick one). Each instance holds the data segments. Adjacent DAILY instances overlap (each holds about two days of data), so group by Date and take each date once rather than summing instances",
          inputSchema: {
            type: "object",
            properties: {
              reportId: {
                type: "string",
                description: "The ID of the analytics report"
              },
              granularity: {
                type: "string",
                enum: ["DAILY", "WEEKLY", "MONTHLY"],
                description: "Only instances of this granularity"
              },
              processingDate: {
                type: "string",
                description: "Only the instance processed on this date (YYYY-MM-DD). A DAILY instance covers the one to two days before its processing date"
              },
              limit: {
                type: "number",
                description: "Maximum number of instances to return (default: 200)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["reportId"]
          }
        },
        {
          name: "list_analytics_report_segments",
          description: "List the data segments of an analytics report instance (id, size, checksum). Download them with download_analytics_report_segment",
          inputSchema: {
            type: "object",
            properties: {
              instanceId: {
                type: "string",
                description: "The ID of the analytics report instance"
              },
              limit: {
                type: "number",
                description: "Maximum number of segments to return (default: 200)",
                minimum: 1,
                maximum: 200
              }
            },
            required: ["instanceId"]
          }
        },
        {
          name: "download_analytics_report_segment",
          description: "Download an analytics report segment (or every segment of an instance), unpacked to tab-separated text. Filter rows, pick columns or aggregate with groupBy/sum to keep the result small. A DAILY instance holds about two days that the neighbouring instances repeat; include Date in groupBy",
          inputSchema: {
            type: "object",
            properties: {
              segmentId: {
                type: "string",
                description: "The ID of one segment (from list_analytics_report_segments)"
              },
              instanceId: {
                type: "string",
                description: "Alternatively: the ID of an instance; all its segments are downloaded and combined"
              },
              filter: {
                type: "object",
                additionalProperties: { type: ["string", "array"], items: { type: "string" } },
                description: "Keep only rows whose column equals the value (or any of the values); case-insensitive. Keys are report column names as listed in the 'Columns:' line of a previous result"
              },
              groupBy: {
                type: "array",
                items: { type: "string" },
                description: "Aggregate: one output row per distinct combination of these columns, with the sum columns summed and a row count"
              },
              sum: {
                type: "array",
                items: { type: "string" },
                description: "Numeric columns to sum per group and in the totals line (default: 'Counts' when present)"
              },
              columns: {
                type: "array",
                items: { type: "string" },
                description: "Without groupBy: which columns to return (default: all)"
              },
              limit: {
                type: "number",
                description: "Maximum output rows (default 50, max 1000)",
                minimum: 1,
                maximum: 1000
              }
            }
          }
        },

        // Xcode Development Tools
        {
          name: "list_schemes",
          description: "List all available schemes in an Xcode project or workspace",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "Path to the Xcode project (.xcodeproj) or workspace (.xcworkspace)"
              }
            },
            required: ["projectPath"]
          }
        },

        // Customer Review Tools
        {
          name: "list_customer_reviews",
          description: "List public App Store customer reviews for an app. Returns rating, title, body, reviewer nickname, territory, created date, and any developer response. Supports filtering by star rating and territory, sorting, and full pagination via allPages to pull the complete review history (useful for gathering testimonials per locale/territory). Identify the app with either appId or bundleId.",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "The App Store app ID (e.g., '656212466')"
              },
              bundleId: {
                type: "string",
                description: "The bundle ID (e.g., 'com.example.app'). Used to resolve appId when appId is omitted."
              },
              rating: {
                type: "array",
                items: { type: "number", minimum: 1, maximum: 5 },
                description: "Filter by star rating(s), 1-5 (e.g., [5] for five-star reviews only)"
              },
              territory: {
                type: "array",
                items: { type: "string" },
                description: "Filter by App Store territory code(s), e.g. ['USA','GBR','ESP','RUS','FRA','DEU']"
              },
              sort: {
                type: "string",
                enum: ["rating", "-rating", "createdDate", "-createdDate"],
                description: "Sort order (default: -createdDate, newest first)"
              },
              limit: {
                type: "number",
                description: "Page size, max 200 (default: 200)",
                minimum: 1,
                maximum: 200
              },
              allPages: {
                type: "boolean",
                description: "Follow pagination and fetch up to maxTotal reviews across pages (default: false)",
                default: false
              },
              maxTotal: {
                type: "number",
                description: "Cap on total reviews fetched when allPages is true (default: 500)",
                minimum: 1
              },
              includeResponse: {
                type: "boolean",
                description: "Include the developer response for each review (default: true)",
                default: true
              }
            },
            required: []
          }
        },

        // In-App Purchase & Subscription Tools (version-based resources, API 4.6)
        {
          name: "list_in_app_purchases",
          description: "List an app's In-App Purchases (consumable, non-consumable, non-renewing subscription) via the v2 resource. By default includes each IAP's versions (InAppPurchaseVersion) — the version id is what you add to a review submission. Auto-renewable subscriptions live under subscription groups (see list_subscription_groups).",
          inputSchema: {
            type: "object",
            properties: {
              appId: { type: "string", description: "The app ID (e.g. 656212466)" },
              state: {
                type: "array",
                items: { type: "string", enum: ["MISSING_METADATA", "WAITING_FOR_UPLOAD", "PROCESSING_CONTENT", "READY_TO_SUBMIT", "WAITING_FOR_REVIEW", "IN_REVIEW", "DEVELOPER_ACTION_NEEDED", "PENDING_BINARY_APPROVAL", "APPROVED", "DEVELOPER_REMOVED_FROM_SALE", "REMOVED_FROM_SALE", "REJECTED"] },
                description: "Optional filter by IAP state(s)"
              },
              inAppPurchaseType: {
                type: "array",
                items: { type: "string", enum: ["CONSUMABLE", "NON_CONSUMABLE", "NON_RENEWING_SUBSCRIPTION"] },
                description: "Optional filter by IAP type(s)"
              },
              productId: { type: "array", items: { type: "string" }, description: "Optional filter by product ID(s)" },
              includeVersions: { type: "boolean", description: "Include IAP versions (default: true)", default: true },
              limit: { type: "number", description: "Maximum number of IAPs to return (default: 100)", minimum: 1, maximum: 200 }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_subscription_groups",
          description: "List an app's auto-renewable subscription groups. By default includes each group's subscriptions and group versions (SubscriptionGroupVersion).",
          inputSchema: {
            type: "object",
            properties: {
              appId: { type: "string", description: "The app ID (e.g. 656212466)" },
              includeSubscriptions: { type: "boolean", description: "Include subscriptions in each group (default: true)", default: true },
              includeVersions: { type: "boolean", description: "Include subscription group versions (default: true)", default: true },
              limit: { type: "number", description: "Maximum number of groups to return (default: 100)", minimum: 1, maximum: 200 }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_subscriptions",
          description: "List the subscriptions in a subscription group. By default includes each subscription's versions (SubscriptionVersion).",
          inputSchema: {
            type: "object",
            properties: {
              subscriptionGroupId: { type: "string", description: "The subscription group ID" },
              state: {
                type: "array",
                items: { type: "string", enum: ["MISSING_METADATA", "READY_TO_SUBMIT", "WAITING_FOR_REVIEW", "IN_REVIEW", "DEVELOPER_ACTION_NEEDED", "PENDING_BINARY_APPROVAL", "APPROVED", "DEVELOPER_REMOVED_FROM_SALE", "REMOVED_FROM_SALE", "REJECTED"] },
                description: "Optional filter by subscription state(s)"
              },
              productId: { type: "array", items: { type: "string" }, description: "Optional filter by product ID(s)" },
              includeVersions: { type: "boolean", description: "Include subscription versions (default: true)", default: true },
              limit: { type: "number", description: "Maximum number of subscriptions to return (default: 100)", minimum: 1, maximum: 200 }
            },
            required: ["subscriptionGroupId"]
          }
        },
        {
          name: "list_in_app_purchase_versions",
          description: "List the versions of an In-App Purchase (GET /v2/inAppPurchases/{id}/versions). Optionally include each version's localizations.",
          inputSchema: {
            type: "object",
            properties: {
              inAppPurchaseId: { type: "string", description: "The In-App Purchase ID" },
              state: { type: "string", enum: ["PREPARE_FOR_SUBMISSION", "READY_FOR_REVIEW", "WAITING_FOR_REVIEW", "IN_REVIEW", "ACCEPTED", "APPROVED", "REPLACED_WITH_NEW_VERSION", "REJECTED", "DEVELOPER_REJECTED"], description: "Optional filter by version state" },
              includeLocalizations: { type: "boolean", description: "Include version localizations (default: false)", default: false },
              limit: { type: "number", description: "Maximum number of versions to return (default: 100)", minimum: 1, maximum: 200 }
            },
            required: ["inAppPurchaseId"]
          }
        },
        {
          name: "list_subscription_versions",
          description: "List the versions of an auto-renewable subscription. Optionally include each version's localizations.",
          inputSchema: {
            type: "object",
            properties: {
              subscriptionId: { type: "string", description: "The subscription ID" },
              state: { type: "string", enum: ["PREPARE_FOR_SUBMISSION", "READY_FOR_REVIEW", "WAITING_FOR_REVIEW", "IN_REVIEW", "ACCEPTED", "APPROVED", "REPLACED_WITH_NEW_VERSION", "REJECTED", "DEVELOPER_REJECTED"], description: "Optional filter by version state" },
              includeLocalizations: { type: "boolean", description: "Include version localizations (default: false)", default: false },
              limit: { type: "number", description: "Maximum number of versions to return (default: 100)", minimum: 1, maximum: 200 }
            },
            required: ["subscriptionId"]
          }
        },
        {
          name: "list_subscription_group_versions",
          description: "List the versions of a subscription group. Optionally include each version's localizations (group display name, etc.).",
          inputSchema: {
            type: "object",
            properties: {
              subscriptionGroupId: { type: "string", description: "The subscription group ID" },
              state: { type: "string", enum: ["PREPARE_FOR_SUBMISSION", "READY_FOR_REVIEW", "WAITING_FOR_REVIEW", "IN_REVIEW", "ACCEPTED", "APPROVED", "REPLACED_WITH_NEW_VERSION", "REJECTED", "DEVELOPER_REJECTED"], description: "Optional filter by version state" },
              includeLocalizations: { type: "boolean", description: "Include version localizations (default: false)", default: false },
              limit: { type: "number", description: "Maximum number of versions to return (default: 100)", minimum: 1, maximum: 200 }
            },
            required: ["subscriptionGroupId"]
          }
        },
        {
          name: "create_in_app_purchase_version",
          description: "Create a new editable version of an In-App Purchase (needed to change metadata of an already-approved IAP before submitting it for review). Check list_in_app_purchase_versions first — reuse an existing PREPARE_FOR_SUBMISSION version if there is one.",
          inputSchema: {
            type: "object",
            properties: {
              inAppPurchaseId: { type: "string", description: "The In-App Purchase ID" }
            },
            required: ["inAppPurchaseId"]
          }
        },
        {
          name: "create_subscription_version",
          description: "Create a new editable version of an auto-renewable subscription. Check list_subscription_versions first — reuse an existing PREPARE_FOR_SUBMISSION version if there is one.",
          inputSchema: {
            type: "object",
            properties: {
              subscriptionId: { type: "string", description: "The subscription ID" }
            },
            required: ["subscriptionId"]
          }
        },
        {
          name: "create_subscription_group_version",
          description: "Create a new editable version of a subscription group. Check list_subscription_group_versions first — reuse an existing PREPARE_FOR_SUBMISSION version if there is one.",
          inputSchema: {
            type: "object",
            properties: {
              subscriptionGroupId: { type: "string", description: "The subscription group ID" }
            },
            required: ["subscriptionGroupId"]
          }
        },

        // Review Submission Tools (unified App Review flow)
        {
          name: "list_review_submissions",
          description: "List an app's App Review submissions (the unified flow that groups app versions, IAP/subscription versions, custom product pages, in-app events, Game Center items, etc.). Use state=['READY_FOR_REVIEW'] to find an open draft submission to reuse before creating a new one.",
          inputSchema: {
            type: "object",
            properties: {
              appId: { type: "string", description: "The app ID (e.g. 656212466)" },
              state: {
                type: "array",
                items: { type: "string", enum: ["READY_FOR_REVIEW", "WAITING_FOR_REVIEW", "IN_REVIEW", "UNRESOLVED_ISSUES", "CANCELING", "COMPLETING", "COMPLETE"] },
                description: "Optional filter by submission state(s)"
              },
              platform: { type: "string", enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"], description: "Optional filter by platform" },
              includeItems: { type: "boolean", description: "Include the submission items (default: true)", default: true },
              limit: { type: "number", description: "Maximum number of submissions to return (default: 50)", minimum: 1, maximum: 200 }
            },
            required: ["appId"]
          }
        },
        {
          name: "list_review_submission_items",
          description: "List the items in a review submission, with each item's state and the resource it points to (app version, IAP version, subscription version, CPP version, etc.).",
          inputSchema: {
            type: "object",
            properties: {
              reviewSubmissionId: { type: "string", description: "The review submission ID" },
              limit: { type: "number", description: "Maximum number of items to return (default: 200)", minimum: 1, maximum: 200 }
            },
            required: ["reviewSubmissionId"]
          }
        },
        {
          name: "create_review_submission",
          description: "Create a new draft App Review submission for an app and platform. Call list_review_submissions with state=['READY_FOR_REVIEW'] first and reuse an existing open draft for that platform instead of creating another. Creating a draft does not send anything to App Review.",
          inputSchema: {
            type: "object",
            properties: {
              appId: { type: "string", description: "The app ID (e.g. 656212466)" },
              platform: { type: "string", enum: ["IOS", "MAC_OS", "TV_OS", "VISION_OS"], description: "Platform of the submission" }
            },
            required: ["appId", "platform"]
          }
        },
        {
          name: "add_review_submission_item",
          description: "Add an item to a draft review submission (max 200 items per submission). itemKind names what itemId refers to — e.g. inAppPurchaseVersion (an IAP version id), subscriptionVersion, subscriptionGroupVersion, appStoreVersion, appCustomProductPageVersion, appEvent.",
          inputSchema: {
            type: "object",
            properties: {
              reviewSubmissionId: { type: "string", description: "The draft review submission ID" },
              itemKind: {
                type: "string",
                enum: ["appStoreVersion", "appCustomProductPageVersion", "appStoreVersionExperiment", "appStoreVersionExperimentV2", "appEvent", "appAssetLibraryImage", "appAssetLibraryVideo", "backgroundAssetVersion", "gameCenterAchievementVersion", "gameCenterActivityVersion", "gameCenterChallengeVersion", "gameCenterLeaderboardSetVersion", "gameCenterLeaderboardVersion", "inAppPurchaseVersion", "subscriptionVersion", "subscriptionGroupVersion", "retentionMessageVersion"],
                description: "The kind of resource being added"
              },
              itemId: { type: "string", description: "ID of the resource (e.g. the inAppPurchaseVersion id, not the IAP id)" }
            },
            required: ["reviewSubmissionId", "itemKind", "itemId"]
          }
        },
        {
          name: "remove_review_submission_item",
          description: "Remove an item from a draft review submission.",
          inputSchema: {
            type: "object",
            properties: {
              reviewSubmissionItemId: { type: "string", description: "The review submission item ID" }
            },
            required: ["reviewSubmissionItemId"]
          }
        },
        {
          name: "submit_review_submission",
          description: "SUBMIT a review submission to Apple App Review. This sends every item in the submission for review and cannot be undone (only canceled). Always confirm with the user and show them the item list (list_review_submission_items) before calling.",
          inputSchema: {
            type: "object",
            properties: {
              reviewSubmissionId: { type: "string", description: "The review submission ID to submit" }
            },
            required: ["reviewSubmissionId"]
          }
        },
        {
          name: "cancel_review_submission",
          description: "Cancel a review submission that is waiting for or in review. Confirm with the user before calling.",
          inputSchema: {
            type: "object",
            properties: {
              reviewSubmissionId: { type: "string", description: "The review submission ID to cancel" }
            },
            required: ["reviewSubmissionId"]
          }
        }
    ];

    // Sales and Finance Report tools - only available if vendor number is configured
    const paymentReportTools = [
      {
        name: "download_sales_report",
        description: "Download a Sales and Trends report, unpacked to tab-separated text. A monthly summary is thousands of rows: filter (appleId, countryCode, productTypeIdentifier, filter) and/or aggregate (groupBy + sum) to keep the result small. Units of Product Type Identifier 1/1F/1T are first-time app downloads; for other codes see Apple's 'Product type identifiers' reference (live reports also contain codes such as F3 and F7, whose documented meanings do not obviously fit, so check them before relying on them)",
        inputSchema: {
          type: "object",
          properties: {
            vendorNumber: {
              type: "string",
              description: "Your vendor number from App Store Connect (optional if set as environment variable)",
              default: config.vendorNumber
            },
            reportType: {
              type: "string",
              enum: ["SALES", "PRE_ORDER", "NEWSSTAND", "SUBSCRIPTION", "SUBSCRIPTION_EVENT", "SUBSCRIBER", "SUBSCRIPTION_OFFER_CODE_REDEMPTION", "INSTALLS", "FIRST_ANNUAL", "WIN_BACK_ELIGIBILITY"],
              description: "Type of report to download",
              default: "SALES"
            },
            reportSubType: {
              type: "string",
              enum: ["SUMMARY", "DETAILED", "SUMMARY_INSTALL_TYPE", "SUMMARY_TERRITORY", "SUMMARY_CHANNEL"],
              description: "Sub-type of the report",
              default: "SUMMARY"
            },
            frequency: {
              type: "string",
              enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
              description: "Frequency of the report",
              default: "MONTHLY"
            },
            reportDate: {
              type: "string",
              description: "Report date; format depends on frequency: DAILY 'YYYY-MM-DD', WEEKLY 'YYYY-MM-DD' (the Sunday that ends the week), MONTHLY 'YYYY-MM', YEARLY 'YYYY'"
            },
            version: {
              type: "string",
              description: "Report format version (filter[version]), e.g. '1_0'. Some report types (e.g. SUBSCRIPTION) require a specific version; omit for Apple's default"
            },
            appleId: {
              type: "string",
              description: "Only rows for this app/product Apple ID ('Apple Identifier' column)"
            },
            sku: {
              type: "string",
              description: "Only rows for this SKU"
            },
            countryCode: {
              type: "array",
              items: { type: "string" },
              description: "Only rows for these country codes, e.g. ['US', 'GB']"
            },
            productTypeIdentifier: {
              type: "array",
              items: { type: "string" },
              description: "Only rows with these Product Type Identifiers, e.g. ['1F'] for first-time iOS downloads"
            },
            filter: {
              type: "object",
              additionalProperties: { type: ["string", "array"], items: { type: "string" } },
              description: "Keep only rows whose column equals the value (or any of the values); case-insensitive. Keys are report column names as listed in the 'Columns:' line of a previous result"
            },
            groupBy: {
              type: "array",
              items: { type: "string" },
              description: "Aggregate: one output row per distinct combination of these columns, with the sum columns summed and a row count"
            },
            sum: {
              type: "array",
              items: { type: "string" },
              description: "Numeric columns to sum per group and in the totals line (default: 'Units')"
            },
            columns: {
              type: "array",
              items: { type: "string" },
              description: "Without groupBy: which columns to return (default: all)"
            },
            limit: {
              type: "number",
              description: "Maximum output rows (default 50, max 1000)",
              minimum: 1,
              maximum: 1000
            }
          },
          required: ["reportDate"]
        }
      },
      {
        name: "download_finance_report",
        description: "Download a finance report for a region, unpacked to text (line-limited)",
        inputSchema: {
          type: "object",
          properties: {
            vendorNumber: {
              type: "string",
              description: "Your vendor number from App Store Connect (optional if set as environment variable)",
              default: config.vendorNumber
            },
            reportDate: {
              type: "string",
              description: "Report date in YYYY-MM format (e.g., '2024-01')"
            },
            regionCode: {
              type: "string",
              description: "Region code (e.g., 'Z1' for worldwide, 'WW' for Europe)"
            },
            reportType: {
              type: "string",
              enum: ["FINANCIAL", "FINANCE_DETAIL"],
              description: "FINANCIAL (per-region payments report) or FINANCE_DETAIL (all regions; use regionCode 'Z1')",
              default: "FINANCIAL"
            },
            limit: {
              type: "number",
              description: "Maximum number of lines to return (default 200, max 2000)",
              minimum: 1,
              maximum: 2000
            }
          },
          required: ["reportDate", "regionCode"]
        }
      }
    ];

    // Only include payment report tools if vendor number is configured
    if (config.vendorNumber) {
      return [...baseTools, ...paymentReportTools];
    }

    return baseTools;
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.buildToolsList()
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const args = request.params.arguments || {};
        
        // Helper to format responses
        const formatResponse = (data: any) => {
          return {
            content: [{
              type: "text",
              text: JSON.stringify(data, null, 2)
            }]
          };
        };

        // Report downloads are already rendered as text (summary lines + TSV)
        const formatText = (text: string) => ({
          content: [{ type: "text", text }]
        });

        // Compact list: one JSON item per line, so long lists stay readable and small
        const formatCompact = (list: { total?: number; data: unknown[] }) => formatText(
          `{"total": ${list.total ?? list.data.length}, "returned": ${list.data.length}, "data": [\n` +
          list.data.map(item => JSON.stringify(item)).join(',\n') +
          '\n]}'
        );

        // Media sets: one line per set header and one per item, still valid JSON
        const formatMediaSets = (sets: { total: number; data: Array<{ items: unknown[] }> }) => formatText(
          `{"total": ${sets.total}, "data": [\n` +
          sets.data.map(({ items, ...set }) =>
            JSON.stringify(set).slice(0, -1) + ',"items":[\n' +
            items.map(item => '  ' + JSON.stringify(item)).join(',\n') +
            '\n]}'
          ).join(',\n') +
          '\n]}'
        );

        switch (request.params.name) {
          // App Management
          case "list_apps":
            const appsData = await this.appHandlers.listApps(args as any);
            return formatResponse(appsData);
          
          case "get_app_info":
            const appInfo = await this.appHandlers.getAppInfo(args as any);
            return formatResponse(appInfo);

          // Beta Testing
          case "list_beta_groups":
            return formatResponse(await this.betaHandlers.listBetaGroups(args as any));
          
          case "list_group_testers":
            return formatResponse(await this.betaHandlers.listGroupTesters(args as any));
          
          case "add_tester_to_group":
            return formatResponse(await this.betaHandlers.addTesterToGroup(args as any));
          
          case "remove_tester_from_group":
            return formatResponse(await this.betaHandlers.removeTesterFromGroup(args as any));
          
          case "list_beta_feedback_screenshots":
            const feedbackData = await this.betaHandlers.listBetaFeedbackScreenshots(args as any);
            return formatResponse(feedbackData);
          
          case "get_beta_feedback_screenshot":
            const result = await this.betaHandlers.getBetaFeedbackScreenshot(args as any);
            // If the result already contains content (image), return it directly
            if (result.content) {
              return result;
            }
            // Otherwise format as text
            return formatResponse(result);

          // App Store Version Localizations
          case "create_app_store_version":
            return formatResponse(await this.localizationHandlers.createAppStoreVersion(args as any));
          
          case "list_app_store_versions": {
            const versions = await this.localizationHandlers.listAppStoreVersions(args as any);
            return (args as any).raw ? formatResponse(versions) : formatCompact(versions as any);
          }
          
          case "list_app_screenshot_sets":
            return formatMediaSets(await this.screenshotHandlers.listAppScreenshotSets(args as any));

          case "list_app_preview_sets":
            return formatMediaSets(await this.screenshotHandlers.listAppPreviewSets(args as any));

          case "list_app_store_version_localizations":
            return formatResponse(await this.localizationHandlers.listAppStoreVersionLocalizations(args as any));
          
          case "get_app_store_version_localization":
            return formatResponse(await this.localizationHandlers.getAppStoreVersionLocalization(args as any));
          
          case "update_app_store_version_localization":
            return formatResponse(await this.localizationHandlers.updateAppStoreVersionLocalization(args as any));

          case "list_app_custom_product_pages":
            return formatResponse(await this.localizationHandlers.listAppCustomProductPages(args as any));

          case "list_app_custom_product_page_localizations":
            return formatResponse(await this.localizationHandlers.listAppCustomProductPageLocalizations(args as any));

          case "create_app_custom_product_page":
            return formatResponse(await this.localizationHandlers.createAppCustomProductPage(args as any));

          case "create_app_custom_product_page_version":
            return formatResponse(await this.localizationHandlers.createAppCustomProductPageVersion(args as any));

          case "create_app_custom_product_page_localization":
            return formatResponse(await this.localizationHandlers.createAppCustomProductPageLocalization(args as any));

          case "update_app_custom_product_page_localization":
            return formatResponse(await this.localizationHandlers.updateAppCustomProductPageLocalization(args as any));

          // App Info Localizations
          case "list_app_infos":
            return formatResponse(await this.localizationHandlers.listAppInfos(args as any));

          case "list_app_info_localizations":
            return formatResponse(await this.localizationHandlers.listAppInfoLocalizations(args as any));

          case "get_app_info_localization":
            return formatResponse(await this.localizationHandlers.getAppInfoLocalization(args as any));

          case "update_app_info_localization":
            return formatResponse(await this.localizationHandlers.updateAppInfoLocalization(args as any));

          // Bundle IDs
          case "create_bundle_id":
            return formatResponse(await this.bundleHandlers.createBundleId(args as any));
          
          case "list_bundle_ids":
            return formatResponse(await this.bundleHandlers.listBundleIds(args as any));
          
          case "get_bundle_id_info":
            return formatResponse(await this.bundleHandlers.getBundleIdInfo(args as any));
          
          case "enable_bundle_capability":
            return formatResponse(await this.bundleHandlers.enableBundleCapability(args as any));
          
          case "disable_bundle_capability":
            return formatResponse(await this.bundleHandlers.disableBundleCapability(args as any));

          // Devices
          case "list_devices":
            return formatResponse(await this.deviceHandlers.listDevices(args as any));

          // Users
          case "list_users":
            return formatResponse(await this.userHandlers.listUsers(args as any));

          // Analytics & Reports
          case "create_analytics_report_request":
            return formatResponse(await this.analyticsHandlers.createAnalyticsReportRequest(args as any));
          
          case "list_analytics_report_requests":
            return formatCompact(await this.analyticsHandlers.listAnalyticsReportRequests(args as any));

          case "list_analytics_reports":
            return formatCompact(await this.analyticsHandlers.listAnalyticsReports(args as any));
          
          case "list_analytics_report_instances":
            return formatCompact(await this.analyticsHandlers.listAnalyticsReportInstances(args as any));

          case "list_analytics_report_segments":
            return formatCompact(await this.analyticsHandlers.listAnalyticsReportSegments(args as any));
          
          case "download_analytics_report_segment":
            return formatText(await this.analyticsHandlers.downloadAnalyticsReportSegment(args as any));
          
          case "download_sales_report":
            if (!config.vendorNumber) {
              throw new McpError(
                ErrorCode.MethodNotFound,
                "Sales reports are not available. Please set APP_STORE_CONNECT_VENDOR_NUMBER environment variable."
              );
            }
            return formatText(await this.analyticsHandlers.downloadSalesReport(args as any));
          
          case "download_finance_report":
            if (!config.vendorNumber) {
              throw new McpError(
                ErrorCode.MethodNotFound,
                "Finance reports are not available. Please set APP_STORE_CONNECT_VENDOR_NUMBER environment variable."
              );
            }
            return formatText(await this.analyticsHandlers.downloadFinanceReport(args as any));

          // Xcode Development Tools
          case "list_schemes":
            return { toolResult: await this.xcodeHandlers.listSchemes(args as any) };

          // Customer Reviews
          case "list_customer_reviews":
            return formatResponse(await this.reviewHandlers.listCustomerReviews(args as any));

          // In-App Purchases & Subscriptions
          case "list_in_app_purchases":
            return formatResponse(await this.purchaseHandlers.listInAppPurchases(args as any));
          case "list_subscription_groups":
            return formatResponse(await this.purchaseHandlers.listSubscriptionGroups(args as any));
          case "list_subscriptions":
            return formatResponse(await this.purchaseHandlers.listSubscriptions(args as any));
          case "list_in_app_purchase_versions":
            return formatResponse(await this.purchaseHandlers.listInAppPurchaseVersions(args as any));
          case "list_subscription_versions":
            return formatResponse(await this.purchaseHandlers.listSubscriptionVersions(args as any));
          case "list_subscription_group_versions":
            return formatResponse(await this.purchaseHandlers.listSubscriptionGroupVersions(args as any));
          case "create_in_app_purchase_version":
            return formatResponse(await this.purchaseHandlers.createInAppPurchaseVersion(args as any));
          case "create_subscription_version":
            return formatResponse(await this.purchaseHandlers.createSubscriptionVersion(args as any));
          case "create_subscription_group_version":
            return formatResponse(await this.purchaseHandlers.createSubscriptionGroupVersion(args as any));

          // Review Submissions
          case "list_review_submissions":
            return formatResponse(await this.submissionHandlers.listReviewSubmissions(args as any));
          case "list_review_submission_items":
            return formatResponse(await this.submissionHandlers.listReviewSubmissionItems(args as any));
          case "create_review_submission":
            return formatResponse(await this.submissionHandlers.createReviewSubmission(args as any));
          case "add_review_submission_item":
            return formatResponse(await this.submissionHandlers.addReviewSubmissionItem(args as any));
          case "remove_review_submission_item":
            return formatResponse(await this.submissionHandlers.removeReviewSubmissionItem(args as any));
          case "submit_review_submission":
            return formatResponse(await this.submissionHandlers.submitReviewSubmission(args as any));
          case "cancel_review_submission":
            return formatResponse(await this.submissionHandlers.cancelReviewSubmission(args as any));

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new McpError(
            ErrorCode.InternalError,
            `App Store Connect API error: ${
              (error.response?.data?.errors as any[] | undefined)
                ?.flatMap(e => [
                  e?.detail ?? e?.title,
                  // Review submission failures put per-item reasons in meta.associatedErrors
                  ...Object.values(e?.meta?.associatedErrors ?? {})
                    .flat()
                    .map((a: any) => a?.detail ?? a?.title),
                ])
                .filter(Boolean)
                .join('; ') || error.message
            }${agreementHint(error.response?.data)}`
          );
        }
        throw error;
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("App Store Connect MCP server running on stdio");
  }
}

// Start the server
const server = new AppStoreConnectServer();
server.run().catch(console.error);
