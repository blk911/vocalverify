# 🔍 How to Check for Syntax/Logic Mismatches

**Quick Answer**: Run `.\check-stack-mismatch.ps1`

---

## ⚡ **QUICK START**

### **Run This Command**
```powershell
.\check-stack-mismatch.ps1
```

### **What It Does**
1. ✅ Tests complete invite flow
2. ✅ Verifies API responses
3. ✅ Checks database entries
4. ✅ Validates frontend code
5. ✅ Reports any mismatches

### **Output**
- **Green ✅** = Everything matches
- **Red ❌** = Mismatch found (with details)

---

## 📊 **CURRENT STATUS**

**Result**: ✅ **ALL CHECKS PASSED**

```
Testing Invite Flow...
1. Creating test invite...           ✅ Success
2. Checking if invite found...       ✅ Invite found
3. Capturing phone with invite...    ✅ User created
4. Verifying in database...          ✅ User in database

Checking Frontend Code...
   ✅ data.hasInvite check
   ✅ data.invite usage
   ✅ sessionStorage pendingInvite
   ✅ inviteId parameter

✅ ALL CHECKS PASSED
No mismatches found!
```

---

## 🎯 **WHAT WAS THE PROBLEM?**

### **Original Issue**
Admin sent invite → User tried to register → Got "Name NOT FOUND"

### **Root Cause**
Frontend was checking for **wrong field names**:
```typescript
// ❌ WRONG (old code)
if (data.status === 'INVITEE') { ... }

// ✅ CORRECT (fixed)
if (data.hasInvite && data.invite) { ... }
```

### **The Fix**
1. Updated frontend to check correct fields
2. Enhanced API to handle invites properly
3. Added validation tools to catch future issues

---

## 🛠️ **HOW TO CHECK FOR MISMATCHES**

### **Method 1: Automated (Recommended)**
```powershell
# Run validation script
.\check-stack-mismatch.ps1

# If it passes: ✅ No mismatches
# If it fails: ❌ Shows exactly what's wrong
```

### **Method 2: Manual Testing**
```powershell
# 1. Test API endpoint
curl.exe http://localhost:3000/api/user/check-with-invite?name=Test

# 2. Check response structure
# Look for: ok, exists, hasInvite, invite

# 3. Verify frontend uses same fields
Select-String -Path "src\app\connect\page.tsx" -Pattern "hasInvite"
```

### **Method 3: Code Review**
Look for these patterns:

#### **Field Name Mismatches**
```typescript
// API returns:
{ hasInvite: true, invite: {...} }

// Frontend checks:
if (data.hasInvite) { ... }  // ✅ MATCHES

// NOT:
if (data.status === 'INVITEE') { ... }  // ❌ MISMATCH
```

#### **Object Structure Mismatches**
```typescript
// API returns:
{ invite: { id, name, phone } }

// Frontend accesses:
data.invite.id  // ✅ MATCHES

// NOT:
data.inviteData.inviteId  // ❌ MISMATCH
```

---

## 📋 **VALIDATION CHECKLIST**

When adding/modifying features:

### **Before Coding**
- [ ] Define API request/response structure
- [ ] Document field names
- [ ] Check existing patterns

### **During Coding**
- [ ] Use exact field names from API
- [ ] Match nesting structure
- [ ] Keep types consistent

### **After Coding**
- [ ] Run `.\check-stack-mismatch.ps1`
- [ ] Test in browser
- [ ] Check console for errors
- [ ] Verify database entries

---

## 🚨 **COMMON MISMATCH SIGNS**

### **In Browser Console**
```
❌ Cannot read property 'x' of undefined
❌ data.invite is undefined
❌ Unexpected token in JSON
```

### **In Behavior**
- API returns data but UI doesn't show it
- Form submits but nothing happens
- Data not saving to database
- Redirect doesn't work

### **In Code**
- Different field names in different files
- Inconsistent casing (memberCode vs member_code)
- Wrong object nesting (data.user vs data.member)

---

## ✅ **WHAT'S FIXED NOW**

