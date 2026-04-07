// ----------------------------------------------------
// Critical Northwest Census — Sync Engine
// ----------------------------------------------------

// TODO: Replace this with your Google Apps Script URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyoY6UpoiCfinT7VElOaB6Qw8KeL1KYzPh7IC4gkxO1sSPRxgnyvIoz9Jauh0kvYEsX/exec";

// Listen for messages from the service worker
navigator.serviceWorker?.addEventListener("message", event => {
  if (event.data?.action === "sync") {
    syncSubmissions();
  }
});

// Detect when the device comes online
window.addEventListener("online", () => {
  syncSubmissions();
});

// -------------------------------------------
// Send queued submissions to Google Sheets
// -------------------------------------------
async function syncSubmissions() {
  const queued = await getQueuedSubmissions();
  if (!queued.length) return;

  for (const item of queued) {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.data)
      });

      if (response.ok) {
        await markSubmissionSynced(item.timestamp);
      } else {
        console.error("Sync failed:", await response.text());
      }
    } catch (err) {
      console.error("Network error during sync:", err);
      return; // stop syncing until connection improves
    }
  }
}
