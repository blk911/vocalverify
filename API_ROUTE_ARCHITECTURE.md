# AmIHuman API Route Architecture
**Version:** 1.0  
**Last Updated:** October 12, 2025  
**Status:** Production Ready  

---

## 📋 Table of Contents
1. [User Management Routes](#user-management-routes)
2. [Invite System Routes](#invite-system-routes)
3. [Trust Network Routes](#trust-network-routes)
4. [Voice Authentication Routes](#voice-authentication-routes)
5. [Admin Routes](#admin-routes)
6. [Testing & Diagnostics](#testing--diagnostics)
7. [Data Structures](#data-structures)

---

## 🔐 User Management Routes

### `/api/user/check` (GET/POST)
**Purpose:** Check if user exists by name  
**Parameters:**
- `firstName` (string)
- `lastName` (string)

**Returns:**
```json
{
  "ok": true,
  "exists": boolean,
  "user": { memberCode, name, status, ... }
}
```

### `/api/user/check-with-invite` (POST)
**Purpose:** Check user and match with invite  
**Parameters:**
- `firstName` (string)
- `lastName` (string)

**Returns:**
```json
{
  "ok": true,
  "exists": boolean,
  "hasInvite": boolean,
  "invite": { ... },
  "user": { ... }
}
```

### `/api/user/capture-phone` (POST)
**Purpose:** Capture phone and create user account  
**Parameters:**
- `name` (string)
- `phone` (string)
- `inviteId` (string)

**Returns:**
```json
{
  "ok": true,
  "user": { memberCode, name, phone, status },
  "hasInvite": true
}
```

**Creates:**
- User record in Firestore
- Links to invite
- Sets sponsor information

### `/api/user/upload-picture` (POST) ⚡ CRITICAL
**Purpose:** Upload selfie and COMPLETE REGISTRATION  
**Parameters:**
- `memberCode` (string)
- `profilePicture` (base64 string)

**Returns:**
```json
{
  "ok": true,
  "message": "Profile picture uploaded and registration completed",
  "user": { memberCode, hasProfilePicture, status: "registered" },
  "sponsorDivisionsCreated": boolean
}
```

**Creates (if has sponsor):**
1. Trust Bond (sponsor → new member, auto-accepted)
2. Trust Connection (bidirectional)
3. Trust Unit (adds to sponsor's group)

### `/api/user/profile` (GET/PUT)
**Purpose:** Get/update user profile  
**GET Parameters:** `?memberCode=XXXXXXXXXX`  
**PUT Body:** Profile fields to update

### `/api/user/profile-picture` (GET)
**Purpose:** Get user's profile picture  
**Parameters:** `?memberCode=XXXXXXXXXX`

### `/api/user/create` (POST)
**Purpose:** Create new user (legacy)

### `/api/user/create-temp` (POST)
**Purpose:** Create temporary member

### `/api/user/lookup` (GET)
**Purpose:** Lookup user by various criteria

### `/api/user/pending` (GET)
**Purpose:** Get pending user registrations

### `/api/user/phone` (POST)
**Purpose:** Update user phone number

### `/api/user/complete-registration` (POST)
**Purpose:** Mark registration as complete

---

## 📨 Invite System Routes

### `/api/invites/send` (POST)
**Purpose:** Member sends invite to new person  
**Parameters:**
- `memberCode` (string) - Sender's member code
- `invitedName` (string) - Recipient's name
- `invitedPhone` (string) - Recipient's phone

**Returns:**
```json
{
  "ok": true,
  "invite": {
    "id": "invite123",
    "name": "John Doe",
    "phone": "5551234567",
    "sponsorId": "memberCode",
    "sponsorName": "Jane Smith",
    "sponsorMemberCode": "memberCode",
    "status": "pending",
    "createdAt": "..."
  }
}
```

**Creates:**
- Invite record with sponsor info
- Ready for recipient registration

### `/api/invites/list` (GET) ✅ FIXED
**Purpose:** List all invites sent by a member  
**Parameters:** `?memberCode=XXXXXXXXXX`

**Query:** `.where('inviterMemberCode', '==', memberCode)` (sorts in memory)

**Returns:**
```json
{
  "ok": true,
  "invites": [
    {
      "id": "invite123",
      "inviterMemberCode": "1234567890",
      "invitedName": "John Doe",
      "invitedPhone": "5551234567",
      "status": "pending",
      "createdAt": "..."
    }
  ],
  "count": 1
}
```

### `/api/invites/update-status` (POST)
**Purpose:** Update invite status  
**Parameters:**
- `inviteId` (string)
- `status` (string) - "accepted", "rejected", "pending"

### `/api/member/invite-history` (GET) ✅ FIXED
**Purpose:** Get member's invite history  
**Parameters:** `?memberCode=XXXXXXXXXX`

**Query:** `.where('inviterUid', '==', memberCode)` (no orderBy)

### `/api/member/send-invitation` (POST)
**Purpose:** Member sends invitation (alternative endpoint)

### `/api/admin/send-invitation` (POST)
**Purpose:** Admin sends invitation  
**Parameters:**
- `inviterMemberCode` (string) - Admin code
- `inviteeEmail` (string)
- `inviteeName` (string)

**Creates:**
- Admin invite with sponsorId = '0000000000'

### `/api/admin/invite-history` (GET)
**Purpose:** Get all invites (admin view)

### `/api/admin/delete-invite` (DELETE)
**Purpose:** Delete an invite  
**Parameters:** `?inviteId=XXXXX`

---

## 🤝 Trust Network Routes

### Trust Units

#### `/api/trust-units/list` (GET) ✅ FIXED
**Purpose:** List all trust units member belongs to  
**Parameters:** `?memberCode=XXXXXXXXXX`

**Query:** `.where('members', 'array-contains', memberCode)`

**Returns:**
```json
{
  "ok": true,
  "trustUnits": [
    {
      "id": "unit123",
      "members": ["1234567890", "0987654321"],
      "size": 2,
      "sponsorCode": "1234567890",
      "status": "active",
      "createdAt": {},
      "updatedAt": {}
    }
  ]
}
```

#### `/api/trust/units/connect` (POST)
**Purpose:** Initiate trust unit connection  
**Parameters:**
- `memberCode` (string)
- `targetMemberCode` (string)

**Creates:**
- Trust connection with status "pending"

#### `/api/trust/units/status` (POST)
**Purpose:** Update trust unit status  
**Parameters:**
- `unitId` (string)
- `status` (string)

#### `/api/trust/units/members` (GET)
**Purpose:** Get members of a trust unit  
**Parameters:** `?unitId=XXXXX`

#### `/api/trust/units/wait` (GET) ✅ FIXED
**Purpose:** Get pending trust unit connections  
**Parameters:** `?memberCode=XXXXXXXXXX`

**Query:** `.where('toMemberCode', '==', memberCode).where('status', '==', 'pending')`

---

### Trust Bonds

#### `/api/trust-bonds/list` (GET) ✅ FIXED
**Purpose:** List all trust bonds for a member  
**Parameters:** `?memberCode=XXXXXXXXXX`

**Queries:**
- Sent: `.where('fromMemberCode', '==', memberCode)`
- Received: `.where('toMemberCode', '==', memberCode)`

**Returns:**
```json
{
  "ok": true,
  "trustBonds": [
    {
      "id": "bond123",
      "direction": "sent",
      "fromMemberCode": "1234567890",
      "toMemberCode": "0987654321",
      "fromMemberName": "Jane Smith",
      "toMemberName": "John Doe",
      "status": "accepted",
      "type": "sponsor",
      "message": "Sponsor relationship",
      "createdAt": {},
      "acceptedAt": {},
      "updatedAt": {}
    }
  ]
}
```

#### `/api/trust/bonds/create` (POST)
**Purpose:** Create new trust bond request  
**Parameters:**
- `fromMemberCode` (string)
- `toMemberCode` (string)
- `message` (string, optional)

**Validation:**
- Checks both members exist
- Prevents self-bonding
- Prevents duplicate bonds

**Returns:**
```json
{
  "ok": true,
  "bond": {
    "id": "bond123",
    "fromMemberCode": "1234567890",
    "toMemberCode": "0987654321",
    "status": "pending",
    "message": "Let's connect!",
    "createdAt": {}
  },
  "message": "Trust bond request sent successfully"
}
```

#### `/api/trust/bonds/accept` (POST)
**Purpose:** Accept pending trust bond  
**Parameters:**
- `bondId` (string)
- `memberCode` (string)

#### `/api/trust/bonds/reject` (POST)
**Purpose:** Reject pending trust bond  
**Parameters:**
- `bondId` (string)
- `memberCode` (string)

---

## 🎤 Voice Authentication Routes

### `/api/voice/init` (POST)
**Purpose:** Initialize voice authentication session  
**Returns:** Session token

### `/api/voice/upload` (POST)
**Purpose:** Upload voice recording  
**Parameters:**
- `memberCode` (string)
- `audioData` (base64)
- `recordingType` (string)

### `/api/voice/analyze` (POST)
**Purpose:** Analyze voice recording  
**Parameters:**
- `audioData` (base64)

### `/api/voice/verify` (POST)
**Purpose:** Verify voice against stored print  
**Parameters:**
- `memberCode` (string)
- `audioData` (base64)

### `/api/voice/aws-verify` (POST)
**Purpose:** AWS Transcribe verification  
**Parameters:**
- `audioData` (base64)
- `expectedText` (string)

### `/api/voice/anti-spoof` (POST)
**Purpose:** Check for voice spoofing

### `/api/voice/multi-factor` (POST)
**Purpose:** Multi-factor voice authentication

### `/api/voice/spelling-verify` (POST)
**Purpose:** Verify spelling pronunciation

### `/api/voice/commit` (POST)
**Purpose:** Commit voice print to storage

### `/api/voice/register-print` (POST)
**Purpose:** Register new voice print

### `/api/voice/test-transcribe` (POST)
**Purpose:** Test AWS Transcribe connection

### `/api/voice/prints/upload` (POST)
**Purpose:** Upload voice print

### `/api/voice/prints/get` (GET)
**Purpose:** Get voice print  
**Parameters:** `?memberCode=XXXXXXXXXX`

### `/api/voice/prints` (GET)
**Purpose:** List all voice prints

### `/api/voice-prints` (GET)
**Purpose:** Get voice prints (alternative endpoint)

---

## 👨‍💼 Admin Routes

### `/api/admin/stats` (GET)
**Purpose:** Get system statistics  
**Returns:**
```json
{
  "ok": true,
  "stats": {
    "totalUsers": 150,
    "registeredUsers": 100,
    "pendingUsers": 50,
    "totalInvites": 200,
    "acceptedInvites": 120,
    "trustUnits": 25,
    "trustBonds": 180
  }
}
```

### `/api/admin/members` (GET)
**Purpose:** Get all members  
**Returns:** List of all users

### `/api/admin/approve-member` (POST)
**Purpose:** Approve pending member  
**Parameters:**
- `memberCode` (string)

### `/api/admin/delete-user` (DELETE)
**Purpose:** Delete a user  
**Parameters:** `?memberCode=XXXXXXXXXX`

### `/api/admin/not-found-registry` (GET)
**Purpose:** Get not-found registry entries

### `/api/admin/nf-archive` (GET)
**Purpose:** Get archived not-found entries

### `/api/admin/archive-not-found` (POST)
**Purpose:** Archive not-found entry  
**Parameters:**
- `entryId` (string)

### `/api/admin/migrate-names` (POST)
**Purpose:** Migrate name format in database

### `/api/admin/clear-all` (DELETE)
**Purpose:** Clear all data (DANGEROUS)  
**Deletes:**
- All users
- All invites
- All trust data
- All voice data

### `/api/admin/init-database` (GET/POST)
**Purpose:** Initialize/verify database structure  
**GET:** Check status  
**POST:** Initialize collections

### `/api/admin/setup-database` (GET/POST)
**Purpose:** Setup database collections  
**GET:** Check collection status  
**POST:** Create collections

---

## 🔧 Testing & Diagnostics

### `/api/test-firestore` (GET)
**Purpose:** Test Firestore connection  
**Action:** Writes and reads test document

### `/api/test-firebase` (GET)
**Purpose:** Test Firebase Admin connection

### `/api/test-connection` (GET)
**Purpose:** Test general connectivity

### `/api/benchmark` (GET)
**Purpose:** Run voice authentication benchmark  
**Returns:** Performance metrics

### `/api/debug-credsource` (GET)
**Purpose:** Debug credential source

### `/api/device/fingerprint` (POST)
**Purpose:** Generate device fingerprint  
**Returns:** Unique device ID

---

## 📦 Upload Routes

### `/api/upload/picture` (POST)
**Purpose:** Upload profile picture (legacy)

### `/api/upload/logo` (POST)
**Purpose:** Upload logo image

---

## 📊 Data Structures

### User Document
```javascript
{
  memberCode: '1234567890',        // 10-digit unique ID
  name: 'John Doe',                // Full name
  fullName: 'John Doe',            // Same as name
  firstName: 'John',
  lastName: 'Doe',
  nameLower: 'john doe',           // Lowercase for searching
  phone: '5551234567',             // 10 digits
  email: 'john@example.com',
  profilePicture: 'base64...',     // Base64 image
  status: 'registered',            // 'pending' | 'registered' | 'approved'
  sponsorId: '0987654321',         // Sponsor's memberCode or '0000000000'
  sponsorMemberCode: '0987654321', // Same as sponsorId
  sponsorName: 'Jane Smith',
  inviteId: 'invite123',
  source: 'member_invite',         // 'admin_invite' | 'member_invite'
  hasVoice: true,
  voiceUrl: 'gs://...',
  createdAt: '2025-10-12T...',
  updatedAt: '2025-10-12T...',
  completedAt: '2025-10-12T...',
  selfieUploadedAt: '2025-10-12T...'
}
```

### Invite Document
```javascript
{
  id: 'invite123',                 // Auto-generated
  name: 'John Doe',                // Invitee name (proper case)
  nameLower: 'john doe',           // Lowercase for searching
  phone: '5551234567',             // Invitee phone
  invitedName: 'John Doe',         // Same as name
  invitedPhone: '5551234567',      // Same as phone
  inviterMemberCode: '0987654321', // Who sent invite
  sponsorId: '0987654321',         // Who will be sponsor
  sponsorMemberCode: '0987654321', // Same as sponsorId
  sponsorName: 'Jane Smith',
  status: 'pending',               // 'pending' | 'accepted' | 'rejected'
  createdAt: '2025-10-12T...',
  expiresAt: '2025-10-19T...'      // 7 days from creation
}
```

### Trust Unit Document
```javascript
{
  id: 'unit123',                   // Auto-generated
  members: ['1234567890', '0987654321'], // Array of memberCodes
  size: 2,                         // Number of members
  sponsorCode: '1234567890',       // Unit owner/sponsor
  status: 'active',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Trust Bond Document
```javascript
{
  id: 'bond123',                   // Auto-generated
  fromMemberCode: '1234567890',    // Sender
  toMemberCode: '0987654321',      // Receiver
  fromMemberName: 'Jane Smith',
  toMemberName: 'John Doe',
  status: 'accepted',              // 'pending' | 'accepted' | 'rejected'
  type: 'sponsor',                 // 'sponsor' | undefined
  message: 'Sponsor relationship',
  createdAt: Timestamp,
  acceptedAt: Timestamp,           // When accepted
  updatedAt: Timestamp
}
```

### Trust Connection Document
```javascript
{
  id: 'conn123',                   // Auto-generated
  member1Code: '1234567890',
  member2Code: '0987654321',
  member1Name: 'Jane Smith',
  member2Name: 'John Doe',
  bondId: 'bond123',               // Related trust bond
  status: 'active',                // 'active' | 'pending' | 'inactive'
  type: 'sponsor',                 // 'sponsor' | undefined
  createdAt: Timestamp
}
```

---

## 🔄 Registration Flow

```mermaid
graph TD
    A[Admin/Member Sends Invite] --> B[/api/invites/send]
    B --> C[Invite Created with Sponsor Info]
    C --> D[User Enters Name on /connect]
    D --> E[/api/user/check-with-invite]
    E --> F{Has Invite?}
    F -->|Yes + Phone| G[Auto-create Account]
    F -->|Yes No Phone| H[Show Phone Modal]
    G --> I[/api/user/capture-phone]
    H --> I
    I --> J[User Created - Status: Pending]
    J --> K[Show Selfie Modal]
    K --> L[/api/user/upload-picture]
    L --> M[Status → Registered]
    L --> N[Create Trust Bond]
    L --> O[Create Trust Connection]
    L --> P[Create/Update Trust Unit]
    N --> Q[Dashboard Opens]
    O --> Q
    P --> Q
```

---

## 🔑 Key Points

### Firestore Query Best Practices
✅ **Trust Units:** Use `array-contains` for members array  
✅ **Trust Bonds:** Query both `fromMemberCode` AND `toMemberCode`  
✅ **Avoid orderBy:** Sort in memory to avoid index requirements  

### Sponsor Division Creation
🔗 Triggered by: `/api/user/upload-picture`  
📋 Creates: Bond + Connection + Unit  
⚡ Auto-accepted for sponsor relationships  

### Status Flow
1. **Invite Created** → status: 'pending'
2. **Account Created** → user status: 'pending'
3. **Selfie Uploaded** → user status: 'registered'
4. **Admin Approval** → user status: 'approved' (optional)

---

**Total Routes:** ~65  
**Last Audit:** October 12, 2025  
**All Routes Tested:** ✅ PASS

