const snipsContainer = document.getElementById("snips");
const sourcesSection = document.getElementById("sources");
const sourcesList = document.getElementById("sources-list");
const exportBtn = document.getElementById("export-btn");
const clearBtn = document.getElementById("clear-btn");
const settingsBtn = document.getElementById("settings-btn");
const filenameInput = document.getElementById("filename");

// Pre-fill with today's date. The user can edit this to whatever
// they want — it becomes the .md filename on export.
const today = new Date().toISOString().split("T")[0];
filenameInput.value = `snips-${today}`;
filenameInput.placeholder = "filename";

// ── Render all snips and sources from storage ──────────────────
function render(snips) {
  snipsContainer.innerHTML = "";
  sourcesList.innerHTML = "";

  if (!snips || snips.length === 0) {
    snipsContainer.innerHTML =
      '<p class="empty-state">No snips yet. Highlight text on any page, right-click, and choose "Snip it".</p>';
    sourcesSection.hidden = true;
    return;
  }

  // Build a blockquote card for each snip
  for (const snip of snips) {
    const blockquote = document.createElement("blockquote");

    // ── Snip text (display) ──
    const text = document.createElement("p");
    text.textContent = snip.text;
    blockquote.appendChild(text);

    // ── Snip text editor (hidden until "edit" is clicked) ──
    // Replaces the <p> in-place so the edit happens where the text lives.
    const textEditor = document.createElement("textarea");
    textEditor.className = "note-editor text-editor";
    textEditor.value = snip.text;
    textEditor.hidden = true;

    const saveText = async () => {
      const newText = textEditor.value.trim();
      // Don't allow saving empty — that would make a blank snip
      if (!newText) {
        textEditor.value = snip.text; // revert to original
      }

      const { snips: allSnips = [] } = await chrome.storage.local.get("snips");
      const target = allSnips.find((s) => s.id === snip.id);
      if (target && newText) {
        target.text = newText;
        await chrome.storage.local.set({ snips: allSnips });
      }

      // Swap back: hide textarea, show the <p>
      textEditor.hidden = true;
      text.textContent = newText || snip.text;
      text.hidden = false;
      editBtn.textContent = "edit";
    };

    textEditor.addEventListener("blur", saveText);

    textEditor.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        textEditor.blur();
      }
    });

    blockquote.appendChild(textEditor);

    // ── Source citation ──
    const cite = document.createElement("cite");
    const link = document.createElement("a");
    link.href = snip.url;
    link.textContent = snip.title || snip.url;
    link.target = "_blank";
    link.rel = "noopener";
    cite.appendChild(document.createTextNode("\u2014 "));
    cite.appendChild(link);
    blockquote.appendChild(cite);

    // ── Note display (shown when a saved note exists) ──
    // This is a plain div that shows the note text. Clicking the
    // "edit" button swaps it for the textarea.
    const noteDisplay = document.createElement("div");
    noteDisplay.className = "note-display";
    noteDisplay.textContent = snip.note || "";
    // Only show if there's actually a note saved
    noteDisplay.hidden = !snip.note;
    blockquote.appendChild(noteDisplay);

    // ── Note editor (textarea, hidden by default) ──
    // Appears when the user clicks "add note" or "edit".
    // Saves on blur (click away) or Ctrl+Enter.
    const noteEditor = document.createElement("textarea");
    noteEditor.className = "note-editor";
    noteEditor.placeholder = "Add a note...";
    noteEditor.value = snip.note || "";
    noteEditor.hidden = true; // starts hidden

    // saveNote: reads the textarea value, writes it into the snip
    // object in chrome.storage, then re-renders the display.
    // We don't re-render the whole sidebar — just update this card
    // and persist to storage.
    const saveNote = async () => {
      const newNote = noteEditor.value.trim();

      // Update storage: read all snips, find this one by id, patch it
      const { snips: allSnips = [] } = await chrome.storage.local.get("snips");
      const target = allSnips.find((s) => s.id === snip.id);
      if (target) {
        target.note = newNote;
        // .set() triggers the onChanged listener, but we also update
        // the local display immediately so there's no flicker.
        await chrome.storage.local.set({ snips: allSnips });
      }

      // Swap: hide editor, show display (if note is non-empty)
      noteEditor.hidden = true;
      noteDisplay.textContent = newNote;
      noteDisplay.hidden = !newNote;

      // Update the toggle button label
      toggleBtn.textContent = newNote ? "edit note" : "+ note";
    };

    // Save on blur (user clicks away from the textarea)
    noteEditor.addEventListener("blur", saveNote);

    // Save on Ctrl+Enter (common keyboard shortcut for "submit")
    noteEditor.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        // blur will fire saveNote, so we just need to remove focus
        noteEditor.blur();
      }
    });

    blockquote.appendChild(noteEditor);

    // ── Toolbar row with the toggle button ──
    const toolbar = document.createElement("div");
    toolbar.className = "snip-toolbar";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "note-toggle";
    // Label depends on whether a note already exists
    toggleBtn.textContent = snip.note ? "edit note" : "+ note";

    toggleBtn.addEventListener("click", () => {
      // Toggle: if editor is hidden, show it and focus; if visible, save
      if (noteEditor.hidden) {
        noteEditor.hidden = false;
        noteDisplay.hidden = true; // hide the display while editing
        noteEditor.focus();
      } else {
        // Clicking the button while editor is open → save and close
        noteEditor.blur(); // triggers saveNote via the blur handler
      }
    });

    // ── Delete button ──
    // Removes this single snip from storage. We don't need to manually
    // re-render — chrome.storage.onChanged fires and render() runs
    // automatically with the updated array.
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "note-toggle delete-btn";
    deleteBtn.textContent = "\u00d7"; // × symbol

    deleteBtn.addEventListener("click", async () => {
      const { snips: allSnips = [] } = await chrome.storage.local.get("snips");
      // Keep every snip except the one matching this id
      const filtered = allSnips.filter((s) => s.id !== snip.id);
      await chrome.storage.local.set({ snips: filtered });
      // onChanged listener handles the re-render
    });

    // ── Edit snip text button ──
    const editBtn = document.createElement("button");
    editBtn.className = "note-toggle";
    editBtn.textContent = "edit";

    editBtn.addEventListener("click", () => {
      if (textEditor.hidden) {
        // Show editor, hide the <p>
        text.hidden = true;
        textEditor.hidden = false;
        textEditor.value = text.textContent;
        textEditor.focus();
        editBtn.textContent = "save";
      } else {
        // Save and close — blur triggers saveText
        textEditor.blur();
      }
    });

    toolbar.appendChild(editBtn);
    toolbar.appendChild(toggleBtn);
    toolbar.appendChild(deleteBtn);
    blockquote.appendChild(toolbar);

    snipsContainer.appendChild(blockquote);
  }

  // ── Collect unique sources for the footer list ──
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

