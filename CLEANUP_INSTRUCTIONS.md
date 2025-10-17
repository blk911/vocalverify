# 🗑️ TRUST UNIT CLEANUP - REMOVE CORRUPT DATA

## Date: 2025-10-13

---

## 🚨 **PROBLEM IDENTIFIED:**

Your dashboard shows a Trust Unit with:
- Members: `5127715877` (Spencer) + `5551111111` (Mem One)
- Size: 2

### ❌ **THIS IS CORRUPT DATA**

**Why it's wrong:**
1. Spencer has only **1 invitee** (Mem One)
2. According to NEW LOGIC: TU should only exist when sponsor has **2+ invitees**
3. According to NEW LOGIC: **Sponsor should NOT be in TU members array**
4. This TU was created by the **OLD BROKEN CODE**

---

## 🛠️ **SOLUTION: RUN CLEANUP**

### **Option 1: Via API (RECOMMENDED)**

#### Step 1: Check what will be deleted (dry run)
```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/cleanup-trust-units" -Method GET
```

#### Step 2: Delete invalid Trust Units
```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/cleanup-trust-units" -Method DELETE
```

---

### **Option 2: Via Browser Console**

1. Open browser console (F12)
2. Run:

```javascript
// Check what will be deleted
fetch('/api/admin/cleanup-trust-units')
  .then(r => r.json())
  .then(data => {
    console.log('Invalid TUs to delete:', data.invalid);
    console.log('Valid TUs to keep:', data.valid);
    console.log('Details:', data);
  });

// Then delete them
fetch('/api/admin/cleanup-trust-units', { method: 'DELETE' })
  .then(r => r.json())
  .then(data => {
    console.log('Cleanup complete!');
    console.log('Deleted:', data.deleted);
    console.log('Kept:', data.kept);
  });
```

---

## ✅ **EXPECTED RESULT:**

### Before Cleanup:
```
TRUST UNITS (1)
┌─────────────────────────────────────────────────┐
│ Unit #7w0rBZqg  │ 5127715877, 5551111111 │ 2  │
└─────────────────────────────────────────────────┘
```

### After Cleanup:
```
TRUST UNITS (0)
┌─────────────────────────────────────────────────┐
│ No trust units created yet - Units form when   │
│ you invite 2+ members                           │
└─────────────────────────────────────────────────┘
```

---

## 📊 **CLEANUP CRITERIA:**

The script will DELETE any Trust Unit that has:

1. **Sponsor in members array**
   - Example: `members: [sponsor, invitee]` ❌
   - Should be: `members: [invitee1, invitee2]` ✅

2. **Less than 2 members**
   - Example: `members: [invitee1]` ❌
   - Should be: `members: [invitee1, invitee2]` ✅

---

## 🔄 **TEST AFTER CLEANUP:**

1. **Refresh Dashboard** → Trust Units should show "0"
2. **Invite 2nd member** → Trust Unit should be created
3. **Check Groups tab** → Should match Overview tab

---

## 📝 **FILES CREATED:**

1. ✅ `src/scripts/cleanup-invalid-trust-units.ts` - Cleanup logic
2. ✅ `src/app/api/admin/cleanup-trust-units/route.ts` - API endpoint
3. ✅ `CLEANUP_INSTRUCTIONS.md` - This file

---

## 🚀 **READY TO CLEAN!**

Run the DELETE command and refresh your dashboard. The corrupt TU should be gone!











