// ----------------------------------------------------
// Critical Northwest Census — Sync Engine
// ----------------------------------------------------

const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbyoY6UpoiCfinT7VElOaB6Qw8KeL1KYzPh7IC4gkxO1sSPRxgnyvIoz9Jauh0kvYEsX/exec';

async function syncNow() {
  if (!navigator.onLine) return;

  const submissions = await getQueuedSubmissions();
  for (const sub of submissions) {
    if (sub.synced) continue;
    try {
      const res = await fetch(ENDPOINT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sub.data)
      });
      // no-cors: assume success if no error thrown
      await markSubmissionSynced(sub.id);
    } catch (e) {
      // keep in queue, try later
    }
  }
}

window.addEventListener('online', () => {
  syncNow();
});

// Optional: manual sync trigger if you ever want a button
// document.getElementById('sync-btn').addEventListener('click', syncNow);
