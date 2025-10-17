# 🛠️ MCP Tools for AM I HUMAN.net

## Overview

This directory contains Model Context Protocol (MCP) servers that provide specialized tools for the AM I HUMAN.net project.

## MCP Server: aih-dev

**Version**: 0.1.0  
**Location**: `tools/mcp-aih-dev/server.ts`  
**Configuration**: `.cursor/mcp.json`

### Available Tools

#### 1. `scaffold_api`
Create Next.js App Router API route stubs with consistent structure.

**Input**:
```json
{
  "route": "/api/path/to/endpoint",
  "method": "GET" | "POST"
}
```

**Example**:
```
Use scaffold_api to create /api/trust/verify (POST)
```

**Output**: Creates `src/app/api/trust/verify/route.ts` with:
- Runtime configuration (`nodejs`, `force-dynamic`)
- HTTP utility imports (`ok`, `fail`, `bad`)
- Firebase Admin imports (`getDb`)
- Method stub with error handling
- TODO comment for implementation

---

#### 2. `read_file`
Read project files as text.

**Input**:
```json
{
  "file": "relative/path/to/file.ts"
}
```

**Security**: 
- Blocks path traversal (`..` segments)
- Blocks absolute paths
- Restricted to project root

**Example**:
```
Use read_file to open src/app/api/user/check/route.ts
```

---

#### 3. `write_file`
Write or overwrite project files.

**Input**:
```json
{
  "file": "relative/path/to/file.ts",
  "text": "file contents here"
}
```

**Security**: 
- Blocks path traversal (`..` segments)
- Blocks absolute paths
- Restricted to project root
- Creates directories as needed

**Example**:
```
Use write_file to create src/lib/trustHelpers.ts with helper functions
```

---

#### 4. `list_api_routes`
List all existing API routes in the project.

**Input**: `{}` (no parameters)

**Example**:
```
Use list_api_routes to show all existing endpoints
```

**Output**: Sorted list of all `route.ts` files in `src/app/api/`

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm i -D @modelcontextprotocol/sdk zod tsx fs-extra
```

### 2. Verify Configuration
Ensure `.cursor/mcp.json` exists at project root:
```json
{
  "mcpServers": {
    "aih-dev": {
      "command": "npx",
      "args": ["-y", "tsx", "tools/mcp-aih-dev/server.ts"]
    }
  }
}
```

### 3. Restart Cursor
Close and reopen Cursor to load the MCP configuration.

### 4. Verify in Settings
Go to **Settings → Tools** and confirm **"aih-dev"** shows as **"Ready"**.

---

## Security Features

### Path Traversal Prevention
All file operations (`read_file`, `write_file`) include:
- Normalization of input paths
- Detection of `..` segments
- Detection of absolute paths
- Double-check that resolved paths remain within project root

### Error Handling
- All tools wrapped in try-catch blocks
- Consistent error message format
- Logging to stderr for debugging

### Logging
Simple logger outputs to stderr:
```typescript
[MCP:aih-dev] scaffold_api {"route":"/api/test","method":"GET"}
[MCP:aih-dev] Route created successfully {"fp":"...","route":"..."}
[MCP:aih-dev:ERROR] scaffold_api failed Error message here
```

---

## HTTP Utilities

The scaffolded routes use standardized HTTP response helpers from `src/app/api/_utils/http.ts`:

### `ok(data, status = 200)`
Success response with data.

```typescript
return ok({ users: [...], count: 10 });
// → { ok: true, users: [...], count: 10 }
```

### `fail(error, status = 500)`
Error response from caught exception.

```typescript
try {
  // ...
} catch (e: any) {
  return fail(e);
}
// → { ok: false, error: "Error message", code: "ERROR_CODE" }
```

### `bad(message, code, status = 400)`
Bad request response.

```typescript
if (!userId) {
  return bad("User ID required", "MISSING_USER_ID");
}
// → { ok: false, error: "User ID required", code: "MISSING_USER_ID" }
```

### `notFound(message)`
404 response.

```typescript
return notFound("User not found");
// → { ok: false, error: "User not found", code: "NOT_FOUND" }
```

### `unauthorized(message)`
401 response.

```typescript
return unauthorized("Invalid credentials");
// → { ok: false, error: "Invalid credentials", code: "UNAUTHORIZED" }
```

---

## Extending the MCP Server

To add new tools, edit `tools/mcp-aih-dev/server.ts`:

```typescript
server.tool(
  {
    name: "my_new_tool",
    description: "What this tool does",
    inputSchema: z.object({
      param: z.string(),
    }),
  },
  async ({ param }) => {
    try {
      log.info("my_new_tool", { param });
      // Tool logic here
      return {
        content: [{ type: "text", text: "Success message" }],
      };
    } catch (error: any) {
      log.error("my_new_tool failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      };
    }
  }
);
```

After adding tools:
1. Save the file
2. Restart Cursor
3. Tool will be available immediately

---

## Troubleshooting

### MCP server not showing in Settings
- Verify `.cursor/mcp.json` is at project root
- Check file paths are correct
- Restart Cursor completely
- Check Cursor logs for errors

### Tool execution errors
- Check stderr output for `[MCP:aih-dev:ERROR]` messages
- Verify input schema matches tool requirements
- Ensure project structure is correct

### ESM/CJS issues
- `tools/tsconfig.json` is configured for ESM
- `tsx` handles module resolution automatically
- If issues persist, add `"type": "module"` to `package.json`

---

## Performance

- **scaffold_api**: ~50ms (includes file write)
- **read_file**: ~10ms (small files)
- **write_file**: ~20ms (includes directory creation)
- **list_api_routes**: ~100ms (walks entire API directory)

---

## Best Practices

1. **Use scaffold_api for all new routes** - Ensures consistency
2. **Always specify method** - Even though GET is default
3. **Review generated stubs** - Add proper implementation
4. **Use HTTP utilities** - Don't create custom response formats
5. **Test after scaffolding** - Verify route works before implementing logic

---

## Version History

### v0.1.0 (2025-10-09)
- Initial release
- 4 core tools: scaffold_api, read_file, write_file, list_api_routes
- Security: Path traversal prevention
- Error handling and logging
- HTTP utility helpers
- Documentation

---

**Maintained by**: AM I HUMAN.net Development Team  
**Last Updated**: October 9, 2025























