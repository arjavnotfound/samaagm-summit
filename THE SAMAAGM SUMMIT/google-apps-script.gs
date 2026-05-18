/**
 * ═══════════════════════════════════════════════════════════════
 *  PLATFORM 9¾ TSS — Google Apps Script Backend
 *  The Samaagm Summit · Registration Handler
 * ═══════════════════════════════════════════════════════════════
 *
 *  SETUP INSTRUCTIONS:
 *  ───────────────────
 *  1. Open your Google Sheet (or create a new one).
 *  2. Go to Extensions → Apps Script.
 *  3. Delete any existing code and paste this entire file.
 *  4. Click Save, then click Deploy → New Deployment.
 *  5. Choose type: Web App.
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  6. Click Deploy and copy the Web App URL.
 *  7. Paste that URL as the SCRIPT_URL in Register.tsx and devApi.ts.
 *
 *  SHEET LAYOUT:
 *  ─────────────
 *  Section 1 — Registration Data (dark red header)
 *    Timestamp · First Name · Last Name · Full Name · Phone · Email ·
 *    School/College · Grade/Year · MUN Experience · MUNs Attended ·
 *    Potterhead? · Note · Payment Screenshot
 *
 *  Section 2 — Workflow (navy header, visually separate)
 *    Referral · Status
 *
 *  Section 3 — Token / Approval (deep purple header)
 *    Token ID · Approved At
 */

/* ── Configuration ── */
var CONFIG = {
  SHEET_NAME: "Registrations",
  DRIVE_FOLDER: "Platform934_Payments",
  SEND_CONFIRMATION_EMAIL: true,
  EVENT_NAME: "Platform 9¾ TSS",
  EVENT_DATE: "12 April 2026",
  EVENT_TIME: "4:00 PM – 8:00 PM IST",
  EVENT_VENUE: "Underdoggs, High Street Apollo, Indore",
  CONTACT_EMAIL: "thesamaagmsummit@gmail.com",
};

/* ── SECRET KEY for Token ID generation ──
   Arjav: change this string before going live. */
var SECRET_KEY = "TSS-P934-2026-INTERNAL";

/* ── Section 1: Registration data columns ── */
var COLUMNS_DATA = [
  "Timestamp",
  "First Name",
  "Last Name",
  "Full Name",
  "Phone",
  "Email",
  "School / College",
  "Grade / Year",
  "MUN Experience",
  "MUNs Attended",
  "Potterhead?",
  "Note",
  "Payment Screenshot",
];

/* ── Section 2: Workflow / ops columns ── */
var COLUMNS_WORKFLOW = [
  "Referral",
  "Status",
];

/* ── Section 3: Token / Approval columns ── */
var COLUMNS_SECTION3 = [
  "Token ID",
  "Approved At",
];

/* ── Section 4: Special Ticket columns ── */
var COLUMNS_SECTION4 = [
  "Is Special",
  "Ticket Type",
  "Hosted By Email",
  "Hosted By Row",
  "Special Note",
];

var COLUMNS = COLUMNS_DATA.concat(COLUMNS_WORKFLOW).concat(COLUMNS_SECTION3).concat(COLUMNS_SECTION4);

/* ═══════════════════════════════════════════════════════════════
   doGet — health check or fetch registrations
   ═══════════════════════════════════════════════════════════════ */
