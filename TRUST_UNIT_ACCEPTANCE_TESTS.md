# Trust Unit v1 - Acceptance Tests

## 🎯 Test Scenarios

All tests are **manual** for v1. Execute in order to verify system behavior.

---

## ✅ Test 1: Baseline Same-Sponsor TU

**Objective:** Verify traditional same-sponsor Trust Units still work.

**Setup:**
- Clean database (or use `Clear All Members` in admin)
- Feature flag: `FEATURE_TU_TRIANGLE=true`

**Steps:**

1. **Admin invites User A**
   - Go to Admin Dashboard → Send Invitation
   - Name: `User A`, Phone: `1111111111`
   - Click "Send Invitation"

2. **User A registers**
   - Navigate to `/connect`
   - Enter name: `User A`
   - Enter phone: `1111111111`
   - Capture selfie
   - Complete registration

3. **User A invites User B**
   - Login as User A (name: `User A`)
   - Go to Member Dashboard
   - Send invitation: Name: `User B`, Phone: `2222222222`

4. **User B registers**
   - Navigate to `/connect`
   - Enter name: `User B`
   - Enter phone: `2222222222`
   - Capture selfie
   - Complete registration

5. **User A invites User C**
   - Login as User A
   - Send invitation: Name: `User C`, Phone: `3333333333`

6. **User C registers**
   - Navigate to `/connect`
   - Enter name: `User C`
   - Enter phone: `3333333333`
   - Capture selfie
   - Complete registration

**Expected Results:**

✅ After User C registers:
- A Trust Unit is created with `rootSponsorId = User A`
- Members: `[User B, User C]` (User A is sponsor, NOT in members array)
- Status: `pending_connections`
- User B logs in → sees Trust Unit modal
- User C logs in → sees Trust Unit modal

**Console Logs:**
```
[TU] triangle-close candidate: inviter=1111111111 invitee=3333333333 root=1111111111
[TU] added members: [2222222222, 3333333333]
[TU] status=pending_connections
```

---

## ✅ Test 2: Triangle Close via Cross-Connection

**Objective:** Verify triangle close detection when A→B, B→C, then A invites C.

**Setup:**
- Clean database
- Feature flag: `FEATURE_TU_TRIANGLE=true`

**Steps:**

1. **Admin invites User A** (becomes root)
   - Name: `User A`, Phone: `1111111111`
   - User A registers

2. **User A invites User B**
   - Name: `User B`, Phone: `2222222222`
   - User B registers
   - Result: Only 1 invitee, NO TU yet

3. **User B invites User C**
   - Name: `User C`, Phone: `3333333333`
   - User C registers
   - Result: User B has 1 invitee, creates TU with root=User A? NO! User C's root is User B.
   - **Important:** User C inherits `rootSponsorId=User B`, NOT User A

4. **Fix: Different scenario**
   - **Admin invites User A** → A is root (`rootSponsorId=A`, `depth=0`)
   - **A invites B** → B gets (`rootSponsorId=A`, `depth=1`)
   - **A invites C** → C gets (`rootSponsorId=A`, `depth=1`)
   - **B invites C** (C is already registered!)
   - **Expected:** Triangle close! A, B, C all share `rootSponsorId=A`

**Revised Steps:**

1. **Admin invites User A**
   - User A registers (root, depth=0)

2. **User A invites User B**
   - User B registers (root=A, depth=1)

3. **User A invites User C**
   - User C registers (root=A, depth=1)
   - **Result:** TU created with members [B, C], root=A

4. **User B tries to invite User C**
   - User C is already registered
   - **Expected:** Blocker fires! `ALREADY_IN_TU` error
   - UI shows toast: "User C is already in your Trust Unit. You're already connected through your Trust Unit."

**Alternative Cross-Connection:**

