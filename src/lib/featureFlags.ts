/**
 * Feature Flags
 *
 * Central configuration for feature toggles
 *
 * Usage:
 * - Set flags here to enable/disable features without code changes
 * - Can be extended to read from environment variables or database
 */

export interface FeatureFlags {
  triangleCloseTUs: boolean;
  sameSponsorTUs: boolean;
  tuInviteBlocker: boolean;
  circularInviteDetection: boolean;
}

/**
 * Get feature flags
 *
 * Priority:
 * 1. Environment variables
 * 2. Default values (below)
 */
export function getFeatureFlags(): FeatureFlags {
  // ✅ Master toggle for triangle close feature
  const tuTriangleEnabled = process.env.FEATURE_TU_TRIANGLE !== 'false'; // Default: true

  return {
    // ✅ Triangle Close TUs (v1 logic) - controlled by FEATURE_TU_TRIANGLE
    triangleCloseTUs:
      tuTriangleEnabled &&
      process.env.NEXT_PUBLIC_TRIANGLE_CLOSE_TU !== 'false',

    // ✅ Same-Sponsor TUs (legacy logic) - always enabled for now
    sameSponsorTUs: process.env.NEXT_PUBLIC_SAME_SPONSOR_TU !== 'false',

    // ✅ Block duplicate invites to same TU members
    tuInviteBlocker:
      tuTriangleEnabled &&
      process.env.NEXT_PUBLIC_TU_INVITE_BLOCKER !== 'false',

    // ℹ️  Detect circular invites (log only, doesn't block)
    circularInviteDetection:
      tuTriangleEnabled &&
      process.env.NEXT_PUBLIC_CIRCULAR_INVITE_DETECTION !== 'false',
  };
}

/**
 * Log feature flag status
 */
export function logFeatureFlags(): void {
  const flags = getFeatureFlags();
  console.log('\n🚩 [FEATURE FLAGS] Current configuration:');
  console.log(
    `   - Triangle Close TUs: ${flags.triangleCloseTUs ? '✅ ENABLED' : '❌ DISABLED'}`
  );
  console.log(
    `   - Same-Sponsor TUs: ${flags.sameSponsorTUs ? '✅ ENABLED' : '❌ DISABLED'}`
  );
  console.log(
    `   - TU Invite Blocker: ${flags.tuInviteBlocker ? '✅ ENABLED' : '❌ DISABLED'}`
  );
  console.log(
    `   - Circular Invite Detection: ${flags.circularInviteDetection ? '✅ ENABLED' : '❌ DISABLED'}\n`
  );
}