function doGet(e) {
  try {
    var action = e && e.parameter && e.parameter.action;
    if (action === "getRegistrations") {
      return handleGetRegistrations();
    }
    if (action === "getSetting") {
      return handleGetSettingAction((e.parameter && e.parameter.key) || "");
    }
    if (action === "verifyToken") {
      return handleVerifyToken((e.parameter && e.parameter.tokenId) || "");
    }
    if (action === "getEntryLog") {
      return handleGetEntryLog();
    }
    if (action === "getComplimentary") {
      return handleGetComplimentary();
    }
    if (action === "getOnSpotRegistrations") {
      return handleGetOnSpotRegistrations();
    }
    return jsonResponse({
      status: "ok",
      event: CONFIG.EVENT_NAME,
      date: CONFIG.EVENT_DATE,
      message: "Platform 9¾ TSS registration endpoint is live.",
    });
  } catch (err) {
    Logger.log("doGet error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   doPost — routes by action field, or handles new registration
   ═══════════════════════════════════════════════════════════════ */
function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : "";
    if (!raw) {
      return jsonResponse({ success: false, error: "Empty request body." });
    }

    var data = JSON.parse(raw);

    /* Route developer actions */
    if (data.action === "approveRegistration") return handleApproveRegistrationAction(data);
    if (data.action === "resendEmail")          return handleResendEmailAction(data);
    if (data.action === "bulkApprove")          return handleBulkApproveAction(data);
    if (data.action === "manualRegister")       return handleManualRegisterAction(data);
    if (data.action === "getSetting")           return handleGetSettingAction(data.key || "");
    if (data.action === "setSetting")           return handleSetSettingAction(data);
    if (data.action === "sendEmail")            return handleSendEmailAction(data);

    /* Route entry-app actions */
    if (data.action === "confirmEntry")         return handleConfirmEntry(data);
    if (data.action === "manualCheckIn")        return handleManualCheckIn(data);
    if (data.action === "onSpotRegister")       return handleOnSpotRegister(data);

    /* ─── Existing new-registration flow ─── */

    /* 0. Duplicate check — reject if email already registered */
    var dupCheck = checkDuplicate(data.email);
    if (dupCheck.isDuplicate) {
      return jsonResponse({
        success: false,
        duplicate: true,
        message: dupCheck.message,
      });
    }

    /* 1. Save screenshot to Google Drive */
    var screenshotUrl = "";
    if (data.screenshotBase64 && data.screenshotBase64.length > 0) {
      screenshotUrl = saveScreenshotToDrive(
        data.screenshotBase64,
        data.screenshotMimeType || "image/jpeg",
        data.screenshotFileName || ("payment_" + Date.now())
      );
    }

    /* 2. Write row to Google Sheet */
    writeToSheet(data, screenshotUrl);

    return jsonResponse({
      success:   true,
      message:   "Registration recorded.",
      firstName: data.firstName || "",
      lastName:  data.lastName  || "",
      email:     (data.email || "").toLowerCase().trim(),
    });

  } catch (err) {
    Logger.log("doPost error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   handleGetRegistrations — returns all rows as JSON
   ═══════════════════════════════════════════════════════════════ */
function handleGetRegistrations() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet || sheet.getLastRow() <= 1) {
      return jsonResponse([]);
    }

    /* Ensure Section 3 and 4 columns exist before reading */
    ensureSection3Columns(sheet);
    ensureSection4Columns(sheet);

    /* Read actual header row to determine column positions dynamically */
    var colMap = getSheetColumnMap(sheet);

    var allValues = sheet.getDataRange().getValues();
    var result = [];

    for (var i = 1; i < allValues.length; i++) {
      var row = allValues[i];
      var approvedAtRaw = colMap["Approved At"] !== undefined ? row[colMap["Approved At"]] : "";
      var approvedAtStr = "";
      if (approvedAtRaw) {
        try { approvedAtStr = new Date(approvedAtRaw).toISOString(); } catch(x) { approvedAtStr = approvedAtRaw.toString(); }
      }
      result.push({
        rowIndex:      i + 1,
        firstName:     safeStr(row, colMap, "First Name"),
        lastName:      safeStr(row, colMap, "Last Name"),
        fullName:      safeStr(row, colMap, "Full Name"),
        email:         safeStr(row, colMap, "Email"),
        phone:         safeStr(row, colMap, "Phone"),
        school:        safeStr(row, colMap, "School / College"),
        grade:         safeStr(row, colMap, "Grade / Year"),
        munExp:        safeStr(row, colMap, "MUN Experience"),
        munsAttended:  safeStr(row, colMap, "MUNs Attended"),
        potterhead:    safeStr(row, colMap, "Potterhead?"),
        note:          safeStr(row, colMap, "Note"),
        screenshotUrl: safeStr(row, colMap, "Payment Screenshot"),
        referral:      safeStr(row, colMap, "Referral"),
        status:        safeStr(row, colMap, "Status"),
        tokenId:       safeStr(row, colMap, "Token ID"),
        approvedAt:    approvedAtStr,
        isSpecial:     safeStr(row, colMap, "Is Special"),
        ticketType:    safeStr(row, colMap, "Ticket Type"),
        hostedByEmail: safeStr(row, colMap, "Hosted By Email"),
        hostedByRow:   safeStr(row, colMap, "Hosted By Row"),
        specialNote:   safeStr(row, colMap, "Special Note"),
      });
    }

    return jsonResponse(result);
  } catch (err) {
    Logger.log("handleGetRegistrations error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   handleApproveRegistrationAction — called via doPost
   ═══════════════════════════════════════════════════════════════ */
function handleApproveRegistrationAction(data) {
  try {
    var rowIndex = parseInt(data.rowIndex, 10);
    if (!rowIndex || isNaN(rowIndex)) return jsonResponse({ success: false, error: "Invalid rowIndex." });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return jsonResponse({ success: false, error: "Sheet not found." });

    ensureSection3Columns(sheet);
    var colMap = getSheetColumnMap(sheet);

    var email     = sheet.getRange(rowIndex, colMap["Email"] + 1).getValue();
    var firstName = sheet.getRange(rowIndex, colMap["First Name"] + 1).getValue();
    var lastName  = sheet.getRange(rowIndex, colMap["Last Name"] + 1).getValue();

    if (!email) return jsonResponse({ success: false, error: "No email found at row " + rowIndex });

    var tokenId    = generateTokenId(email, rowIndex);
    var approvedAt = new Date();

    /* Write Token ID and Approved At */
    sheet.getRange(rowIndex, colMap["Token ID"] + 1).setValue(tokenId);
    sheet.getRange(rowIndex, colMap["Approved At"] + 1).setValue(approvedAt);

    /* Update Status */
    var statusCell = sheet.getRange(rowIndex, colMap["Status"] + 1);
    statusCell.setValue("Reviewed");
    statusCell.setFontColor("#1b7a3b");
    statusCell.setFontWeight("bold");
    statusCell.setBackground("#c8e6c9");

    /* Light green tint on the row */
    var totalCols = sheet.getLastColumn();
    sheet.getRange(rowIndex, 1, 1, totalCols).setBackground("#e8f5e9");

    Logger.log("Approved via API: " + email + " row " + rowIndex + " token " + tokenId);

    return jsonResponse({
      success:   true,
      tokenId:   tokenId,
      approvedAt: approvedAt.toISOString(),
      firstName: firstName.toString(),
      lastName:  lastName.toString(),
      email:     email.toString(),
    });
  } catch (err) {
    Logger.log("handleApproveRegistrationAction error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   handleResendEmailAction — called via doPost
   ═══════════════════════════════════════════════════════════════ */
function handleResendEmailAction(data) {
  try {
    var rowIndex = parseInt(data.rowIndex, 10);
    if (!rowIndex || isNaN(rowIndex)) return jsonResponse({ success: false, error: "Invalid rowIndex." });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return jsonResponse({ success: false, error: "Sheet not found." });

    ensureSection3Columns(sheet);
    var colMap = getSheetColumnMap(sheet);

    var email     = sheet.getRange(rowIndex, colMap["Email"] + 1).getValue();
    var firstName = sheet.getRange(rowIndex, colMap["First Name"] + 1).getValue();
    var lastName  = sheet.getRange(rowIndex, colMap["Last Name"] + 1).getValue();
    var tokenId   = sheet.getRange(rowIndex, colMap["Token ID"] + 1).getValue();

    if (!email)   return jsonResponse({ success: false, error: "No email at row " + rowIndex });
    if (!tokenId) return jsonResponse({ success: false, error: "No token at row " + rowIndex + ". Approve first." });

    Logger.log("Resent approval email to: " + email + " (row " + rowIndex + ")");
    return jsonResponse({
      success:  true,
      tokenId:  tokenId.toString(),
      firstName: firstName.toString(),
      lastName:  lastName.toString(),
      email:     email.toString(),
    });
  } catch (err) {
    Logger.log("handleResendEmailAction error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   handleBulkApproveAction — called via doPost
   ═══════════════════════════════════════════════════════════════ */
function handleBulkApproveAction(data) {
  try {
    var rowIndexes = data.rowIndexes;
    if (!Array.isArray(rowIndexes) || rowIndexes.length === 0) {
      return jsonResponse({ success: false, error: "No rowIndexes provided." });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return jsonResponse({ success: false, error: "Sheet not found." });

    ensureSection3Columns(sheet);
    var colMap = getSheetColumnMap(sheet);

    var results = [];

    for (var i = 0; i < rowIndexes.length; i++) {
      var rowIndex = parseInt(rowIndexes[i], 10);
      if (!rowIndex || isNaN(rowIndex)) continue;

      try {
        var email     = sheet.getRange(rowIndex, colMap["Email"] + 1).getValue();
        var firstName = sheet.getRange(rowIndex, colMap["First Name"] + 1).getValue();
        var lastName  = sheet.getRange(rowIndex, colMap["Last Name"] + 1).getValue();
        var existingStatus = sheet.getRange(rowIndex, colMap["Status"] + 1).getValue();

        if (!email) continue;
        /* Skip if already reviewed */
        if (existingStatus === "Reviewed") {
          var existingToken = sheet.getRange(rowIndex, colMap["Token ID"] + 1).getValue();
          var existingAt    = sheet.getRange(rowIndex, colMap["Approved At"] + 1).getValue();
          results.push({ rowIndex: rowIndex, tokenId: existingToken.toString(), approvedAt: existingAt ? new Date(existingAt).toISOString() : "" });
          continue;
        }

        var tokenId    = generateTokenId(email, rowIndex);
        var approvedAt = new Date();

        sheet.getRange(rowIndex, colMap["Token ID"] + 1).setValue(tokenId);
        sheet.getRange(rowIndex, colMap["Approved At"] + 1).setValue(approvedAt);

        var statusCell = sheet.getRange(rowIndex, colMap["Status"] + 1);
        statusCell.setValue("Reviewed");
        statusCell.setFontColor("#1b7a3b");
        statusCell.setFontWeight("bold");
        statusCell.setBackground("#c8e6c9");

        var totalCols = sheet.getLastColumn();
        sheet.getRange(rowIndex, 1, 1, totalCols).setBackground("#e8f5e9");

        results.push({ rowIndex: rowIndex, tokenId: tokenId, approvedAt: approvedAt.toISOString(), firstName: firstName.toString(), lastName: lastName.toString(), email: email.toString() });
        Logger.log("Bulk approved: " + email + " row " + rowIndex);
      } catch (rowErr) {
        Logger.log("Bulk approve error at row " + rowIndex + ": " + rowErr.toString());
      }
    }

    return jsonResponse({ success: true, results: results });
  } catch (err) {
    Logger.log("handleBulkApproveAction error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   generateTokenId — P934-{YEAR}-{ROW_PADDED}-{HMAC_SUFFIX}
   Example: P934-2026-042-A7KX
   ═══════════════════════════════════════════════════════════════ */
function generateTokenId(email, rowIndex) {
  var year       = new Date().getFullYear();
  var rowPadded  = String(rowIndex).padStart(3, "0");
  var input      = email + "|" + rowIndex + "|" + SECRET_KEY;
  var digest     = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input);
  var hex        = "";
  for (var i = 0; i < 3; i++) {
    var b = digest[i] < 0 ? digest[i] + 256 : digest[i];
    hex += ("0" + b.toString(16)).slice(-2).toUpperCase();
  }
  var suffix = hex.slice(0, 4);
  return "P934-" + year + "-" + rowPadded + "-" + suffix;
}

/* ═══════════════════════════════════════════════════════════════
   ensureSection3Columns — adds Token ID and Approved At headers
   if they are missing. Safe to call multiple times.
   ═══════════════════════════════════════════════════════════════ */
function ensureSection3Columns(sheet) {
  if (!sheet || sheet.getLastRow() === 0) return;
  var lastCol = sheet.getLastColumn();
  var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var hasTokenId    = headerRow.indexOf("Token ID") !== -1;
  var hasApprovedAt = headerRow.indexOf("Approved At") !== -1;
  if (hasTokenId && hasApprovedAt) return;

  var nextCol = lastCol + 1;

  if (!hasTokenId) {
    var tokenHeader = sheet.getRange(1, nextCol, 1, 1);
    tokenHeader.setValue("Token ID");
    tokenHeader.setFontWeight("bold");
    tokenHeader.setFontColor("#ffffff");
    tokenHeader.setBackground("#1a0033");
    tokenHeader.setFontFamily("Arial");
    tokenHeader.setFontSize(10);
    tokenHeader.setHorizontalAlignment("center");
    tokenHeader.setVerticalAlignment("middle");
    tokenHeader.setNote("SECTION 3 — Token / Approval");
    nextCol++;
  }

  if (!hasApprovedAt) {
    var atHeader = sheet.getRange(1, nextCol, 1, 1);
    atHeader.setValue("Approved At");
    atHeader.setFontWeight("bold");
    atHeader.setFontColor("#ffffff");
    atHeader.setBackground("#1a0033");
    atHeader.setFontFamily("Arial");
    atHeader.setFontSize(10);
    atHeader.setHorizontalAlignment("center");
    atHeader.setVerticalAlignment("middle");
    nextCol++;
  }

  sheet.setRowHeight(1, 40);
  Logger.log("Section 3 columns ensured.");
}

/* ═══════════════════════════════════════════════════════════════
   ensureSection4Columns — adds Section 4 (Special Ticket) headers
   if missing. Safe to call multiple times.
   ═══════════════════════════════════════════════════════════════ */
function ensureSection4Columns(sheet) {
  if (!sheet || sheet.getLastRow() === 0) return;
  var lastCol   = sheet.getLastColumn();
  var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var headers = COLUMNS_SECTION4;
  var allExist = headers.every(function(h) { return headerRow.indexOf(h) !== -1; });
  if (allExist) return;

  var nextCol = lastCol + 1;

  for (var i = 0; i < headers.length; i++) {
    var colName = headers[i];
    if (headerRow.indexOf(colName) === -1) {
      var cell = sheet.getRange(1, nextCol, 1, 1);
      cell.setValue(colName);
      cell.setFontWeight("bold");
      cell.setFontColor("#ffffff");
      cell.setBackground("#7a5c00");
      cell.setFontFamily("Arial");
      cell.setFontSize(10);
      cell.setHorizontalAlignment("center");
      cell.setVerticalAlignment("middle");
      cell.setNote("SECTION 4 — Special Ticket");
      nextCol++;
    }
  }

  sheet.setRowHeight(1, 40);
  Logger.log("Section 4 columns ensured.");
}

/* ═══════════════════════════════════════════════════════════════
   handleManualRegisterAction — manual registration with auto-approval
   ═══════════════════════════════════════════════════════════════ */
function handleManualRegisterAction(data) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      formatSheetHeader(sheet);
    }

    /* 1. Duplicate check (unless bypassed) */
    if (!data.bypassDuplicateEmail) {
      var dupCheck = checkDuplicate(data.email);
      if (dupCheck.isDuplicate) {
        return jsonResponse({ success: false, error: dupCheck.message });
      }
    }

    /* 2. Upload screenshot to Drive if provided */
    var screenshotUrl = "";
    if (data.screenshotBase64 && data.screenshotBase64.length > 0) {
      screenshotUrl = saveScreenshotToDrive(
        data.screenshotBase64,
        data.screenshotMimeType || "image/jpeg",
        data.screenshotFileName || ("payment_" + Date.now())
      );
    }

    /* 3. Write main row to sheet */
    writeToSheet(data, screenshotUrl);

    /* 4. Refresh colMap after writeToSheet (ensures sections exist) */
    ensureSection3Columns(sheet);
    ensureSection4Columns(sheet);
    var colMap   = getSheetColumnMap(sheet);
    var rowIndex = sheet.getLastRow();

    /* 5. Write Section 4 data */
    var ticketType    = data.ticketType || "";
    var isSpecial     = (ticketType !== "") ? "TRUE" : "";
    var hostedByEmail = data.hostedByEmail || "";
    var hostedByRow   = data.hostedByRow   || "";
    var specialNote   = data.specialNote   || "";

    if (colMap["Is Special"] !== undefined)
      sheet.getRange(rowIndex, colMap["Is Special"] + 1).setValue(isSpecial);
    if (colMap["Ticket Type"] !== undefined)
      sheet.getRange(rowIndex, colMap["Ticket Type"] + 1).setValue(ticketType);
    if (colMap["Hosted By Email"] !== undefined)
      sheet.getRange(rowIndex, colMap["Hosted By Email"] + 1).setValue(hostedByEmail);
    if (colMap["Hosted By Row"] !== undefined)
      sheet.getRange(rowIndex, colMap["Hosted By Row"] + 1).setValue(hostedByRow);
    if (colMap["Special Note"] !== undefined)
      sheet.getRange(rowIndex, colMap["Special Note"] + 1).setValue(specialNote);

    /* 6. Immediately approve */
    var email     = (data.email || "").toLowerCase().trim();
    var firstName = data.firstName || "";
    var lastName  = data.lastName  || "";
    var tokenId   = generateTokenId(email, rowIndex);
    var approvedAt = new Date();

    if (colMap["Token ID"] !== undefined)
      sheet.getRange(rowIndex, colMap["Token ID"] + 1).setValue(tokenId);
    if (colMap["Approved At"] !== undefined)
      sheet.getRange(rowIndex, colMap["Approved At"] + 1).setValue(approvedAt);

    /* Update status */
    var statusCell = sheet.getRange(rowIndex, colMap["Status"] + 1);
    statusCell.setValue("Reviewed");
    statusCell.setFontColor("#1b7a3b");
    statusCell.setFontWeight("bold");
    statusCell.setBackground("#c8e6c9");

    /* Tint row green */
    var totalCols = sheet.getLastColumn();
    sheet.getRange(rowIndex, 1, 1, totalCols).setBackground("#e8f5e9");

    /* 7. Look up host data if needed (returned in payload for frontend to send email) */
    var hostFirst = "";
    var hostLast  = "";
    if (ticketType === "Hosted By" && hostedByRow && hostedByEmail) {
      var hostRowNum = parseInt(hostedByRow, 10);
      if (!isNaN(hostRowNum) && hostRowNum > 1) {
        hostFirst = sheet.getRange(hostRowNum, colMap["First Name"] + 1).getValue() || "";
        hostLast  = sheet.getRange(hostRowNum, colMap["Last Name"]  + 1).getValue() || "";
      }
    }

    Logger.log("Manual registration approved: " + email + " row " + rowIndex + " token " + tokenId);
    return jsonResponse({
      success:       true,
      tokenId:       tokenId,
      approvedAt:    approvedAt.toISOString(),
      firstName:     firstName,
      lastName:      lastName,
      email:         email,
      ticketType:    ticketType,
      hostFirstName: hostFirst,
      hostLastName:  hostLast,
      hostFullName:  (hostFirst + " " + hostLast).trim(),
      hostEmail:     hostedByEmail,
    });

  } catch (err) {
    Logger.log("handleManualRegisterAction error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   removeLegacyApproveColumn — one-time migration.
   Finds and deletes the old "Approve ✅" column by header name.
   Run this once manually if the live sheet has the legacy column.
   ═══════════════════════════════════════════════════════════════ */
function removeLegacyApproveColumn() {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) { Logger.log("Sheet not found."); return; }

    var lastCol   = sheet.getLastColumn();
    var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var colIdx    = headerRow.indexOf("Approve ✅");

    if (colIdx === -1) {
      Logger.log("Legacy 'Approve ✅' column not found — nothing to do.");
      return;
    }

    sheet.deleteColumn(colIdx + 1);
    Logger.log("Deleted legacy 'Approve ✅' column at index " + (colIdx + 1));
  } catch (err) {
    Logger.log("removeLegacyApproveColumn error: " + err.toString());
  }
}

/* ═══════════════════════════════════════════════════════════════
   getSheetColumnMap — returns a map of header name → 0-based col index
   ═══════════════════════════════════════════════════════════════ */
function getSheetColumnMap(sheet) {
  var lastCol   = sheet.getLastColumn();
  var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map       = {};
  for (var i = 0; i < headerRow.length; i++) {
    var header = headerRow[i] ? headerRow[i].toString().trim() : "";
    if (header) map[header] = i;
  }
  return map;
}

/* ═══════════════════════════════════════════════════════════════
   safeStr — safely reads a string value by column name from a row
   ═══════════════════════════════════════════════════════════════ */
function safeStr(row, colMap, colName) {
  var idx = colMap[colName];
  if (idx === undefined) return "";
  var val = row[idx];
  if (val === null || val === undefined) return "";
  return val.toString();
}

/* ═══════════════════════════════════════════════════════════════
   checkDuplicate — checks if email already exists
   ═══════════════════════════════════════════════════════════════ */
function checkDuplicate(email) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet || sheet.getLastRow() <= 1) {
      return { isDuplicate: false };
    }

    var data = sheet.getDataRange().getValues();
    var emailCol = 5;  /* 0-indexed: Email is column F (index 5) */

    var normalizedEmail = (email || "").toLowerCase().trim();

    for (var i = 1; i < data.length; i++) {
      var rowEmail = (data[i][emailCol] || "").toString().toLowerCase().trim();
      if (normalizedEmail && rowEmail === normalizedEmail) {
        return {
          isDuplicate: true,
          message: "This email address is already registered. Each person can only register once.",
        };
      }
    }

    return { isDuplicate: false };
  } catch (err) {
    Logger.log("checkDuplicate error: " + err.toString());
    return { isDuplicate: false };
  }
}

/* ═══════════════════════════════════════════════════════════════
   saveScreenshotToDrive
   ═══════════════════════════════════════════════════════════════ */
function saveScreenshotToDrive(base64String, mimeType, fileName) {
  try {
    var folder = getOrCreateFolder(CONFIG.DRIVE_FOLDER);
    var extension = mimeType === "application/pdf" ? ".pdf" : ".jpg";
    var fullName = fileName + extension;

    var decoded = Utilities.base64Decode(base64String);
    var blob = Utilities.newBlob(decoded, mimeType, fullName);
    var file = folder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log("saveScreenshotToDrive error: " + err.toString());
    return "Upload failed: " + err.toString();
  }
}

/* ═══════════════════════════════════════════════════════════════
   getOrCreateFolder
   ═══════════════════════════════════════════════════════════════ */
function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  var newFolder = DriveApp.createFolder(folderName);
  Logger.log("Created Drive folder: " + folderName);
  return newFolder;
}

/* ═══════════════════════════════════════════════════════════════
   writeToSheet — writes a new registration row.
   Section 3 (Token ID, Approved At) is left blank on registration.
   ═══════════════════════════════════════════════════════════════ */
function writeToSheet(data, screenshotUrl) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    formatSheetHeader(sheet);
  } else if (sheet.getLastRow() === 0) {
    formatSheetHeader(sheet);
  } else {
    /* Ensure Section 3 and 4 exist on existing sheets */
    ensureSection3Columns(sheet);
    ensureSection4Columns(sheet);
  }

  var fullName  = (data.firstName || "") + " " + (data.lastName || "");
  var timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
  var emailNormalized = (data.email || "").toLowerCase().trim();

  var row = [
    timestamp,
    data.firstName || "",
    data.lastName || "",
    fullName.trim(),
    data.phone || "",
    emailNormalized,
    data.school || "",
    data.grade || "",
    formatMunExp(data.munExp),
    data.munCount || "—",
    data.potterhead || "—",
    data.note || "—",
    screenshotUrl ? '=HYPERLINK("' + screenshotUrl + '","📷 View")' : "Not provided",
    data.referral || "—",
    "Pending Review",
    /* Section 3 — Token ID and Approved At left blank */
    "",
    "",
    /* Section 4 — Special Ticket left blank for normal registrations */
    "",
    "",
    "",
    "",
    "",
  ];

  sheet.appendRow(row);

  /* Style the new data row */
  var newRowIndex = sheet.getLastRow();
  var totalCols   = sheet.getLastColumn();

  /* Status cell — amber pending style */
  var colMap     = getSheetColumnMap(sheet);
  var statusCol  = colMap["Status"] + 1;
  var statusCell = sheet.getRange(newRowIndex, statusCol);
  statusCell.setFontColor("#f0c060");
  statusCell.setFontWeight("bold");

  sheet.autoResizeColumns(1, totalCols);
}

/* ═══════════════════════════════════════════════════════════════
   formatSheetHeader — called on new sheet creation
   ═══════════════════════════════════════════════════════════════ */
function formatSheetHeader(sheet) {
  sheet.appendRow(COLUMNS);

  var numData     = COLUMNS_DATA.length;
  var numWorkflow = COLUMNS_WORKFLOW.length;
  var numSection3 = COLUMNS_SECTION3.length;
  var numSection4 = COLUMNS_SECTION4.length;

  /* Section 1 — dark red */
  var sec1 = sheet.getRange(1, 1, 1, numData);
  sec1.setFontWeight("bold");
  sec1.setFontColor("#ffffff");
  sec1.setBackground("#7a0000");
  sec1.setFontFamily("Arial");
  sec1.setFontSize(10);
  sec1.setHorizontalAlignment("center");
  sec1.setVerticalAlignment("middle");
  sec1.setBorder(null, null, true, null, null, null, "#ffffff", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  /* Section 2 — navy */
  var sec2 = sheet.getRange(1, numData + 1, 1, numWorkflow);
  sec2.setFontWeight("bold");
  sec2.setFontColor("#ffffff");
  sec2.setBackground("#1a3a5c");
  sec2.setFontFamily("Arial");
  sec2.setFontSize(10);
  sec2.setHorizontalAlignment("center");
  sec2.setVerticalAlignment("middle");

  /* Section 3 — deep purple/indigo */
  var sec3 = sheet.getRange(1, numData + numWorkflow + 1, 1, numSection3);
  sec3.setFontWeight("bold");
  sec3.setFontColor("#ffffff");
  sec3.setBackground("#1a0033");
  sec3.setFontFamily("Arial");
  sec3.setFontSize(10);
  sec3.setHorizontalAlignment("center");
  sec3.setVerticalAlignment("middle");

  /* Section 4 — gold/amber */
  var sec4 = sheet.getRange(1, numData + numWorkflow + numSection3 + 1, 1, numSection4);
  sec4.setFontWeight("bold");
  sec4.setFontColor("#ffffff");
  sec4.setBackground("#7a5c00");
  sec4.setFontFamily("Arial");
  sec4.setFontSize(10);
  sec4.setHorizontalAlignment("center");
  sec4.setVerticalAlignment("middle");

  /* Left border on Section 2 */
  sheet.getRange(1, numData + 1, sheet.getMaxRows(), 1)
    .setBorder(null, true, null, null, null, null, "#1a3a5c", SpreadsheetApp.BorderStyle.SOLID_THICK);

  /* Left border on Section 3 */
  sheet.getRange(1, numData + numWorkflow + 1, sheet.getMaxRows(), 1)
    .setBorder(null, true, null, null, null, null, "#1a0033", SpreadsheetApp.BorderStyle.SOLID_THICK);

  /* Left border on Section 4 */
  sheet.getRange(1, numData + numWorkflow + numSection3 + 1, sheet.getMaxRows(), 1)
    .setBorder(null, true, null, null, null, null, "#7a5c00", SpreadsheetApp.BorderStyle.SOLID_THICK);

  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);

  sheet.getRange(1, 1).setNote("SECTION 1 — Registration Data");
  sheet.getRange(1, numData + 1).setNote("SECTION 2 — Workflow / Ops");
  sheet.getRange(1, numData + numWorkflow + 1).setNote("SECTION 3 — Token / Approval");
  sheet.getRange(1, numData + numWorkflow + numSection3 + 1).setNote("SECTION 4 — Special Ticket");

  Logger.log("Sheet header formatted with 4-section design.");
}

/* ═══════════════════════════════════════════════════════════════
   sendConfirmationEmail — premium HP-themed design (unchanged)
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

    Logger.log("Confirmation email sent to: " + data.email);
  } catch (err) {
    Logger.log("sendConfirmationEmail error: " + err.toString());
  }
}

/* ═══════════════════════════════════════════════════════════════
   onEdit — kept for backward compatibility. No longer drives
   approvals (Developer Panel handles that now). Safe no-op if
   "Approve ✅" column doesn't exist.
   ═══════════════════════════════════════════════════════════════ */
function onEdit(e) {
  try {
    var sheet = e.range.getSheet();
    if (sheet.getName() !== CONFIG.SHEET_NAME) return;

    var colMap     = getSheetColumnMap(sheet);
    var approveIdx = colMap["Approve \u2705"];
    if (approveIdx === undefined) return; /* Column removed — do nothing */

    var approveCol = approveIdx + 1;
    var statusCol  = colMap["Status"] + 1;
    var editedCol  = e.range.getColumn();
    var editedRow  = e.range.getRow();

    if (editedCol !== approveCol) return;
    if (editedRow <= 1)           return;
    if (e.value !== "TRUE")       return;

    var statusCell = sheet.getRange(editedRow, statusCol);
    if (statusCell.getValue() === "Reviewed") {
      e.range.setValue(false);
      return;
    }

    approveRegistration(sheet, editedRow, statusCol, approveCol);
  } catch (err) {
    Logger.log("onEdit error: " + err.toString());
  }
}

/* ═══════════════════════════════════════════════════════════════
   approveRegistration — internal helper (used by onEdit).
   For API approvals, use handleApproveRegistrationAction instead.
   ═══════════════════════════════════════════════════════════════ */
function approveRegistration(sheet, rowIndex, statusCol, approveCol) {
  var colMap       = getSheetColumnMap(sheet);
  var firstNameCol = colMap["First Name"] + 1;
  var lastNameCol  = colMap["Last Name"]  + 1;
  var emailCol     = colMap["Email"]      + 1;

  var firstName = sheet.getRange(rowIndex, firstNameCol).getValue();
  var lastName  = sheet.getRange(rowIndex, lastNameCol).getValue();
  var email     = sheet.getRange(rowIndex, emailCol).getValue();

  if (!email) {
    Logger.log("approveRegistration: no email found at row " + rowIndex);
    return;
  }

  var statusCell = sheet.getRange(rowIndex, statusCol);
  statusCell.setValue("Reviewed");
  statusCell.setFontColor("#1b7a3b");
  statusCell.setFontWeight("bold");
  statusCell.setBackground("#c8e6c9");

  var totalCols = sheet.getLastColumn();
  sheet.getRange(rowIndex, 1, 1, totalCols - 1).setBackground("#e8f5e9");

  var approveCell = sheet.getRange(rowIndex, approveCol);
  approveCell.clearContent();
  approveCell.removeCheckboxes();
  approveCell.setValue("✅ Done");
  approveCell.setFontColor("#1b7a3b");
  approveCell.setFontSize(10);
  approveCell.setHorizontalAlignment("center");
  approveCell.setBackground("#e8f5e9");

  var tokenId = generateTokenId(email, rowIndex);

  ensureSection3Columns(sheet);
  var updatedColMap = getSheetColumnMap(sheet);
  if (updatedColMap["Token ID"] !== undefined) {
    sheet.getRange(rowIndex, updatedColMap["Token ID"] + 1).setValue(tokenId);
    sheet.getRange(rowIndex, updatedColMap["Approved At"] + 1).setValue(new Date());
  }

  sendApprovedTicketEmail({ firstName: firstName, lastName: lastName, email: email }, tokenId);
  Logger.log("Approved registration (onEdit) for: " + email + " token: " + tokenId);
}

/* ═══════════════════════════════════════════════════════════════
   sendApprovedTicketEmail — official "You're in!" ticket with QR code.
   @param {Object} data  — { firstName, lastName, email }
   @param {string} tokenId — e.g. "P934-2026-042-A7KX"
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

      /* OFFICIAL TICKET STUB */
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

      /* QR CODE + TOKEN ID SECTION */
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

    Logger.log("Approved ticket email sent to: " + data.email + " token: " + token);
  } catch (err) {
    Logger.log("sendApprovedTicketEmail error: " + err.toString());
  }
}

/* ═══════════════════════════════════════════════════════════════
   sendHostedByTicketEmail — HP-themed ticket for "Hosted By" guests.
   Same dark green design as sendApprovedTicketEmail, with hosted-by line.
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

      /* OFFICIAL TICKET STUB */
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

      /* QR CODE + TOKEN ID SECTION */
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

    Logger.log("Hosted-by ticket email sent to: " + guestData.email + " token: " + token);
  } catch (err) {
    Logger.log("sendHostedByTicketEmail error: " + err.toString());
  }
}

/* ═══════════════════════════════════════════════════════════════
   sendHostNotificationEmail — concise notification to the host.
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

      /* Header */
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
      '<tr><td style="background:linear-gradient(160deg,#003300 0%,#005522 55%,#003300 100%);padding:32px 44px 28px;text-align:center;">',
      '<p style="margin:0 0 4px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:6px;color:rgba(255,255,255,0.5);text-transform:uppercase;">Host Notification</p>',
      '<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:36px;font-weight:bold;color:#ffffff;letter-spacing:2px;line-height:1;">Platform&nbsp;9&frac34;</h1>',
      '<div style="width:40px;height:2px;background:#00cc66;margin:0 auto;"></div>',
      '</td></tr>',
      '</table>',

      '<div style="height:3px;background:linear-gradient(90deg,#007733,#00cc66,#00ff88,#00cc66,#007733);"></div>',

      /* Body */
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
      '<tr><td style="padding:32px 44px 28px;">',

      '<p style="margin:0 0 6px;font-family:\'Courier New\',monospace;font-size:9px;letter-spacing:5px;color:#00cc66;text-transform:uppercase;">\u2713 Entry confirmed</p>',
      '<p style="margin:0 0 20px;font-size:24px;font-weight:bold;color:#ffffff;line-height:1.2;">Hey, ' + hostName + '.</p>',
      '<p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.85;">',
      'Just confirming \u2014 you hosted <strong style="color:#ffffff;">' + guestFull + '</strong> for <span style="color:#00cc66;font-weight:bold;">Platform 9\u00be TSS</span>. ',
      'Their ticket has been sent to <strong style="color:#ffffff;">' + (guestData.email || "") + '</strong>.',
      '</p>',

      /* Token block */
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

      /* Footer */
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

    Logger.log("Host notification email sent to: " + hostData.email);
  } catch (err) {
    Logger.log("sendHostNotificationEmail error: " + err.toString());
  }
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS TAB — ensureSettingsTab, getSettingValue, setSettingValue
   ═══════════════════════════════════════════════════════════════ */

