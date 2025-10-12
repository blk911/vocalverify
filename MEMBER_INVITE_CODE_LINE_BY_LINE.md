# Member Invite Registration Flow - LINE BY LINE CODE REVIEW
**Date:** October 12, 2025  
**Issue:** MEM SIX went to registration WITHOUT phone confirmation  
**Status:** 🔍 UNDER REVIEW

---

## 📋 COMPLETE FLOW BREAKDOWN

### FILE: `src/app/connect/page.tsx`

#### STEP 1: User Enters Name (Lines 295-373)
```typescript
// Line 43: Form submission handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  // Lines 48-59: Validation
  if (!firstName.trim() || !lastName.trim()) {
    setError('Both first name and last name are required');
    setIsLoading(false);
    return;
  }

  // Line 62-63: Concatenate and normalize name
  const rawName = `${firstName.trim()} ${lastName.trim()}`;
  const fullName = toProperCase(rawName);  // "spencer" → "Spencer"

  // Line 71: API CALL TO CHECK NAME
  const response = await fetch(`/api/user/check-with-invite?name=${encodeURIComponent(fullName)}`);
  const data = await response.json();
```

**Result for MEM SIX (Spencer):**
- fullName = "Spencer"
- API call goes to `/api/user/check-with-invite?name=Spencer`

---

#### STEP 2: API Response (Lines 78-144)
```typescript
// Line 78-79: Check response
if (response.ok) {
  
  // Line 80-83: PATH 1 - Existing User
  if (data.exists && data.user) {
    const memberCode = data.user.memberCode || data.user.phone;
    window.location.href = `/welcome-back?name=${encodeURIComponent(fullName)}&status=registered&memberCode=${memberCode}`;
  } 
  
  // Line 84-130: PATH 2 - HAS INVITE ⚠️ CRITICAL
  else if (data.hasInvite && data.invite) {
    console.log('Invite found:', data.invite);  // Line 86
    
    // Line 88-92: CHECK INVITE TYPE
    // ⚠️ THIS IS THE CRITICAL LOGIC
    const isAdminInvite = !data.invite.sponsorId || data.invite.sponsorId === '0000000000';
    const hasPhone = data.invite.phone && data.invite.phone.trim();
    
    // Line 94-123: IF ADMIN + PHONE → AUTO-CREATE
    if (isAdminInvite && hasPhone) {
      console.log('✅ Admin invite with phone, auto-creating user account');
      // ... auto-create logic ...
      window.location.href = `/complete-registration?memberCode=...&autoPhone=true`;
    } 
    
    // Line 124-130: ELSE (MEMBER OR NO PHONE) → PHONE MODAL
    else {
      console.log('Member invite or no phone, asking user to confirm number');
      sessionStorage.setItem('pendingInvite', JSON.stringify(data.invite));
      setHasInvite(true);
      setShowPhoneCapture(true);  // ⚠️ THIS SHOULD SHOW PHONE MODAL
    }
  }
  
  // Line 131-135: PATH 3 - NOT FOUND
  else {
    setHasInvite(false);
    setShowPhoneCapture(true);
  }
}
```

**QUESTION FOR MEM SIX:**
- What is `data.invite.sponsorId`?
- Is it '0000000000' (admin) or a memberCode (member)?
- If it's undefined or memberCode → should show phone modal
- If it's '0000000000' → auto-creates (wrong for member invite)

---