1. **Admin invites User A** → A registers
2. **A invites B** → B registers (no TU, only 1 invitee)
3. **B invites C** → C registers with sponsor=B, root=A?, NO! root=B (B is C's root)
4. **A invites C** → C is already registered with root=B, different from A's root
5. **Result:** No triangle close (different roots)

**Correct Triangle Close Scenario:**

1. **Admin invites Spencer** → Spencer registers (`root=Spencer, depth=0`)
2. **Spencer invites Test One** → Test One registers (`root=Spencer, depth=1`)
3. **Spencer invites Test Two** → Test Two registers (`root=Spencer, depth=1`)
   - TU created: `root=Spencer, members=[Test One, Test Two]`
4. **Test One invites Test Two** (already registered, same root)
   - **Expected:** Triangle close candidate detected
   - **Result:** `[TU] no-op (already in TU)` (idempotent)

**Expected Results:**

✅ Triangle close detected when all share same root
✅ Idempotent: re-adding existing members is a no-op
✅ Console shows: `[TU] triangle-close candidate: inviter=X invitee=Y root=Z`

---

## ✅ Test 3: Circular Invite Allowed

**Objective:** Verify member can invite their own sponsor (circular).

**Setup:**
- Clean database
- Feature flag: `FEATURE_TU_TRIANGLE=true`

**Steps:**

1. **Admin invites Spencer**
   - Spencer registers (`root=Spencer, depth=0`)

2. **Spencer invites Test One**
   - Test One registers (`root=Spencer, depth=1`)

3. **Test One invites Spencer** (inviting own sponsor!)
   - Spencer is already registered
   - **Expected:** Invite is ALLOWED
   - Console: `📍 [INVITES-SEND] Circular invite detected (allowed): Inviting own sponsor`
   - **Result:** No error, invite goes through

4. **Spencer tries to accept Test One's invite**
   - Spencer is already registered, so this is a no-op
   - Or: System detects Spencer is the root, no action needed

**Expected Results:**

✅ Circular invite is logged but allowed
✅ Telemetry event: `circular_invite_detected`
✅ No error returned to user

---

## ✅ Test 4: Block Invite Within Same TU

**Objective:** Verify duplicate invite blocker prevents inviting TU members.

**Setup:**
- Clean database
- Feature flag: `FEATURE_TU_TRIANGLE=true`

**Steps:**

1. **Admin invites Spencer**
   - Spencer registers

2. **Spencer invites Test One**
   - Test One registers

3. **Spencer invites Test Two**
   - Test Two registers
   - **Result:** TU created with [Test One, Test Two], root=Spencer

4. **Spencer tries to invite Test One again**
   - Enter name: `Test One`, phone: `(same as before)`
   - Click "Send Invitation"
   - **Expected:** API returns `409 Conflict`
   - Response: `{ error: "Test One is already in your Trust Unit", code: "ALREADY_IN_TU" }`
   - UI shows error toast with friendly message

**Expected Results:**

✅ API returns `409` status
✅ Error code: `ALREADY_IN_TU`
✅ UI displays: "Test One is already in your Trust Unit. You're already connected through your Trust Unit."
✅ Invite is NOT created
✅ Telemetry logged: `invite_blocked`

---

## ✅ Test 5: Root Immutability

**Objective:** Verify `rootSponsorId` never changes once set.

**Setup:**
- Clean database
- Feature flag: `FEATURE_TU_TRIANGLE=true`

**Steps:**

1. **Admin invites User A**
   - User A registers
   - **Result:** `rootSponsorId=A`, `depth=0`

2. **User A invites User B**
   - User B registers
   - **Result:** `rootSponsorId=A`, `depth=1`

3. **Verify in Firestore Console**
   - Check User B's document
   - Confirm: `rootSponsorId=A`

4. **User B invites User C**
   - User C registers
   - **Result:** `rootSponsorId=A` (inherited from B, NOT set to B)
   - Depth: `2` (B's depth + 1)

5. **Try to manually change User B's rootSponsorId** (in code)
   - Attempt: `db.collection('users').doc('B').update({ rootSponsorId: 'X' })`
   - **Expected:** Code should prevent this (immutability check)
   - Or: If allowed, subsequent operations should ignore the change

**Expected Results:**

✅ `rootSponsorId` is set once and never changes
✅ All descendants inherit from their sponsor's root
✅ Depth increases with each level
✅ Console: `[ENSURE-ROOT] Already set: root=X, depth=Y`

---

## ✅ Test 6: Multi-Root Allowed

**Objective:** Verify users can belong to multiple TUs across different roots.

**Setup:**
- Clean database
- Feature flag: `FEATURE_TU_TRIANGLE=true`

**Steps:**

1. **Tree 1: Admin invites User A**
   - User A registers (`root=A, depth=0`)

2. **User A invites User X**
   - User X registers (`root=A, depth=1`)

3. **User A invites User Y**
   - User Y registers (`root=A, depth=1`)
   - **Result:** TU1 created with `root=A, members=[X, Y]`

4. **Tree 2: Admin invites User B** (different root!)
   - User B registers (`root=B, depth=0`)

5. **User B invites User X** (X is already registered with root=A!)
   - **Expected:** This is CROSS-ROOT invite
   - User X keeps their original `rootSponsorId=A` (immutable!)
   - But now User B is trying to sponsor someone from a different tree
   - **Result:** Invite is created, but no triangle close (different roots)

6. **Alternative: User B invites NEW User Z**
   - User Z registers (`root=B, depth=1`)

7. **User B invites NEW User W**
   - User W registers (`root=B, depth=1`)
   - **Result:** TU2 created with `root=B, members=[Z, W]`

8. **Check User X's TUs**
   - User X is ONLY in TU1 (root=A)
   - User X is NOT in TU2 (different root)

**Expected Results:**

✅ Each tree has its own root
✅ TUs are scoped by `rootSponsorId`
✅ A member can theoretically be in multiple TUs if invited by different roots (but root is immutable, so this is complex)
✅ **Clarification:** A user can only have ONE `rootSponsorId`, so they can only be in TUs under that root

**Note:** Multi-root for a SINGLE user is actually NOT possible due to immutability! Each user has ONE root. Multi-root means different USERS can have different roots (separate trees).

---

## 🚫 Non-Goals (v1) - Explicitly NOT Testing

These behaviors are **out of scope** for v1:

### 1. N-Degree Graph Traversal
**Not Tested:** Finding connections beyond 1-degree (direct trust bonds).

**Example (NOT implemented):**
- A → B → C → D
- A tries to invite D
- System does NOT check if A and D are connected via B and C

**What IS implemented:**
- Only direct bonds checked
- No multi-hop traversal

### 2. Auto-Merge of Adjacent TUs
**Not Tested:** Automatically merging separate TUs when they connect.

**Example (NOT implemented):**
- TU1: [A, B, C] under root X
- TU2: [D, E, F] under root Y
- If X and Y connect → TUs do NOT auto-merge

**What IS implemented:**
- One TU per root
- TUs remain separate across roots

### 3. Mass Auto-Enrollment
**Not Tested:** Adding entire networks to TUs automatically.

**Example (NOT implemented):**
- Root A has 50 descendants
- New member joins → does NOT automatically add all 50 to TU

**What IS implemented:**
- Members added one-by-one via invites
- Triangle close adds specific pairs

---

## 📋 Test Execution Checklist

- [ ] Test 1: Baseline Same-Sponsor TU
- [ ] Test 2: Triangle Close via Cross-Connection
- [ ] Test 3: Circular Invite Allowed
- [ ] Test 4: Block Invite Within Same TU
- [ ] Test 5: Root Immutability
- [ ] Test 6: Multi-Root Allowed (separate trees)

---

## 🔍 Verification Checklist

For each test, verify:

- [ ] Console logs match expected format: `[TU] triangle-close candidate: inviter=X invitee=Y root=Z`
- [ ] Idempotency: Re-running operations produces same result
- [ ] Telemetry events fired correctly
- [ ] UI displays correct modals/toasts
- [ ] Firestore data is correct (`rootSponsorId`, `depth`, `trustUnits[]`)
- [ ] No duplicate members in TUs
- [ ] Status updates correctly (`pending_connections` → `fully_connected`)

---

## 🐛 Debugging Tips

**If triangle close doesn't trigger:**
1. Check console for `[TU] triangle-close candidate:` log
2. Verify both users have same `rootSponsorId` in Firestore
3. Verify both users have `depth >= 1`
4. Check feature flag: `FEATURE_TU_TRIANGLE=true`

**If blocker doesn't fire:**
1. Check console for `[INVITES-SEND] Checking for duplicate TU membership`
2. Verify `tuInviteBlocker` flag is enabled
3. Check if invitee is actually in the same TU (`memberCodes` array)

**If root is wrong:**
1. Check `ensureRoot()` execution in console
2. Verify sponsor's `rootSponsorId` is correct
3. Confirm immutability (shouldn't change after first set)

---

**Testing Complete!** 🎉

All scenarios verified = Trust Unit v1 is production-ready.











