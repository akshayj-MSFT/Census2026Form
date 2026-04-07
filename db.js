// -------------------------------------------
// Critical Northwest Census — IndexedDB Layer
// -------------------------------------------

const DB_NAME = 'cnw-census-db';
const DB_VERSION = 1;
const STORE_DRAFT = 'draft';
const STORE_QUEUE = 'queue';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_DRAFT)) {
        db.createObjectStore(STORE_DRAFT, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveDraft(data) {
  const db = await openDb();
  const tx = db.transaction(STORE_DRAFT, 'readwrite');
  const store = tx.objectStore(STORE_DRAFT);
  store.put({ id: 'current', data, updatedAt: Date.now() });
  return tx.complete;
}

async function saveSubmission(data) {
  const db = await openDb();
  const tx = db.transaction(STORE_QUEUE, 'readwrite');
  const store = tx.objectStore(STORE_QUEUE);
  store.add({ data, createdAt: Date.now(), synced: false });
  return tx.complete;
}

async function getQueuedSubmissions() {
  const db = await openDb();
  const tx = db.transaction(STORE_QUEUE, 'readonly');
  const store = tx.objectStore(STORE_QUEUE);
  return new Promise(resolve => {
    const items = [];
    const req = store.openCursor();
    req.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) {
        items.push({ id: cursor.key, ...cursor.value });
        cursor.continue();
      } else {
        resolve(items);
      }
    };
  });
}

async function markSubmissionSynced(id) {
  const db = await openDb();
  const tx = db.transaction(STORE_QUEUE, 'readwrite');
  const store = tx.objectStore(STORE_QUEUE);
  const item = await new Promise(resolve => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
  });
  if (item) {
    item.synced = true;
    item.syncedAt = Date.now();
    store.put(item);
  }
  return tx.complete;
}
