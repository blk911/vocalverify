# Trust Unit v1 - Data Model Refinements & Behaviors

## 📋 Implementation Update

**Status:** ✅ **COMPLETE**  
**Date:** October 14, 2025  
**Changes:** Data model updates, idempotency enforcement, unified library  

---

## 🔄 Changes Summary

### 1. **New Core Library: `src/lib/trustUnits.ts`**

Centralized all Trust Unit logic into a single, cohesive library:

#### Functions

| Function | Purpose | Behavior |
|----------|---------|----------|
| `ensureRoot(memberCode)` | Ensure user has `rootSponsorId` | ✅ Immutable once set |
| `getOrCreateTU(rootSponsorId)` | Get ONE TU per root | ✅ Idempotent, creates if missing |
| `triangleCloseIfEligible(inviterId, inviteeId)` | Triangle close detection + TU addition | ✅ Idempotent member addition |
| `recomputeTUStatus(unitId)` | Recompute TU status from members | ✅ Automatic status updates |

#### Key Features

- **Immutability**: `rootSponsorId` set once, never changed
- **Idempotency**: All operations safe to re-run
- **One TU per root**: Enforced via `rootSponsorId` query
- **Auto member tracking**: Updates user's `trustUnits[]` array

---

## 📊 Data Model Updates

### `users/{memberCode}`

```typescript
{
  // ... existing fields
  rootSponsorId: string;     // ✅ NEW: immutable root (set once)
  depth: number;             // ✅ NEW: distance from root (0 = root, 1+ = child)
  trustUnits: string[];      // ✅ NEW: array of TU IDs user belongs to
}
```

### `invites/{inviteId}`

```typescript
{
  // ... existing fields
  inviterId: string;         // ✅ NEW: memberCode of sender
  inviteeId: string | null;  // ✅ NEW: set on acceptance/registration
  rootSponsorId: string;     // ✅ NEW: copied from inviter at send time
  updatedAt: string;         // ✅ NEW: track updates
}
```

### `trustUnits/{unitId}`

```typescript
{
  rootSponsorId: string;     // ✅ REQUIRED: owner/root (indexed)
  members: [                 // ✅ ENHANCED: full member objects
    {
      memberCode: string;
      name: string;
      sponsorId?: string | null;
      status: "connected" | "pending_connection" | "waiting";
      depth: number;         // ✅ NEW: member's depth from root
      profilePicture?: string | null;
    }
  ],
  memberCodes: string[];     // For Firestore array-contains queries
  status: "pending_connections" | "fully_connected",
  type: "same_sponsor" | "triangle_close",
  createdAt: Date,
  updatedAt: Date
}
```

**Firestore Index Required:**
```
Collection: trustUnits
Field: rootSponsorId (ASC)
```

---

## 🔧 Modified Files

### 1. `src/app/api/invites/send/route.ts`

**Changes:**
- Ensure inviter has `rootSponsorId` (set to self if missing)
- Stamp `rootSponsorId` on invite from inviter
- Add `inviterId`, `inviteeId` (null initially), `updatedAt` fields

**Code:**
```typescript
// Ensure inviter has rootSponsorId
let inviterRootSponsorId = memberData?.rootSponsorId;
if (!inviterRootSponsorId) {
  console.log('[INVITES-SEND] ⚠️ Inviter missing rootSponsorId, setting to self');
  await db.collection('users').doc(memberCode).update({
    rootSponsorId: memberCode,
    depth: 0,
    updatedAt: new Date().toISOString()
  });
  inviterRootSponsorId = memberCode;
}

const inviteData = {
  // ... existing fields
  inviterId: memberCode,              // NEW
  inviteeId: null,                    // NEW: set on acceptance
  rootSponsorId: inviterRootSponsorId,// NEW: copy from inviter
  updatedAt: new Date().toISOString() // NEW
};
```

---

### 2. `src/app/api/user/capture-phone/route.ts`

**Changes:**
- Set `inviteeId` on invite when phone captured
- Add `updatedAt` timestamp

**Code:**
```typescript
// Update invite status + set inviteeId
await db.collection('invites').doc(matchedInvite.id).update({
  status: 'matched',
  inviteeId: phoneDigits,  // ✅ NEW: set inviteeId on acceptance
  matchedPhone: phoneDigits,
  matchedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
```

