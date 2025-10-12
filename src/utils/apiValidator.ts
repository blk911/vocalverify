/**
 * API Endpoint Validator
 * Prevents JSON parse errors by validating API responses
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
}

export async function safeApiCall<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    });

    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        error: `HTTP ${response.status}: ${errorText}`,
        status: response.status
      };
    }

    // Check content type before parsing JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const body = await response.text();
      return {
        ok: false,
        error: `Expected JSON but got ${contentType || 'unknown'}: ${body.substring(0, 100)}`,
        status: response.status
      };
    }

    // Parse JSON safely
    const data = await response.json();
    return {
      ok: true,
      data,
      status: response.status
    };

  } catch (error) {
    return {
      ok: false,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 0
    };
  }
}

/**
 * API Endpoint Registry
 * Tracks all API endpoints to prevent missing routes
 */
export const API_ENDPOINTS = {
  // User APIs
  'user.profile': '/api/user/profile',
  'user.profile-picture': '/api/user/profile-picture',
  'user.check-with-invite': '/api/user/check-with-invite',
  'user.complete-registration': '/api/user/complete-registration',
  'user.upload-picture': '/api/user/upload-picture',
  'user.capture-phone': '/api/user/capture-phone',
  
  // Admin APIs
  'admin.stats': '/api/admin/stats',
  'admin.members': '/api/admin/members',
  'admin.send-invitation': '/api/admin/send-invitation',
  'admin.not-found-registry': '/api/admin/not-found-registry',
  'admin.nf-archive': '/api/admin/nf-archive',
  'admin.archive-not-found': '/api/admin/archive-not-found',
  
  // Trust Units APIs
  'trust-units.list': '/api/trust/units/list',
  'trust-units.connect': '/api/trust/units/connect',
  'trust-units.wait': '/api/trust/units/wait',
  
  // Member APIs
  'member.send-invitation': '/api/member/send-invitation',
  'member.invite-history': '/api/member/invite-history',
} as const;

export type ApiEndpoint = keyof typeof API_ENDPOINTS;

/**
 * Validates API endpoint exists before making call
 */
export function validateApiEndpoint(endpoint: ApiEndpoint): boolean {
  return endpoint in API_ENDPOINTS;
}

/**
 * Gets API endpoint URL safely
 */
export function getApiUrl(endpoint: ApiEndpoint): string {
  if (!validateApiEndpoint(endpoint)) {
    throw new Error(`Invalid API endpoint: ${endpoint}`);
  }
  return API_ENDPOINTS[endpoint];
}




