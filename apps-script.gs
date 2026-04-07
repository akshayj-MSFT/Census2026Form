/**
 * Critical Northwest 2026 Census — Google Apps Script Backend
 * Receives POST requests from the offline PWA and writes each submission
 * to Google Sheet B (your offline-submissions sheet).
 */

function doPost(e) {
  try {
    const sheetName = "Offline Submissions"; // <-- Change if needed
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return ContentService
        .createTextOutput("Sheet not found: " + sheetName)
        .setMimeType(ContentService.MimeType.TEXT);
    }

    // Parse JSON body
    const data = JSON.parse(e.postData.contents);

    // Convert object to row array
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(h => data[h] || "");

    // Append row
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
