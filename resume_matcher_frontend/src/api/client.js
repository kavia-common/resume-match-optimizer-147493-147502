//
// Lightweight API client using fetch with JSON and multipart helpers.
// Uses base URL from getApiBaseUrl() and provides standardized errors and timeouts.
//

import { getApiBaseUrl } from '../constants/config';

/**
 * Standardized error shape returned by this client.
 * @typedef {Object} ApiError
 * @property {string} code - A machine-friendly code (e.g., 'NETWORK_ERROR', 'TIMEOUT', 'HTTP_ERROR', 'PARSING_ERROR').
 * @property {string} message - Human-readable error message.
 * @property {number} [status] - HTTP status code if available.
 * @property {any} [details] - Additional error details, often parsed from server JSON body.
 */

/**
 * Apply a timeout to a promise.
 * @param {Promise<Response>} promise - The fetch promise.
 * @param {number} ms - Timeout in milliseconds.
 * @returns {Promise<Response>}
 */
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(createError('TIMEOUT', `Request timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * Build a standardized ApiError.
 * @param {string} code
 * @param {string} message
 * @param {number} [status]
 * @param {any} [details]
 * @returns {ApiError}
 */
function createError(code, message, status, details) {
  return { code, message, status, details };
}

/**
 * Attempts to parse a response as JSON, falling back gracefully.
 * @param {Response} res
 * @returns {Promise<any|null>}
 */
async function parseJsonSafely(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_err) {
    // Not JSON, return text as details
    return text;
  }
}

/**
 * Executes a fetch with standardized handling:
 * - Prefixes with base URL
 * - Merges headers
 * - Applies timeout
 * - Parses JSON automatically when possible
 * - Returns { data } on success or throws ApiError
 *
 * PUBLIC_INTERFACE
 * @param {string} path - Relative API path, e.g. '/api/resumes/analyze'
 * @param {RequestInit & { timeout?: number }} [options]
 * @returns {Promise<{ data: any, status: number, headers: Headers }>}
 *
 * @example
 * // Basic GET:
 * const { data } = await request('/api/health');
 * console.log(data);
 */
export async function request(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = new URL(path, baseUrl).toString();

  const {
    headers: customHeaders,
    timeout = 20000, // default timeout 20s
    ...rest
  } = options;

  const headers = new Headers(customHeaders || {});

  // Always accept JSON responses when we don't explicitly know the type
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json, */*;q=0.8');
  }

  try {
    const response = await withTimeout(fetch(url, { headers, ...rest }), timeout);

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Attempt to parse body accordingly
    let parsed = null;
    if (isJson) {
      try {
        parsed = await response.json();
      } catch (_e) {
        // Fallback to safe parse
        try {
          const fallback = await parseJsonSafely(response.clone());
          parsed = fallback;
        } catch {
          parsed = null;
        }
      }
    } else {
      // For non-JSON, try safe parse to capture text when useful
      try {
        parsed = await parseJsonSafely(response.clone());
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      // Build best-effort error message
      const serverMessage =
        parsed && typeof parsed === 'object' && parsed.message
          ? String(parsed.message)
          : response.statusText || 'Request failed';

      throw createError('HTTP_ERROR', serverMessage, response.status, parsed);
    }

    return { data: parsed, status: response.status, headers: response.headers };
  } catch (err) {
    if (err && err.code && err.message) {
      // Already standardized error
      throw err;
    }

    // Network or unknown error
    const message =
      (err && err.message) || 'Network error occurred while making the request';
    throw createError('NETWORK_ERROR', message);
  }
}

/**
 * Helper for GET requests with query params.
 *
 * PUBLIC_INTERFACE
 * @param {string} path - Relative API path
 * @param {Object} [params] - Query params
 * @param {RequestInit & { timeout?: number }} [options]
 * @returns {Promise<{ data: any, status: number, headers: Headers }>}
 *
 * @example
 * const { data } = await get('/api/jobs/suggest', { q: 'frontend' });
 */
export async function get(path, params = undefined, options = {}) {
  let url = path;
  if (params && typeof params === 'object') {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) usp.append(k, String(v));
    });
    url += `?${usp.toString()}`;
  }
  return request(url, {
    method: 'GET',
    ...options,
  });
}

/**
 * Helper for POST requests with JSON body.
 *
 * PUBLIC_INTERFACE
 * @param {string} path - Relative API path
 * @param {any} body - JSON payload
 * @param {RequestInit & { timeout?: number }} [options]
 * @returns {Promise<{ data: any, status: number, headers: Headers }>}
 *
 * @example
 * const payload = { resumeText, jobDescription };
 * const { data } = await postJson('/api/resumes/analyze', payload);
 */
export async function postJson(path, body, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  return request(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
    ...options,
  });
}

/**
 * Helper for POST multipart/form-data (e.g., file uploads).
 * Note: Do NOT set 'Content-Type' header manually for multipart; the browser sets it with boundary.
 *
 * PUBLIC_INTERFACE
 * @param {string} path - Relative API path
 * @param {FormData} formData - FormData containing files/fields
 * @param {RequestInit & { timeout?: number }} [options]
 * @returns {Promise<{ data: any, status: number, headers: Headers }>}
 *
 * @example
 * const fd = new FormData();
 * fd.append('resume', fileInput.files[0]);
 * const { data } = await postMultipart('/api/resumes/analyze', fd);
 */
export async function postMultipart(path, formData, options = {}) {
  const headers = new Headers(options.headers || {});
  // Ensure we don't manually set Content-Type for multipart
  if (headers.has('Content-Type')) {
    headers.delete('Content-Type');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  return request(path, {
    method: 'POST',
    headers,
    body: formData,
    ...options,
  });
}

/**
 * PUBLIC_INTERFACE
 * Creates a small typed client wrapper for common operations.
 * This is optional sugar to inject base options (e.g., auth headers).
 *
 * @param {{ getToken?: () => string | null, defaultTimeout?: number }} [config]
 * @returns {{ get: typeof get, postJson: typeof postJson, postMultipart: typeof postMultipart, request: typeof request }}
 *
 * @example
 * const api = createApiClient({ getToken: () => localStorage.getItem('token') });
 * const { data } = await api.postJson('/api/jobs/match', { resumeId, jobIds });
 */
export function createApiClient(config = {}) {
  const { getToken, defaultTimeout } = config;

  function withAuthHeaders(init = {}) {
    const headers = new Headers(init.headers || {});
    const token = typeof getToken === 'function' ? getToken() : null;
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return { ...init, headers, timeout: init.timeout ?? defaultTimeout };
  }

  return {
    request: (p, o) => request(p, withAuthHeaders(o)),
    get: (p, params, o) => get(p, params, withAuthHeaders(o)),
    postJson: (p, body, o) => postJson(p, body, withAuthHeaders(o)),
    postMultipart: (p, fd, o) => postMultipart(p, fd, withAuthHeaders(o)),
  };
}

export default {
  request,
  get,
  postJson,
  postMultipart,
  createApiClient,
};
