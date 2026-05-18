/**
 * ═══════════════════════════════════════════════════════════════
 *  AB.gs — Platform 9¾ TSS · Independent Email Sender
 *  Deploy this file from: arjavbadjatya1026@gmail.com
 * ═══════════════════════════════════════════════════════════════
 *
 *  PURPOSE:
 *  ────────
 *  AB.gs is a fully independent email sender. It has the complete
 *  email logic — all four email functions, identical HTML, identical
 *  QR code generation, identical CONFIG values. The only difference
 *  from TSS.gs is that this runs under Arjav's Google account, so
 *  GmailApp sends from arjavbadjatya1026@gmail.com.
 *
 *  AB.gs does NOT touch any Google Sheet.
 *  AB.gs does NOT generate Token IDs (the frontend passes the token in the payload).
 *  AB.gs does NOT read from or write to any sheet.
 *  It receives all the data it needs in the POST payload from the frontend.
 *
 *  ARCHITECTURE:
 *  ─────────────
 *  When "AB" is the active sender (set in the Settings tab on the TSS sheet),
 *  the frontend calls AB.gs directly for email-sending actions instead of TSS.gs.
 *  TSS.gs always handles all sheet operations regardless of which sender is active.
 *
 *  FRONTEND FLOW (when AB is active sender):
 *  Step 1 — Frontend calls TSS.gs to do the sheet operation (register, approve, etc.)
 *            TSS.gs returns the token ID and all registrant data.
 *  Step 2 — Frontend calls AB.gs with action "sendEmail", passing all data needed.
 *            AB.gs builds the email HTML and sends it via GmailApp from Arjav's account.
 *
 *  SETUP:
 *  ──────
 *  1. Open https://script.google.com/ while logged into arjavbadjatya1026@gmail.com
 *  2. Create a new project, name it "Platform 9¾ TSS — AB Email Sender"
 *  3. Delete any existing code and paste this entire file.
 *  4. Click Save.
 *  5. Click Deploy → New Deployment.
 *  6. Choose type: Web App.
 *     - Execute as: Me (arjavbadjatya1026@gmail.com)
 *     - Who has access: Anyone
 *  7. Click Deploy and copy the Web App URL.
 *  8. Paste that URL as AB_URL in both devApi.ts and Register.tsx in the frontend.
 *
 *  ACCEPTED doPost ACTION:
 *  ───────────────────────
 *  { action: "sendEmail", emailType: "confirmation"|"approval"|"hostedBy"|"hostNotification",
 *    firstName, lastName, email, tokenId,
 *    hostFirstName, hostLastName, hostFullName, hostEmail  (for hosted-by flows)
 *  }
 * ═══════════════════════════════════════════════════════════════
 */

/* ── Configuration — identical to TSS.gs ── */
var CONFIG = {
  EVENT_NAME:  "Platform 9¾ TSS",
  EVENT_DATE:  "12 April 2026",
  EVENT_TIME:  "4:00 PM – 8:00 PM IST",
  EVENT_VENUE: "Underdoggs, High Street Apollo, Indore",
  CONTACT_EMAIL: "thesamaagmsummit@gmail.com",
};

/* ═══════════════════════════════════════════════════════════════
   doGet — health check
   ═══════════════════════════════════════════════════════════════ */
function doGet(e) {
  return abRespond({
    status:  "ok",
    service: "Platform 9\u00be TSS \u00b7 AB Email Sender",
    account: "arjavbadjatya1026@gmail.com",
    message: "AB sender is live. POST { action: 'sendEmail', emailType, ... } to send emails.",
  });
}

/* ═══════════════════════════════════════════════════════════════
   doPost — routes by action field
   ═══════════════════════════════════════════════════════════════ */
