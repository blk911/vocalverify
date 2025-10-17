/**
 * Telemetry Utility
 * 
 * Centralized logging for key business events
 * 
 * Usage:
 * - Log important events for monitoring and analytics
 * - Can be extended to send to external services (Datadog, Sentry, etc.)
 */

export interface TelemetryEvent {
  eventName: string;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Log a telemetry event
 */
export function logTelemetry(eventName: string, data: Record<string, any> = {}): void {
  const event: TelemetryEvent = {
    eventName,
    timestamp: new Date().toISOString(),
    data
  };

  // Console logging (can be extended to external services)
  console.log(`\n📊 [TELEMETRY] ${eventName}`);
  console.log(`   Timestamp: ${event.timestamp}`);
  Object.entries(data).forEach(([key, value]) => {
    console.log(`   ${key}: ${JSON.stringify(value)}`);
  });
  console.log('');

  // TODO: Send to external service (e.g., Datadog, Sentry)
  // await sendToDatadog(event);
}

/**
 * Log Trust Unit creation event
 */
export function logTUCreation(
  unitId: string,
  type: 'same_sponsor' | 'triangle_close',
  rootSponsorId: string,
  memberCount: number,
  memberCodes: string[]
): void {
  logTelemetry('trust_unit_created', {
    unitId,
    type,
    rootSponsorId,
    memberCount,
    memberCodes,
    createdAt: new Date().toISOString()
  });
}

/**
 * Log Trust Unit update event
 */
export function logTUUpdate(
  unitId: string,
  action: 'member_added' | 'status_changed' | 'member_connected' | 'member_waiting',
  memberCode: string,
  newStatus?: string
): void {
  logTelemetry('trust_unit_updated', {
    unitId,
    action,
    memberCode,
    newStatus,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Log invite blocked event
 */
export function logInviteBlocked(
  inviterCode: string,
  inviteeName: string,
  reason: string,
  existingTUId?: string
): void {
  logTelemetry('invite_blocked', {
    inviterCode,
    inviteeName,
    reason,
    existingTUId,
    blockedAt: new Date().toISOString()
  });
}

/**
 * Log triangle close detection
 */
export function logTriangleCloseDetected(
  inviterCode: string,
  inviteeCode: string,
  rootSponsorId: string,
  result: 'tu_created' | 'tu_updated' | 'already_in_tu'
): void {
  logTelemetry('triangle_close_detected', {
    inviterCode,
    inviteeCode,
    rootSponsorId,
    result,
    detectedAt: new Date().toISOString()
  });
}

/**
 * Log circular invite detection
 */
export function logCircularInvite(
  inviterCode: string,
  inviteeCode: string,
  allowed: boolean
): void {
  logTelemetry('circular_invite_detected', {
    inviterCode,
    inviteeCode,
    allowed,
    detectedAt: new Date().toISOString()
  });
}











