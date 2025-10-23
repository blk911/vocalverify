# AM I HUMAN - Monorepo

Social Media Platform with Vault System and AI Integration.

## Structure

```
amihuman/
├─ apps/
│  ├─ web/            # Next.js 15 Frontend
│  ├─ api/            # Node/Express API
│  └─ ais/            # FastAPI (Python) AI Services
├─ packages/
│  ├─ shared-types/   # Zod + TS types
│  ├─ prompt-packs/   # JSON prompt packs
│  └─ auth-sdk/       # Tiny client for /api
├─ infra/
│  └─ docker-compose.dev.yml
└─ package.json       # workspaces
```

## Getting Started

```bash
# Install dependencies and build
pnpm setup

# Start all services (development)
pnpm dev

# Start individual services
pnpm dev:web    # Next.js frontend
pnpm dev:api    # Express API
pnpm dev:ais    # FastAPI Python

# Start with Docker
pnpm dev:docker

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Development

### Local Development
- **Web**: http://localhost:3000
- **API**: http://localhost:4000
- **AIS**: http://localhost:8000

### Docker Development
- **Web**: http://localhost:3000
- **API**: http://localhost:4000
- **AIS**: http://localhost:8000
- **Postgres**: localhost:5432
- **Redis**: localhost:6379

### Environment Setup
```bash
# Copy environment files
cp apps/api/env.example apps/api/.env
cp apps/ais/env.example apps/ais/.env
cp apps/web/env.example apps/web/.env

# Edit as needed
```

## Packages

- `@amihuman/shared-types` - Shared TypeScript types and Zod schemas
- `@amihuman/prompt-packs` - AI prompt templates and configurations
- `@amihuman/auth-sdk` - Authentication client library
