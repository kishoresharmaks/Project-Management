# ⚡ ClientPulse Vault Pro - Website & Credentials Management System

A high-performance, secure, and modern **Client Website & Credentials Management Dashboard** featuring **Realtime Bi-Directional 2-Way Sync** with Online Excel and Google Sheets.

![ClientPulse Vault Pro](https://img.shields.io/badge/Status-Production%20Ready-emerald)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20TailwindCSS-blue)
![Sync Engine](https://img.shields.io/badge/Sync-Google%20Sheets%202--Way-green)

---

## 🌟 Key Features

- 🔄 **Bi-Directional 2-Way Google Sheets Sync**: Any changes made on the website (adding, editing, or deleting clients) instantly push to your connected Google Sheet. Edits made inside Google Sheets auto-sync to the web dashboard every 10 seconds.
- 🔒 **Security-First Credentials Vault**: Store WP-Admin, FTP/SFTP, Hosting Panels, Databases, DNS, and API keys with password masking, 1-click copy feedback, and Master PIN vault protection.
- 📊 **Executive Analytics Dashboard**: Real-time KPI metrics, monthly recurring revenue (MRR) tracking, health uptime counters, and maintenance milestone trackers.
- 💻 **Dual View Modes**: Switch between high-impact **Grid Cards** and a dense **Spreadsheet Table View**.
- 📥 **XLSX Import & Export**: Download full database snapshots to `.xlsx` or import local spreadsheets using SheetJS.
- 🔐 **URL & Environment Obfuscation**: Sheet links and API keys are protected in `.env` and masked in the UI to prevent DOM inspection leakage.

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/kishoresharmaks/Project-Management.git
cd Project-Management
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your deployed Google Apps Script URL or Google Sheets API Key in `.env`:
```env
VITE_CUSTOM_API_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_SHEET_WRITE_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_AUTO_SYNC_INTERVAL_SEC=10
VITE_MASTER_SECURITY_PIN=1234
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 📜 2-Way Google Apps Script Setup

To enable 2-way read and write sync with Google Sheets:

1. Open your Google Sheet &rarr; Click **Extensions &rarr; Apps Script**.
2. Paste the following script:

```javascript
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var clientSheet = ss.getSheetByName('Clients Data') || ss.getSheets()[0];
  var rows = clientSheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Update Clients Data Sheet (Main Overview Tab)
    if (contents.action === 'update_all' && contents.clients) {
      var clientSheet = ss.getSheetByName('Clients Data') || ss.getSheets()[0];
      clientSheet.clear();
      
      var clients = contents.clients;
      if (clients.length > 0) {
        var headers = Object.keys(clients[0]);
        var data = [headers];
        for (var i = 0; i < clients.length; i++) {
          var row = [];
          for (var j = 0; j < headers.length; j++) {
            row.push(clients[i][headers[j]] !== undefined ? clients[i][headers[j]] : '');
          }
          data.push(row);
        }
        clientSheet.getRange(1, 1, data.length, headers.length).setValues(data);
        clientSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
      }
    }

    // 2. Update Credentials Vault Sheet (2nd Vault Tab)
    if (contents.credentials && contents.credentials.length > 0) {
      var vaultSheet = ss.getSheetByName('Credentials Vault');
      if (!vaultSheet) {
        vaultSheet = ss.insertSheet('Credentials Vault');
      }
      vaultSheet.clear();

      var creds = contents.credentials;
      var credHeaders = Object.keys(creds[0]);
      var credData = [credHeaders];
      for (var k = 0; k < creds.length; k++) {
        var credRow = [];
        for (var m = 0; m < credHeaders.length; m++) {
          credRow.push(creds[k][credHeaders[m]] !== undefined ? creds[k][credHeaders[m]] : '');
        }
        credData.push(credRow);
      }
      vaultSheet.getRange(1, 1, credData.length, credHeaders.length).setValues(credData);
      vaultSheet.getRange(1, 1, 1, credHeaders.length).setFontWeight('bold').setBackground('#e0e7ff');
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click **Deploy &rarr; New Deployment &rarr; Web App** (Execute as: *Me*, Access: *Anyone*).
4. Copy the Web App URL into your `.env` file for `VITE_CUSTOM_API_ENDPOINT` and `VITE_SHEET_WRITE_ENDPOINT`.

---

## 📄 License
MIT License. Built for modern web agencies and digital asset managers.