/* ensureSettingsTab — creates the Settings tab with default values if it
   does not already exist. Safe to call multiple times. */
function ensureSettingsTab() {
  var ss       = SpreadsheetApp.getActiveSpreadsheet();
  var settings = ss.getSheetByName("Settings");
  if (settings) return settings;

  settings = ss.insertSheet("Settings");

  /* Header row */
  var header = settings.getRange(1, 1, 1, 2);
  header.setValues([["Key", "Value"]]);
  header.setFontWeight("bold");
  header.setFontColor("#ffffff");
  header.setBackground("#1a1a2e");
  header.setFontFamily("Arial");
  header.setFontSize(10);
  header.setHorizontalAlignment("center");
  header.setVerticalAlignment("middle");

  /* Default rows */
  settings.getRange(2, 1).setValue("Active Sender");
  settings.getRange(2, 2).setValue("TSS");
  settings.getRange(3, 1).setValue("Registration Status");
  settings.getRange(3, 2).setValue("open");

  settings.autoResizeColumns(1, 2);
  settings.setFrozenRows(1);

  Logger.log("Settings tab created with defaults.");
  return settings;
}

/* getSettingValue — reads a value from the Settings tab by key name.
   Returns "" if the key is not found. */
function getSettingValue(key) {
  try {
    var ss       = SpreadsheetApp.getActiveSpreadsheet();
    var settings = ss.getSheetByName("Settings");
    if (!settings) settings = ensureSettingsTab();

    var data = settings.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString().trim() === key) {
        return (data[i][1] || "").toString().trim();
      }
    }
    return "";
  } catch (err) {
    Logger.log("getSettingValue error: " + err.toString());
    return "";
  }
}