#### STEP 3: Phone Confirmation Modal (Lines 238-293)
```typescript
// Line 238: CONDITIONAL RENDER
if (showPhoneCapture) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        
        // Line 243-244: HEADING
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {hasInvite ? '🎉 Complete Your Registration' : 'Name NOT FOUND!'}
        </h1>
        
        // Line 246-250: DESCRIPTION
        <p className="text-center text-gray-600 mb-6">
          {hasInvite 
            ? 'Enter your phone number to complete registration' 
            : 'Enter your phone and we\'ll be in touch'}
        </p>
        
        // Line 252-277: PHONE FORM
        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <div suppressHydrationWarning>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              PHONE NUMBER *
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}  // ⚠️ Pre-filled from useEffect (lines 29-41)
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              className="..."
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md"
            disabled={isLoading || !phone.trim()}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**THIS IS THE PHONE MODAL** - Should show for member invites!

---

#### STEP 4: Phone Pre-Fill (Lines 29-41)
```typescript
// Line 29-41: useEffect TO PRE-FILL PHONE
useEffect(() => {
  if (showPhoneCapture) {
    const pendingInviteStr = sessionStorage.getItem('pendingInvite');
    if (pendingInviteStr) {
      const pendingInvite = JSON.parse(pendingInviteStr);
      if (pendingInvite.phone) {
        const formatted = formatPhoneNumber(pendingInvite.phone);
        setPhone(formatted);
        console.log('✅ Pre-filled phone from invite:', formatted);
      }
    }
  }
}, [showPhoneCapture]);
```

**This pre-fills the phone from the invite for member invites**

---

#### STEP 5: Phone Submit (Lines 152-208)
```typescript
// Line 152: PHONE FORM SUBMISSION
const handlePhoneSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");
  
  try {
    // Line 159: Extract phone digits
    const phoneDigits = phone.replace(/\D/g, '');
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    
    // Line 162-164: Get pending invite from sessionStorage
    const pendingInviteStr = sessionStorage.getItem('pendingInvite');
    const pendingInvite = pendingInviteStr ? JSON.parse(pendingInviteStr) : null;
    
    console.log('📞 Phone capture request:', { name: fullName, phone: phoneDigits, hasInvite: !!pendingInvite });
    
    // Line 168-178: API CALL TO CAPTURE PHONE
    const response = await fetch('/api/user/capture-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fullName,
        phone: phoneDigits,
        inviteId: pendingInvite?.id  // ⚠️ Links to invite
      })
    });
    
    const data = await response.json();
    
    // Line 183-196: HANDLE RESPONSE
    if (response.ok) {
      sessionStorage.removeItem('pendingInvite');
      
      if (data.hasInvite && data.user) {
        // User created from invite - redirect to complete registration
        console.log('✅ User created from invite, redirecting to complete registration');
        // Line 191: REDIRECT WITH autoPhone=true
        window.location.href = `/complete-registration?memberCode=${data.user.memberCode}&name=${encodeURIComponent(fullName)}&autoPhone=true`;
      } else {
        // No invite - show thank you modal
        console.log('✅ Phone captured successfully');
        setShowThankYou(true);
      }
    }
  } catch (error) {
    console.error('❌ Phone capture error:', error);
    setError('Failed to submit phone number. Please try again.');
  }
};
```

---

## 🔍 CRITICAL ANALYSIS

### THE DECISION POINT (Lines 88-130)

```typescript
// Line 91: ⚠️ THIS DETERMINES IF PHONE MODAL SHOWS
const isAdminInvite = !data.invite.sponsorId || data.invite.sponsorId === '0000000000';
```

**If MEM SIX skipped phone modal, ONE of these is true:**

1. **`data.invite.sponsorId` is undefined**
   - Condition: `!data.invite.sponsorId` = true
   - Result: `isAdminInvite` = true
   - Result: Auto-creates (WRONG!)

2. **`data.invite.sponsorId` is '0000000000'**
   - Condition: `data.invite.sponsorId === '0000000000'` = true
   - Result: `isAdminInvite` = true
   - Result: Auto-creates (WRONG for member invite!)

3. **`data.invite.phone` exists**
   - Condition: `hasPhone` = true
   - Combined with isAdminInvite = true
   - Result: Goes to auto-create path (lines 94-123)

---

## 🐛 POSSIBLE BUGS

### Bug #1: API Not Returning sponsorId
**File:** `src/app/api/user/check-with-invite/route.ts`  
**Lines 60-70:**

```typescript
return NextResponse.json({
  ok: true,
  exists: false,
  hasInvite: true,
  invite: {
    id: inviteDoc.id,
    name: inviteData.name,
    phone: inviteData.phone,
    sponsorName: inviteData.sponsorName
    // ⚠️ WHERE IS sponsorId?
  }
});
```

**MISSING:** `sponsorId: inviteData.sponsorId`

If `sponsorId` is NOT in the response:
- Line 91: `!data.invite.sponsorId` = TRUE
- Result: `isAdminInvite` = TRUE
- Result: Auto-creates WITHOUT phone modal!

---

### Bug #2: Invite Creation Not Setting sponsorId
**File:** `src/app/api/invites/send/route.ts`  
**Lines 24-36:**

```typescript
const inviteData = {
  name: properName,
  nameLower: nameLower,
  phone: invitedPhone,
  invitedPhone,
  invitedName: properName,
  sponsorId: memberCode,           // ✅ This IS set
  sponsorName: memberData?.name || memberData?.fullName || 'Member',
  sponsorMemberCode: memberCode,
  status: 'pending',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};
