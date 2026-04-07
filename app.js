let currentPage = 1;

function showPage(page) {
  document.querySelectorAll('.page').forEach(sec => {
    sec.hidden = Number(sec.dataset.page) !== page;
  });
  currentPage = page;
}

function getRequiredFields(page) {
  if (page === 1) {
    return [
      document.getElementById('consent'),
      document.getElementById('ticket')
    ];
  }
  return [];
}

function validatePage(page) {
  const required = getRequiredFields(page);
  for (const el of required) {
    if (!el.value) {
      el.classList.add('error');
      return false;
    }
    el.classList.remove('error');
  }
  return true;
}

function collectData() {
  const data = {};

  // All inputs/selects
  const inputs = document.querySelectorAll('input[data-key], select[data-key]');
  inputs.forEach(el => {
    const key = el.dataset.key;
    if (!key) return;

    if (el.type === 'checkbox') {
      if (!data[key]) data[key] = [];
      if (el.checked) data[key].push(el.value);
    } else if (el.type === 'radio') {
      if (el.checked) data[key] = el.value;
    } else {
      data[key] = el.value || data[key] || '';
    }
  });

  // Scale radio group (already handled via data-key)
  return data;
}

document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  document.getElementById('next-1').addEventListener('click', () => {
    if (!validatePage(1)) return;
    saveDraft(collectData());
    showPage(2);
  });

  document.getElementById('back-2').addEventListener('click', () => showPage(1));
  document.getElementById('next-2').addEventListener('click', () => {
    saveDraft(collectData());
    showPage(3);
  });

  document.getElementById('back-3').addEventListener('click', () => showPage(2));
  document.getElementById('next-3').addEventListener('click', () => {
    saveDraft(collectData());
    showPage(4);
  });

  document.getElementById('back-4').addEventListener('click', () => showPage(3));

  document.getElementById('submit').addEventListener('click', async () => {
    if (!validatePage(1)) {
      showPage(1);
      return;
    }
    const data = collectData();
    await saveSubmission(data);
    const status = document.getElementById('status');
    status.textContent = 'Saved locally. Will sync when online.';
    status.classList.add('visible');
    // Optionally clear form or keep for next participant
  });

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
});