/* setSettingValue — writes a key/value pair to the Settings tab.
   Updates an existing row, or appends a new one. */
function setSettingValue(key, value) {
  try {
    var ss       = SpreadsheetApp.getActiveSpreadsheet();
    var settings = ss.getSheetByName("Settings");
    if (!settings) settings = ensureSettingsTab();

    var data = settings.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || "").toString().trim() === key) {
        settings.getRange(i + 1, 2).setValue(value);
        Logger.log("setSettingValue: " + key + " = " + value);
        return;
      }
    }
    /* Key not found — append a new row */
    var nextRow = settings.getLastRow() + 1;
    settings.getRange(nextRow, 1).setValue(key);
    settings.getRange(nextRow, 2).setValue(value);
    Logger.log("setSettingValue (new row): " + key + " = " + value);
  } catch (err) {
    Logger.log("setSettingValue error: " + err.toString());
  }
}

/* getActiveSender — returns "TSS" or "AB" from the Settings tab.
   TSS.gs no longer uses this for routing — the frontend reads it via getSetting
   and decides which URL (TSS or AB) to call for email sending. Kept here because
   the Settings tab lives in the TSS sheet. */
function getActiveSender() {
  var val = getSettingValue("Active Sender");
  return (val === "AB") ? "AB" : "TSS";
}

