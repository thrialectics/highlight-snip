const snipsContainer = document.getElementById("snips");
const sourcesSection = document.getElementById("sources");
const sourcesList = document.getElementById("sources-list");
const exportBtn = document.getElementById("export-btn");
const clearBtn = document.getElementById("clear-btn");
const settingsBtn = document.getElementById("settings-btn");

// Render all snips and sources from storage
function render(snips) {
  snipsContainer.innerHTML = "";
  sourcesList.innerHTML = "";

  if (!snips || snips.length === 0) {
    snipsContainer.innerHTML =
      '<p class="empty-state">No snips yet. Highlight text on any page, right-click, and choose "Snip it".</p>';
    sourcesSection.hidden = true;
    return;
  }

  // Render snips as blockquotes
  for (const snip of snips) {
    const blockquote = document.createElement("blockquote");

    const text = document.createElement("p");
    text.textContent = snip.text;
    blockquote.appendChild(text);

    const cite = document.createElement("cite");
    const link = document.createElement("a");
    link.href = snip.url;
    link.textContent = snip.title || snip.url;
    link.target = "_blank";
    link.rel = "noopener";
    cite.appendChild(document.createTextNode("\u2014 "));
    cite.appendChild(link);
    blockquote.appendChild(cite);

    snipsContainer.appendChild(blockquote);
  }

  // Collect unique sources
  const seen = new Set();
  const uniqueSources = [];
  for (const snip of snips) {
    if (!seen.has(snip.url)) {
      seen.add(snip.url);
      uniqueSources.push({ url: snip.url, title: snip.title });
    }
  }

  for (const source of uniqueSources) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = source.url;
    a.textContent = source.title || source.url;
    a.target = "_blank";
    a.rel = "noopener";
    li.appendChild(a);
    sourcesList.appendChild(li);
  }

  sourcesSection.hidden = false;
}

// Build markdown string from snips
function buildMarkdown(snips) {
  const date = new Date().toISOString().split("T")[0];
  let md = `# Highlight & Snip \u2014 ${date}\n\n`;

  for (const snip of snips) {
    const title = snip.title || snip.url;
    md += `> ${snip.text}\n>\n> \u2014 [${title}](${snip.url})\n\n`;
  }

  // Deduplicated sources
  const seen = new Set();
  const uniqueSources = [];
  for (const snip of snips) {
    if (!seen.has(snip.url)) {
      seen.add(snip.url);
      uniqueSources.push({ url: snip.url, title: snip.title });
    }
  }

  md += "---\n\n## Sources\n";
  for (const source of uniqueSources) {
    const title = source.title || source.url;
    md += `- [${title}](${source.url})\n`;
  }

  return md;
}

// Download markdown file via chrome.downloads API
async function downloadMarkdown(snips) {
  const md = buildMarkdown(snips);
  const date = new Date().toISOString().split("T")[0];
  const { subfolder = "highlight-snip" } = await chrome.storage.local.get("subfolder");
  const filename = `${subfolder}/snips-${date}.md`;

  // Use a data URL instead of blob URL — blob URLs fail in Firefox downloads API
  const dataUrl = "data:text/markdown;base64," + btoa(unescape(encodeURIComponent(md)));

  chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: false,
  });
}

// Export button
exportBtn.addEventListener("click", async () => {
  const { snips = [] } = await chrome.storage.local.get("snips");
  if (snips.length === 0) return;
  await downloadMarkdown(snips);
});

// Settings button — open extension options
settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// Clear button
clearBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove("snips");
  render([]);
});

// Reactive updates when storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.snips) {
    render(changes.snips.newValue || []);
  }
});

// Initial load
chrome.storage.local.get("snips").then(({ snips = [] }) => render(snips));
