# 🚀 MCP Quick Reference - aih-dev

## One-Liners

```bash
# List all API routes
Use list_api_routes

# Create new GET endpoint
Use scaffold_api to create /api/trust/bonds (GET)

# Create new POST endpoint
Use scaffold_api to create /api/trust/connect (POST)

# Read a file
Use read_file to open src/app/api/user/check/route.ts

# Create/overwrite a file
Use write_file to create src/lib/helpers.ts with [content]
```

---

## HTTP Response Patterns

```typescript
// ✅ Success
return ok({ data: result });

// ❌ Error (from exception)
catch (e: any) { return fail(e); }

// ⚠️ Bad request
return bad("Missing parameter", "MISSING_PARAM");

// 🔍 Not found
return notFound("Resource not found");

// 🔒 Unauthorized
return unauthorized("Invalid token");
```

---

## Scaffolded Route Template

```typescript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ok, fail, bad } from "@/app/api/_utils/http";
import { getDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const db = getDb();
    // TODO: Implement your logic here
    return ok({ stub: true, route: "/api/..." });
  } catch (e: any) {
    return fail(e);
  }
}
```

---

## Common Workflows

### Create New API Endpoint
1. `Use scaffold_api to create /api/path/to/endpoint (METHOD)`
2. Open generated file
3. Replace TODO with implementation
4. Test endpoint

### Refactor Existing Route
1. `Use read_file to open src/app/api/path/route.ts`
2. Review current implementation
3. Make changes
4. Save and test

### Audit API Routes
1. `Use list_api_routes`
2. Review output
3. Identify gaps or duplicates
4. Plan refactoring

---

## Security Notes

✅ **Safe Operations**:
- `src/app/api/new/route.ts`
- `src/lib/helper.ts`
- `tools/scripts/build.ts`

❌ **Blocked Operations**:
- `../../../etc/passwd`
- `/absolute/path/file.ts`
- `src/../../../outside.ts`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tool not found | Restart Cursor |
| Path error | Use relative paths only |
| Route exists | Check with `list_api_routes` first |
| ESM error | Verify `tools/tsconfig.json` exists |

---

**Quick Help**: See `tools/README.md` for full documentation











