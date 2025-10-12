# 📋 NOT FOUND REGISTRY - COMPLETE PROGRAMMING PATH

## 🎯 PURPOSE

The `notFoundRegistry` collection is a **queue system** that tracks users who attempted to register but were not found in the system. This allows admins to review and potentially send invitations to these users.

---

## 🔄 COMPLETE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│  USER ATTEMPTS REGISTRATION                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  1. User enters First + Last Name                            │
│     Frontend: /connect                                       │
│     → Normalizes to Proper Case: "John Doe"                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Check if user exists or has invite                       │
│     API: GET /api/user/check-with-invite?name=John%20Doe    │
│     → Searches users collection (nameLower = "john doe")     │
│     → Searches invites collection (nameLower = "john doe")   │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    ┌──────┴──────┐
                    │             │
            ┌───────▼──────┐  ┌──▼────────────┐
            │ FOUND        │  │ NOT FOUND     │
            │ (exists=true)│  │ (exists=false)│
            └───────┬──────┘  └──┬────────────┘
                    │             │
                    │             ↓
                    │  ┌─────────────────────────────────────┐
                    │  │ 3. Show Phone Capture Modal         │
                    │  │    User enters phone number         │
                    │  └─────────────────────────────────────┘
                    │             ↓
                    │  ┌─────────────────────────────────────┐
                    │  │ 4. Submit Phone                     │
                    │  │    API: POST /api/user/capture-phone│
                    │  │    Body: { name, phone, inviteId }  │
                    │  └─────────────────────────────────────┘
                    │             ↓
                    │       ┌─────┴─────┐
                    │       │           │
                    │  ┌────▼─────┐ ┌──▼──────────────┐
                    │  │ Has      │ │ No Invite       │
                    │  │ Invite   │ │                 │
                    │  └────┬─────┘ └──┬──────────────┘
                    │       │          │
                    │       │          ↓
                    │       │  ┌──────────────────────────────┐
                    │       │  │ 5. CREATE notFoundRegistry   │
                    │       │  │    Collection Entry          │
                    │       │  │    {                         │
                    │       │  │      name: "John Doe",       │
                    │       │  │      nameLower: "john doe",  │
                    │       │  │      phone: "5555555555",    │
                    │       │  │      status: "pending",      │
                    │       │  │      source: "phone_capture",│
                    │       │  │      createdAt: timestamp    │
                    │       │  │    }                         │
                    │       │  └──────────────────────────────┘
                    │       │             ↓
                    │       │  ┌──────────────────────────────┐
                    │       │  │ 6. Show "Thank You" Message  │
                    │       │  │    "Admin will review your   │
                    │       │  │     registration request"    │
                    │       │  └──────────────────────────────┘
                    │       │
                    │       ↓
                    │  ┌──────────────────────────────────────┐
                    │  │ Create User Account from Invite      │
                    │  │ → Redirect to /complete-registration │
                    │  └──────────────────────────────────────┘
                    │
                    ↓
         ┌──────────────────────────────┐
         │ Redirect to Dashboard        │
         │ /welcome-back                │
         └──────────────────────────────┘
```

---

## 👨‍💼 ADMIN WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD - Not Found Registry Tab                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  1. Admin views notFoundRegistry entries                     │
│     API: GET /api/admin/not-found-registry                   │
│     → Returns list of users who attempted registration       │
│     → Sorted by createdAt (newest first)                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    ┌──────┴──────┐
                    │             │
         ┌──────────▼──────┐  ┌──▼────────────┐
         │ SEND INVITATION │  │ ARCHIVE       │
         └──────────┬──────┘  └──┬────────────┘
                    │             │
                    ↓             ↓
┌─────────────────────────────┐  ┌──────────────────────────┐
│ 2a. Admin clicks "Send      │  │ 2b. Admin clicks         │
│     Invitation" button      │  │     "Archive" button     │
│                             │  │                          │
│ API: POST                   │  │ API: POST                │
│ /api/admin/send-invitation  │  │ /api/admin/              │
│                             │  │ archive-not-found        │
│ Body: {                     │  │                          │
│   name: "John Doe",         │  │ Body: {                  │
│   phone: "5555555555",      │  │   inviteId: "abc123"     │
│   message: "Welcome!"       │  │ }                        │
│ }                           │  │                          │
└─────────────┬───────────────┘  └──────────┬───────────────┘
              │                              │
              ↓                              ↓
┌─────────────────────────────┐  ┌──────────────────────────┐
│ 3a. CREATE invite in        │  │ 3b. MOVE entry to        │
│     'invites' collection    │  │     'nfArchive'          │
│                             │  │     collection           │
│ {                           │  │                          │
│   name: "John Doe",         │  │ DELETE from              │
│   nameLower: "john doe",    │  │ 'notFoundRegistry'       │
│   phone: "5555555555",      │  │                          │
│   message: "Welcome!",      │  │ (Keeps history but       │
│   sponsorId: "0000000000",  │  │  removes from queue)     │
│   sponsorName: "Admin",     │  │                          │
│   status: "pending",        │  │                          │
│   createdAt: timestamp      │  │                          │
│ }                           │  │                          │
└─────────────┬───────────────┘  └──────────────────────────┘
              │
              ↓
┌─────────────────────────────┐
│ 4. User can now register    │
│    using their name         │
│    (invite will be found)   │
└─────────────────────────────┘
```

