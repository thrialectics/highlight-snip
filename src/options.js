const subfolderInput = document.getElementById("subfolder");
const saveBtn = document.getElementById("save-btn");
const savedMsg = document.getElementById("saved-msg");

// Load saved setting
chrome.storage.local.get("subfolder").then(({ subfolder }) => {
  subfolderInput.value = subfolder || "highlight-snip";
});

saveBtn.addEventListener("click", async () => {
  const raw = subfolderInput.value.trim();
  // Sanitize: remove leading/trailing slashes, collapse multiple slashes
  const subfolder = raw.replace(/^\/+|\/+$/g, "").replace(/\/\/+/g, "/") || "highlight-snip";
  subfolderInput.value = subfolder;

  await chrome.storage.local.set({ subfolder });

  savedMsg.classList.add("show");
  setTimeout(() => savedMsg.classList.remove("show"), 1500);
});