/* handleSendEmailAction — doPost action "sendEmail".
   Accepts emailType + all data fields needed to build and send the appropriate
   email via GmailApp directly. Does not touch the Google Sheet at all.
   This mirrors the identical handler in AB.gs — the only difference is which
   Gmail account executes the send. */
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
      return jsonResponse({ success: false, error: "Unknown emailType: " + type });
    }

    return jsonResponse({ success: true });
  } catch (err) {
    Logger.log("handleSendEmailAction error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* handleGetSettingAction — doGet / doPost handler for getSetting. */
function handleGetSettingAction(key) {
  if (!key) return jsonResponse({ success: false, error: "key is required." });
  var value = getSettingValue(key);
  return jsonResponse({ success: true, key: key, value: value });
}

/* handleSetSettingAction — doPost handler for setSetting. */
function handleSetSettingAction(data) {
  if (!data.key) return jsonResponse({ success: false, error: "key is required." });
  if (data.value === undefined || data.value === null)
    return jsonResponse({ success: false, error: "value is required." });
  setSettingValue(data.key, data.value.toString());
  return jsonResponse({ success: true, key: data.key, value: data.value });
}

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */
function formatMunExp(val) {
  var map = { yes: "Yes — attended MUNs", heard: "Heard of it" };
  return map[val] || val || "—";
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ═══════════════════════════════════════════════════════════════
   ENTRY APP — Sheet names & admin PIN
   ═══════════════════════════════════════════════════════════════ */
var ENTRY_LOG_SHEET   = "Entry Log";
var COMP_SHEET        = "Complimentary";
var ONSPOT_SHEET      = "On-Spot Reg";
var ENTRY_ADMIN_PIN   = "1234";

/* ─── ensureEntryLogSheet ─── */
function ensureEntryLogSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ENTRY_LOG_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ENTRY_LOG_SHEET);
    var headers = ["Timestamp", "Token ID", "Full Name", "Email", "Phone", "Entered By", "Source", "Entry Type"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold").setFontColor("#ffffff")
      .setBackground("#0d3349").setFontFamily("Arial").setFontSize(10)
      .setHorizontalAlignment("center");
    sheet.setRowHeight(1, 36);
    sheet.setFrozenRows(1);
    Logger.log("Created Entry Log sheet.");
  }
  return sheet;
}

/* ─── ensureEntryLogEntryTypeColumn ─── */
function ensureEntryLogEntryTypeColumn(sheet) {
  if (!sheet || sheet.getLastRow() === 0) return;
  var lastCol   = sheet.getLastColumn();
  var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headerRow.indexOf("Entry Type") !== -1) return;
  var nextCol = lastCol + 1;
  var cell = sheet.getRange(1, nextCol, 1, 1);
  cell.setValue("Entry Type");
  cell.setFontWeight("bold").setFontColor("#ffffff")
    .setBackground("#0d3349").setFontFamily("Arial").setFontSize(10)
    .setHorizontalAlignment("center");
  Logger.log("Added Entry Type column to Entry Log.");
}

