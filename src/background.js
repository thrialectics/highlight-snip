// Register context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "snip-selection",
    title: "Snip it",
    contexts: ["selection"],
  });
});

// Chrome: clicking the extension icon opens the side panel
if (chrome.sidePanel) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "snip-selection") return;

  // Open the sidebar IMMEDIATELY — before any async work.
  // Firefox requires sidebarAction.open() in the synchronous user action context.
  if (chrome.sidePanel) {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  } else if (typeof browser !== "undefined" && browser.sidebarAction) {
    browser.sidebarAction.open().catch(() => {});
  }

  // Then save the snip
  const snip = {
    id: `snip_${Date.now()}`,
    text: info.selectionText,
    url: tab.url,
    title: tab.title,
    timestamp: Date.now(),
  };

  chrome.storage.local.get("snips").then(({ snips = [] }) => {
    snips.push(snip);
    chrome.storage.local.set({ snips });
  });
});
