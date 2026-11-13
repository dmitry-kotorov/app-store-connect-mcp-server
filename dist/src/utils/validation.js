import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
export function validateRequired(params, requiredFields) {
    const missingFields = requiredFields.filter(field => !params[field]);
    if (missingFields.length > 0) {
        throw new McpError(ErrorCode.InvalidParams, `Missing required parameters: ${missingFields.join(', ')}`);
    }
}
export function validateEnum(value, validValues, fieldName) {
    if (!value)
        return undefined;
    if (!validValues.includes(value)) {
        throw new McpError(ErrorCode.InvalidParams, `Invalid ${fieldName}: ${value}. Valid values are: ${validValues.join(', ')}`);
    }
    return value;
}
export function sanitizeLimit(limit, max = 200) {
    if (!limit)
        return 100;
    return Math.min(Math.max(1, Number(limit)), max);
}
export function buildFilterParams(filter = {}) {
    const params = {};
    Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
                params[`filter[${key}]`] = value.join(',');
            }
            else {
                params[`filter[${key}]`] = String(value);
            }
        }
    });
    return params;
}
export function buildFieldParams(fields = {}) {
    const params = {};
    Object.entries(fields).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
            params[`fields[${key}]`] = value.join(',');
        }
    });
    return params;
}
/**
 * Encode a resource id for use as a single URL path segment. Ids come from tool
 * arguments, so a raw "../" could redirect an authenticated request to another
 * endpoint; encodeURIComponent neutralises "/", "?" and "#", and the dot-only
 * segments that encoding leaves intact are rejected.
 */
export function pathId(value, fieldName = 'id') {
    const id = String(value ?? '').trim();
    if (!id || id === '.' || id === '..') {
        throw new McpError(ErrorCode.InvalidParams, `Invalid ${fieldName}: ${value}`);
    }
    return encodeURIComponent(id);
}
