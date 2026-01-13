# dataweb

A modern CLI tool to sync Swagger/OpenAPI specifications from a backend monorepo to Bruno API collections. Built with Bun for speed and simplicity.

## Features

- Interactive setup with guided prompts
- Automatic service discovery in monorepo
- Parallel synchronization for multiple services
- Bearer token authentication injection
- Bruno workspace management (environments, collections)
- Health check diagnostics
- Single compiled binary distribution (no runtime dependencies)

## Prerequisites

- **Bruno CLI**: `npm i -g @usebruno/cli`
- **macOS**: Currently supports darwin-arm64 and darwin-x64

## Installation

### One-liner Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/wenruiq/dataweb-cli/main/install.sh | bash
```

### Manual Download

Download the latest binary from [Releases](https://github.com/wenruiq/dataweb-cli/releases):

```bash
# Download for Apple Silicon
curl -L https://github.com/wenruiq/dataweb-cli/releases/latest/download/dataweb-darwin-arm64 -o dataweb

# Or for Intel Mac
curl -L https://github.com/wenruiq/dataweb-cli/releases/latest/download/dataweb-darwin-x64 -o dataweb

# Make executable
chmod +x dataweb

# Move to PATH
sudo mv dataweb /usr/local/bin/
```

### From Source

```bash
git clone https://github.com/wenruiq/dataweb-cli.git
cd dataweb
bun install
bun run build:binary

# The binary will be in dist/dataweb
```

## Quick Start

### 1. Initial Setup

Run the interactive setup wizard:

```bash
dataweb config setup
```

You'll be prompted for:

- Backend monorepo path (e.g., `~/web/one-finance-backend`)
- Bruno workspace path (e.g., `~/bruno/one-finance`)
- Bruno workspace name (e.g., `one-finance`)
- Number of parallel jobs (leave empty for auto-detection)
- Whether to inject Bearer token authentication

Configuration is saved to `~/.config/dataweb/config.json`.

### 2. Sync Services

Sync a single service:

```bash
dataweb sync iam
```

Sync all services:

```bash
dataweb sync all
```

Force re-sync (clean and re-import):

```bash
dataweb sync all --force
```

### 3. Health Check

Verify your setup:

```bash
dataweb doctor
```

This checks:

- Bruno CLI installation
- Configuration file existence
- Backend path validity
- Bruno workspace path validity

## Commands

### `dataweb config setup`

Interactive setup wizard. Guides you through configuration and saves settings to `~/.config/dataweb/config.json`.

**Example:**

```bash
$ dataweb config setup
┌  dataweb setup
│
◆  Checking for Bruno CLI...
│  Bruno CLI found
│
◇  Backend monorepo path:
│  ~/web/one-finance-backend
│
◇  Bruno workspace path:
│  ~/bruno/one-finance
│
◇  Bruno workspace name:
│  one-finance
│
◇  Parallel jobs (leave empty for auto):
│
│
◇  Inject Bearer token authentication?
│  Yes
│
◆  Saving configuration...
│  Configuration saved
│
└  Setup complete! Run: dataweb sync all
```

### `dataweb sync <service>`

Sync Swagger/OpenAPI specifications to Bruno collections.

**Arguments:**

- `<service>` - Service acronym (e.g., `iam`) or `all` for bulk sync

**Options:**

- `-f, --force` - Force re-sync (clean existing and re-import)

**Examples:**

```bash
# Sync single service
dataweb sync iam

# Sync all services
dataweb sync all

# Force re-sync all services
dataweb sync all --force
```

**What it does:**

1. Sets up Bruno workspace (bruno.json, environments)
2. Discovers services in backend monorepo
3. Imports OpenAPI specs using Bruno CLI
4. Injects Bearer token authentication (if enabled)
5. Updates file timestamps for UI refresh

### `dataweb config show`

View current configuration.

**Options:**

- `-p, --path <key>` - Show specific config value

**Examples:**

```bash
# View full configuration
dataweb config show

