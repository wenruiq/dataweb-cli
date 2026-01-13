#!/bin/bash

SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || realpath "${BASH_SOURCE[0]}")"
REPO_DIR="$(dirname "$SCRIPT_PATH")/.."
ENV_FILE="$REPO_DIR/env.local"

if [ ! -f "$ENV_FILE" ]; then
	echo "❌ Missing env.local. Run: cp env.example env.local"
	exit 1
fi
source "$ENV_FILE"

if [ -z "$BSYNC_BACKEND_PATH" ] || [ -z "$BSYNC_BRUNO_PATH" ]; then
	echo "❌ Missing required variables in env.local:"
	[ -z "$BSYNC_BACKEND_PATH" ] && echo "   BSYNC_BACKEND_PATH"
	[ -z "$BSYNC_BRUNO_PATH" ] && echo "   BSYNC_BRUNO_PATH"
	exit 1
fi

BSYNC_PARALLEL="${BSYNC_PARALLEL:-$(sysctl -n hw.ncpu)}"
BE_PATH="$BSYNC_BACKEND_PATH"
BRUNO_PATH="$BSYNC_BRUNO_PATH"

if ! command -v bru &>/dev/null; then
	echo "❌ Bruno CLI not found. Install: npm i -g @usebruno/cli"
	exit 1
fi

setup_workspace() {
	mkdir -p "$BRUNO_PATH"

	if [ ! -f "$BRUNO_PATH/bruno.json" ]; then
		echo "🏗️  Initializing one-finance Workspace..."
		echo '{
  "version": "1",
  "name": "one-finance",
  "type": "collection",
  "ignore": ["node_modules", ".git"]
}' >"$BRUNO_PATH/bruno.json"
	fi

	if [ ! -f "$BRUNO_PATH/collection.bru" ]; then
		echo 'auth {
  mode: bearer
}

auth:bearer {
  token: {{authToken}}
}' >"$BRUNO_PATH/collection.bru"
		echo "🔐 Configured root Bearer auth"
	fi

	mkdir -p "$BRUNO_PATH/environments"

	if [ ! -f "$BRUNO_PATH/environments/test.bru" ]; then
		echo 'vars {
  baseUrl: https://one.finance.test.sea.com
}
vars:secret [
  authToken
]' >"$BRUNO_PATH/environments/test.bru"
		echo "📁 Created environment: test"
	fi

	if [ ! -f "$BRUNO_PATH/environments/uat.bru" ]; then
		echo 'vars {
  baseUrl: https://one.finance.uat.sea.com
}
vars:secret [
  authToken
]' >"$BRUNO_PATH/environments/uat.bru"
		echo "📁 Created environment: uat"
	fi

	if [ ! -f "$BRUNO_PATH/environments/live.bru" ]; then
		echo 'vars {
  baseUrl: https://one.finance.sea.com
}
vars:secret [
  authToken
]' >"$BRUNO_PATH/environments/live.bru"
		echo "📁 Created environment: live"
	fi
}

sync_service() {
	local SERVICE_ACRONYM=$1
	local SWAGGER_PATH=$2

	if [ -z "$SWAGGER_PATH" ]; then
		echo "🔍 Searching for service: $SERVICE_ACRONYM..."

		if [ ! -d "$BE_PATH" ]; then
			echo "❌ Error: Monorepo not found at $BE_PATH"
			return 1
		fi

		SWAGGER_PATH=$(find "$BE_PATH/services" -maxdepth 4 -path "*/api/$SERVICE_ACRONYM/$SERVICE_ACRONYM.swagger.json" | head -n 1)

		if [ -z "$SWAGGER_PATH" ]; then
			echo "❌ Error: Could not find swagger file for '$SERVICE_ACRONYM'"
			return 1
		fi
	fi

	echo "📂 [$SERVICE_ACRONYM] Source: $SWAGGER_PATH"

	[ -d "$BRUNO_PATH/$SERVICE_ACRONYM" ] && rm -rf "$BRUNO_PATH/$SERVICE_ACRONYM"

	if bru import openapi -s "$SWAGGER_PATH" -o "$BRUNO_PATH" -n "$SERVICE_ACRONYM" 2>&1; then
		local SERVICE_COLLECTION="$BRUNO_PATH/$SERVICE_ACRONYM/collection.bru"
		if [ -f "$SERVICE_COLLECTION" ]; then
			perl -i -0pe 's/auth \{\s*mode: none\s*\}/auth {\n  mode: bearer\n}\n\nauth:bearer {\n  token: {{authToken}}\n}/g' "$SERVICE_COLLECTION"
		fi

		find "$BRUNO_PATH/$SERVICE_ACRONYM" -name "*.bru" -exec touch {} \;
		echo "✅ [$SERVICE_ACRONYM] Synced successfully"
	else
		echo "❌ [$SERVICE_ACRONYM] Import failed"
		return 1
	fi
}

export BE_PATH BRUNO_PATH
export -f sync_service

sync_all() {
	echo "🚀 Discovering all services..."

	if [ ! -d "$BE_PATH" ]; then
		echo "❌ Error: Monorepo not found at $BE_PATH"
		return 1
	fi

	setup_workspace

	local SERVICES=$(find "$BE_PATH/services" -maxdepth 5 -name "*.swagger.json" -path "*/api/*" 2>/dev/null | while read -r SWAGGER_FILE; do
		ACRONYM=$(basename "$(dirname "$SWAGGER_FILE")")
		FILENAME=$(basename "$SWAGGER_FILE" .swagger.json)
		if [ "$ACRONYM" = "$FILENAME" ]; then
			echo "$ACRONYM|$SWAGGER_FILE"
		fi
	done | sort -u)

	local SERVICE_COUNT=$(echo "$SERVICES" | grep -c . || echo 0)

	if [ "$SERVICE_COUNT" -eq 0 ]; then
		echo "⚠️  No services found in $BE_PATH/services"
		return 0
	fi

	echo "📋 Found $SERVICE_COUNT service(s)"
	echo "⚡ Running with $BSYNC_PARALLEL parallel job(s)..."
	echo ""

	echo "$SERVICES" | xargs -P "$BSYNC_PARALLEL" -I {} bash -c '
        IFS="|" read -r ACRONYM SWAGGER_PATH <<< "{}"
        sync_service "$ACRONYM" "$SWAGGER_PATH"
    '

	touch "$BRUNO_PATH/bruno.json"
	echo ""
	echo "🎉 All services synced!"
}

case "$1" in
all)
	sync_all
	;;
"")
	echo "Usage: bsync <service|all>"
	echo ""
	echo "Examples:"
	echo "  bsync iam    Sync IAM service"
	echo "  bsync jh     Sync Journal Hub service"
	echo "  bsync all    Sync all services (parallel)"
	echo ""
	echo "Config: env.local (see env.example)"
	;;
*)
	setup_workspace
	sync_service "$1"
	touch "$BRUNO_PATH/bruno.json"
	;;
esac