```

**This looks correct** - sponsorId IS being set

---

## 🎯 THE ROOT CAUSE

**Most Likely:** `/api/user/check-with-invite` is NOT returning `sponsorId` in the response!

### Current API Response:
```json
{
  "ok": true,
  "exists": false,
  "hasInvite": true,
  "invite": {
    "id": "invite123",
    "name": "Spencer",
    "phone": "5551234567",
    "sponsorName": "John Doe"
    // ❌ MISSING: sponsorId
  }
}
```

### What Frontend Receives:
- `data.invite.sponsorId` = undefined
- `!data.invite.sponsorId` = TRUE
- `isAdminInvite` = TRUE  
- Auto-creates WITHOUT phone modal ❌

---

## ✅ THE FIX

**File:** `src/app/api/user/check-with-invite/route.ts`  
**Line 64-69: ADD sponsorId to response**

```typescript
return NextResponse.json({
  ok: true,
  exists: false,
  hasInvite: true,
  invite: {
    id: inviteDoc.id,
    name: inviteData.name,
    phone: inviteData.phone,
    sponsorName: inviteData.sponsorName,
    sponsorId: inviteData.sponsorId  // ✅ ADD THIS!
  }
});
```

---

## 📊 FLOW WITH FIX

### Member Invite (Spencer):
1. Member sends invite → `sponsorId = "1234567890"` ✅
2. API stores invite with `sponsorId = "1234567890"` ✅
3. Spencer enters name → API returns invite WITH `sponsorId` ✅
4. Frontend checks: `data.invite.sponsorId = "1234567890"` ✅
5. Frontend: `isAdminInvite = false` (not '0000000000') ✅
6. Frontend: Goes to ELSE block → Shows phone modal ✅
7. Spencer confirms phone → User created ✅
8. Redirect with `autoPhone=true` → Selfie modal ✅

---

## 🧪 TEST CONSOLE LOGS

Add these to verify:

```typescript
// Line 86 - Log full invite data
console.log('Invite found:', data.invite);
console.log('sponsorId:', data.invite.sponsorId);  // ← Should see memberCode or '0000000000'
console.log('isAdminInvite:', isAdminInvite);      // ← Should see false for member invites
console.log('hasPhone:', hasPhone);                 // ← Should see true
console.log('Decision:', isAdminInvite && hasPhone ? 'AUTO-CREATE' : 'PHONE MODAL');
```

Expected output for member invite (Spencer):
```
Invite found: {id: "...", name: "Spencer", phone: "5551234567", sponsorId: "1234567890", ...}
sponsorId: 1234567890
isAdminInvite: false
hasPhone: true
Decision: PHONE MODAL
```

---

## 🎯 SUMMARY

**Line-by-Line Review Complete**

**Root Cause:** API not returning `sponsorId` in response

**Fix:** Add `sponsorId` to `/api/user/check-with-invite` response (Line 69)

**Result:** Frontend can correctly differentiate admin vs member invites

**Status:** Ready to apply fix

