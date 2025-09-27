// Device fingerprinting utility for client-side device identification
// Collects device characteristics to create a unique fingerprint

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string;
  hardwareConcurrency: number;
  maxTouchPoints: number;
}

export class DeviceFingerprint {
  private static instance: DeviceFingerprint;
  private fingerprint: string | null = null;

  private constructor() {}

  public static getInstance(): DeviceFingerprint {
    if (!DeviceFingerprint.instance) {
      DeviceFingerprint.instance = new DeviceFingerprint();
    }
    return DeviceFingerprint.instance;
  }

  /**
   * Collect device information for fingerprinting
   */
  public collectDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unspecified',
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0
    };
  }

  /**
   * Generate device fingerprint hash
   */
  public generateFingerprint(): string {
    if (this.fingerprint) {
      return this.fingerprint;
    }

    const deviceInfo = this.collectDeviceInfo();
    const fingerprintString = JSON.stringify(deviceInfo);
    
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    this.fingerprint = Math.abs(hash).toString(36);
    return this.fingerprint;
  }

  /**
   * Send device fingerprint to server
   */
  public async sendFingerprint(memberCode: string): Promise<boolean> {
    try {
      const fingerprint = this.generateFingerprint();
      const deviceInfo = this.collectDeviceInfo();

      const response = await fetch('/api/device/fingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberCode,
          fingerprint,
          ...deviceInfo
        })
      });

      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get stored fingerprint
   */
  public getFingerprint(): string | null {
    return this.fingerprint;
  }

  /**
   * Clear stored fingerprint
   */
  public clearFingerprint(): void {
    this.fingerprint = null;
  }
}

// Export singleton instance
export const deviceFingerprint = DeviceFingerprint.getInstance();
