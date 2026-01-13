# scripts

Shared CLI utilities. Symlinks `bin/*` to `~/.local/bin`.

## Setup

```bash
git clone <repo-url> ~/web/scripts
cd ~/web/scripts
cp env.example env.local  # edit paths if needed
./install.sh
# Add to ~/.zshrc: export PATH="$HOME/.local/bin:$PATH"
```

## Scripts

**bsync** - Sync OpenAPI specs from backend monorepo to Bruno collections

```bash
bsync iam    # sync single service
bsync all    # sync all services (parallel)
```

## Configuration

Scripts source `env.local` directly. See `env.example` for available variables.

## Adding Scripts

1. Add executable to `bin/`
2. Add variables to `env.example`
3. Run `./install.sh`
