/**
 * Takumi Ceremonial Matcha — landing page lead capture.
 *
 * Paste this into the Apps Script project bound to the leads spreadsheet
 * (Sheet → Extensions → Apps Script), then deploy it as a Web app.
 * Full setup steps are in README.md under "Lead capture".
 *
 * The sheet tab must exist with this header row:
 *   Timestamp | Source | Name | Email | Phone | Reason | Consent | Page
 */

// Tab inside the bound spreadsheet that rows are appended to.
var SHEET_NAME = 'Leads';

// Must match LEAD_TOKEN in script.js. This is NOT a secret — it ships in the
// page's JavaScript. It only turns away drive-by bots hitting the URL directly;
// anyone reading the page source can still post. Rate limiting below is what
// keeps volume down.
var SHARED_TOKEN = 'takumi-2026';

// Leave '' to skip notifications, or set an address to be emailed per lead.
var NOTIFY_EMAIL = '';

// Max submissions accepted from one email address per hour.
var MAX_PER_HOUR = 5;

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Honeypot: a filled hidden field means a bot. Answer ok so it does not
    // learn anything from the response, but write nothing.
    if (data.bot_field) return json({ ok: true });

    if (SHARED_TOKEN && data.token !== SHARED_TOKEN) {
      return json({ ok: false, error: 'forbidden' });
    }

    var email = String(data.email || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ ok: false, error: 'invalid email' });
    }

    if (isRateLimited_(email)) {
      return json({ ok: false, error: 'too many submissions' });
    }

    // Lock so two simultaneous posts cannot append to the same row.
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
      if (!sheet) return json({ ok: false, error: 'sheet ' + SHEET_NAME + ' not found' });

      sheet.appendRow([
        new Date(),
        String(data.source || ''),
        String(data.name || ''),
        email,
        String(data.phone || ''),
        String(data.reason || ''),
        data.consent ? 'yes' : 'no',
        String(data.page || '')
      ]);
    } finally {
      lock.releaseLock();
    }

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: 'Takumi Matcha lead — ' + email,
        body: [
          'Source: ' + (data.source || ''),
          'Name: ' + (data.name || ''),
          'Email: ' + email,
          'Phone: ' + (data.phone || ''),
          'Reason: ' + (data.reason || ''),
          'Consent: ' + (data.consent ? 'yes' : 'no'),
          'Page: ' + (data.page || '')
        ].join('\n')
      });
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Opening the /exec URL in a browser should not look broken.
function doGet() {
  return json({ ok: true, note: 'POST only' });
}

function isRateLimited_(email) {
  var cache = CacheService.getScriptCache();
  var key = 'rl_' + Utilities.base64EncodeWebSafe(email.toLowerCase());
  var count = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(count), 3600);
  return count > MAX_PER_HOUR;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
