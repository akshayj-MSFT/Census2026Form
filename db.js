// -------------------------------------------
// Critical Northwest Census — IndexedDB Layer
// -------------------------------------------

const DB_NAME = "cnw_census_db";
const STORE_PROGRESS = "progress";
const STORE_QUEUE = "queue";

let db;

// Open or create the database
const request = indexedDB.open(DB_NAME, 1);

request.onupgradeneeded = event => {
  db = event.target.result;

  if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
    db.createObjectStore(STORE_PROGRESS, { keyPath: "id" });
  }

  if (!db.objectStoreNames.contains(STORE_QUEUE)) {
    db.createObjectStore(STORE_QUEUE, { autoIncrement: true });
  }
};

request.onsuccess = event => {
  db = event.target.result;
};

request.onerror = event => {
  console.error("IndexedDB error:", event.target.error);
};

// ---------------------------
// Save in-progress responses
// ---------------------------
async function saveProgress(id, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, "readwrite");
    const store = tx.objectStore(STORE_PROGRESS);
    store.put({ id, data });

    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

// ---------------------------
// Load in-progress responses
// ---------------------------
async function loadProgress(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, "readonly");
    const store = tx.objectStore(STORE_PROGRESS);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result ? req.result.data : null);
    req.onerror = reject;
  });
}

// ---------------------------
// Save a completed submission
// ---------------------------
async function saveSubmission(data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, "readwrite");
    const store = tx.objectStore(STORE_QUEUE);
    store.add({
      data,
      timestamp: Date.now(),
      synced: false
    });

    tx.oncomplete = () => {
      // Trigger background sync if available
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then(reg => {
          reg.sync.register("sync-submissions");
        });
      }
      resolve();
    };

    tx.onerror = reject;
  });
}

// ---------------------------
// Get all unsynced submissions
// ---------------------------
async function getQueuedSubmissions() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, "readonly");
    const store = tx.objectStore(STORE_QUEUE);
    const req = store.getAll();

    req.onsuccess = () => {
      const unsynced = req.result.filter(item => !item.synced);
      resolve(unsynced);
    };

    req.onerror = reject;
  });
}

// ---------------------------
// Mark submission as synced
// ---------------------------
async function markSubmissionSynced(timestamp) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, "readwrite");
    const store = tx.objectStore(STORE_QUEUE);

    const req = store.openCursor();
    req.onsuccess = event => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.timestamp === timestamp) {
          const updated = cursor.value;
          updated.synced = true;
          cursor.update(updated);
        }
        cursor.continue();
      }
    };

    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}