function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : "";
    if (!raw) {
      return abRespond({ success: false, error: "Empty request body." });
    }

    var data = JSON.parse(raw);

    if (data.action === "sendEmail") return handleSendEmailAction(data);

    return abRespond({ success: false, error: "Unknown action: " + (data.action || "(none)") });

  } catch (err) {
    Logger.log("AB doPost error: " + err.toString());
    return abRespond({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   handleSendEmailAction — routes to the correct email function.
   Identical handler to TSS.gs — the only difference is which Gmail
   account executes the GmailApp.sendEmail call.
   ═══════════════════════════════════════════════════════════════ */
function handleSendEmailAction(data) {
  try {
    var type = data.emailType || "";

    if (type === "confirmation") {
      sendConfirmationEmail({
        firstName: data.firstName || "",
        lastName:  data.lastName  || "",
        email:     data.email     || "",
      });

    } else if (type === "approval") {
      sendApprovedTicketEmail({
        firstName: data.firstName || "",
        lastName:  data.lastName  || "",
        email:     data.email     || "",
      }, data.tokenId || "");

    } else if (type === "hostedBy") {
      var guestData = {
        firstName: data.firstName || "",
        lastName:  data.lastName  || "",
        email:     data.email     || "",
      };
      var hostData = {
        firstName: data.hostFirstName || "",
        lastName:  data.hostLastName  || "",
        fullName:  data.hostFullName  || ((data.hostFirstName || "") + " " + (data.hostLastName || "")).trim(),
        email:     data.hostEmail     || "",
      };
      sendHostedByTicketEmail(guestData, data.tokenId || "", hostData);

    } else if (type === "hostNotification") {
      var hostData2 = {
        firstName: data.hostFirstName || "",
        lastName:  data.hostLastName  || "",
        fullName:  data.hostFullName  || ((data.hostFirstName || "") + " " + (data.hostLastName || "")).trim(),
        email:     data.hostEmail     || "",
      };
      var guestData2 = {
        firstName: data.firstName || "",
        lastName:  data.lastName  || "",
        email:     data.email     || "",
      };
      sendHostNotificationEmail(hostData2, guestData2, data.tokenId || "");

    } else {
      return abRespond({ success: false, error: "Unknown emailType: " + type });
    }

    return abRespond({ success: true });
  } catch (err) {
    Logger.log("AB handleSendEmailAction error: " + err.toString());
    return abRespond({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   sendConfirmationEmail — premium HP-themed design.
   Identical HTML to TSS.gs. Sends via Arjav's GmailApp account.
   ═══════════════════════════════════════════════════════════════ */
function sendConfirmationEmail(data) {
  try {
    var name = data.firstName || "Wizard";
    var fullName = ((data.firstName || "") + " " + (data.lastName || "")).trim();
    var subject = "Registration received — Platform 9¾ TSS";

    var htmlBody = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
      '<title>Platform 9¾ TSS — Registration Received</title></head>',
      '<body style="margin:0;padding:0;background:#0d0d0d;font-family:Georgia,\'Times New Roman\',serif;">',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">',
      '<tr><td align="center">',
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">',

      '<tr><td style="padding:0 0 14px;text-align:center;">',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:5px;color:rgba(255,255,255,0.22);text-transform:uppercase;">The Samaagm Summit &middot; Platform 9&frac34; TSS</p>',
      '</td></tr>',

      '<tr><td style="background:#111111;border-radius:14px;overflow:hidden;border:1px solid #2a2a2a;">',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
      '<tr><td style="background:linear-gradient(160deg,#6b0000 0%,#cc0000 55%,#7a0000 100%);padding:40px 44px 36px;text-align:center;">',
      '<p style="margin:0 0 4px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:6px;color:rgba(255,255,255,0.5);text-transform:uppercase;">presents</p>',
      '<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:48px;font-weight:bold;color:#ffffff;letter-spacing:3px;line-height:1;">Platform&nbsp;9&frac34;</h1>',
      '<div style="width:56px;height:2px;background:#d4a843;margin:0 auto 14px;"></div>',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:10px;letter-spacing:5px;color:rgba(255,255,255,0.55);text-transform:uppercase;">12&nbsp;April&nbsp;2026&nbsp;&nbsp;&middot;&nbsp;&nbsp;Indore</p>',
      '</td></tr>',
      '</table>',

      '<div style="height:3px;background:linear-gradient(90deg,#b8922a,#d4a843,#f0c060,#d4a843,#b8922a);"></div>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
      '<tr><td style="padding:36px 44px 16px;">',

      '<p style="margin:0 0 6px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:5px;color:#d4a843;text-transform:uppercase;">Registration received</p>',
      '<p style="margin:0 0 22px;font-size:28px;font-weight:bold;color:#ffffff;line-height:1.2;">Hey, ' + name + '.</p>',
      '<p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.85;">',
      'We\'ve got your registration for <span style="color:#e05555;font-weight:bold;">Platform 9¾ TSS</span>. ',
      'Your payment screenshot is with us and <strong style="color:#ffffff;">currently under review</strong>. ',
      'Once confirmed, your official ticket will be sent to this inbox.',
      '</p>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">',
      '<tr><td style="background:#1e1200;border:1px solid #5a3a00;border-left:4px solid #d4a843;border-radius:8px;padding:16px 20px;">',
      '<table role="presentation" cellpadding="0" cellspacing="0">',
      '<tr><td style="vertical-align:middle;padding-right:12px;">',
      '<div style="width:10px;height:10px;background:#f0c060;border-radius:50%;box-shadow:0 0 6px #d4a843;"></div>',
      '</td><td>',
      '<p style="margin:0 0 2px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#d4a843;text-transform:uppercase;font-weight:bold;">Status: Payment under review</p>',
      '<p style="margin:0;font-size:13px;color:rgba(255,255,255,0.50);line-height:1.5;">We\'ll send your ticket once payment is verified — usually within 24 hours.</p>',
      '</td></tr>',
      '</table>',
      '</td></tr>',
      '</table>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #2e2e2e;border-radius:10px;overflow:hidden;">',
      '<tr><td style="background:#181818;padding:14px 22px 12px;border-bottom:1px solid #2a2a2a;">',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#d4a843;text-transform:uppercase;font-weight:bold;">Registration details</p>',
      '</td></tr>',
      '<tr><td style="padding:18px 22px 20px;background:#141414;">',
      '<table role="presentation" cellpadding="0" cellspacing="6" width="100%">',
      '<tr>',
      '<td style="width:80px;font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;padding:4px 0;vertical-align:top;">Name</td>',
      '<td style="font-size:15px;color:#ffffff;font-weight:bold;padding:4px 0;">' + fullName + '</td>',
      '</tr><tr>',
      '<td style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;padding:4px 0;vertical-align:top;">Date</td>',
      '<td style="font-size:15px;color:#ffffff;font-weight:bold;padding:4px 0;">' + CONFIG.EVENT_DATE + '</td>',
      '</tr><tr>',
      '<td style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;padding:4px 0;vertical-align:top;">Time</td>',
      '<td style="font-size:15px;color:#ffffff;font-weight:bold;padding:4px 0;">' + CONFIG.EVENT_TIME + '</td>',
      '</tr><tr>',
      '<td style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;padding:4px 0;vertical-align:top;">Venue</td>',
      '<td style="font-size:15px;color:#ffffff;font-weight:bold;padding:4px 0;">' + CONFIG.EVENT_VENUE + '</td>',
      '</tr>',
      '</table>',
      '</td></tr>',
      '<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px dashed #3a3a3a;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>',
      '<tr><td style="background:#0e0e0e;padding:12px 22px;">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
      '<tr>',
      '<td><p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.22);text-transform:uppercase;">The Samaagm Summit &middot; Platform 9&frac34; TSS</p></td>',
      '<td style="text-align:right;">',
      '<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;"><tr>',
      '<td style="width:8px;height:8px;background:#f0c060;border-radius:50%;vertical-align:middle;"></td>',
      '<td style="padding-left:6px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:3px;color:#d4a843;text-transform:uppercase;vertical-align:middle;">Pending Review</td>',
      '</tr></table>',
      '</td>',
      '</tr>',
      '</table>',
      '</td></tr>',
      '</table>',

      '<p style="margin:0 0 14px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:rgba(255,255,255,0.30);text-transform:uppercase;">What happens next</p>',
      '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">',
      '<tr><td style="width:30px;vertical-align:top;padding-top:2px;"><span style="display:inline-block;width:22px;height:22px;background:#cc0000;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:bold;font-family:\'Courier New\',monospace;">1</span></td>',
      '<td style="padding:2px 0 16px 12px;font-size:14px;color:rgba(255,255,255,0.62);line-height:1.7;">Our team reviews your <strong style="color:#fff;">payment screenshot</strong>.</td></tr>',
      '<tr><td style="width:30px;vertical-align:top;padding-top:2px;"><span style="display:inline-block;width:22px;height:22px;background:#cc0000;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:bold;font-family:\'Courier New\',monospace;">2</span></td>',
      '<td style="padding:2px 0 16px 12px;font-size:14px;color:rgba(255,255,255,0.62);line-height:1.7;">Your <strong style="color:#fff;">official ticket</strong> arrives here — usually within <strong style="color:#fff;">24 hours</strong>.</td></tr>',
      '<tr><td style="width:30px;vertical-align:top;padding-top:2px;"><span style="display:inline-block;width:22px;height:22px;background:#cc0000;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:bold;font-family:\'Courier New\',monospace;">3</span></td>',
      '<td style="padding:2px 0 4px 12px;font-size:14px;color:rgba(255,255,255,0.62);line-height:1.7;">Show your ticket at the door on <strong style="color:#fff;">12 April</strong>.</td></tr>',
      '</table>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#181818;border:1px solid #252525;border-radius:8px;margin-bottom:26px;">',
      '<tr><td style="padding:14px 18px;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;">',
      '&#128161; <strong style="color:rgba(255,255,255,0.65);">Tip:</strong> Didn\'t get your ticket within 24 hours? Check your <strong style="color:rgba(255,255,255,0.65);">spam or promotions folder</strong>.',
      '</td></tr>',
      '</table>',

      '<p style="margin:0;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.8;">',
      'Questions? DM us on Instagram: <a href="https://www.instagram.com/thesamaagmsummit.tss" style="color:#cc0000;text-decoration:none;font-weight:bold;">@thesamaagmsummit.tss</a> or reply to this email.',
      '</p>',

      '</td></tr>',

      '<tr><td style="background:#0a0a0a;border-top:1px solid #1c1c1c;padding:28px 44px;text-align:center;">',
      '<p style="margin:0;font-style:italic;color:rgba(255,255,255,0.32);font-size:14px;line-height:1.9;">&ldquo;It does not do to dwell on dreams and forget to live.&rdquo;</p>',
      '<p style="margin:10px 0 0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#b8922a;text-transform:uppercase;">&mdash; Albus Dumbledore</p>',
      '</td></tr>',

      '<tr><td style="background:#080808;padding:22px 44px 20px;text-align:center;border-top:1px solid #181818;">',
      '<p style="margin:0 0 14px;font-family:\'Courier New\',monospace;font-size:8px;letter-spacing:3px;color:rgba(255,255,255,0.15);text-transform:uppercase;">&lowast; Mischief Managed &middot; Platform 9&frac34; TSS &middot; The Samaagm Summit &lowast;</p>',
      '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 14px;"><tr>',
      '<td style="padding:0 16px;text-align:center;"><p style="margin:0 0 3px;font-family:\'Courier New\',monospace;font-size:8px;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:2px;">Somya Khandare &mdash; CEO</p><a href="tel:+918962092386" style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.30);text-decoration:none;">+91 89620 92386</a></td>',
      '<td style="padding:0 16px;text-align:center;border-left:1px solid #252525;"><p style="margin:0 0 3px;font-family:\'Courier New\',monospace;font-size:8px;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:2px;">Arjav Badjatya &mdash; CMO</p><a href="tel:+919406861126" style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.30);text-decoration:none;">+91 94068 61126</a></td>',
      '</tr></table>',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:1px;">',
      '<a href="https://www.instagram.com/thesamaagmsummit.tss" style="color:rgba(255,255,255,0.28);text-decoration:none;">@thesamaagmsummit.tss</a>',
      ' &nbsp;&middot;&nbsp; ',
      '<a href="mailto:thesamaagmsummit@gmail.com" style="color:rgba(255,255,255,0.28);text-decoration:none;">thesamaagmsummit@gmail.com</a>',
      '</p>',
      '</td></tr>',

      '</table>',
      '</table>',
      '</td></tr>',
      '</table>',
      '</body></html>',
    ].join("\n");

    GmailApp.sendEmail(data.email, subject, "", {
      htmlBody: htmlBody,
      name:     "Platform 9\u00be TSS \u00b7 The Samaagm Summit",
      replyTo:  CONFIG.CONTACT_EMAIL,
    });

    Logger.log("AB: Confirmation email sent to: " + data.email);
  } catch (err) {
    Logger.log("AB sendConfirmationEmail error: " + err.toString());
  }
}

/* ═══════════════════════════════════════════════════════════════
   sendApprovedTicketEmail — official "You're in!" ticket with QR code.
   Identical HTML to TSS.gs. Sends via Arjav's GmailApp account.
   @param {Object} data     — { firstName, lastName, email }
   @param {string} tokenId  — e.g. "P934-2026-042-A7KX"
   ═══════════════════════════════════════════════════════════════ */
function sendApprovedTicketEmail(data, tokenId) {
  try {
    var name     = data.firstName || "Wizard";
    var fullName = ((data.firstName || "") + " " + (data.lastName || "")).trim();
    var subject  = "Your ticket is confirmed — Platform 9\u00be TSS";
    var token    = tokenId || "";
    var qrUrl    = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(token) + "&color=000000&bgcolor=FFFFFF&margin=10";

    var htmlBody = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
      '<title>Platform 9\u00be TSS \u2014 You\'re In!</title></head>',
      '<body style="margin:0;padding:0;background:#0d0d0d;font-family:Georgia,\'Times New Roman\',serif;">',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">',
      '<tr><td align="center">',
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">',

      '<tr><td style="padding:0 0 14px;text-align:center;">',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:5px;color:rgba(255,255,255,0.22);text-transform:uppercase;">The Samaagm Summit &middot; Platform 9&frac34; TSS</p>',
      '</td></tr>',

      '<tr><td style="background:#111111;border-radius:14px;overflow:hidden;border:1px solid #2a2a2a;">',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
      '<tr><td style="background:linear-gradient(160deg,#003300 0%,#005522 55%,#003300 100%);padding:40px 44px 36px;text-align:center;">',
      '<p style="margin:0 0 4px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:6px;color:rgba(255,255,255,0.5);text-transform:uppercase;">presents</p>',
      '<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:48px;font-weight:bold;color:#ffffff;letter-spacing:3px;line-height:1;">Platform&nbsp;9&frac34;</h1>',
      '<div style="width:56px;height:2px;background:#00cc66;margin:0 auto 14px;"></div>',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:10px;letter-spacing:5px;color:rgba(255,255,255,0.55);text-transform:uppercase;">12&nbsp;April&nbsp;2026&nbsp;&nbsp;&middot;&nbsp;&nbsp;Indore</p>',
      '</td></tr>',
      '</table>',

      '<div style="height:3px;background:linear-gradient(90deg,#007733,#00cc66,#00ff88,#00cc66,#007733);"></div>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
      '<tr><td style="padding:36px 44px 16px;">',

      '<p style="margin:0 0 6px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:5px;color:#00cc66;text-transform:uppercase;">\u2713 Registration approved</p>',
      '<p style="margin:0 0 22px;font-size:28px;font-weight:bold;color:#ffffff;line-height:1.2;">You\'re in, ' + name + '!</p>',
      '<p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.85;">',
      'Your payment has been verified and your registration for <span style="color:#00cc66;font-weight:bold;">Platform 9\u00be TSS</span> is now <strong style="color:#ffffff;">officially confirmed</strong>. ',
      'Show this email at the door on <strong style="color:#ffffff;">12 April</strong>.',
      '</p>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">',
      '<tr><td style="background:#0a1f0a;border:1px solid #005522;border-left:4px solid #00cc66;border-radius:8px;padding:16px 20px;">',
      '<table role="presentation" cellpadding="0" cellspacing="0"><tr>',
      '<td style="vertical-align:middle;padding-right:12px;"><div style="width:10px;height:10px;background:#00cc66;border-radius:50%;box-shadow:0 0 8px #00cc66;"></div></td>',
      '<td>',
      '<p style="margin:0 0 2px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#00cc66;text-transform:uppercase;font-weight:bold;">Status: Confirmed &amp; Approved</p>',
      '<p style="margin:0;font-size:13px;color:rgba(255,255,255,0.50);line-height:1.5;">Your seat is reserved. We can\'t wait to see you!</p>',
      '</td></tr></table>',
      '</td></tr>',
      '</table>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #005522;border-radius:10px;overflow:hidden;">',
      '<tr><td style="background:#0d1f0d;padding:14px 22px 12px;border-bottom:1px solid #1a3a1a;">',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#00cc66;text-transform:uppercase;font-weight:bold;">Official Ticket</p>',
      '</td></tr>',
      '<tr><td style="padding:18px 22px 20px;background:#0a1a0a;">',
      '<table role="presentation" cellpadding="0" cellspacing="6" width="100%">',
      '<tr><td style="width:80px;font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;padding:4px 0;vertical-align:top;">Name</td><td style="font-size:15px;color:#ffffff;font-weight:bold;padding:4px 0;">' + fullName + '</td></tr>',
      '<tr><td style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;padding:4px 0;vertical-align:top;">Date</td><td style="font-size:15px;color:#ffffff;font-weight:bold;padding:4px 0;">' + CONFIG.EVENT_DATE + '</td></tr>',
      '<tr><td style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;padding:4px 0;vertical-align:top;">Time</td><td style="font-size:15px;color:#ffffff;font-weight:bold;padding:4px 0;">' + CONFIG.EVENT_TIME + '</td></tr>',
      '<tr><td style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;padding:4px 0;vertical-align:top;">Venue</td><td style="font-size:15px;color:#ffffff;font-weight:bold;padding:4px 0;">' + CONFIG.EVENT_VENUE + '</td></tr>',
      '</table>',
      '</td></tr>',
      '<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px dashed #1a4a1a;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>',
      '<tr><td style="background:#060f06;padding:12px 22px;">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>',
      '<td><p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.22);text-transform:uppercase;">The Samaagm Summit &middot; Platform 9&frac34; TSS</p></td>',
      '<td style="text-align:right;"><table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;"><tr>',
      '<td style="width:8px;height:8px;background:#00cc66;border-radius:50%;vertical-align:middle;box-shadow:0 0 6px #00cc66;"></td>',
      '<td style="padding-left:6px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:3px;color:#00cc66;text-transform:uppercase;vertical-align:middle;">Confirmed \u2713</td>',
      '</tr></table></td>',
      '</tr></table>',
      '</td></tr>',
      '</table>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #005522;border-radius:10px;overflow:hidden;">',
      '<tr><td style="background:#0d1f0d;padding:14px 22px 12px;border-bottom:1px solid #1a3a1a;">',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#00cc66;text-transform:uppercase;font-weight:bold;">Your Entry Token</p>',
      '</td></tr>',
      '<tr><td style="padding:28px 22px 24px;background:#0a1a0a;text-align:center;">',
      '<img src="' + qrUrl + '" width="180" height="180" alt="Entry QR Code" style="display:block;margin:0 auto 20px;border:4px solid #1a3a1a;border-radius:8px;" />',
      '<p style="margin:0 0 10px;font-family:\'Courier New\',monospace;font-size:20px;color:#00ff88;letter-spacing:5px;font-weight:bold;">' + token + '</p>',
      '<p style="margin:0;font-size:12px;color:rgba(255,255,255,0.40);line-height:1.7;">This code is your entry pass.<br>Show it at the door or read it aloud to our team.</p>',
      '</td></tr>',
      '</table>',

      '<p style="margin:0 0 14px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:rgba(255,255,255,0.30);text-transform:uppercase;">What to bring</p>',
      '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">',
      '<tr><td style="width:30px;vertical-align:top;padding-top:2px;"><span style="display:inline-block;width:22px;height:22px;background:#006622;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:bold;font-family:\'Courier New\',monospace;">1</span></td>',
      '<td style="padding:2px 0 16px 12px;font-size:14px;color:rgba(255,255,255,0.62);line-height:1.7;">This <strong style="color:#fff;">email</strong> — show it at the door.</td></tr>',
      '<tr><td style="width:30px;vertical-align:top;padding-top:2px;"><span style="display:inline-block;width:22px;height:22px;background:#006622;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:bold;font-family:\'Courier New\',monospace;">2</span></td>',
      '<td style="padding:2px 0 4px 12px;font-size:14px;color:rgba(255,255,255,0.62);line-height:1.7;">Your excitement \u2014 <strong style="color:#fff;">12 April is almost here!</strong></td></tr>',
      '</table>',

      '<p style="margin:0;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.8;">Questions? DM us on Instagram: <a href="https://www.instagram.com/thesamaagmsummit.tss" style="color:#00cc66;text-decoration:none;font-weight:bold;">@thesamaagmsummit.tss</a> or reply to this email.</p>',

      '</td></tr>',

      '<tr><td style="background:#0a0a0a;border-top:1px solid #1c1c1c;padding:28px 44px;text-align:center;">',
      '<p style="margin:0;font-style:italic;color:rgba(255,255,255,0.32);font-size:14px;line-height:1.9;">&ldquo;Happiness can be found even in the darkest of times, if one only remembers to turn on the light.&rdquo;</p>',
      '<p style="margin:10px 0 0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#00cc66;text-transform:uppercase;">&mdash; Albus Dumbledore</p>',
      '</td></tr>',

      '<tr><td style="background:#080808;padding:22px 44px 20px;text-align:center;border-top:1px solid #181818;">',
      '<p style="margin:0 0 14px;font-family:\'Courier New\',monospace;font-size:8px;letter-spacing:3px;color:rgba(255,255,255,0.15);text-transform:uppercase;">&lowast; Mischief Managed &middot; Platform 9&frac34; TSS &middot; The Samaagm Summit &lowast;</p>',
      '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 14px;"><tr>',
      '<td style="padding:0 16px;text-align:center;"><p style="margin:0 0 3px;font-family:\'Courier New\',monospace;font-size:8px;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:2px;">Somya Khandare &mdash; CEO</p><a href="tel:+918962092386" style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.30);text-decoration:none;">+91 89620 92386</a></td>',
      '<td style="padding:0 16px;text-align:center;border-left:1px solid #252525;"><p style="margin:0 0 3px;font-family:\'Courier New\',monospace;font-size:8px;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:2px;">Arjav Badjatya &mdash; CMO</p><a href="tel:+919406861126" style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.30);text-decoration:none;">+91 94068 61126</a></td>',
      '</tr></table>',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:1px;">',
      '<a href="https://www.instagram.com/thesamaagmsummit.tss" style="color:rgba(255,255,255,0.28);text-decoration:none;">@thesamaagmsummit.tss</a>',
      ' &nbsp;&middot;&nbsp; ',
      '<a href="mailto:thesamaagmsummit@gmail.com" style="color:rgba(255,255,255,0.28);text-decoration:none;">thesamaagmsummit@gmail.com</a>',
      '</p>',
      '</td></tr>',

      '</table>',
      '</table>',
      '</td></tr>',
      '</table>',
      '</body></html>',
    ].join("\n");

    GmailApp.sendEmail(data.email, subject, "", {
      htmlBody: htmlBody,
      name:     "Platform 9\u00be TSS \u00b7 The Samaagm Summit",
      replyTo:  CONFIG.CONTACT_EMAIL,
    });

    Logger.log("AB: Approved ticket email sent to: " + data.email + " token: " + token);
  } catch (err) {
    Logger.log("AB sendApprovedTicketEmail error: " + err.toString());
  }
}

/* ═══════════════════════════════════════════════════════════════
   sendHostedByTicketEmail — HP-themed ticket for "Hosted By" guests.
   Identical HTML to TSS.gs. Sends via Arjav's GmailApp account.
   @param {Object} guestData — { firstName, lastName, email }
   @param {string} tokenId
   @param {Object} hostData  — { firstName, lastName, fullName, email }
   ═══════════════════════════════════════════════════════════════ */
function sendHostedByTicketEmail(guestData, tokenId, hostData) {
  try {
    var name      = guestData.firstName || "Wizard";
    var fullName  = ((guestData.firstName || "") + " " + (guestData.lastName || "")).trim();
    var hostFull  = hostData.fullName || ((hostData.firstName || "") + " " + (hostData.lastName || "")).trim();
    var subject   = "Your ticket is confirmed — Platform 9\u00be TSS";
    var token     = tokenId || "";
    var qrUrl     = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(token) + "&color=000000&bgcolor=FFFFFF&margin=10";

    var htmlBody = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
      '<title>Platform 9\u00be TSS \u2014 You\'re In!</title></head>',
      '<body style="margin:0;padding:0;background:#0d0d0d;font-family:Georgia,\'Times New Roman\',serif;">',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">',
      '<tr><td align="center">',
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">',

      '<tr><td style="padding:0 0 14px;text-align:center;">',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:5px;color:rgba(255,255,255,0.22);text-transform:uppercase;">The Samaagm Summit &middot; Platform 9&frac34; TSS</p>',
      '</td></tr>',

      '<tr><td style="background:#111111;border-radius:14px;overflow:hidden;border:1px solid #2a2a2a;">',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
      '<tr><td style="background:linear-gradient(160deg,#003300 0%,#005522 55%,#003300 100%);padding:40px 44px 36px;text-align:center;">',
      '<p style="margin:0 0 4px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:6px;color:rgba(255,255,255,0.5);text-transform:uppercase;">presents</p>',
      '<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:48px;font-weight:bold;color:#ffffff;letter-spacing:3px;line-height:1;">Platform&nbsp;9&frac34;</h1>',
      '<div style="width:56px;height:2px;background:#00cc66;margin:0 auto 14px;"></div>',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:10px;letter-spacing:5px;color:rgba(255,255,255,0.55);text-transform:uppercase;">12&nbsp;April&nbsp;2026&nbsp;&nbsp;&middot;&nbsp;&nbsp;Indore</p>',
      '</td></tr>',
      '</table>',

      '<div style="height:3px;background:linear-gradient(90deg,#007733,#00cc66,#00ff88,#00cc66,#007733);"></div>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
      '<tr><td style="padding:36px 44px 16px;">',

      '<p style="margin:0 0 6px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:5px;color:#00cc66;text-transform:uppercase;">\u2713 Registration approved</p>',
      '<p style="margin:0 0 12px;font-size:28px;font-weight:bold;color:#ffffff;line-height:1.2;">You\'re in, ' + name + '!</p>',
      '<p style="margin:0 0 6px;font-family:\'Courier New\',monospace;font-size:11px;font-style:italic;color:rgba(100,200,140,0.7);">This entry was arranged by ' + hostFull + '.</p>',
      '<p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.85;">',
      'Your registration for <span style="color:#00cc66;font-weight:bold;">Platform 9\u00be TSS</span> is now <strong style="color:#ffffff;">officially confirmed</strong>. ',
      'Show this email at the door on <strong style="color:#ffffff;">12 April</strong>.',
      '</p>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">',
      '<tr><td style="background:#0a1f0a;border:1px solid #005522;border-left:4px solid #00cc66;border-radius:8px;padding:16px 20px;">',
      '<table role="presentation" cellpadding="0" cellspacing="0"><tr>',
      '<td style="vertical-align:middle;padding-right:12px;"><div style="width:10px;height:10px;background:#00cc66;border-radius:50%;box-shadow:0 0 8px #00cc66;"></div></td>',
      '<td>',
      '<p style="margin:0 0 2px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#00cc66;text-transform:uppercase;font-weight:bold;">Status: Confirmed &amp; Approved</p>',
      '<p style="margin:0;font-size:13px;color:rgba(255,255,255,0.50);line-height:1.5;">Your seat is reserved. We can\'t wait to see you!</p>',
      '</td></tr></table>',
      '</td></tr>',
      '</table>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #005522;border-radius:10px;overflow:hidden;">',
      '<tr><td style="background:#0d1f0d;padding:14px 22px 12px;border-bottom:1px solid #1a3a1a;">',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#00cc66;text-transform:uppercase;font-weight:bold;">Official Ticket</p>',
      '</td></tr>',
      '<tr><td style="padding:18px 22px 20px;background:#0a1a0a;">',
      '<table role="presentation" cellpadding="0" cellspacing="6" width="100%">',
      '<tr><td style="width:80px;font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;padding:4px 0;vertical-align:top;">Name</td><td style="font-size:18px;color:#ffffff;font-weight:bold;padding:4px 0;">' + fullName + '</td></tr>',
      '<tr><td style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;padding:4px 0;vertical-align:top;">Date</td><td style="font-size:15px;color:#ffffff;font-weight:bold;padding:4px 0;">' + CONFIG.EVENT_DATE + '</td></tr>',
      '<tr><td style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;padding:4px 0;vertical-align:top;">Time</td><td style="font-size:15px;color:#ffffff;font-weight:bold;padding:4px 0;">' + CONFIG.EVENT_TIME + '</td></tr>',
      '<tr><td style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;padding:4px 0;vertical-align:top;">Venue</td><td style="font-size:15px;color:#ffffff;font-weight:bold;padding:4px 0;">' + CONFIG.EVENT_VENUE + '</td></tr>',
      '</table>',
      '</td></tr>',
      '<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px dashed #1a4a1a;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>',
      '<tr><td style="background:#060f06;padding:12px 22px;">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>',
      '<td><p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.22);text-transform:uppercase;">The Samaagm Summit &middot; Platform 9&frac34; TSS</p></td>',
      '<td style="text-align:right;"><table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;"><tr>',
      '<td style="width:8px;height:8px;background:#00cc66;border-radius:50%;vertical-align:middle;box-shadow:0 0 6px #00cc66;"></td>',
      '<td style="padding-left:6px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:3px;color:#00cc66;text-transform:uppercase;vertical-align:middle;">Confirmed \u2713</td>',
      '</tr></table></td>',
      '</tr></table>',
      '</td></tr>',
      '</table>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #005522;border-radius:10px;overflow:hidden;">',
      '<tr><td style="background:#0d1f0d;padding:14px 22px 12px;border-bottom:1px solid #1a3a1a;">',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#00cc66;text-transform:uppercase;font-weight:bold;">Your Entry Token</p>',
      '</td></tr>',
      '<tr><td style="padding:28px 22px 24px;background:#0a1a0a;text-align:center;">',
      '<img src="' + qrUrl + '" width="180" height="180" alt="Entry QR Code" style="display:block;margin:0 auto 20px;border:4px solid #1a3a1a;border-radius:8px;" />',
      '<p style="margin:0 0 10px;font-family:\'Courier New\',monospace;font-size:20px;color:#00ff88;letter-spacing:5px;font-weight:bold;">' + token + '</p>',
      '<p style="margin:0;font-size:12px;color:rgba(255,255,255,0.40);line-height:1.7;">This code is your entry pass.<br>Show it at the door or read it aloud to our team.</p>',
      '</td></tr>',
      '</table>',

      '<p style="margin:0;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.8;">Questions? DM us on Instagram: <a href="https://www.instagram.com/thesamaagmsummit.tss" style="color:#00cc66;text-decoration:none;font-weight:bold;">@thesamaagmsummit.tss</a> or reply to this email.</p>',

      '</td></tr>',

      '<tr><td style="background:#0a0a0a;border-top:1px solid #1c1c1c;padding:28px 44px;text-align:center;">',
      '<p style="margin:0;font-style:italic;color:rgba(255,255,255,0.32);font-size:14px;line-height:1.9;">&ldquo;Happiness can be found even in the darkest of times, if one only remembers to turn on the light.&rdquo;</p>',
      '<p style="margin:10px 0 0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#00cc66;text-transform:uppercase;">&mdash; Albus Dumbledore</p>',
      '</td></tr>',

      '<tr><td style="background:#080808;padding:22px 44px 20px;text-align:center;border-top:1px solid #181818;">',
      '<p style="margin:0 0 14px;font-family:\'Courier New\',monospace;font-size:8px;letter-spacing:3px;color:rgba(255,255,255,0.15);text-transform:uppercase;">&lowast; Mischief Managed &middot; Platform 9&frac34; TSS &middot; The Samaagm Summit &lowast;</p>',
      '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 14px;"><tr>',
      '<td style="padding:0 16px;text-align:center;"><p style="margin:0 0 3px;font-family:\'Courier New\',monospace;font-size:8px;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:2px;">Somya Khandare &mdash; CEO</p><a href="tel:+918962092386" style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.30);text-decoration:none;">+91 89620 92386</a></td>',
      '<td style="padding:0 16px;text-align:center;border-left:1px solid #252525;"><p style="margin:0 0 3px;font-family:\'Courier New\',monospace;font-size:8px;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:2px;">Arjav Badjatya &mdash; CMO</p><a href="tel:+919406861126" style="font-family:\'Courier New\',monospace;font-size:10px;color:rgba(255,255,255,0.30);text-decoration:none;">+91 94068 61126</a></td>',
      '</tr></table>',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:1px;">',
      '<a href="https://www.instagram.com/thesamaagmsummit.tss" style="color:rgba(255,255,255,0.28);text-decoration:none;">@thesamaagmsummit.tss</a>',
      ' &nbsp;&middot;&nbsp; ',
      '<a href="mailto:thesamaagmsummit@gmail.com" style="color:rgba(255,255,255,0.28);text-decoration:none;">thesamaagmsummit@gmail.com</a>',
      '</p>',
      '</td></tr>',

      '</table>',
      '</table>',
      '</td></tr>',
      '</table>',
      '</body></html>',
    ].join("\n");

    GmailApp.sendEmail(guestData.email, subject, "", {
      htmlBody: htmlBody,
      name:     "Platform 9\u00be TSS \u00b7 The Samaagm Summit",
      replyTo:  CONFIG.CONTACT_EMAIL,
    });

    Logger.log("AB: Hosted-by ticket email sent to: " + guestData.email + " token: " + token);
  } catch (err) {
    Logger.log("AB sendHostedByTicketEmail error: " + err.toString());
  }
}

/* ═══════════════════════════════════════════════════════════════
   sendHostNotificationEmail — concise notification to the host.
   Identical HTML to TSS.gs. Sends via Arjav's GmailApp account.
   @param {Object} hostData  — { firstName, lastName, fullName, email }
   @param {Object} guestData — { firstName, lastName, email }
   @param {string} tokenId
   ═══════════════════════════════════════════════════════════════ */
function sendHostNotificationEmail(hostData, guestData, tokenId) {
  try {
    var hostName  = hostData.firstName || "there";
    var guestFull = ((guestData.firstName || "") + " " + (guestData.lastName || "")).trim();
    var token     = tokenId || "";
    var subject   = "You hosted " + guestFull + " \u2014 Platform 9\u00be TSS";

    var htmlBody = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
      '<title>Host Notification \u2014 Platform 9\u00be TSS</title></head>',
      '<body style="margin:0;padding:0;background:#0d0d0d;font-family:Georgia,\'Times New Roman\',serif;">',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">',
      '<tr><td align="center">',
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">',

      '<tr><td style="padding:0 0 14px;text-align:center;">',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:5px;color:rgba(255,255,255,0.22);text-transform:uppercase;">The Samaagm Summit &middot; Platform 9&frac34; TSS</p>',
      '</td></tr>',

      '<tr><td style="background:#111111;border-radius:14px;overflow:hidden;border:1px solid #2a2a2a;">',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
      '<tr><td style="background:linear-gradient(160deg,#003300 0%,#005522 55%,#003300 100%);padding:32px 44px 28px;text-align:center;">',
      '<p style="margin:0 0 4px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:6px;color:rgba(255,255,255,0.5);text-transform:uppercase;">Host Notification</p>',
      '<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:36px;font-weight:bold;color:#ffffff;letter-spacing:2px;line-height:1;">Platform&nbsp;9&frac34;</h1>',
      '<div style="width:40px;height:2px;background:#00cc66;margin:0 auto;"></div>',
      '</td></tr>',
      '</table>',

      '<div style="height:3px;background:linear-gradient(90deg,#007733,#00cc66,#00ff88,#00cc66,#007733);"></div>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
      '<tr><td style="padding:32px 44px 28px;">',

      '<p style="margin:0 0 6px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:5px;color:#00cc66;text-transform:uppercase;">\u2713 Entry confirmed</p>',
      '<p style="margin:0 0 20px;font-size:24px;font-weight:bold;color:#ffffff;line-height:1.2;">Hey, ' + hostName + '.</p>',
      '<p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.85;">',
      'Just confirming \u2014 you hosted <strong style="color:#ffffff;">' + guestFull + '</strong> for <span style="color:#00cc66;font-weight:bold;">Platform 9\u00be TSS</span>. ',
      'Their ticket has been sent to <strong style="color:#ffffff;">' + (guestData.email || "") + '</strong>.',
      '</p>',

      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #005522;border-radius:10px;overflow:hidden;">',
      '<tr><td style="background:#0d1f0d;padding:12px 22px 10px;border-bottom:1px solid #1a3a1a;">',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#00cc66;text-transform:uppercase;font-weight:bold;">Guest Entry Token</p>',
      '</td></tr>',
      '<tr><td style="padding:20px 22px;background:#0a1a0a;text-align:center;">',
      '<p style="margin:0 0 6px;font-family:\'Courier New\',monospace;font-size:22px;color:#00ff88;letter-spacing:5px;font-weight:bold;">' + token + '</p>',
      '<p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6;">This is ' + guestFull + '\'s unique entry token.</p>',
      '</td></tr>',
      '</table>',

      '<p style="margin:0;font-size:13px;color:rgba(255,255,255,0.40);line-height:1.8;">Questions? DM us on Instagram: <a href="https://www.instagram.com/thesamaagmsummit.tss" style="color:#00cc66;text-decoration:none;font-weight:bold;">@thesamaagmsummit.tss</a></p>',

      '</td></tr>',
      '</table>',

      '<tr><td style="background:#0a0a0a;border-top:1px solid #1c1c1c;padding:22px 44px;text-align:center;">',
      '<p style="margin:0;font-style:italic;color:rgba(255,255,255,0.32);font-size:13px;line-height:1.9;">&ldquo;It does not do to dwell on dreams and forget to live.&rdquo;</p>',
      '<p style="margin:8px 0 0;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:4px;color:#00cc66;text-transform:uppercase;">&mdash; Albus Dumbledore</p>',
      '</td></tr>',

      '<tr><td style="background:#080808;padding:18px 44px 16px;text-align:center;border-top:1px solid #181818;">',
      '<p style="margin:0 0 10px;font-family:\'Courier New\',monospace;font-size:8px;letter-spacing:3px;color:rgba(255,255,255,0.15);text-transform:uppercase;">&lowast; Mischief Managed &middot; Platform 9&frac34; TSS &middot; The Samaagm Summit &lowast;</p>',
      '<p style="margin:0;font-family:\'Courier New\',monospace;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:1px;">',
      '<a href="https://www.instagram.com/thesamaagmsummit.tss" style="color:rgba(255,255,255,0.28);text-decoration:none;">@thesamaagmsummit.tss</a>',
      ' &nbsp;&middot;&nbsp; ',
      '<a href="mailto:thesamaagmsummit@gmail.com" style="color:rgba(255,255,255,0.28);text-decoration:none;">thesamaagmsummit@gmail.com</a>',
      '</p>',
      '</td></tr>',

      '</table>',
      '</td></tr>',
      '</table>',
      '</body></html>',
    ].join("\n");

    GmailApp.sendEmail(hostData.email, subject, "", {
      htmlBody: htmlBody,
      name:     "Platform 9\u00be TSS \u00b7 The Samaagm Summit",
      replyTo:  CONFIG.CONTACT_EMAIL,
    });

    Logger.log("AB: Host notification email sent to: " + hostData.email);
  } catch (err) {
    Logger.log("AB sendHostNotificationEmail error: " + err.toString());
  }
}

/* ── abRespond — JSON response helper ── */
function abRespond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