/* ─── ensureComplimentarySheet ─── */
function ensureComplimentarySheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(COMP_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(COMP_SHEET);
    var headers = ["Name", "Phone", "Token ID"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold").setFontColor("#ffffff")
      .setBackground("#7a4800").setFontFamily("Arial").setFontSize(10)
      .setHorizontalAlignment("center");
    sheet.setRowHeight(1, 36);
    sheet.setFrozenRows(1);
    Logger.log("Created Complimentary sheet.");
  }
  return sheet;
}

/* ─── ensureOnSpotSheet ─── */
function ensureOnSpotSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ONSPOT_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ONSPOT_SHEET);
    var headers = ["Timestamp", "Full Name", "Phone", "Payment Mode", "Note", "Registered By"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold").setFontColor("#ffffff")
      .setBackground("#1a3300").setFontFamily("Arial").setFontSize(10)
      .setHorizontalAlignment("center");
    sheet.setRowHeight(1, 36);
    sheet.setFrozenRows(1);
    Logger.log("Created On-Spot Reg sheet.");
  }
  return sheet;
}

/* ─── isAlreadyEntered — checks Entry Log for a token ─── */
function isAlreadyEntered(tokenId) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ENTRY_LOG_SHEET);
  if (!sheet || sheet.getLastRow() <= 1) return { entered: false };
  var data    = sheet.getDataRange().getValues();
  var colMap  = getSheetColumnMap(sheet);
  var tokenCol = colMap["Token ID"];
  var tsCol    = colMap["Timestamp"];
  if (tokenCol === undefined) return { entered: false };
  for (var i = 1; i < data.length; i++) {
    var rowToken = (data[i][tokenCol] || "").toString().trim();
    if (rowToken === tokenId) {
      var ts = tsCol !== undefined ? data[i][tsCol] : "";
      var tsStr = "";
      if (ts) {
        try { tsStr = new Date(ts).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }); }
        catch(x) { tsStr = ts.toString(); }
      }
      return { entered: true, enteredAt: tsStr };
    }
  }
  return { entered: false };
}

