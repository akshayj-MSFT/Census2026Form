/**
 * Critical Northwest 2026 Census — Merge Script
 * Combines:
 *   - Sheet A: Google Form responses
 *   - Sheet B: Offline PWA submissions
 * Into:
 *   - Sheet C: Master Sheet (deduplicated)
 */

function mergeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const FORM_SHEET = "Form Responses 1";       // Google Form sheet
  const OFFLINE_SHEET = "Offline Submissions"; // PWA sheet
  const MASTER_SHEET = "Master Responses";     // Output sheet

  const formSheet = ss.getSheetByName(FORM_SHEET);
  const offlineSheet = ss.getSheetByName(OFFLINE_SHEET);
  let masterSheet = ss.getSheetByName(MASTER_SHEET);

  // Create master sheet if missing
  if (!masterSheet) {
    masterSheet = ss.insertSheet(MASTER_SHEET);
  }

  // Clear master sheet
  masterSheet.clear();

  // Get data
  const formData = formSheet.getDataRange().getValues();
  const offlineData = offlineSheet.getDataRange().getValues();

  // Use headers from Form Responses (Google Form defines the schema)
  const headers = formData[0];
  masterSheet.appendRow(headers);

  // Build a set to track unique rows (stringified)
  const seen = new Set();

  // Helper to add rows without duplicates
  function addRows(data) {
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const key = JSON.stringify(row);

      if (!seen.has(key)) {
        seen.add(key);
        masterSheet.appendRow(row);
      }
    }
  }

  // Add Form responses first
  addRows(formData);

  // Add Offline responses second
  addRows(offlineData);

  // Auto-resize columns
  masterSheet.autoResizeColumns(1, headers.length);

  SpreadsheetApp.getUi().alert("Merge complete! Master sheet updated.");
}
