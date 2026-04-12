# Highlight & Snip

A browser extension for collecting text snippets while browsing. Highlight text on any page, right-click "Snip it", and your selections accumulate in a sidebar notepad with source URLs tracked automatically. Export everything as a clean `.md` file with one click.

Works on **Firefox** and **Chrome**.

## Install

### Prerequisites

- [jq](https://jqlang.github.io/jq/) (for building manifests) — install via `brew install jq`, `apt install jq`, etc.

### Build

```bash
git clone https://github.com/thrialectics/highlight-snip.git
cd highlight-snip
chmod +x build.sh
./build.sh
```

This creates `dist/chrome/` and `dist/firefox/` with browser-specific builds.

### Load in Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `dist/firefox/manifest.json`
4. The sidebar opens automatically — find it in Firefox's sidebar panel

### Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist/chrome/` folder
4. Click the extension icon to open the side panel

## Usage

1. **Highlight** text on any webpage
2. **Right-click** the selection and choose **"Snip it"**
3. The sidebar opens with your snip displayed as a blockquote
4. Repeat across as many pages/tabs as you like — snips accumulate
5. Click **Export .md** to download your collected notes as markdown
6. Click **Clear** to start fresh

### Configure download location

Click the gear icon in the sidebar to set a subfolder name. Exported files save to `~/Downloads/<subfolder>/`. The default subfolder is `highlight-snip`.

### Export format

```markdown
# Highlight & Snip — 2026-02-20

> Some interesting text you highlighted...
>
> — [Page Title](https://example.com/article)

> Another snippet from a different page...
>
> — [Another Page](https://example.com/page2)

---

## Sources
- [Page Title](https://example.com/article)
- [Another Page](https://example.com/page2)
```

## Project structure

```
highlight-snip/
├── manifest.base.json   # Shared manifest template
├── build.sh             # Produces dist/chrome/ and dist/firefox/
├── src/
│   ├── background.js    # Context menu + storage
│   ├── sidebar.html     # Sidebar UI
│   ├── sidebar.js       # Rendering, export, reactive updates
│   ├── sidebar.css      # Styles
│   ├── options.html     # Settings page
│   ├── options.js       # Settings logic
│   └── icons/           # Extension icons
└── dist/                # Built output (gitignored)
```

## License

[MIT](LICENSE)
