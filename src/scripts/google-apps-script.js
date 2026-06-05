/**
 * Google Apps Script for syncing Fetcher Cargo tracking data
 * from Google Sheets to the PostgreSQL database via API.
 *
 * Setup:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this entire script
 * 4. Update SYNC_URL and API_KEY below
 * 5. Save (Ctrl+S) and close Apps Script
 * 6. Reload the Google Sheet — a "Fetcher Cargo" menu will appear in the menu bar
 * 7. Click "Fetcher Cargo > Sync All Shipments" to push data to the website
 */

var SYNC_URL = 'https://your-app.vercel.app/api/sync'; // Update after deploying
var API_KEY = 'your-secret-key-here'; // Must match SYNC_API_KEY env var

/**
 * Adds a custom menu to the Google Sheets toolbar.
 * Runs automatically when the spreadsheet is opened.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Fetcher Cargo')
    .addItem('Sync All Shipments', 'syncWithAlert')
    .addSeparator()
    .addItem('Sync & Show Details', 'syncWithDetails')
    .addToUi();
}

/**
 * Syncs all shipments and shows a success/error popup.
 */
function syncWithAlert() {
  var ui = SpreadsheetApp.getUi();
  try {
    var result = syncAllShipments();
    ui.alert('Sync Complete', 'Successfully synced ' + result.synced + ' shipment(s) to the tracking website.', ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Sync Failed', 'Error: ' + e.message, ui.ButtonSet.OK);
  }
}

/**
 * Syncs all shipments and shows detailed response.
 */
function syncWithDetails() {
  var ui = SpreadsheetApp.getUi();
  try {
    var result = syncAllShipments();
    var msg = 'Synced: ' + result.synced + ' shipment(s)';
    if (result.errors && result.errors.length > 0) {
      msg += '\n\nErrors (' + result.errors.length + '):\n';
      for (var i = 0; i < result.errors.length; i++) {
        msg += '• AWB ' + result.errors[i].awb + ': ' + result.errors[i].error + '\n';
      }
    }
    ui.alert('Sync Results', msg, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Sync Failed', 'Error: ' + e.message, ui.ButtonSet.OK);
  }
}

/**
 * Main sync function. Reads all rows and POSTs to the API.
 * Returns the parsed API response.
 */
function syncAllShipments() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    throw new Error('No data rows found');
  }

  var payloads = [];

  // Data starts at row index 1 (row 0 = header)
  var startRow = 1;

  for (var row = startRow; row < data.length; row++) {
    var rowData = data[row];

    // Column positions (0-indexed):
    // 0: DATE, 1: TIME, 2: AWB, 3: CUSTOMER ID, 4: CARRIER/PARTNER (skip),
    // 5: STATUS, 6: ESTIMATED DELIVERY DATE, 7: MODE
    // 8-10: DATE.1, TIME.1, UPDATE-1
    // 11-13: DATE.2, TIME.2, UPDATE-2
    // ... repeats up to UPDATE-10
    // 38: ADDITIONAL INFO

    var awb = String(rowData[2] || '').trim();
    if (!awb) continue;

    var updates = [];
    for (var i = 1; i <= 10; i++) {
      var baseIdx = 8 + (i - 1) * 3;
      var updateDate = rowData[baseIdx] ? formatDate(rowData[baseIdx]) : '';
      var updateTime = rowData[baseIdx + 1] ? String(rowData[baseIdx + 1]) : '';
      var updateText = rowData[baseIdx + 2] ? String(rowData[baseIdx + 2]).trim() : '';

      if (updateText) {
        updates.push({
          date: updateDate,
          time: updateTime,
          text: updateText,
          sortOrder: i
        });
      }
    }

    payloads.push({
      awb: awb,
      customerId: String(rowData[3] || '').trim(),
      status: String(rowData[5] || '').trim(),
      estimatedDeliveryDate: rowData[6] ? formatDate(rowData[6]) : '',
      mode: String(rowData[7] || '').trim(),
      additionalInfo: String(rowData[38] || '').trim(),
      createdDate: rowData[0] ? formatDate(rowData[0]) : '',
      createdTime: rowData[1] ? String(rowData[1]) : '',
      updates: updates
    });
  }

  if (payloads.length === 0) {
    throw new Error('No valid shipment rows to sync');
  }

  Logger.log('Syncing ' + payloads.length + ' shipments...');

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': API_KEY },
    payload: JSON.stringify(payloads),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(SYNC_URL, options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  Logger.log('Status: ' + code);
  Logger.log('Response: ' + body);

  if (code !== 200) {
    throw new Error('API returned status ' + code + ': ' + body);
  }

  return JSON.parse(body);
}

function formatDate(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'dd-MMM-yyyy');
  }
  return String(value);
}
