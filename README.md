# App Store Connect MCP Server

A Model Context Protocol (MCP) server for interacting with the App Store Connect API. This server provides tools for managing apps, beta testers, bundle IDs, devices, app metadata, and capabilities in App Store Connect.

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=app-store-connect&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMm5weCUyMC15JTIwYXBwc3RvcmUtY29ubmVjdC1tY3Atc2VydmVyJTIyJTdE)

## Overview

The App Store Connect MCP Server is a comprehensive tool that bridges the gap between AI and Apple's App Store Connect ecosystem. Built on the Model Context Protocol (MCP), this server enables developers to interact with their App Store Connect data directly through conversational AI, making app management, beta testing, and analytics more accessible than ever.

**Key Benefits:**
- 🤖 **AI-Powered App Management**: Use natural language to manage your iOS and macOS apps
- 📊 **Comprehensive Analytics**: Access detailed app performance, sales, and user engagement data
- 👥 **Streamlined Beta Testing**: Efficiently manage beta groups and testers
- 🌍 **Localization Management**: Update app descriptions, keywords, and metadata across all languages
- 🔧 **Developer Tools Integration**: List Xcode project schemes and integrate with development workflows
- 🔐 **Secure Authentication**: Uses official App Store Connect API with JWT authentication
- 🚀 **Real-time Data**: Access up-to-date information directly from Apple's systems

**Who This Is For:**
- iOS/macOS developers managing apps in App Store Connect
- Development teams coordinating beta testing programs
- Product managers analyzing app performance and user engagement
- Marketing teams managing app metadata and localizations
- DevOps engineers automating app store workflows
- Anyone looking to streamline their Apple developer experience

This server transforms complex App Store Connect operations into simple conversational commands, whether you're checking app analytics, managing beta testers, updating app descriptions, or exploring your development pipeline.

<a href="https://glama.ai/mcp/servers/z4j2smln34"><img width="380" height="200" src="https://glama.ai/mcp/servers/z4j2smln34/badge" alt="app-store-connect-mcp-server MCP server" /></a>
<a href="https://smithery.ai/server/appstore-connect-mcp-server" style="text-decoration: none;">
  <img alt="Smithery Installations" src="https://smithery.ai/badge/appstore-connect-mcp-server" />
