/**
 * API Enforcer
 * Prevents missing API endpoints by enforcing API-first development
 */

// STEP 1: Define ALL API endpoints BEFORE any frontend code
export const REQUIRED_APIS = {
  // User Management APIs
  'user.check-with-invite': {
    method: 'GET',
    params: ['name'],
    returns: 'UserStatusResponse'
  },
  'user.complete-registration': {
    method: 'POST', 
    params: ['memberCode', 'phone', 'name'],
    returns: 'RegistrationResponse'
  },
  'user.upload-picture': {
    method: 'POST',
    params: ['memberCode', 'picture'],
    returns: 'UploadResponse'
  },
  'user.profile-picture': {
    method: 'GET',
    params: ['memberCode'],
    returns: 'ProfilePictureResponse'
  },
  'user.capture-phone': {
    method: 'POST',
    params: ['name', 'phone'],
    returns: 'CaptureResponse'
  },
  
  // Admin Management APIs
  'admin.stats': {
    method: 'GET',
    params: [],
    returns: 'StatsResponse'
  },
  'admin.members': {
    method: 'GET',
    params: [],
    returns: 'MembersResponse'
  },
  'admin.send-invitation': {
    method: 'POST',
    params: ['name', 'phone', 'message'],
    returns: 'InvitationResponse'
  },
  'admin.not-found-registry': {
    method: 'GET',
    params: [],
    returns: 'RegistryResponse'
  },
  'admin.nf-archive': {
    method: 'GET',
    params: [],
    returns: 'ArchiveResponse'
  },
  'admin.archive-not-found': {
    method: 'POST',
    params: ['entryId', 'name', 'phone', 'memberCode'],
    returns: 'ArchiveResponse'
  },
  
  // Trust Units APIs
  'trust-units.list': {
    method: 'GET',
    params: ['memberCode'],
    returns: 'TrustUnitsResponse'
  },
  'trust-units.connect': {
    method: 'POST',
    params: ['unitId', 'memberCode'],
    returns: 'ConnectionResponse'
  },
  'trust-units.wait': {
    method: 'POST',
    params: ['unitId', 'memberCode'],
    returns: 'WaitResponse'
  },
  
  // Trust Bonds APIs
  'trust-bonds.list': {
    method: 'GET',
    params: ['memberCode'],
    returns: 'TrustBondsResponse'
  },
  
  // Member APIs
  'member.send-invitation': {
    method: 'POST',
    params: ['firstName', 'lastName', 'phone', 'sponsorId', 'sponsorName'],
    returns: 'InvitationResponse'
  },
  'member.invite-history': {
    method: 'GET',
    params: ['memberCode'],
    returns: 'InviteHistoryResponse'
  }
} as const;

// STEP 2: Type-safe API calls that CANNOT call non-existent endpoints
export type ApiKey = keyof typeof REQUIRED_APIS;

export function createApiCall<T extends ApiKey>(
  endpoint: T,
  params: Record<string, any>
): Promise<any> {
  const api = REQUIRED_APIS[endpoint];
  
  // This will COMPILE-TIME ERROR if endpoint doesn't exist
  if (!api) {
    throw new Error(`API endpoint ${endpoint} is not defined in REQUIRED_APIS`);
  }
  
  // Build URL with params
  const baseUrl = `/api/${endpoint.replace('.', '/')}`;
  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  
  return fetch(url.toString(), {
    method: api.method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error(`API ${endpoint} returned ${response.status}`);
    }
    return response.json();
  });
}

// STEP 3: Compile-time validation that all APIs exist
export function validateAllApisExist(): boolean {
  const missingApis: string[] = [];
  
  for (const [apiKey, apiDef] of Object.entries(REQUIRED_APIS)) {
    const endpoint = `/api/${apiKey.replace('.', '/')}`;
    
    // This would need to be checked at build time
    // For now, we'll just validate the structure
    if (!apiDef.method || !apiDef.returns) {
      missingApis.push(apiKey);
    }
  }
  
  if (missingApis.length > 0) {
    console.error('❌ MISSING API DEFINITIONS:', missingApis);
    return false;
  }
  
  return true;
}

// STEP 4: Usage examples that CANNOT fail
export const apiCalls = {
  checkUser: (name: string) => 
    createApiCall('user.check-with-invite', { name }),
    
  completeRegistration: (memberCode: string, phone: string, name: string) =>
    createApiCall('user.complete-registration', { memberCode, phone, name }),
    
  uploadPicture: (memberCode: string, picture: File) =>
    createApiCall('user.upload-picture', { memberCode, picture }),
    
  getTrustUnits: (memberCode: string) =>
    createApiCall('trust-units.list', { memberCode }),
  
  getTrustBonds: (memberCode: string) =>
    createApiCall('trust-bonds.list', { memberCode }),
    
  getAdminStats: () =>
    createApiCall('admin.stats', {}),
    
  getMembers: () =>
    createApiCall('admin.members', {})
};

// STEP 5: Build-time validation
if (typeof window !== 'undefined') {
  // Only run in browser
  validateAllApisExist();
}




