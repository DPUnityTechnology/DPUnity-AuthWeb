const SHEET_NAME = "Users";
const HEADERS = ["id", "name", "email", "passwordHash", "salt", "createdAt", "lastLoginAt"];

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || "{}");
    const action = body.action;
    const payload = body.payload || {};

    if (action === "register") {
      return jsonResponse(registerUser(payload));
    }

    if (action === "login") {
      return jsonResponse(loginUser(payload));
    }

    return jsonResponse(null, "Unknown action.");
  } catch (error) {
    return jsonResponse(null, error.message || "Server error.");
  }
}

function registerUser(payload) {
  const name = String(payload.name || "").trim();
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");

  if (name.length < 2) {
    throw new Error("Name must have at least 2 characters.");
  }

  if (!email || !email.includes("@")) {
    throw new Error("Invalid email.");
  }

  if (password.length < 8) {
    throw new Error("Password must have at least 8 characters.");
  }

  const sheet = getUsersSheet();
  const users = readUsers(sheet);
  if (users.some((user) => user.email === email)) {
    throw new Error("Email already exists.");
  }

  const salt = Utilities.getUuid();
  const now = new Date().toISOString();
  const user = {
    id: Utilities.getUuid(),
    name,
    email,
    passwordHash: hashPassword(password, salt),
    salt,
    createdAt: now,
    lastLoginAt: now
  };

  sheet.appendRow(HEADERS.map((key) => user[key]));

  return {
    user: publicUser(user)
  };
}

function loginUser(payload) {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const sheet = getUsersSheet();
  const users = readUsers(sheet);
  const userIndex = users.findIndex((item) => item.email === email);

  if (userIndex < 0) {
    throw new Error("Email or password is incorrect.");
  }

  const user = users[userIndex];
  if (hashPassword(password, user.salt) !== user.passwordHash) {
    throw new Error("Email or password is incorrect.");
  }

  const lastLoginAtColumn = HEADERS.indexOf("lastLoginAt") + 1;
  sheet.getRange(userIndex + 2, lastLoginAtColumn).setValue(new Date().toISOString());

  return {
    user: publicUser(user)
  };
}

function getUsersSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = HEADERS.every((header, index) => firstRow[index] === header);
  if (!hasHeaders) {
    sheet.clear();
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function readUsers(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  return sheet
    .getRange(2, 1, lastRow - 1, HEADERS.length)
    .getValues()
    .map((row) => {
      return HEADERS.reduce((user, key, index) => {
        user[key] = row[index];
        return user;
      }, {});
    });
}

function hashPassword(password, salt) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    `${salt}:${password}`,
    Utilities.Charset.UTF_8
  );

  return bytes
    .map((byte) => {
      const value = byte < 0 ? byte + 256 : byte;
      return value.toString(16).padStart(2, "0");
    })
    .join("");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

function jsonResponse(data, error) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: !error,
      data: error ? null : data,
      error: error || null
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
