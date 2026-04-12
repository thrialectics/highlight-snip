#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/src"
DIST="$ROOT/dist"
BASE="$ROOT/manifest.base.json"

# Clean and create dist directories
rm -rf "$DIST"
mkdir -p "$DIST/chrome" "$DIST/firefox"

# Copy shared source files to both targets
for target in chrome firefox; do
  cp "$SRC"/background.js "$DIST/$target/"
  cp "$SRC"/sidebar.html "$DIST/$target/"
  cp "$SRC"/sidebar.js "$DIST/$target/"
  cp "$SRC"/sidebar.css "$DIST/$target/"
  cp "$SRC"/options.html "$DIST/$target/"
  cp "$SRC"/options.js "$DIST/$target/"
  cp -r "$SRC"/icons "$DIST/$target/"
done

# Build Chrome manifest
jq '. + {
  "background": { "service_worker": "background.js" },
  "side_panel": { "default_path": "sidebar.html" },
  "permissions": (.permissions + ["sidePanel"])
}' "$BASE" > "$DIST/chrome/manifest.json"

# Build Firefox manifest
# del(.action) removes the generic toolbar button so that
# sidebar_action's built-in toggle icon appears instead.
# Without this, Firefox shows the action button (which does nothing)
# and hides the sidebar toggle — making it impossible to reopen.
jq 'del(.action) + {
  "background": { "scripts": ["background.js"] },
  "sidebar_action": {
    "default_panel": "sidebar.html",
    "default_title": "Highlight & Snip",
    "open_at_install": true
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "highlight-snip@thrialectics.github.io",
      "strict_min_version": "121.0"
    }
  }
}' "$BASE" > "$DIST/firefox/manifest.json"

echo "Build complete."
echo "  Chrome: $DIST/chrome/"
echo "  Firefox: $DIST/firefox/"