# View specific value
dataweb config show --path backend.path
```

### `dataweb config edit`

Edit configuration interactively (re-runs setup wizard).

```bash
dataweb config edit
```

### `dataweb doctor`

Health check for system requirements and configuration.

**Example:**

```bash
$ dataweb doctor
┌  dataweb health check
│
◆  Bruno CLI installed ✓
◆  Configuration file exists ✓
◆  Backend path validation ✓
◆  Bruno workspace path validation ✓
│
└  All checks passed!
```

## Configuration

Configuration is stored at `~/.config/dataweb/config.json`:

```json
{
  "version": "1.0.0",
  "backend": {
    "path": "/Users/you/web/one-finance-backend",
    "servicesDir": "services"
  },
  "bruno": {
    "path": "/Users/you/bruno/one-finance",
    "workspaceName": "one-finance",
    "environments": [
      { "name": "test", "baseUrl": "https://test.example.com" },
      { "name": "uat", "baseUrl": "https://uat.example.com" },
      { "name": "live", "baseUrl": "https://api.example.com" }
    ]
  },
  "sync": {
    "parallel": null,
    "autoClean": true
  },
  "auth": {
    "injectBearer": true,
    "tokenVariable": "authToken"
  }
}
```

### Configuration Options

**backend:**

- `path`: Absolute path to backend monorepo
- `servicesDir`: Directory containing services (default: `services`)

**bruno:**

- `path`: Absolute path to Bruno workspace
- `workspaceName`: Name for Bruno workspace
- `environments`: Array of environment configurations

**sync:**

- `parallel`: Number of parallel jobs (`null` for auto-detection)
- `autoClean`: Delete existing service directories before sync

**auth:**

- `injectBearer`: Inject Bearer token authentication
- `tokenVariable`: Variable name for auth token (default: `authToken`)

## How It Works

### Service Discovery

The CLI searches for Swagger files matching this pattern:

```
{backend.path}/{servicesDir}/**/api/{SERVICE_ACRONYM}/{SERVICE_ACRONYM}.swagger.json
```

For example:

```
/backend/services/iam/api/iam/iam.swagger.json
/backend/services/payments/api/payments/payments.swagger.json
```

### Bruno Workspace Structure

The CLI creates a standard Bruno workspace:

```
bruno-workspace/
├── bruno.json              # Workspace metadata
├── collection.bru          # Root collection with auth config
├── environments/           # Environment configurations
│   ├── test.bru
│   ├── uat.bru
│   └── live.bru
└── {service}/              # Service-specific collections
    ├── collection.bru
    └── *.bru
```

### Authentication Injection

If enabled, the CLI automatically injects Bearer token auth into each service's `collection.bru`:

```
auth {
  mode: bearer
}

auth:bearer {
  token: {{authToken}}
}
```

The `authToken` variable is defined in environment files.

## Development

### Prerequisites

- [Bun](https://bun.sh) v1.3.5 or later
- [Bruno CLI](https://www.usebruno.com) for OpenAPI import

### Setup

```bash
# Clone repository
git clone https://github.com/wenruiq/dataweb-cli.git
cd dataweb

# Install dependencies
bun install

# Run in development mode
bun run dev
```

### Commands

```bash
# Development with hot reload
bun run dev

# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Lint and format
bun run check
bun run check:write
bun run format

# Build binary (current platform)
bun run build:binary

# Build for all platforms
bun run build
```

### Creating a Release

```bash
# 1. Ensure all changes are committed
git add -A && git commit -m "chore: prepare release"

# 2. Create a version tag
git tag v1.0.0

# 3. Push the tag to trigger release workflow
git push origin main --tags
```

This will:

- Build binaries for darwin-arm64 and darwin-x64
- Create a GitHub Release with the binaries attached
- Auto-generate release notes from commits

### Project Structure

```
dataweb/
├── src/
│   ├── cli.ts                    # CLI entry point
│   ├── commands/                 # Command implementations
│   │   ├── init.ts
│   │   ├── sync.ts
│   │   ├── config.ts
│   │   └── doctor.ts
│   ├── core/                     # Core business logic
│   │   ├── config.ts
│   │   ├── service-discovery.ts
│   │   ├── bruno-workspace.ts
│   │   ├── sync-engine.ts
│   │   └── auth-injector.ts
│   ├── utils/                    # Utility functions
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── file-system.ts
│   └── types/                    # TypeScript type definitions
│       ├── config.ts
│       ├── service.ts
│       └── bruno.ts
├── tests/                        # Test files
├── scripts/                      # Build scripts
└── .github/workflows/            # CI/CD workflows
```

## Troubleshooting

### Bruno CLI not found

**Error:** "Bruno CLI not found"

**Solution:** Install Bruno CLI globally:

```bash
npm i -g @usebruno/cli
```

### Backend path not found

**Error:** "Path does not exist" or "Services directory not found"

**Solution:** Ensure the backend path is correct and contains a `services/` directory:

```bash
ls ~/web/one-finance-backend/services
```

### No services discovered

**Error:** "Found 0 service(s)"

**Solution:** Verify swagger files follow the expected pattern:

```
{backend}/services/**/api/{acronym}/{acronym}.swagger.json
```

### Sync fails for specific service

**Error:** "Bruno CLI failed"

**Solution:**

1. Check if the swagger file is valid JSON
2. Try running Bruno CLI manually:

```bash
bru import openapi -s /path/to/service.swagger.json -o ~/bruno/workspace -n service-name
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`bun test`)
5. Run linter (`bun run check`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

MIT

## Acknowledgments

- [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- [Bruno](https://www.usebruno.com) - Open-source API client
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [@clack/prompts](https://github.com/natemoo-re/clack) - Beautiful CLI prompts