// ── Build markdown string from snips ───────────────────────────
// Each snip becomes a blockquote. If a note exists, it appears
// right below the blockquote as regular text (not quoted).
function buildMarkdown(snips) {
  // Use whatever the user typed into the filename field as the heading
  const name = filenameInput.value.trim() || `snips-${new Date().toISOString().split("T")[0]}`;
  let md = `# ${name}\n\n`;

  for (const snip of snips) {
    const title = snip.title || snip.url;
    md += `> ${snip.text}\n>\n> \u2014 [${title}](${snip.url})\n\n`;

    // Append the note as plain text if it exists
    if (snip.note) {
      md += `**Note:** ${snip.note}\n\n`;
    }
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

// ── Download markdown file ──────────────────────────────────────
// Uses a temporary <a> tag with the `download` attribute instead of
// the chrome.downloads API. This is plain DOM — no extension API
// needed, works reliably in both Firefox and Chrome sidebar panels.
function downloadMarkdown(snips) {
  const md = buildMarkdown(snips);

  // Read from the input field; fall back to date-based name if empty.
  // Sanitize: strip characters that are illegal in filenames.
  const raw = filenameInput.value.trim() || `snips-${new Date().toISOString().split("T")[0]}`;
  const safeName = raw.replace(/[<>:"/\\|?*]/g, "-");

  // Create a Blob (binary-large-object) from the markdown string.
  // The Blob constructor takes an array of parts and a MIME type.
  const blob = new Blob([md], { type: "text/markdown" });

  // URL.createObjectURL() gives us a temporary browser-internal URL
  // (blob:moz-extension://...) that points to the Blob's data in memory.
  const url = URL.createObjectURL(blob);

  // Create an invisible <a> tag, set its href to the blob URL,
  // and set `download` to the desired filename. When we .click() it,
  // the browser treats it as a file download with that name.
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.md`;
  a.click();

  // Clean up: release the blob URL so the browser can free the memory.
  // We use setTimeout because the download needs a moment to start
  // before we revoke the URL out from under it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Button handlers ────────────────────────────────────────────

// Export button
exportBtn.addEventListener("click", async () => {
  const { snips = [] } = await chrome.storage.local.get("snips");
  if (snips.length === 0) {
    // Brief flash on the button so the user knows "nothing to export"
    exportBtn.textContent = "No snips yet";
    setTimeout(() => { exportBtn.textContent = "Export .md"; }, 1500);
    return;
  }
  downloadMarkdown(snips);
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

// ── Reactive updates when storage changes ──────────────────────
// If another tab snips something, the sidebar updates live.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.snips) {
    render(changes.snips.newValue || []);
  }
});

// ── Initial load ───────────────────────────────────────────────
chrome.storage.local.get("snips").then(({ snips = [] }) => render(snips));