---

## 📊 DATABASE COLLECTIONS

### **1. `notFoundRegistry` (Active Queue)**
**Purpose:** Tracks users who attempted registration but weren't found

**Schema:**
```typescript
{
  id: string,                    // Auto-generated document ID
  name: string,                  // Display name (Proper Case)
  nameLower: string,             // Lowercase for searching
  phone: string,                 // Phone number (digits only)
  firstName?: string,            // Optional
  lastName?: string,             // Optional
  status: "pending" | "matched", // Status
  source: "phone_capture",       // How they got here
  createdAt: string,             // ISO timestamp
  matchedPhone?: string,         // If matched to invite
  matchedAt?: string             // When matched
}
```

**Lifecycle:**
- Created when user enters phone but has no invite
- Admin reviews and either:
  - Sends invitation → Entry stays until user completes registration
  - Archives → Moved to `nfArchive`

---

### **2. `invites` (Admin Sent Invitations)**
**Purpose:** Stores invitations sent by admin

**Schema:**
```typescript
{
  id: string,                    // Auto-generated document ID
  name: string,                  // Display name (Proper Case)
  nameLower: string,             // Lowercase for searching
  phone: string,                 // Phone number
  message: string,               // Custom invitation message
  sponsorId: string,             // "0000000000" for admin
  sponsorName: string,           // "Admin"
  status: "pending" | "matched", // Status
  inviteId: string,              // Unique invite identifier
  createdAt: string,             // ISO timestamp
  matchedPhone?: string,         // When user registers
  matchedAt?: string             // When user registers
}
```

**Lifecycle:**
- Created by admin via `/api/admin/send-invitation`
- User registers → Status changes to "matched"
- User account created in `users` collection

---

### **3. `nfArchive` (Archived Not Found)**
**Purpose:** Historical record of archived not found entries

**Schema:**
```typescript
{
  ...all fields from notFoundRegistry,
  archivedAt: string,            // When archived
  originalId: string             // Original document ID
}
```

**Lifecycle:**
- Created when admin archives a not found entry
- Never deleted (permanent history)

---

### **4. `users` (Registered Users)**
**Purpose:** Active user accounts

**Schema:**
```typescript
{
  memberCode: string,            // Document ID (phone number)
  name: string,                  // Display name (Proper Case)
  nameLower: string,             // Lowercase for searching
  phone: string,                 // Phone number
  status: "pending" | "active",  // Account status
  sponsorId: string,             // Who invited them
  sponsorName: string,           // Sponsor's name
  inviteId?: string,             // If created from invite
  source: string,                // "admin_invite" | "member_invite"
  createdAt: string              // ISO timestamp
}
```

---

## 🔧 API ENDPOINTS

### **User Flow**
- `GET /api/user/check-with-invite?name=John%20Doe` - Check if user/invite exists
- `POST /api/user/capture-phone` - Submit phone number

### **Admin Flow**
- `GET /api/admin/not-found-registry` - List all not found entries
- `POST /api/admin/send-invitation` - Send invitation (creates in `invites`)
- `POST /api/admin/archive-not-found` - Archive entry (moves to `nfArchive`)
- `DELETE /api/admin/delete-invite` - Delete invite/entry completely

### **Maintenance**
- `POST /api/admin/migrate-names` - Add `nameLower` to existing records
- `DELETE /api/admin/clear-all` - Clear all collections (dev only)

---

## ✅ CRITICAL RULES

1. **Name Normalization:**
   - Always store BOTH `name` (Proper Case) and `nameLower` (lowercase)
   - Always search using `nameLower` for case-insensitive matching

2. **Collection Separation:**
   - `invites` = Admin sent invitations ONLY
   - `notFoundRegistry` = Users who tried to register but weren't found
   - NEVER mix these two purposes

3. **Search Priority:**
   - Check `users` collection first (existing users)
   - Check `invites` collection second (pending invitations)
   - If neither found → User enters phone → Create `notFoundRegistry` entry

4. **Data Consistency:**
   - Use `normalizeName()` utility for ALL name operations
   - Use `nameLower` field for ALL searches
   - Never search by `name` field directly

---

## 🧪 TESTING

Run the test suite:
```powershell
powershell -ExecutionPolicy Bypass -File test-name-normalization.ps1
```

This tests:
- ✅ Admin sends invite (proper case)
- ✅ User checks with lowercase
- ✅ User checks with UPPERCASE
- ✅ User checks with MiXeD CaSe
- ✅ All variations find the same invite

---

## 📝 SUMMARY

**notFoundRegistry Flow:**
1. User attempts registration → NOT FOUND
2. User enters phone → CREATE `notFoundRegistry` entry
3. Admin reviews → Sends invitation to `invites` collection
4. User tries again → FOUND in `invites` → Registration completes
5. User account created in `users` collection
6. Invite status → "matched"

**Key Point:** `notFoundRegistry` is a **queue**, not a destination. It's a temporary holding area for admin review.





