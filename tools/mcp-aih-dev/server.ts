// tools/mcp-aih-dev/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

const server = new Server(
  { name: 'aih-dev', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

// Simple logger for MCP server
const log = {
  info: (msg: string, data?: any) => {
    console.error(`[MCP:aih-dev] ${msg}`, data ? JSON.stringify(data) : '');
  },
  error: (msg: string, error?: any) => {
    console.error(`[MCP:aih-dev:ERROR] ${msg}`, error?.message || error);
  },
};

// Helper: write a file, making folders as needed
function writeFileDeep(filePath: string, data: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, data, 'utf8');
}

// Tool 1: Scaffold a Next.js API route stub
(server as any).tool(
  {
    name: 'scaffold_api',
    description:
      'Create a Next.js App Router API stub at src/app/api/<segments>/route.ts.',
    inputSchema: z.object({
      route: z
        .string()
        .regex(/^\/api\//, 'route must start with /api/ e.g. /api/trust/bonds'),
      method: z.enum(['GET', 'POST']).default('GET'),
    }),
  },
  async ({ route, method }: { route: any; method: any }) => {
    try {
      log.info('scaffold_api', { route, method });

      const segments = route
        .replace(/^\/api\//, '')
        .split('/')
        .filter(Boolean);
      const dir = path.join(process.cwd(), 'src', 'app', 'api', ...segments);
      const fp = path.join(dir, 'route.ts');

      if (fs.existsSync(fp)) {
        log.info('Route already exists', { fp });
        return {
          content: [{ type: 'text', text: `Already exists: ${fp}` }],
        };
      }

      const body = `export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ok, fail, bad } from "@/app/api/_utils/http";
import { getDb } from "@/lib/firebaseAdmin";

export async function ${method}() {
  try {
    const db = getDb();
    // TODO: Implement your logic here
    return ok({ stub: true, route: "${route}" });
  } catch (e: any) {
    return fail(e);
  }
}
`;

      writeFileDeep(fp, body);
      log.info('Route created successfully', { fp, route });

      return {
        content: [
          { type: 'text', text: `Created ${fp}\nExposed at: ${route}` },
        ],
      };
    } catch (error: any) {
      log.error('scaffold_api failed', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error creating route: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Tool 2: Read a file
(server as any).tool(
  {
    name: 'read_file',
    description: 'Read a project file as text',
    inputSchema: z.object({ file: z.string() }),
  },
  async ({ file }: { file: any }) => {
    // Security: Prevent path traversal outside project root
    const normalized = path.normalize(file);
    if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
      return {
        content: [
          {
            type: 'text',
            text: `Security error: Path "${file}" attempts to escape project root. Use relative paths only.`,
          },
        ],
      };
    }

    const fp = path.join(process.cwd(), file);

    // Double-check the resolved path is still within project
    const projectRoot = process.cwd();
    const resolvedPath = path.resolve(fp);
    if (!resolvedPath.startsWith(projectRoot)) {
      return {
        content: [
          {
            type: 'text',
            text: `Security error: Resolved path "${resolvedPath}" is outside project root.`,
          },
        ],
      };
    }

    if (!fs.existsSync(fp)) {
      return { content: [{ type: 'text', text: `Not found: ${fp}` }] };
    }
    const txt = fs.readFileSync(fp, 'utf8');
    return { content: [{ type: 'text', text: txt }] };
  }
);

// Tool 3: Write a file (overwrite)
(server as any).tool(
  {
    name: 'write_file',
    description: 'Write a project file (overwrites). Provide relative path.',
    inputSchema: z.object({ file: z.string(), text: z.string() }),
  },
  async ({ file, text }: { file: any; text: any }) => {
    // Security: Prevent path traversal outside project root
    const normalized = path.normalize(file);
    if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
      return {
        content: [
          {
            type: 'text',
            text: `Security error: Path "${file}" attempts to escape project root. Use relative paths only.`,
          },
        ],
      };
    }

    const fp = path.join(process.cwd(), file);

    // Double-check the resolved path is still within project
    const projectRoot = process.cwd();
    const resolvedPath = path.resolve(fp);
    if (!resolvedPath.startsWith(projectRoot)) {
      return {
        content: [
          {
            type: 'text',
            text: `Security error: Resolved path "${resolvedPath}" is outside project root.`,
          },
        ],
      };
    }

    writeFileDeep(fp, text);
    return { content: [{ type: 'text', text: `Wrote ${fp}` }] };
  }
);

// Tool 4: List existing API routes
(server as any).tool(
  {
    name: 'list_api_routes',
    description: 'List existing src/app/api/**/route.ts files',
    inputSchema: z.object({}),
  },
  async () => {
    const root = path.join(process.cwd(), 'src', 'app', 'api');
    const out: string[] = [];
    const walk = (d: string) => {
      for (const name of fs.existsSync(d) ? fs.readdirSync(d) : []) {
        const p = path.join(d, name);
        const st = fs.statSync(p);
        if (st.isDirectory()) walk(p);
        else if (name === 'route.ts') out.push(p);
      }
    };
    walk(root);
    return {
      content: [{ type: 'text', text: out.sort().join('\n') || '(none)' }],
    };
  }
);

(async () => {
  await server.connect(new StdioServerTransport());
})();