/* ─── writeEntryLog ─── */
function writeEntryLog(tokenId, fullName, email, phone, deviceId, source, entryType) {
  var sheet = ensureEntryLogSheet();
  ensureEntryLogEntryTypeColumn(sheet);
  var colMap = getSheetColumnMap(sheet);
  var now = new Date();
  var tsStr = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  var numCols = sheet.getLastColumn();
  var row = [];
  for (var k = 0; k < numCols; k++) row.push("");
  if (colMap["Timestamp"]  !== undefined) row[colMap["Timestamp"]]  = tsStr;
  if (colMap["Token ID"]   !== undefined) row[colMap["Token ID"]]   = tokenId;
  if (colMap["Full Name"]  !== undefined) row[colMap["Full Name"]]  = fullName;
  if (colMap["Email"]      !== undefined) row[colMap["Email"]]      = email;
  if (colMap["Phone"]      !== undefined) row[colMap["Phone"]]      = phone;
  if (colMap["Entered By"] !== undefined) row[colMap["Entered By"]] = deviceId || "Entry App";
  if (colMap["Source"]     !== undefined) row[colMap["Source"]]     = source || "reg";
  if (colMap["Entry Type"] !== undefined) row[colMap["Entry Type"]] = entryType || "MAIN";
  sheet.appendRow(row);
}

/* ═══════════════════════════════════════════════════════════════
   handleVerifyToken — GET action=verifyToken&tokenId=...
   Checks Registrations sheet, then Complimentary sheet.
   Returns VALID / DUPLICATE / INVALID.
   ═══════════════════════════════════════════════════════════════ */
