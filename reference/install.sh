#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_BIN="$HOME/.local/bin"

mkdir -p "$LOCAL_BIN"

if [ ! -d "$REPO_DIR/bin" ]; then
    echo -e "${RED}Error: bin/ not found${NC}"
    exit 1
fi

for script in "$REPO_DIR/bin"/*; do
    [ -f "$script" ] || continue
    name="${script##*/}"
    name="${name%.*}"
    chmod +x "$script"
    ln -sf "$script" "$LOCAL_BIN/$name"
    echo -e "${GREEN}✓${NC} $name"
done

echo ""
echo "Add to your shell profile if not already:"
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