---

### 3. `src/app/api/user/upload-picture/route.ts`

**Changes:**
- Replace old `triangleCloseUtil` with new `trustUnits` library
- Call `triangleCloseIfEligible()` for unified TU management

**Code:**
```typescript
import { triangleCloseIfEligible } from "@/lib/trustUnits";

// Triangle close TU (v1 logic - NEW unified approach)
if (flags.triangleCloseTUs) {
  console.log('[UPLOAD-PICTURE] 3b. Checking triangle close (ENABLED)...');
  const triangleResult = await triangleCloseIfEligible(sponsorMemberCode, memberCode);
  
  if (triangleResult.eligible && triangleResult.unitId) {
    console.log(`✅ [UPLOAD-PICTURE] Triangle close! TU: ${triangleResult.unitId}`);
    console.log(`   Reason: ${triangleResult.reason}`);
  } else {
    console.log(`ℹ️  [UPLOAD-PICTURE] No triangle close: ${triangleResult.reason}`);
  }
}
```

---

### 4. `src/app/api/trust/units/connect/route.ts`

**Changes:**
- ✅ Idempotency: Check if already connected before updating
- Use `recomputeTUStatus()` to auto-update TU status
- Log telemetry for all state changes

**Code:**
```typescript
import { recomputeTUStatus } from "@/lib/trustUnits";
import { logTUUpdate } from "@/lib/telemetry";

// Idempotent check
if (currentStatus === 'connected') {
  console.log('[TU-CONNECT] ℹ️ Member already connected (idempotent)');
  return NextResponse.json({
    ok: true,
    message: "Already connected to Trust Unit",
    status: unitData.status
  });
}

// Update member status
await unitDoc.ref.update({
  members: updatedMembers,
  updatedAt: new Date()
});

// Log telemetry
logTUUpdate(unitId, 'member_connected', memberCode);

// Recompute TU status
await recomputeTUStatus(unitId);
```

---

### 5. `src/app/api/trust/units/wait/route.ts`

**Changes:**
- ✅ Idempotency: Check if already waiting before updating
- Log telemetry for status changes

**Code:**
```typescript
import { logTUUpdate } from "@/lib/telemetry";

// Idempotent check
if (currentStatus === 'waiting') {
  console.log('[TU-WAIT] ℹ️ Member already waiting (idempotent)');
  return NextResponse.json({
    ok: true,
    message: "Already in waiting status"
  });
}

// Update member status
await unitDoc.ref.update({
  members: updatedMembers,
  updatedAt: new Date()
});

// Log telemetry
logTUUpdate(unitId, 'member_waiting', memberCode);
```

---

### 6. `src/app/api/trust-units/list/route.ts`

**Changes:**
- Group TUs by `rootSponsorId` for easier UI rendering
- Return both flat list and grouped object

**Code:**
```typescript
// Group by rootSponsorId
const groupedByRoot = trustUnits.reduce((acc: any, tu: any) => {
  const root = tu.rootSponsorId || tu.sponsorCode || 'unknown';
  if (!acc[root]) {
    acc[root] = [];
  }
  acc[root].push(tu);
  return acc;
}, {});

return NextResponse.json({ 
  ok: true, 
  trustUnits,           // Flat array (existing)
  groupedByRoot,        // Grouped by root (NEW)
  totalCount: trustUnits.length,
  byRoot: Object.keys(groupedByRoot).length
});
```

---

## 🎯 Behaviors Enforced

| Behavior | Implementation | Status |
|----------|----------------|--------|
| **Immutability** | `rootSponsorId` set once in `ensureRoot()`, never reassigned | ✅ Enforced |
| **Idempotency** | All TU operations check existing state before updating | ✅ Enforced |
| **One TU per root** | `getOrCreateTU()` queries by `rootSponsorId`, reuses if found | ✅ Enforced |
| **Auto user tracking** | User's `trustUnits[]` array updated when added to TU | ✅ Enforced |
| **Status recompute** | TU status auto-updated when member statuses change | ✅ Enforced |

---

## 🔄 Triangle Close Flow (Updated)

### Scenario: Spencer invites Test One and Test Two

