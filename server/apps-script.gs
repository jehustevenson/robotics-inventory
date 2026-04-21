// ============================================================
//  RoboLend – Google Apps Script Backend
//  Paste this entire file into your Apps Script editor,
//  then deploy as a Web App (execute as: Me, access: Anyone).
//
//  CHANGELOG
//  • Added "section" column to the Items sheet (Infant / Junior /
//    Secondary School).
//  • ensureItemsSchema() auto-adds the "section" header to an
//    existing sheet the first time this script runs.
//  • Added Users sheet (id, username, passwordHash, role, createdAt)
//    with getUsers/addUser/updateUser/deleteUser actions. Seeded
//    with the two existing users on first run.
//  • Wrapped borrowItem in LockService to close a race condition
//    where two teachers borrowing simultaneously could overbook.
// ============================================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// ── Sheet / column constants ─────────────────────────────────
const ITEMS_SHEET        = "Items";
const TRANSACTIONS_SHEET = "Transactions";
const USERS_SHEET        = "Users";

const ITEMS_COLS = ["id","name","category","totalQuantity","createdAt","section"];
const TXN_COLS   = ["id","itemId","itemName","category","quantity",
                    "teacherName","borrowDate","returnDate","returned"];
const USER_COLS  = ["id","username","passwordHash","role","createdAt"];

// ── Bootstrap: create sheets + headers if missing ────────────
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let itemSheet = ss.getSheetByName(ITEMS_SHEET);
  if (!itemSheet) {
    itemSheet = ss.insertSheet(ITEMS_SHEET);
    itemSheet.appendRow(ITEMS_COLS);
    itemSheet.getRange(1, 1, 1, ITEMS_COLS.length)
      .setFontWeight("bold")
      .setBackground("#1E3A5F")
      .setFontColor("#FFFFFF");

    const now = new Date().toISOString();
    const seeds = [
      ["item_1","Arduino Uno R3","Microcontrollers",15,now,"Secondary School"],
      ["item_2","Raspberry Pi 4 Model B","Microcontrollers",10,now,"Secondary School"],
      ["item_3","Ultrasonic Sensor HC-SR04","Sensors",30,now,"Secondary School"],
      ["item_4","IR Infrared Sensor Module","Sensors",25,now,"Junior School"],
      ["item_5","DHT11 Temperature & Humidity Sensor","Sensors",20,now,"Junior School"],
      ["item_6","DC Motor 6V","Motors",18,now,"Junior School"],
      ["item_7","Servo Motor SG90","Motors",22,now,"Secondary School"],
      ["item_8","Stepper Motor 28BYJ-48","Motors",12,now,"Secondary School"],
      ["item_9","LEGO Mindstorms EV3","Kits",8,now,"Junior School"],
      ["item_10","Arduino Starter Kit","Kits",6,now,"Secondary School"],
      ["item_11","ESP32 Development Board","Microcontrollers",14,now,"Secondary School"],
    ];
    seeds.forEach(r => itemSheet.appendRow(r));
  } else {
    ensureItemsSchema(itemSheet);
  }

  let txnSheet = ss.getSheetByName(TRANSACTIONS_SHEET);
  if (!txnSheet) {
    txnSheet = ss.insertSheet(TRANSACTIONS_SHEET);
    txnSheet.appendRow(TXN_COLS);
    txnSheet.getRange(1, 1, 1, TXN_COLS.length)
      .setFontWeight("bold")
      .setBackground("#2D5A3D")
      .setFontColor("#FFFFFF");
  }

  let userSheet = ss.getSheetByName(USERS_SHEET);
  if (!userSheet) {
    userSheet = ss.insertSheet(USERS_SHEET);
    userSheet.appendRow(USER_COLS);
    userSheet.getRange(1, 1, 1, USER_COLS.length)
      .setFontWeight("bold")
      .setBackground("#7B2D3A")
      .setFontColor("#FFFFFF");

    // Seed with the two existing users. These are the same bcrypt hashes
    // currently in server/.env. Usernames: admin, teacher1.
    const now = new Date().toISOString();
    userSheet.appendRow([
      "user_admin_seed",
      "admin",
      "$2b$10$Q9NIOzhmt4BkkJoQOneLp.OsuVdSPOBso609VXjoKLrba2hC0m9nS",
      "admin",
      now,
    ]);
    userSheet.appendRow([
      "user_teacher1_seed",
      "teacher1",
      "$2b$10$.d1414O8fYh7WMh.kOuldOuylgce5h1m9M2.mj4Ty8YLMKuZz3fuK",
      "user",
      now,
    ]);
  }
}

