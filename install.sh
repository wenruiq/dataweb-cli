#!/usr/bin/env bash
set -e

# Dataweb installer script

echo "Installing dataweb..."

# Detect platform
OS="$(uname -s)"
ARCH="$(uname -m)"

if [ "$OS" = "Darwin" ]; then
  if [ "$ARCH" = "arm64" ]; then
    PLATFORM="darwin-arm64"
  elif [ "$ARCH" = "x86_64" ]; then
    PLATFORM="darwin-x64"
  else
    echo "Unsupported architecture: $ARCH"
    exit 1
  fi
else
  echo "Unsupported OS: $OS (currently only macOS is supported)"
  exit 1
fi

# GitHub release URL (update with your actual repo)
REPO="your-org/dataweb-cli"
BINARY_NAME="dataweb-${PLATFORM}"
DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${BINARY_NAME}"

# Determine install location
if [ -w "/usr/local/bin" ]; then
  INSTALL_DIR="/usr/local/bin"
else
  INSTALL_DIR="$HOME/.local/bin"
  mkdir -p "$INSTALL_DIR"

  # Check if ~/.local/bin is in PATH
  if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo ""
    echo "⚠️  $HOME/.local/bin is not in your PATH"
    echo ""
    echo "Add this line to your shell profile (~/.zshrc or ~/.bashrc):"
    echo ""
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
  fi
fi

INSTALL_PATH="$INSTALL_DIR/dataweb"

# Download binary
echo "Downloading dataweb for $PLATFORM..."
if command -v curl > /dev/null; then
  curl -fsSL "$DOWNLOAD_URL" -o "$INSTALL_PATH"
elif command -v wget > /dev/null; then
  wget -q "$DOWNLOAD_URL" -O "$INSTALL_PATH"
else
  echo "Error: curl or wget is required"
  exit 1
fi

# Make executable
chmod +x "$INSTALL_PATH"

echo "✓ dataweb installed to $INSTALL_PATH"
echo ""
echo "Run 'dataweb' to get started!"