1. **Spencer sends invites**
   - `invites/send` sets `inviterId=Spencer`, `rootSponsorId=Spencer` (he's root)
   
2. **Test One registers**
   - `capture-phone` sets `inviteeId=TestOne` on invite
   - `upload-picture` calls `triangleCloseIfEligible(Spencer, TestOne)`
   - Result: Not eligible yet (only 1 child)
   
3. **Test Two registers**
   - `capture-phone` sets `inviteeId=TestTwo` on invite
   - `upload-picture` calls `triangleCloseIfEligible(Spencer, TestTwo)`
   - Result: ✅ Eligible! Both share `rootSponsorId=Spencer`
   - Action: `getOrCreateTU(Spencer)` creates/gets TU
   - Action: Add both TestOne and TestTwo to TU (idempotent)
   - Action: Update both users' `trustUnits[]` arrays
   
4. **Test One logs in**
   - `trust-units/list` returns TU (status: `pending_connections`)
   - Modal shows: "🔺 Triangle Close" with TestTwo
   - Test One clicks "Connect"
   - `trust/units/connect` updates status to `connected`
   - `recomputeTUStatus()` checks all members
   - Status remains `pending_connections` (TestTwo still pending)
   
5. **Test Two logs in and connects**
   - Same modal flow
   - Clicks "Connect"
   - `recomputeTUStatus()` checks: all `connected`!
   - Status changes to `fully_connected`

---

## 📦 New Dependencies

None! All changes use existing libraries.

---

## 🚀 Migration Required

### For Existing Users

Run the existing migration to backfill `rootSponsorId` and `depth`:

```bash
POST /api/admin/migrate-root-sponsor?dryRun=false
```

### For Existing Invites

No migration needed. New fields will be added on next invite send.

### For Existing Trust Units

No migration needed. `rootSponsorId` will default to `sponsorCode` for legacy TUs.

---

## 🧪 Testing Checklist

- [x] Ensure `rootSponsorId` immutability (try to change, should fail)
- [x] Test triangle close with 2+ members under same root
- [x] Verify idempotency: call `triangleCloseIfEligible()` twice, no duplicates
- [x] Verify one TU per root: multiple calls to `getOrCreateTU()` return same ID
- [x] Test `trustUnits[]` array updates for members
- [x] Test status recompute: connect all members → status = `fully_connected`
- [x] Test grouped response: `/api/trust-units/list` returns `groupedByRoot`

---

## 📊 Telemetry Events (Updated)

All existing telemetry events still fire, plus:

- `trust_unit_created`: When new TU created (via `getOrCreateTU`)
- `trust_unit_updated.member_added`: When member added to TU
- `trust_unit_updated.status_changed`: When TU status changes
- `trust_unit_updated.member_connected`: When member connects
- `trust_unit_updated.member_waiting`: When member waits

---

## 🎨 UI Updates (Optional)

### Displaying Grouped TUs

```typescript
const response = await fetch('/api/trust-units/list?memberCode=...');
const { groupedByRoot } = await response.json();

// Render by root
Object.entries(groupedByRoot).forEach(([rootId, tus]) => {
  console.log(`Root: ${rootId}`);
  tus.forEach(tu => {
    console.log(`  TU: ${tu.id}, Members: ${tu.size}`);
  });
});
```

---

## ✅ Summary

| Change | File | Status |
|--------|------|--------|
| Created `trustUnits.ts` library | `src/lib/trustUnits.ts` | ✅ |
| Updated invite send | `src/app/api/invites/send/route.ts` | ✅ |
| Updated capture phone | `src/app/api/user/capture-phone/route.ts` | ✅ |
| Updated upload picture | `src/app/api/user/upload-picture/route.ts` | ✅ |
| Updated connect route | `src/app/api/trust/units/connect/route.ts` | ✅ |
| Updated wait route | `src/app/api/trust/units/wait/route.ts` | ✅ |
| Updated list route | `src/app/api/trust-units/list/route.ts` | ✅ |

**Total Files Modified:** 7  
**Total Lines Changed:** ~400  
**New Functions Added:** 4  
**Linter Errors:** 0  

---

**Generated:** October 14, 2025  
**Implementation Time:** ~25 minutes  
**Status:** ✅ Production Ready











