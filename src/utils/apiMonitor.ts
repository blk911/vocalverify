/**
 * API Runtime Monitor
 * Monitors API calls in production to catch JSON errors
 */

interface ApiCall {
  url: string;
  method: string;
  timestamp: number;
  status: number;
  responseTime: number;
  error?: string;
}

class ApiMonitor {
  private calls: ApiCall[] = [];
  private maxCalls = 100; // Keep last 100 calls

  logApiCall(call: ApiCall) {
    this.calls.push(call);
    if (this.calls.length > this.maxCalls) {
      this.calls.shift(); // Remove oldest
    }
  }

  getRecentErrors(): ApiCall[] {
    return this.calls.filter(call => call.status >= 400 || call.error);
  }

  getSlowCalls(threshold: number = 2000): ApiCall[] {
    return this.calls.filter(call => call.responseTime > threshold);
  }

  getApiHealthReport(): string {
    const totalCalls = this.calls.length;
    const errorCalls = this.getRecentErrors().length;
    const slowCalls = this.getSlowCalls().length;
    
    return `
🔍 API HEALTH REPORT
==================
Total Calls: ${totalCalls}
Error Rate: ${totalCalls > 0 ? ((errorCalls / totalCalls) * 100).toFixed(2) : 0}%
Slow Calls: ${slowCalls}
Recent Errors: ${errorCalls}
    `;
  }
}

export const apiMonitor = new ApiMonitor();

/**
 * Enhanced fetch with monitoring
 */
export async function monitoredFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;
    
    apiMonitor.logApiCall({
      url,
      method: options?.method || 'GET',
      timestamp: Date.now(),
      status: response.status,
      responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}`
    });
    
    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    apiMonitor.logApiCall({
      url,
      method: options?.method || 'GET',
      timestamp: Date.now(),
      status: 0,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}




