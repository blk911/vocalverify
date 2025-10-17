# Trust Unit v1 - Environment Variables

## Feature Flag Configuration

Add these to your `.env.local` file to control Trust Unit v1 features:

```env
# 🚩 Master toggle for Trust Unit triangle close feature
FEATURE_TU_TRIANGLE=true

# Enable triangle close TU detection and creation (controlled by FEATURE_TU_TRIANGLE)
NEXT_PUBLIC_TRIANGLE_CLOSE_TU=true

# Enable same-sponsor TU logic (legacy - always enabled)
NEXT_PUBLIC_SAME_SPONSOR_TU=true

# Block duplicate invites to members already in same TU (controlled by FEATURE_TU_TRIANGLE)
NEXT_PUBLIC_TU_INVITE_BLOCKER=true

# Detect and log circular invites - member inviting own sponsor (controlled by FEATURE_TU_TRIANGLE)
NEXT_PUBLIC_CIRCULAR_INVITE_DETECTION=true
```

## Flag Hierarchy

**Master Toggle:**
- `FEATURE_TU_TRIANGLE` - Controls ALL triangle close features
  - If `false`: Triangle close, invite blocker, and circular detection are ALL disabled
  - If `true` (default): Individual flags can still control each feature

**Individual Flags:**
- Only active when `FEATURE_TU_TRIANGLE=true`
- Can be individually toggled for fine-grained control

## Defaults

All flags default to `true` if not set. To disable the entire feature:

```env
FEATURE_TU_TRIANGLE=false
```

To disable only specific sub-features:

```env
FEATURE_TU_TRIANGLE=true
NEXT_PUBLIC_TRIANGLE_CLOSE_TU=false  # Disable triangle close logic only
```

## Production Recommendation

### Initial Rollout (Safe)

```env
# Enable all features with master toggle
FEATURE_TU_TRIANGLE=true
NEXT_PUBLIC_TRIANGLE_CLOSE_TU=true
NEXT_PUBLIC_SAME_SPONSOR_TU=true
NEXT_PUBLIC_TU_INVITE_BLOCKER=true
NEXT_PUBLIC_CIRCULAR_INVITE_DETECTION=true
```

### Gradual Rollout (Staged)

**Week 1: Observation Only**
```env
FEATURE_TU_TRIANGLE=true
NEXT_PUBLIC_TRIANGLE_CLOSE_TU=true
NEXT_PUBLIC_TU_INVITE_BLOCKER=false  # Don't block yet, just log
NEXT_PUBLIC_CIRCULAR_INVITE_DETECTION=true
```

**Week 2+: Full Enforcement**
```env
FEATURE_TU_TRIANGLE=true
NEXT_PUBLIC_TU_INVITE_BLOCKER=true  # Enable blocker after monitoring
```

### Emergency Disable

If issues arise, disable everything instantly:

```env
FEATURE_TU_TRIANGLE=false
```

## Monitoring

Monitor telemetry logs for:
- `📊 [TELEMETRY] trust_unit_created`
- `📊 [TELEMETRY] triangle_close_detected`
- `📊 [TELEMETRY] invite_blocked`
- `📊 [TELEMETRY] circular_invite_detected`

## Example `.env.local`

```env
# Trust Unit v1 Feature Flags
FEATURE_TU_TRIANGLE=true
NEXT_PUBLIC_TRIANGLE_CLOSE_TU=true
NEXT_PUBLIC_SAME_SPONSOR_TU=true
NEXT_PUBLIC_TU_INVITE_BLOCKER=true
NEXT_PUBLIC_CIRCULAR_INVITE_DETECTION=true

# Other app config...
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

**Note:** Restart your Next.js dev server after changing environment variables.