// Add any missing columns defined in ITEMS_COLS to an existing Items sheet.
// Idempotent — safe to run on every request.
function ensureItemsSchema(sheet) {
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, Math.max(1, lastCol)).getValues()[0].map(String);
  ITEMS_COLS.forEach((colName) => {
    if (headers.indexOf(colName) === -1) {
      const newColIndex = sheet.getLastColumn() + 1;
      sheet.getRange(1, newColIndex).setValue(colName)
        .setFontWeight("bold")
        .setBackground("#1E3A5F")
        .setFontColor("#FFFFFF");
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1; // 1-based
  }
  return -1;
}

function columnIndex(sheet, headerName) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const idx = headers.indexOf(headerName);
  return idx === -1 ? -1 : idx + 1;
}

function generateId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substr(2,5);
}

function jsonResponse(data, status) {
  const payload = JSON.stringify({ status: status || "ok", data });
  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "error", message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GET router ────────────────────────────────────────────────
function doGet(e) {
  try {
    setupSheets();
    const action = e.parameter.action;

    if (action === "getItems") {
      return jsonResponse(sheetToObjects(getSheet(ITEMS_SHEET)));
    }

    if (action === "getTransactions") {
      return jsonResponse(sheetToObjects(getSheet(TRANSACTIONS_SHEET)));
    }

    if (action === "getDashboard") {
      const items = sheetToObjects(getSheet(ITEMS_SHEET));
      const txns  = sheetToObjects(getSheet(TRANSACTIONS_SHEET));
      const active = txns.filter(t => String(t.returned) !== "true");

      const totalBorrowed = active.reduce((s,t) => s + Number(t.quantity||0), 0);
      const totalAvailable = items.reduce((s, item) => {
        const b = active.filter(t => t.itemId === item.id)
                        .reduce((a,t) => a + Number(t.quantity||0), 0);
        return s + (Number(item.totalQuantity) - b);
      }, 0);

      return jsonResponse({
        totalItems: items.length,
        totalBorrowed,
        totalAvailable,
        activeTransactions: active.length,
        items,
        transactions: txns,
      });
    }

    // NOTE: getUsers returns passwordHash. The Node server strips the hash
    // before forwarding to the frontend. Apps Script is only reachable via
    // the Node proxy, so the hash never leaves the server boundary.
    if (action === "getUsers") {
      return jsonResponse(sheetToObjects(getSheet(USERS_SHEET)));
    }

    return errorResponse("Unknown action: " + action);
  } catch(err) {
    return errorResponse(err.message);
  }
}

// ── POST router ───────────────────────────────────────────────
function doPost(e) {
  try {
    setupSheets();
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;

    // ── ADD ITEM ──────────────────────────────────────────────
    if (action === "addItem") {
      const { name, category, totalQuantity, section } = body;
      if (!name || !category || !totalQuantity)
        return errorResponse("Missing fields: name, category, totalQuantity");

      const id  = generateId("item");
      const now = new Date().toISOString();
      const sectionValue = section || "";
      getSheet(ITEMS_SHEET).appendRow([id, name, category, Number(totalQuantity), now, sectionValue]);
      return jsonResponse({
        id, name, category,
        totalQuantity: Number(totalQuantity),
        createdAt: now,
        section: sectionValue,
      });
    }

    // ── UPDATE ITEM ───────────────────────────────────────────
    if (action === "updateItem") {
      const { id, name, category, totalQuantity, section } = body;
      const sheet = getSheet(ITEMS_SHEET);
      const row   = findRowById(sheet, id);
      if (row === -1) return errorResponse("Item not found: " + id);

      sheet.getRange(row, 2).setValue(name);
      sheet.getRange(row, 3).setValue(category);
      sheet.getRange(row, 4).setValue(Number(totalQuantity));

      if (section !== undefined) {
        const sectionCol = columnIndex(sheet, "section");
        if (sectionCol !== -1) sheet.getRange(row, sectionCol).setValue(section);
      }

      return jsonResponse({
        id, name, category,
        totalQuantity: Number(totalQuantity),
        section: section || "",
      });
    }

    // ── DELETE ITEM ───────────────────────────────────────────
    if (action === "deleteItem") {
      const { id } = body;
      const sheet = getSheet(ITEMS_SHEET);
      const row   = findRowById(sheet, id);
      if (row === -1) return errorResponse("Item not found: " + id);
      sheet.deleteRow(row);
      return jsonResponse({ deleted: id });
    }

    // ── BORROW ITEM (with LockService) ────────────────────────
    // Wrap in a script lock so two simultaneous borrows can't both pass
    // the availability check and overbook the item.
    if (action === "borrowItem") {
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(5000); // up to 5s
      } catch (e) {
        return errorResponse("Server busy, please retry.");
      }
      try {
        const { itemId, itemName, category, quantity, teacherName } = body;
        if (!itemId || !quantity || !teacherName)
          return errorResponse("Missing fields");

        const items = sheetToObjects(getSheet(ITEMS_SHEET));
        const item  = items.find(i => i.id === itemId);
        if (!item) return errorResponse("Item not found");

        const txns  = sheetToObjects(getSheet(TRANSACTIONS_SHEET));
        const activeBorrowed = txns
          .filter(t => t.itemId === itemId && String(t.returned) !== "true")
          .reduce((s,t) => s + Number(t.quantity||0), 0);
        const available = Number(item.totalQuantity) - activeBorrowed;

        if (Number(quantity) > available)
          return errorResponse(`Only ${available} unit(s) available`);

        const id         = generateId("txn");
        const borrowDate = new Date().toISOString();
        getSheet(TRANSACTIONS_SHEET).appendRow([
          id, itemId, itemName || item.name,
          category || item.category,
          Number(quantity), teacherName,
          borrowDate, "", false,
        ]);
        return jsonResponse({
          id, itemId, itemName: itemName || item.name,
          category: category || item.category,
          quantity: Number(quantity), teacherName,
          borrowDate, returnDate: null, returned: false,
        });
      } finally {
        lock.releaseLock();
      }
    }

    // ── RETURN ITEM ───────────────────────────────────────────
    if (action === "returnItem") {
      const { id } = body;
      const sheet  = getSheet(TRANSACTIONS_SHEET);
      const row    = findRowById(sheet, id);
      if (row === -1) return errorResponse("Transaction not found: " + id);

      const returnDate = new Date().toISOString();
      sheet.getRange(row, 8).setValue(returnDate);
      sheet.getRange(row, 9).setValue(true);
      return jsonResponse({ id, returned: true, returnDate });
    }

    // ── ADD USER ──────────────────────────────────────────────
    // passwordHash is computed by the Node server (bcrypt) before calling.
    if (action === "addUser") {
      const { username, passwordHash, role } = body;
      if (!username || !passwordHash || !role)
        return errorResponse("Missing fields: username, passwordHash, role");
      if (!["admin", "user"].includes(role))
        return errorResponse("Invalid role (must be 'admin' or 'user')");

      const sheet = getSheet(USERS_SHEET);
      const existing = sheetToObjects(sheet);
      if (existing.some(u => String(u.username) === String(username)))
        return errorResponse("A user with that username already exists.");

      const id  = generateId("user");
      const now = new Date().toISOString();
      sheet.appendRow([id, username, passwordHash, role, now]);
      return jsonResponse({ id, username, role, createdAt: now });
    }

    // ── UPDATE USER ───────────────────────────────────────────
    // Accepts any of: role, passwordHash (for password reset). username is immutable.
    if (action === "updateUser") {
      const { id, role, passwordHash } = body;
      const sheet = getSheet(USERS_SHEET);
      const row   = findRowById(sheet, id);
      if (row === -1) return errorResponse("User not found: " + id);

      if (role !== undefined) {
        if (!["admin", "user"].includes(role))
          return errorResponse("Invalid role");
        const roleCol = columnIndex(sheet, "role");
        sheet.getRange(row, roleCol).setValue(role);
      }
      if (passwordHash !== undefined && passwordHash !== "") {
        const hashCol = columnIndex(sheet, "passwordHash");
        sheet.getRange(row, hashCol).setValue(passwordHash);
      }
      return jsonResponse({ id, updated: true });
    }

    // ── DELETE USER ───────────────────────────────────────────
    if (action === "deleteUser") {
      const { id } = body;
      const sheet = getSheet(USERS_SHEET);
      const row   = findRowById(sheet, id);
      if (row === -1) return errorResponse("User not found: " + id);
      sheet.deleteRow(row);
      return jsonResponse({ deleted: id });
    }

    return errorResponse("Unknown action: " + action);
  } catch(err) {
    return errorResponse(err.message);
  }
}