</a>
[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/joshuarileydev-app-store-connect-mcp-server-badge.png)](https://mseep.ai/app/joshuarileydev-app-store-connect-mcp-server)

## Features

- **App Management**
  - List all apps
  - Get detailed app information
  - View app metadata and relationships

- **Beta Testing**
  - List beta groups
  - List beta testers
  - Add/remove testers from groups
  - Manage beta test configurations
  - View beta feedback with screenshots and device information

- **App Store Version Localizations** ✨ **NEW**
  - Create new app store versions with release scheduling
  - List all app store versions for an app
  - List all localizations for an app version
  - Get specific localization details
  - Update app descriptions, keywords, and promotional text
  - Manage marketing and support URLs
  - Update "What's New" text for releases

- **In-App Purchases & Subscriptions** ✨ **NEW**
  - List IAPs (v2), subscription groups and subscriptions
  - List and create IAP / subscription / subscription group versions (the new version-based resources)
  - Built only on the non-deprecated endpoints (Apple removes the old v1 IAP/subscription localization, image and submission resources from early 2027)

- **App Review Submissions** ✨ **NEW**
  - Unified review submission flow: group an app version, IAP/subscription versions, custom product pages, in-app events and more (up to 200 items) into one submission
  - Create a draft, add/remove items, submit, cancel

- **Bundle ID Management**
  - List bundle IDs
  - Create new bundle IDs
  - Get bundle ID details
  - Enable/disable capabilities

- **Device Management**
  - List registered devices
  - Filter by device type, platform, status
  - View device details

- **User Management**
  - List team members
  - View user roles and permissions
  - Filter users by role and access

- **Analytics & Reports**
  - Create and list analytics report requests; walk reports, instances and segments
  - Download App Store engagement, commerce, and usage analytics as filtered or aggregated tables
  - Access performance and frameworks usage reports
  - Download sales and trends reports (daily, weekly, monthly, yearly), filtered or aggregated
  - Download finance reports by region

- **Xcode Development Tools**
  - List available schemes in Xcode projects and workspaces
  - Integrate with development workflows and CI/CD pipelines

## Installation

### Using Smithery

To install App Store Connect Server for Claude Desktop automatically:

```bash
npx @smithery/cli install appstore-connect-mcp-server --client claude
```

### Manual Installation

```bash
npm install @joshuarileydev/app-store-connect-mcp-server
```

### Using a Local Checkout

If you want Claude Desktop to run the version from this repository instead of downloading the published package:

1. Install dependencies and build once:

   ```bash
   npm install
   npm run build
   ```

2. Point the Claude Desktop configuration at the built entry point (`dist/src/index.js`). Example:

   ```json
   {
     "mcpServers": {
       "app-store-connect": {
         "command": "/usr/bin/env",
         "args": [
           "node",
           "/Users/you/path/to/app-store-connect-mcp-server/dist/src/index.js"
         ],
         "env": {
           "APP_STORE_CONNECT_KEY_ID": "YOUR_KEY_ID",
           "APP_STORE_CONNECT_ISSUER_ID": "YOUR_ISSUER_ID",
           "APP_STORE_CONNECT_P8_PATH": "/path/to/your/auth-key.p8",
           "APP_STORE_CONNECT_VENDOR_NUMBER": "YOUR_VENDOR_NUMBER_OPTIONAL"
         }
       }
     }
   }
   ```

   Using `/usr/bin/env node` keeps the config portable, but you can replace it with the absolute path to `node` if you prefer. Restart Claude Desktop after updating the file so it reloads the server.

   For the Codex CLI (or any other MCP client that uses a TOML configuration), update `~/.codex/config.toml` to launch the same local build:

   ```toml
   [mcp_servers.app-store-connect]
   command = "/usr/bin/env"
   args = ["node", "/Users/you/path/to/app-store-connect-mcp-server/dist/src/index.js"]
   env = {
     APP_STORE_CONNECT_KEY_ID = "YOUR_KEY_ID",
     APP_STORE_CONNECT_ISSUER_ID = "YOUR_ISSUER_ID",
     APP_STORE_CONNECT_P8_PATH = "/path/to/your/auth-key.p8",
     APP_STORE_CONNECT_VENDOR_NUMBER = "YOUR_VENDOR_NUMBER_OPTIONAL"
   }
   ```

   Adjust the path to match your checkout. Restart the Codex CLI (or run `codex reload`) so it reloads the updated server definition.

## Configuration

Add the following to your Claude Desktop configuration file:

### macOS
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Windows
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

```json
{
  "mcpServers": {
    "app-store-connect": {
      "command": "npx",
      "args": [
        "-y",
        "appstore-connect-mcp-server"
      ],
      "env": {
        "APP_STORE_CONNECT_KEY_ID": "YOUR_KEY_ID",
        "APP_STORE_CONNECT_ISSUER_ID": "YOUR_ISSUER_ID",
        "APP_STORE_CONNECT_P8_PATH": "/path/to/your/auth-key.p8",
        "APP_STORE_CONNECT_VENDOR_NUMBER": "YOUR_VENDOR_NUMBER_OPTIONAL"
      }
    }
  }
}
```

## Authentication

### Required Configuration
1. Generate an App Store Connect API Key from [App Store Connect](https://appstoreconnect.apple.com/access/integrations/api)
2. Download the .p8 private key file
3. Note your Key ID and Issuer ID
4. Set the required environment variables in your configuration:
   - `APP_STORE_CONNECT_KEY_ID`: Your API Key ID
   - `APP_STORE_CONNECT_ISSUER_ID`: Your Issuer ID  
   - `APP_STORE_CONNECT_P8_PATH`: Path to your .p8 private key file

### Optional Configuration for Sales & Finance Reports
To enable sales and finance reporting tools, you'll also need:
- `APP_STORE_CONNECT_VENDOR_NUMBER`: Your vendor number from App Store Connect

**Note**: Sales and finance report tools (`download_sales_report`, `download_finance_report`) will only be available if the vendor number is configured. You can find your vendor number in App Store Connect under "Sales and Trends" or "Payments and Financial Reports".

## Complete Tool Reference

### 📱 App Management Tools

#### `list_apps`
Get a list of all apps in App Store Connect.

**Parameters:**
- `limit` (optional): Maximum number of apps to return (default: 100, max: 200)
- `bundleId` (optional): Filter by bundle identifier

**Example:**
```
"List all my apps"
"Show me apps with bundle ID com.example.myapp"
"Get the first 50 apps"
```

#### `get_app_info`
Get detailed information about a specific app.

**Parameters:**
- `appId` (required): The ID of the app
- `include` (optional): Related resources to include (e.g., appClips, appInfos, appStoreVersions, betaGroups, builds)

**Example:**
```
"Get info for app ID 123456789"
"Show me app 123456789 with beta groups and builds"
"Get detailed information about my app including app store versions"
```

### 👥 Beta Testing Tools

#### `list_beta_groups`
List all beta testing groups (internal and external).

**Parameters:**
- `limit` (optional): Maximum number of groups to return (default: 100, max: 200)
- `appId` (optional): Filter by app ID

**Example:**
```
"Show all beta groups"
"List beta groups for app 123456789"
"Get the first 20 beta groups"
```

#### `list_group_testers`
List testers in a specific beta group.

**Parameters:**
- `groupId` (required): The ID of the beta group
- `limit` (optional): Maximum number of testers to return (default: 100, max: 200)

**Example:**
```
"List all testers in group ABC123"
"Show me the first 50 testers in beta group ABC123"
```

#### `add_tester_to_group`
Add a new tester to a beta group.

**Parameters:**
- `groupId` (required): The ID of the beta group
- `email` (required): Email address of the tester
- `firstName` (optional): Tester's first name
- `lastName` (optional): Tester's last name

**Example:**
```
"Add john@example.com to beta group ABC123"
"Add John Smith (john@example.com) to group ABC123"
```

#### `remove_tester_from_group`
Remove a tester from a beta group.

**Parameters:**
- `groupId` (required): The ID of the beta group
- `testerId` (required): The ID of the tester

**Example:**
```
"Remove tester XYZ789 from group ABC123"
"Delete tester XYZ789 from beta group ABC123"
```

#### `list_beta_feedback_screenshots`
List beta feedback screenshot submissions.

**Parameters:**
- `appId` (optional): Filter by app ID
- `bundleId` (optional): Filter by bundle identifier
- `buildId` (optional): Filter by build ID
- `limit` (optional): Maximum results (default: 100)
- `includeBuilds` (optional): Include build information
- `includeTesters` (optional): Include tester information

**Example:**
```
"Show beta feedback screenshots for app 123456789"
"List feedback screenshots for bundle ID com.example.app"
"Get feedback with tester info for build XYZ"
```

#### `get_beta_feedback_screenshot`
Get detailed information about a specific beta feedback screenshot.

**Parameters:**
- `feedbackId` (required): The ID of the feedback
- `includeBuilds` (optional): Include build information
- `includeTesters` (optional): Include tester information
- `downloadScreenshot` (optional): Download the screenshot image (default: true)

**Example:**
```
"Get feedback screenshot FEEDBACK123"
"Show me feedback FEEDBACK123 with tester details"
"Download screenshot from feedback FEEDBACK123"
```

### 🌍 App Store Version Localization Tools

#### `create_app_store_version`
Create a new app store version for an app.

**Parameters:**
- `appId` (required): The ID of the app
- `platform` (required): The platform (IOS, MAC_OS, TV_OS, VISION_OS)
- `versionString` (required): Version string in format X.Y or X.Y.Z (e.g., '1.0' or '1.0.0')
- `copyright` (optional): Copyright text for this version
- `releaseType` (optional): How the app should be released (MANUAL, AFTER_APPROVAL, SCHEDULED)
- `earliestReleaseDate` (optional): ISO 8601 date string (required when releaseType is SCHEDULED)
- `buildId` (optional): ID of the build to associate with this version

**Example:**
```
"Create iOS version 2.0.0 for app 123456789"
"Create macOS version 1.5.0 for app 123456789 with manual release"
"Create scheduled iOS version 2.1.0 for app 123456789 releasing on 2024-02-01"
"Create version 1.2.0 for app 123456789 with build BUILD456 and copyright '2024 My Company'"
```

#### `list_app_store_versions`
Get all app store versions for a specific app.

**Parameters:**
- `appId` (required): The ID of the app
- `limit` (optional): Maximum number of versions to return (default: 100, max: 200)
- `filter` (optional): Filter options
  - `platform`: Filter by platform (IOS, MAC_OS, TV_OS)
  - `versionString`: Filter by version string (e.g., '1.0.0')
  - `appStoreState`: Filter by state (e.g., READY_FOR_SALE, PREPARE_FOR_SUBMISSION)

**Example:**
```
"List all versions for app 123456789"
"Show iOS versions for app 123456789"
"Find version 2.0.0 for app 123456789"
"List versions in review for app 123456789"
```

#### `list_app_store_version_localizations`
Get all localizations for a specific app store version.

**Parameters:**
- `appStoreVersionId` (required): The ID of the app store version
- `limit` (optional): Maximum number of localizations (default: 100, max: 200)

**Example:**
```
"List all localizations for app version VERSION123"
"Show me language versions for app store version VERSION123"
```

#### `get_app_store_version_localization`
Get detailed information about a specific localization.

**Parameters:**
- `localizationId` (required): The ID of the localization

**Example:**
```
"Get localization details for LOCALE123"
"Show me the French localization LOCALE123"
```

#### `update_app_store_version_localization`
Update a specific field in an app store version localization.

**Parameters:**
- `localizationId` (required): The ID of the localization
- `field` (required): Field to update (description, keywords, marketingUrl, promotionalText, supportUrl, whatsNew)
- `value` (required): New value for the field

**Example:**
```
"Update description for localization LOCALE123 to 'Amazing new app description'"
"Change keywords for LOCALE123 to 'productivity, tasks, organize'"
"Update what's new text for LOCALE123 to 'Bug fixes and performance improvements'"
```

### 🎯 Custom Product Page Tools

Custom Product Pages (CPPs) are alternate App Store listings targeted at
specific audiences or ad campaigns. A page's `id` is the public **ppid** —
the same value Apple Ads returns as `productPageId` on
`CUSTOM_PRODUCT_PAGE` creatives — so listing pages resolves the
UUID↔name pairing. CPP localizations expose only `locale` and
`promotionalText`.

#### `list_app_custom_product_pages`
List all custom product pages for an app, each with name, App Store URL, and visibility.

**Parameters:**
- `appId` (required): The app ID (e.g. 656212466)
- `visible` (optional): Filter to only visible/hidden pages (true/false)
- `limit` (optional): Max pages to return (default: 100)

**Example:**
```
"List all custom product pages for app 656212466"
"Show only the visible custom product pages for app 656212466"
```

#### `list_app_custom_product_page_localizations`
List all versions of a custom product page and their per-locale localizations (promotional text, state).

**Parameters:**
- `appCustomProductPageId` (required): The ID of the custom product page
- `versionLimit` (optional): Max versions to return (default: 100)
- `localizationLimit` (optional): Max localizations per version (default: 200)

**Example:**
```
"List localizations for custom product page a134f13f-adcb-45d1-be22-fdf2692afb41"
```

#### `create_app_custom_product_page`
Create a new custom product page for an app. Returns the new page id (ppid).

**Parameters:**
- `appId` (required): The app ID the page belongs to
- `name` (required): Internal page name (e.g. `cpp-<intent>-<locale>-vN`)

#### `create_app_custom_product_page_version`
Create a new version for an existing custom product page. Localizations attach to a version.

**Parameters:**
- `appCustomProductPageId` (required): The ID of the custom product page

#### `create_app_custom_product_page_localization`
Create a locale-specific localization on a custom product page version.

**Parameters:**
- `appCustomProductPageVersionId` (required): The ID of the version
- `locale` (required): Locale code (e.g. en-US, en-GB)
- `promotionalText` (optional): Promotional text for this locale

#### `update_app_custom_product_page_localization`
Update the promotional text of a custom product page localization.

**Parameters:**
- `localizationId` (required): The ID of the localization
- `promotionalText` (required): The new promotional text

> **Screenshots / previews:** uploading screenshot sets to CPP localizations is
> not yet supported — it needs the asset reservation/upload/commit flow, which
> this server does not implement for any resource. Manage CPP creative assets in
> the App Store Connect UI for now.

### 💳 In-App Purchase & Subscription Tools

Uses the version-based resources added to the App Store Connect API in July 2026
(`InAppPurchaseVersion`, `SubscriptionVersion`, `SubscriptionGroupVersion`).
Localizations and images hang off a **version**, and the **version id** is what
you add to a review submission. The deprecated v1 IAP/subscription
localization, image and `*Submissions` resources are not used.

#### `list_in_app_purchases`
List an app's IAPs (consumable, non-consumable, non-renewing) with their versions.

**Parameters:**
- `appId` (required)
- `state`, `inAppPurchaseType`, `productId` (optional arrays): filters
- `includeVersions` (optional, default true)
- `limit` (optional, default 100)

#### `list_subscription_groups`
List subscription groups with their subscriptions and group versions.

**Parameters:** `appId` (required), `includeSubscriptions`, `includeVersions` (default true), `limit`

#### `list_subscriptions`
List subscriptions in a group, with their versions.

**Parameters:** `subscriptionGroupId` (required), `state`, `productId`, `includeVersions` (default true), `limit`

#### `list_in_app_purchase_versions` / `list_subscription_versions` / `list_subscription_group_versions`
List versions of an IAP / subscription / subscription group.

**Parameters:** `inAppPurchaseId` / `subscriptionId` / `subscriptionGroupId` (required), `state` (optional), `includeLocalizations` (default false), `limit`

#### `create_in_app_purchase_version` / `create_subscription_version` / `create_subscription_group_version`
Create a new editable version (e.g. to change metadata of an already-approved product).
Reuse an existing `PREPARE_FOR_SUBMISSION` version if one exists.

**Parameters:** `inAppPurchaseId` / `subscriptionId` / `subscriptionGroupId` (required)

### 📨 Review Submission Tools

The unified App Review flow (`reviewSubmissions` + `reviewSubmissionItems`):

1. `list_review_submissions` with `state: ["READY_FOR_REVIEW"]`: reuse an open draft if there is one
2. otherwise `create_review_submission`
3. `add_review_submission_item` for each item (max 200)
4. `list_review_submission_items` to review the contents
5. `submit_review_submission`: **sends everything to App Review**

#### `list_review_submissions`
**Parameters:** `appId` (required), `state` (optional array), `platform` (optional), `includeItems` (default true), `limit` (default 50)

#### `list_review_submission_items`
**Parameters:** `reviewSubmissionId` (required), `limit` (default 200)

#### `create_review_submission`
Create a draft submission (nothing is sent to Apple yet).

**Parameters:** `appId` (required), `platform` (required: `IOS`, `MAC_OS`, `TV_OS`, `VISION_OS`)

#### `add_review_submission_item`
**Parameters:**
- `reviewSubmissionId` (required)
- `itemKind` (required): e.g. `inAppPurchaseVersion`, `subscriptionVersion`, `subscriptionGroupVersion`, `appStoreVersion`, `appCustomProductPageVersion`, `appEvent`, Game Center versions, …
- `itemId` (required): id of that resource (an IAP **version** id, not the IAP id)

#### `remove_review_submission_item`
**Parameters:** `reviewSubmissionItemId` (required)

#### `submit_review_submission`
Submit to App Review. Cannot be undone (only canceled).

**Parameters:** `reviewSubmissionId` (required)

#### `cancel_review_submission`
**Parameters:** `reviewSubmissionId` (required)

**Example:**
```
"Submit the new subscription version and version 5.2 of app 656212466 for review together"
```

### 🔤 Bundle ID Management Tools

#### `create_bundle_id`
Register a new bundle ID for app development.

**Parameters:**
- `identifier` (required): The bundle ID string (e.g., 'com.example.app')
- `name` (required): A name for the bundle ID
- `platform` (required): Platform (IOS, MAC_OS, or UNIVERSAL)
- `seedId` (optional): Your team's seed ID

**Example:**
```
"Create bundle ID com.mycompany.newapp for iOS named 'My New App'"
"Register universal bundle ID com.example.app called 'Example App'"
```

#### `list_bundle_ids`
Find and list bundle IDs registered to your team.

**Parameters:**
- `limit` (optional): Maximum results (default: 100, max: 200)
- `sort` (optional): Sort order (name, -name, platform, -platform, identifier, -identifier)
- `filter` (optional): Filter by identifier, name, platform, or seedId
- `include` (optional): Include related resources (profiles, bundleIdCapabilities, app)

**Example:**
```
"List all bundle IDs"
"Show iOS bundle IDs sorted by name"
"Find bundle IDs containing 'example'"
```

#### `get_bundle_id_info`
Get detailed information about a specific bundle ID.

**Parameters:**
- `bundleIdId` (required): The ID of the bundle ID
- `include` (optional): Related resources to include
- `fields` (optional): Specific fields to include

**Example:**
```
"Get info for bundle ID BUNDLE123"
"Show bundle ID BUNDLE123 with capabilities"
```

#### `enable_bundle_capability`
Enable a capability for a bundle ID.

**Parameters:**
- `bundleIdId` (required): The ID of the bundle ID
- `capabilityType` (required): Type of capability (e.g., PUSH_NOTIFICATIONS, ICLOUD, GAME_CENTER)
- `settings` (optional): Capability-specific settings

**Example:**
```
"Enable push notifications for bundle ID BUNDLE123"
"Add iCloud capability to bundle BUNDLE123"
"Enable Game Center for bundle ID BUNDLE123"
```

#### `disable_bundle_capability`
Disable a capability for a bundle ID.

**Parameters:**
- `capabilityId` (required): The ID of the capability to disable

**Example:**
```
"Disable capability CAP123"
"Remove capability CAP123 from bundle ID"
```

### 📱 Device Management Tools

#### `list_devices`
Get a list of all devices registered to your team.

**Parameters:**
- `limit` (optional): Maximum results (default: 100, max: 200)
- `sort` (optional): Sort order (name, platform, status, udid, deviceClass, model, addedDate)
- `filter` (optional): Filter by name, platform, status, udid, or deviceClass
- `fields` (optional): Specific fields to include

**Example:**
```
"List all devices"
"Show enabled iOS devices"
"Find devices with name containing 'John'"
"List iPhones sorted by date added"
```

### 👤 User Management Tools

#### `list_users`
Get a list of all users on your App Store Connect team.

**Parameters:**
- `limit` (optional): Maximum results (default: 100, max: 200)
- `sort` (optional): Sort order (username, firstName, lastName, roles)
- `filter` (optional): Filter by username or roles
- `fields` (optional): Specific fields to include
- `include` (optional): Include visibleApps relationship

**Example:**
```
"List all team members"
"Show users with admin role"
"Find developers sorted by last name"
"List users with their visible apps"
```

### 📊 Analytics & Reports Tools

The chain's list tools return compact results: `{ "total", "returned", "data": [ {id, ...attributes} ] }`,
one item per line, without links.

Analytics data is reached through a chain: **request → report → instance → segment → download**.
For example, installs by source: `list_analytics_report_requests` (take the ONGOING request) →
`list_analytics_reports` with `filter.name = "App Downloads Detailed"` → `list_analytics_report_instances`
(`granularity: DAILY`) → `download_analytics_report_segment` with that `instanceId` and `groupBy: ["Source Type"]`.

**Daily instances overlap:** each DAILY instance holds about two days of data, and the next instance repeats the
later day with the same counts. To build a series, group by `Date` and take each date once; never sum instances.

#### `create_analytics_report_request`
Create an analytics report request for an app. If Apple answers that one already exists (an app has at
appears to allow only one ONGOING request per app), the existing request of that access type is looked up and
returned with `alreadyExisted: true`.

**Parameters:**
- `appId` (required): The app ID
- `accessType` (optional): ONGOING or ONE_TIME_SNAPSHOT (default)

#### `list_analytics_report_requests`
List an app's analytics report requests: id, `accessType`, `stoppedDueToInactivity`.

**Parameters:**
- `appId` (required): The app ID
- `accessType` (optional): ONGOING or ONE_TIME_SNAPSHOT
- `limit` (optional): Maximum results (default: 50, max: 200)

#### `list_analytics_reports`
List the reports of a request (id, name, category). An ONGOING request has ~200 reports (~24k characters
unfiltered), so filter by `name` or `category` when possible.

**Parameters:**
- `reportRequestId` (required): The report request ID
- `limit` (optional): Maximum results (default: 200, max: 200)
- `filter` (optional): `category` (APP_USAGE, APP_STORE_ENGAGEMENT, COMMERCE, FRAMEWORK_USAGE, PERFORMANCE) and/or exact `name`

#### `list_analytics_report_instances`
List a report's instances, one per granularity and processing date. They are not returned in date order; use
`processingDate` to pick one.

**Parameters:**
- `reportId` (required): The analytics report ID
- `granularity` (optional): DAILY, WEEKLY or MONTHLY
- `processingDate` (optional): YYYY-MM-DD
- `limit` (optional): Maximum results (default: 200, max: 200)

#### `list_analytics_report_segments`
List the data segments of an instance (id, size, checksum).

**Parameters:**
- `instanceId` (required): The analytics report instance ID
- `limit` (optional): Maximum results (default: 200, max: 200)

#### `download_analytics_report_segment`
Download one segment, or every segment of an instance, unpacked to tab-separated text. The pre-signed
download URL is fetched fresh by id and downloaded without the API token.

**Parameters:**
- `segmentId` or `instanceId` (exactly one)
- Report shaping (see below); `sum` defaults to `Counts`

### 💰 Sales & Finance Reports Tools (Requires Vendor Number)

**Report shaping.** Report files are large (a monthly sales summary is ~2,600 rows / 500k characters), so the
sales report and segment download tools return a summary line, the available columns, a totals line and a
tab-separated body, and accept:
- `filter`: `{ "<column>": "value" | ["v1", "v2"] }`, case-insensitive exact match
- `groupBy`: columns to aggregate by; output has one row per combination, the `sum` columns summed, and a row count, sorted by the first sum
- `sum`: numeric columns to sum (default `Units` for sales, `Counts` for analytics)
- `columns`: without `groupBy`, which columns to return
- `limit`: output rows (default 50, max 1000)

#### `download_sales_report`
Download a Sales and Trends report.

**Parameters:**
- `reportDate` (required): DAILY `YYYY-MM-DD`, WEEKLY `YYYY-MM-DD` (the Sunday that ends the week), MONTHLY `YYYY-MM`, YEARLY `YYYY`
- `frequency` (optional): DAILY, WEEKLY, MONTHLY (default), YEARLY
- `reportType` (optional): SALES (default), PRE_ORDER, NEWSSTAND, SUBSCRIPTION, SUBSCRIPTION_EVENT, SUBSCRIBER, SUBSCRIPTION_OFFER_CODE_REDEMPTION, INSTALLS, FIRST_ANNUAL, WIN_BACK_ELIGIBILITY
- `reportSubType` (optional): SUMMARY (default), DETAILED, SUMMARY_INSTALL_TYPE, SUMMARY_TERRITORY, SUMMARY_CHANNEL
- `version` (optional): report format version, e.g. `1_0`
- `appleId`, `sku`, `countryCode[]`, `productTypeIdentifier[]` (optional): shortcuts for filtering the matching columns
- Report shaping (see above)
- `vendorNumber` (optional): Override default vendor number

Units of Product Type Identifier `1`/`1F`/`1T` are first-time downloads. For other codes see Apple's
[Product type identifiers](https://developer.apple.com/help/app-store-connect/reference/reporting/product-type-identifiers)
reference; live reports also contain codes such as `F3` and `F7` whose documented meanings do not obviously fit,
so check them before relying on them. Sales units and analytics `Counts` are counted differently and will not match.

**Example:**
```
"First-time downloads by country for app 123456789 in 2026-10"
  -> reportDate "2026-10", appleId "123456789", productTypeIdentifier ["1F"], groupBy ["Country Code"]
```

#### `download_finance_report`
Download a finance report, unpacked to text (line-limited).

**Parameters:**
- `reportDate` (required): Report date (YYYY-MM)
- `regionCode` (required): Region code (e.g., 'Z1' for worldwide)
- `reportType` (optional): FINANCIAL (default) or FINANCE_DETAIL (use region `Z1`)
- `limit` (optional): lines to return (default 200, max 2000)
- `vendorNumber` (optional): Override default vendor number

### 🔧 Xcode Development Tools

#### `list_schemes`
List all available schemes in an Xcode project or workspace.

**Parameters:**
- `projectPath` (required): Path to .xcodeproj or .xcworkspace file

**Example:**
```
"List schemes in /Users/john/MyApp/MyApp.xcodeproj"
"Show available schemes for MyApp.xcworkspace"
```

## Error Handling

The server implements proper error handling for:
- Invalid authentication
- Missing required parameters
- API rate limits
- Network issues
- Invalid operations

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run type checking
npm run type-check
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Related Links
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [App Store Connect API Documentation](https://developer.apple.com/documentation/appstoreconnectapi)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
