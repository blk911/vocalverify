# SCHEMA MISMATCH REPORT - COMPREHENSIVE FIELD MAPPING

## CRITICAL FINDING: FRONTEND INPUTS DON'T MATCH DATABASE SCHEMA

### 1. INVITE FORM INPUTS vs DATABASE SCHEMA

#### A. MEMBER DASHBOARD INVITE FORM (InviteManagement.tsx)
**Frontend Input Fields:**
- `firstName` (string)
- `lastName` (string) 
- `phone` (string, formatted as (XXX) XXX-XXXX)

**API Call:** `/api/invites/send`
**API Expects:**
- `memberCode` (string)
- `invitedName` (string) - **CONSTRUCTED** from firstName + lastName
- `invitedPhone` (string) - **STRIPPED** of formatting

**Database Schema (invites collection):**
- `name` (string) - **STORED** as invitedName
- `phone` (string) - **STORED** as invitedPhone
- `sponsorName` (string)
- `sponsorId` (string)
- `sponsorMemberCode` (string)
- `status` (string)
- `createdAt` (string)

**✅ MATCH STATUS: WORKING** - Field mapping is correct

#### B. ADMIN DASHBOARD INVITE FORM (admin-dashboard/page.tsx)
**Frontend Input Fields:**
- `name` (string)
- `phone` (string, formatted as (XXX) XXX-XXXX)

**API Call:** `/api/admin/send-invitation` ❌ **WRONG ENDPOINT**
**API Expects:**
- `name` (string)
- `phone` (string)

**Database Schema (invites collection):**
- `inviteCode` (string)
- `inviterUid` (string) ❌ **WRONG FIELD NAME**
- `inviterMemberCode` (string) ❌ **WRONG FIELD NAME**
- `inviterName` (string) ❌ **WRONG FIELD NAME**
- `inviteeEmail` (string) ❌ **WRONG FIELD NAME**
- `inviteeName` (string) ❌ **WRONG FIELD NAME**

**❌ MATCH STATUS: BROKEN** - Wrong endpoint + wrong field names

### 2. USER REGISTRATION INPUTS vs DATABASE SCHEMA

#### A. REGISTRATION FORM (register/page.tsx)
**Frontend Input Fields:**
- `name` (string)
- `phone` (string, formatted as (XXX) XXX-XXXX)

**API Call:** `/api/user/create`
**API Expects:**
- `name` (string)
- `memberCode` (string) - **DERIVED** from phone
- `phone` (string) - **STRIPPED** of formatting

**Database Schema (users collection):**
- `name` (string)
- `memberCode` (string)
- `phone` (string)
- `status` (string)
- `createdAt` (string)
- `hasVoice` (boolean)

**✅ MATCH STATUS: WORKING** - Field mapping is correct

### 3. TRUST BOND INPUTS vs DATABASE SCHEMA

#### A. TRUST BOND CREATION
**Frontend Input Fields:**
- `fromMemberCode` (string)
- `toMemberCode` (string)
- `message` (string)

**API Call:** `/api/trust/bonds`
**API Expects:**
- `fromMemberCode` (string)
- `toMemberCode` (string)
- `message` (string)

**Database Schema (trustBonds collection):**
- `fromMemberCode` (string)
- `toMemberCode` (string)
- `message` (string)
- `status` (string)
- `createdAt` (string)
- `updatedAt` (string)

**✅ MATCH STATUS: WORKING** - Field mapping is correct

### 4. TRUST UNIT INPUTS vs DATABASE SCHEMA

#### A. TRUST UNIT CREATION
**Frontend Input Fields:**
- `name` (string)
- `description` (string)
- `memberCodes` (array)
- `creatorCode` (string)

**API Call:** `/api/trust/units`
**API Expects:**
- `name` (string)
- `description` (string)
- `memberCodes` (array)
- `creatorCode` (string)

**Database Schema (trustUnits collection):**
- `name` (string)
- `description` (string)
- `members` (array) - **STORED** as memberCodes
- `creatorCode` (string)
- `status` (string)
- `createdAt` (string)
- `updatedAt` (string)

**✅ MATCH STATUS: WORKING** - Field mapping is correct

## CRITICAL MISMATCHES FOUND

### 1. ADMIN DASHBOARD INVITE SYSTEM
**File:** `src/app/admin-dashboard/page.tsx`
**Problem:** Calls wrong API endpoint
- **Calls:** `/api/admin/send-invitation` ❌
- **Should call:** `/api/invites/send` ✅

**Database Impact:** Creates records with wrong field names
- **Creates:** `inviterUid`, `inviterName`, `inviteeEmail`, `inviteeName` ❌
- **Should create:** `sponsorId`, `sponsorName`, `name`, `phone` ✅

### 2. MEMBER DASHBOARD INVITE LIST
**File:** `src/app/member-dashboard/page.tsx`
**Problem:** Calls wrong API endpoint
- **Calls:** `/api/invites/list` ❌
- **Should call:** `/api/member/invite-history` ✅

### 3. QR CODE GENERATION
**File:** `src/app/api/invites/generate-qr/route.ts`
**Problem:** Uses wrong field names
- **Expects:** `inviteeName`, `inviterName`, `inviterCode` ❌
- **Should expect:** `invitedName`, `sponsorName`, `sponsorMemberCode` ✅

## REPAIR PLAN

### PHASE 1: FIX CRITICAL ENDPOINTS
1. **Admin Dashboard** - Change API call from `/api/admin/send-invitation` to `/api/invites/send`
2. **Member Dashboard** - Change API call from `/api/invites/list` to `/api/member/invite-history`
3. **QR Generation** - Update field names to match schema

### PHASE 2: STANDARDIZE FIELD NAMES
1. **Standardize on:** `invitedName`, `invitedPhone`, `sponsorName`, `sponsorId`
2. **Deprecate:** `inviteeName`, `inviteeEmail`, `inviterName`, `inviterUid`
3. **Update all API endpoints** to use consistent field names

### PHASE 3: DATABASE MIGRATION
1. **Migrate existing data** from old field names to new field names
2. **Update all queries** to use new field names
3. **Remove old field names** from database

### PHASE 4: VALIDATION
1. **Run naming convention audit** on every commit
2. **Test all forms** end-to-end
3. **Verify database consistency**

## IMMEDIATE ACTIONS REQUIRED

1. **Fix admin dashboard API call** - Change endpoint
2. **Fix member dashboard API call** - Change endpoint  
3. **Update QR generation** - Fix field names
4. **Test all invite flows** - Verify data saves correctly
5. **Run comprehensive audit** - Catch all mismatches

## CONCLUSION

The core issue is **inconsistent naming conventions** between frontend forms and database schema. While the member dashboard works correctly, the admin dashboard creates data with wrong field names, causing display issues.

**The schema needs to match the inputs, and the backend must reference the schema database names to properly execute the app flow.**