### **Frontend** (`src/app/connect/page.tsx`)
```typescript
// ✅ Checks correct fields
if (data.hasInvite && data.invite) {
  sessionStorage.setItem('pendingInvite', JSON.stringify(data.invite));
  setShowPhoneCapture(true);
}

// ✅ Passes invite ID
body: JSON.stringify({
  name: fullName,
  phone: phoneDigits,
  inviteId: pendingInvite?.id
})

// ✅ Handles response correctly
if (data.hasInvite && data.user) {
  window.location.href = `/complete-registration?memberCode=${data.user.memberCode}`;
}
```

### **API** (`src/app/api/user/capture-phone/route.ts`)
```typescript
// ✅ Returns consistent structure
return NextResponse.json({
  ok: true,
  hasInvite: true,
  user: {
    memberCode: phoneDigits,
    name: name.trim(),
    phone: phoneDigits,
    status: 'pending',
    sponsorName: matchedInvite.sponsorName
  }
});
```

### **Database**
```typescript
// ✅ Stores with consistent field names
await db.collection('users').doc(phoneDigits).set({
  name: name.trim(),
  phone: phoneDigits,
  memberCode: phoneDigits,
  status: 'pending',
  sponsorId: matchedInvite.sponsorId,
  sponsorName: matchedInvite.sponsorName
});
```

---

## 📖 **AVAILABLE TOOLS**

### **1. `check-stack-mismatch.ps1`** ⭐ Recommended
- **Purpose**: Quick validation
- **Time**: ~5 seconds
- **Output**: Pass/fail with issues listed

### **2. `test-invite-flow.ps1`**
- **Purpose**: End-to-end flow test
- **Time**: ~10 seconds
- **Output**: Step-by-step verification

### **3. `validate-stack-consistency.ps1`**
- **Purpose**: Deep validation
- **Time**: ~15 seconds
- **Output**: Comprehensive report

---

## 🎯 **WHEN TO RUN VALIDATION**

### **Always**
- ✅ Before committing code
- ✅ After modifying APIs
- ✅ When debugging "undefined" errors
- ✅ After pulling changes

### **Recommended**
- ✅ Daily during active development
- ✅ Before testing new features
- ✅ After database schema changes

---

## 💡 **BEST PRACTICES**

### **1. Use TypeScript Interfaces**
```typescript
interface ApiResponse {
  ok: boolean;
  hasInvite: boolean;
  invite?: {
    id: string;
    name: string;
    phone: string;
  };
}
```

### **2. Document API Contracts**
```typescript
/**
 * POST /api/user/capture-phone
 * Request: { name: string, phone: string, inviteId?: string }
 * Response: { ok: boolean, hasInvite: boolean, user?: {...} }
 */
```

### **3. Consistent Naming**
```typescript
// ✅ GOOD - Same everywhere
memberCode, hasInvite, sponsorName

// ❌ BAD - Different names
memberCode, member_code, memberId
```

### **4. Test After Changes**
```powershell
# Quick check
.\check-stack-mismatch.ps1

# Full test
.\test-invite-flow.ps1
```

---

## 📞 **QUICK REFERENCE**

| Task | Command |
|------|---------|
| Check for mismatches | `.\check-stack-mismatch.ps1` |
| Test invite flow | `.\test-invite-flow.ps1` |
| Search frontend code | `Select-String -Path "src\**\*.tsx" -Pattern "hasInvite"` |
| Test API directly | `curl.exe http://localhost:3000/api/endpoint` |
| Check database | `curl.exe http://localhost:3000/api/admin/members` |

---

## ✅ **SUMMARY**

**Question**: "How do we check for mismatch logic/syntax errors?"

**Answer**:
1. **Run**: `.\check-stack-mismatch.ps1`
2. **Result**: ✅ All checks passed
3. **Status**: No mismatches found

**Tools Provided**:
- ✅ Automated validation script
- ✅ End-to-end flow test
- ✅ Comprehensive documentation
- ✅ Code review checklist

**Current State**:
- ✅ Frontend logic fixed
- ✅ API responses consistent
- ✅ Database schema aligned
- ✅ All field names match

---

**Status**: ✅ **STACK IS CONSISTENT**  
**Validation**: Automated + Manual  
**Result**: 100% Pass Rate  
**Tools**: Ready to use