function handleVerifyToken(tokenId) {
  try {
    if (!tokenId) return jsonResponse({ success: false, status: "INVALID", message: "No token provided." });

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    /* ── 1. Check Registrations sheet ── */
    var regSheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (regSheet && regSheet.getLastRow() > 1) {
      ensureSection3Columns(regSheet);
      ensureSection4Columns(regSheet);
      var colMap   = getSheetColumnMap(regSheet);
      var allRows  = regSheet.getDataRange().getValues();
      var tokenCol = colMap["Token ID"];
      var statusCol = colMap["Status"];
      if (tokenCol !== undefined) {
        for (var i = 1; i < allRows.length; i++) {
          var row = allRows[i];
          var rowToken  = (row[tokenCol] || "").toString().trim();
          var rowStatus = statusCol !== undefined ? (row[statusCol] || "").toString().trim() : "";
          if (rowToken === tokenId) {
            if (rowStatus !== "Reviewed") {
              return jsonResponse({ success: false, status: "INVALID", message: "Token exists but registration not approved." });
            }
            var entryCheck = isAlreadyEntered(tokenId);
            if (entryCheck.entered) {
              return jsonResponse({
                success:   true,
                status:    "DUPLICATE",
                name:      safeStr(row, colMap, "Full Name"),
                enteredAt: entryCheck.enteredAt,
              });
            }
            return jsonResponse({
              success:       true,
              status:        "VALID",
              rowIndex:      i + 1,
              tokenId:       rowToken,
              fullName:      safeStr(row, colMap, "Full Name"),
              firstName:     safeStr(row, colMap, "First Name"),
              lastName:      safeStr(row, colMap, "Last Name"),
              email:         safeStr(row, colMap, "Email"),
              phone:         safeStr(row, colMap, "Phone"),
              school:        safeStr(row, colMap, "School / College"),
              grade:         safeStr(row, colMap, "Grade / Year"),
              munExp:        safeStr(row, colMap, "MUN Experience"),
              munsAttended:  safeStr(row, colMap, "MUNs Attended"),
              potterhead:    safeStr(row, colMap, "Potterhead?"),
              note:          safeStr(row, colMap, "Note"),
              isSpecial:     safeStr(row, colMap, "Is Special"),
              ticketType:    safeStr(row, colMap, "Ticket Type"),
              hostedByEmail: safeStr(row, colMap, "Hosted By Email"),
              specialNote:   safeStr(row, colMap, "Special Note"),
            });
          }
        }
      }
    }

    /* ── 2. Check Complimentary sheet ── */
    var compSheet = ss.getSheetByName(COMP_SHEET);
    if (compSheet && compSheet.getLastRow() > 1) {
      var compMap  = getSheetColumnMap(compSheet);
      var compRows = compSheet.getDataRange().getValues();
      var cTokenCol = compMap["Token ID"];
      if (cTokenCol !== undefined) {
        for (var j = 1; j < compRows.length; j++) {
          var crow = compRows[j];
          var cToken = (crow[cTokenCol] || "").toString().trim();
          if (cToken === tokenId) {
            var entryCheck2 = isAlreadyEntered(tokenId);
            if (entryCheck2.entered) {
              return jsonResponse({
                success:   true,
                status:    "DUPLICATE",
                name:      safeStr(crow, compMap, "Name"),
                enteredAt: entryCheck2.enteredAt,
              });
            }
            return jsonResponse({
              success:   true,
              status:    "VALID",
              rowIndex:  j + 1,
              tokenId:   cToken,
              fullName:  safeStr(crow, compMap, "Name"),
              firstName: safeStr(crow, compMap, "Name").split(" ")[0] || "",
              lastName:  safeStr(crow, compMap, "Name").split(" ").slice(1).join(" ") || "",
              phone:     safeStr(crow, compMap, "Phone"),
              isComp:    true,
            });
          }
        }
      }
    }

    return jsonResponse({ success: false, status: "INVALID", message: "Token not found or not approved." });
  } catch (err) {
    Logger.log("handleVerifyToken error: " + err.toString());
    return jsonResponse({ success: false, status: "INVALID", message: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   handleGetEntryLog — GET action=getEntryLog
   Returns all Entry Log rows as JSON, most recent first.
   ═══════════════════════════════════════════════════════════════ */
function handleGetEntryLog() {
  try {
    var sheet = ensureEntryLogSheet();
    if (sheet.getLastRow() <= 1) return jsonResponse([]);
    var colMap = getSheetColumnMap(sheet);
    var allRows = sheet.getDataRange().getValues();
    var result = [];
    for (var i = 1; i < allRows.length; i++) {
      var row = allRows[i];
      var ts  = safeStr(row, colMap, "Timestamp");
      result.push({
        rowIndex:  i + 1,
        tokenId:   safeStr(row, colMap, "Token ID"),
        fullName:  safeStr(row, colMap, "Full Name"),
        email:     safeStr(row, colMap, "Email"),
        phone:     safeStr(row, colMap, "Phone"),
        enteredAt: ts,
        enteredBy: safeStr(row, colMap, "Entered By"),
        status:    "entered",
        source:    safeStr(row, colMap, "Source"),
        entryType: safeStr(row, colMap, "Entry Type") || "MAIN",
      });
    }
    result.reverse();
    return jsonResponse(result);
  } catch (err) {
    Logger.log("handleGetEntryLog error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   handleConfirmEntry — POST action=confirmEntry
   Logs entry to Entry Log sheet. Handles both regular and comp tokens.
   ═══════════════════════════════════════════════════════════════ */
function handleConfirmEntry(data) {
  try {
    var tokenId  = (data.tokenId  || "").toString().trim();
    var deviceId = (data.deviceId || "Entry App").toString();
    if (!tokenId) return jsonResponse({ success: false, error: "tokenId required." });

    /* Check for duplicate entry */
    var entryCheck = isAlreadyEntered(tokenId);
    if (entryCheck.entered) {
      return jsonResponse({ success: false, error: "Already entered at " + entryCheck.enteredAt });
    }

    var fullName = "", email = "", phone = "", source = "reg", entryType = "MAIN";

    /* Look up registrant details */
    var ss       = SpreadsheetApp.getActiveSpreadsheet();
    var regSheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (regSheet && regSheet.getLastRow() > 1) {
      var colMap  = getSheetColumnMap(regSheet);
      var allRows = regSheet.getDataRange().getValues();
      var tokenCol = colMap["Token ID"];
      if (tokenCol !== undefined) {
        for (var i = 1; i < allRows.length; i++) {
          if ((allRows[i][tokenCol] || "").toString().trim() === tokenId) {
            fullName  = safeStr(allRows[i], colMap, "Full Name");
            email     = safeStr(allRows[i], colMap, "Email");
            phone     = safeStr(allRows[i], colMap, "Phone");
            source    = "reg";
            entryType = "MAIN";
            break;
          }
        }
      }
    }

    /* If not found in Registrations, try Complimentary */
    if (!fullName) {
      var compSheet = ss.getSheetByName(COMP_SHEET);
      if (compSheet && compSheet.getLastRow() > 1) {
        var compMap  = getSheetColumnMap(compSheet);
        var compRows = compSheet.getDataRange().getValues();
        var cTokenCol = compMap["Token ID"];
        if (cTokenCol !== undefined) {
          for (var j = 1; j < compRows.length; j++) {
            if ((compRows[j][cTokenCol] || "").toString().trim() === tokenId) {
              fullName  = safeStr(compRows[j], compMap, "Name");
              phone     = safeStr(compRows[j], compMap, "Phone");
              source    = "comp";
              entryType = "COMP";
              break;
            }
          }
        }
      }
    }

    writeEntryLog(tokenId, fullName, email, phone, deviceId, source, entryType);
    Logger.log("Entry confirmed: " + tokenId + " (" + fullName + ") via " + deviceId);
    return jsonResponse({ success: true });
  } catch (err) {
    Logger.log("handleConfirmEntry error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   handleManualCheckIn — POST action=manualCheckIn
   Admin-PIN-gated version of confirmEntry.
   ═══════════════════════════════════════════════════════════════ */
function handleManualCheckIn(data) {
  try {
    var adminPin = (data.adminPin || "").toString();
    if (adminPin !== ENTRY_ADMIN_PIN) {
      return jsonResponse({ success: false, error: "Invalid admin PIN." });
    }
    return handleConfirmEntry(data);
  } catch (err) {
    Logger.log("handleManualCheckIn error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   handleGetComplimentary — GET action=getComplimentary
   Returns all Complimentary sheet rows as JSON.
   ═══════════════════════════════════════════════════════════════ */
function handleGetComplimentary() {
  try {
    var sheet = ensureComplimentarySheet();
    var totalRows = sheet.getLastRow();
    Logger.log("handleGetComplimentary: sheet last row = " + totalRows + ", sheet name = " + sheet.getName());
    if (totalRows <= 1) {
      Logger.log("handleGetComplimentary: no data rows, returning empty array.");
      return jsonResponse([]);
    }
    var colMap  = getSheetColumnMap(sheet);
    var allRows = sheet.getDataRange().getValues();
    Logger.log("handleGetComplimentary: colMap = " + JSON.stringify(colMap));
    if (allRows.length > 1) {
      Logger.log("handleGetComplimentary: first data row = " + JSON.stringify(allRows[1]));
    }
    var result  = [];
    for (var i = 1; i < allRows.length; i++) {
      var row     = allRows[i];
      var name    = safeStr(row, colMap, "Name").trim();
      var tokenId = safeStr(row, colMap, "Token ID").trim();
      if (!name) continue;
      var entryCheck = tokenId ? isAlreadyEntered(tokenId) : { entered: false };
      result.push({
        rowIndex:       i + 1,
        name:           name,
        phone:          safeStr(row, colMap, "Phone"),
        tokenId:        tokenId,
        hasToken:       tokenId !== "",
        alreadyEntered: entryCheck.entered,
        enteredAt:      entryCheck.enteredAt || "",
      });
    }
    Logger.log("handleGetComplimentary: returning " + result.length + " entries.");
    return jsonResponse(result);
  } catch (err) {
    Logger.log("handleGetComplimentary error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   handleOnSpotRegister — POST action=onSpotRegister
   Writes a new row to the On-Spot Reg sheet and Entry Log.
   ═══════════════════════════════════════════════════════════════ */
function handleOnSpotRegister(data) {
  try {
    var sheet  = ensureOnSpotSheet();
    var colMap = getSheetColumnMap(sheet);
    var now    = new Date();
    var tsStr  = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    var row = ["", "", "", "", "", ""];
    row[colMap["Timestamp"]    !== undefined ? colMap["Timestamp"]    : 0] = tsStr;
    row[colMap["Full Name"]    !== undefined ? colMap["Full Name"]    : 1] = data.fullName    || "";
    row[colMap["Phone"]        !== undefined ? colMap["Phone"]        : 2] = data.phone       || "";
    row[colMap["Payment Mode"] !== undefined ? colMap["Payment Mode"] : 3] = data.paymentMode || "";
    row[colMap["Note"]         !== undefined ? colMap["Note"]         : 4] = data.note        || "";
    row[colMap["Registered By"]!== undefined ? colMap["Registered By"]: 5] = data.deviceId   || "Entry App";
    sheet.appendRow(row);

    /* Also write to Entry Log so on-spot appears in Monitor */
    var onSpotToken = "ONSPOT-" + now.getTime().toString(36).toUpperCase();
    var noteInfo    = [data.paymentMode || "", data.note || ""].filter(Boolean).join(" · ");
    var deviceLabel = (data.deviceId || "Entry App") + (noteInfo ? " [" + noteInfo + "]" : "");
    writeEntryLog(onSpotToken, data.fullName || "", "", data.phone || "", deviceLabel, "onspot", "ONSPOT");

    Logger.log("On-Spot registration: " + (data.fullName || "") + " " + (data.phone || "") + " token: " + onSpotToken);
    return jsonResponse({ success: true });
  } catch (err) {
    Logger.log("handleOnSpotRegister error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/* ═══════════════════════════════════════════════════════════════
   handleGetOnSpotRegistrations — GET action=getOnSpotRegistrations
   Returns all On-Spot Reg rows as JSON, most recent first.
   ═══════════════════════════════════════════════════════════════ */
function handleGetOnSpotRegistrations() {
  try {
    var sheet = ensureOnSpotSheet();
    if (sheet.getLastRow() <= 1) return jsonResponse([]);
    var colMap  = getSheetColumnMap(sheet);
    var allRows = sheet.getDataRange().getValues();
    var result  = [];
    for (var i = 1; i < allRows.length; i++) {
      var row = allRows[i];
      result.push({
        rowIndex:    i + 1,
        timestamp:   safeStr(row, colMap, "Timestamp"),
        fullName:    safeStr(row, colMap, "Full Name"),
        phone:       safeStr(row, colMap, "Phone"),
        paymentMode: safeStr(row, colMap, "Payment Mode"),
        note:        safeStr(row, colMap, "Note"),
        registeredBy:safeStr(row, colMap, "Registered By"),
      });
    }
    result.reverse();
    return jsonResponse(result);
  } catch (err) {
    Logger.log("handleGetOnSpotRegistrations error: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}
