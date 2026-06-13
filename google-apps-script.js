const SUPER_ROOT_ADMIN_EMAIL = "hongocquocsang2721@gmail.com";

const SHEETS = {
  users: {
    name: "Users",
    headers: ["id", "name", "email", "passwordHash", "salt", "role", "createdAt", "lastLoginAt"]
  },
  packages: {
    name: "Packages",
    headers: ["id", "name", "code", "description", "createdAt"]
  },
  companies: {
    name: "Companies",
    headers: ["id", "name", "rootAdminUserId", "packageCodes", "createdAt"]
  },
  companyUsers: {
    name: "CompanyUsers",
    headers: ["id", "companyId", "userId", "role", "createdAt"]
  }
};

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || "{}");
    const action = body.action;
    const payload = body.payload || {};
    ensureDefaultPackages();
    ensureSingleSuperRootAdmin();

    const adminActions = [
      "adminList",
      "addUser",
      "updateUser",
      "deleteUser",
      "addPackage",
      "updatePackage",
      "deletePackage",
      "addCompany",
      "updateCompany",
      "deleteCompany"
    ];

    if (adminActions.includes(action)) {
      requireSuperRootAdmin(payload.requester);
    }

    const actions = {
      register: () => registerUser(payload),
      login: () => loginUser(payload),
      googleAdminLogin: () => googleAdminLogin(payload),
      adminList: () => adminList(),
      addUser: () => addUser(payload),
      updateUser: () => updateUser(payload),
      deleteUser: () => deleteUser(payload),
      addPackage: () => addPackage(payload),
      updatePackage: () => updatePackage(payload),
      deletePackage: () => deletePackage(payload),
      addCompany: () => addCompany(payload),
      updateCompany: () => updateCompany(payload),
      deleteCompany: () => deleteCompany(payload),
      listCompaniesForUser: () => listCompaniesForUser(payload),
      getCompanyWorkspace: () => getCompanyWorkspace(payload)
    };

    if (!actions[action]) {
      return jsonResponse(null, "Unknown action.");
    }

    return jsonResponse(actions[action]());
  } catch (error) {
    return jsonResponse(null, error.message || "Server error.");
  }
}

function registerUser(payload) {
  const user = createUser(payload, "user");
  return { user: publicUser(user) };
}

function addUser(payload) {
  const user = createUser(payload, normalizeRoleForEmail(payload.role || "user", payload.email));
  return { user: publicUser(user) };
}

function createUser(payload, role) {
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

  const users = readTable("users");
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
    role: normalizeRoleForEmail(role, email),
    createdAt: now,
    lastLoginAt: now
  };

  appendRecord("users", user);
  return user;
}

function updateUser(payload) {
  const users = readTable("users");
  const index = users.findIndex((user) => user.id === payload.id);
  if (index < 0) {
    throw new Error("User not found.");
  }

  const email = normalizeEmail(payload.email);
  if (users.some((user) => user.id !== payload.id && user.email === email)) {
    throw new Error("Email already exists.");
  }

  const current = users[index];
  current.name = String(payload.name || "").trim();
  current.email = email;
  current.role = normalizeRoleForEmail(payload.role || current.role || "user", email);

  if (String(payload.password || "").length > 0) {
    if (String(payload.password).length < 8) {
      throw new Error("Password must have at least 8 characters.");
    }

    current.salt = Utilities.getUuid();
    current.passwordHash = hashPassword(String(payload.password), current.salt);
  }

  writeRecord("users", index, current);
  return { user: publicUser(current) };
}

function deleteUser(payload) {
  deleteById("users", payload.id);
  readTable("companyUsers")
    .filter((item) => item.userId === payload.id)
    .forEach((item) => deleteById("companyUsers", item.id));
  return { id: payload.id };
}

function loginUser(payload) {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const users = readTable("users");
  const index = users.findIndex((item) => item.email === email);

  if (index < 0) {
    throw new Error("Email or password is incorrect.");
  }

  const user = users[index];
  if (hashPassword(password, user.salt) !== user.passwordHash) {
    throw new Error("Email or password is incorrect.");
  }

  user.lastLoginAt = new Date().toISOString();
  user.role = normalizeRoleForEmail(user.role || "user", user.email);
  writeRecord("users", index, user);

  return { user: publicUser(user) };
}

function googleAdminLogin(payload) {
  const tokenInfo = verifyGoogleIdToken(payload.idToken);
  const email = normalizeEmail(tokenInfo.email);

  if (email !== SUPER_ROOT_ADMIN_EMAIL) {
    throw new Error("Only SuperRootAdmin Google account can sign in.");
  }

  let users = readTable("users");
  let index = users.findIndex((item) => normalizeEmail(item.email) === email);
  const now = new Date().toISOString();

  if (index < 0) {
    const user = {
      id: Utilities.getUuid(),
      name: tokenInfo.name || "SuperRootAdmin",
      email,
      passwordHash: "",
      salt: "",
      role: "superRootAdmin",
      createdAt: now,
      lastLoginAt: now
    };
    appendRecord("users", user);
    return { user: publicUser(user) };
  }

  const user = users[index];
  user.name = user.name || tokenInfo.name || "SuperRootAdmin";
  user.role = "superRootAdmin";
  user.lastLoginAt = now;
  writeRecord("users", index, user);

  return { user: publicUser(user) };
}

function verifyGoogleIdToken(idToken) {
  if (!idToken) {
    throw new Error("Missing Google credential.");
  }

  const response = UrlFetchApp.fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error("Google credential is invalid.");
  }

  const tokenInfo = JSON.parse(response.getContentText());
  if (normalizeEmail(tokenInfo.email) !== SUPER_ROOT_ADMIN_EMAIL) {
    throw new Error("Only SuperRootAdmin Google account can sign in.");
  }

  if (String(tokenInfo.email_verified) !== "true") {
    throw new Error("Google email is not verified.");
  }

  return tokenInfo;
}

function addPackage(payload) {
  const item = normalizePackage(payload);
  item.id = Utilities.getUuid();
  item.createdAt = new Date().toISOString();

  if (readTable("packages").some((pack) => pack.code === item.code)) {
    throw new Error("Package code already exists.");
  }

  appendRecord("packages", item);
  return { package: item };
}

function updatePackage(payload) {
  const packages = readTable("packages");
  const index = packages.findIndex((item) => item.id === payload.id);
  if (index < 0) {
    throw new Error("Package not found.");
  }

  const item = normalizePackage(payload);
  item.id = payload.id;
  item.createdAt = packages[index].createdAt;

  if (packages.some((pack) => pack.id !== item.id && pack.code === item.code)) {
    throw new Error("Package code already exists.");
  }

  writeRecord("packages", index, item);
  return { package: item };
}

function deletePackage(payload) {
  deleteById("packages", payload.id);
  return { id: payload.id };
}

function addCompany(payload) {
  const company = normalizeCompany(payload);
  company.id = Utilities.getUuid();
  company.createdAt = new Date().toISOString();
  appendRecord("companies", company);
  syncRootAdminMembership(company);
  return { company };
}

function updateCompany(payload) {
  const companies = readTable("companies");
  const index = companies.findIndex((company) => company.id === payload.id);
  if (index < 0) {
    throw new Error("Company not found.");
  }

  const company = normalizeCompany(payload);
  company.id = payload.id;
  company.createdAt = companies[index].createdAt;
  writeRecord("companies", index, company);
  syncRootAdminMembership(company);
  return { company };
}

function deleteCompany(payload) {
  deleteById("companies", payload.id);
  readTable("companyUsers")
    .filter((item) => item.companyId === payload.id)
    .forEach((item) => deleteById("companyUsers", item.id));
  return { id: payload.id };
}

function adminList() {
  ensureSingleSuperRootAdmin();
  const users = readTable("users").map(publicUser);
  return {
    users,
    packages: readTable("packages"),
    companies: readTable("companies").map((company) => enrichCompany(company, users))
  };
}

function requireSuperRootAdmin(requester) {
  const email = normalizeEmail(requester && requester.email);
  const role = String(requester && requester.role || "").toLowerCase();
  if (email !== SUPER_ROOT_ADMIN_EMAIL || role !== "superrootadmin") {
    throw new Error("Only SuperRootAdmin can use admin actions.");
  }
}

function listCompaniesForUser(payload) {
  const userId = String(payload.userId || "");
  const memberships = readTable("companyUsers").filter((item) => item.userId === userId);
  const companyIds = memberships.map((item) => item.companyId);
  const companies = readTable("companies")
    .filter((company) => company.rootAdminUserId === userId || companyIds.includes(company.id))
    .map((company) => enrichCompany(company, readTable("users").map(publicUser)));

  return { companies };
}

function getCompanyWorkspace(payload) {
  const companyId = String(payload.companyId || "");
  const company = readTable("companies").find((item) => item.id === companyId);
  if (!company) {
    throw new Error("Company not found.");
  }

  const packages = readTable("packages").filter((item) => packageCodes(company).includes(item.code));
  return {
    company: enrichCompany(company, readTable("users").map(publicUser)),
    packages,
    hasWeb: packages.some((item) => item.code === "web")
  };
}

function normalizePackage(payload) {
  const name = String(payload.name || "").trim();
  const code = String(payload.code || "").trim().toLowerCase();
  const description = String(payload.description || "").trim();

  if (!name || !code) {
    throw new Error("Package name and code are required.");
  }

  return { name, code, description };
}

function normalizeCompany(payload) {
  const name = String(payload.name || "").trim();
  if (name.length < 2) {
    throw new Error("Company name must have at least 2 characters.");
  }

  return {
    name,
    rootAdminUserId: String(payload.rootAdminUserId || ""),
    packageCodes: Array.isArray(payload.packageCodes) ? payload.packageCodes.join(",") : String(payload.packageCodes || "")
  };
}

function syncRootAdminMembership(company) {
  if (!company.rootAdminUserId) {
    return;
  }

  const memberships = readTable("companyUsers");
  const exists = memberships.some((item) => item.companyId === company.id && item.userId === company.rootAdminUserId);
  if (exists) {
    return;
  }

  appendRecord("companyUsers", {
    id: Utilities.getUuid(),
    companyId: company.id,
    userId: company.rootAdminUserId,
    role: "rootadmin",
    createdAt: new Date().toISOString()
  });
}

function enrichCompany(company, users) {
  const rootAdmin = users.find((user) => user.id === company.rootAdminUserId);
  return {
    id: company.id,
    name: company.name,
    rootAdminUserId: company.rootAdminUserId,
    rootAdminName: rootAdmin ? rootAdmin.name : "",
    packageCodes: packageCodes(company),
    createdAt: company.createdAt
  };
}

function packageCodes(company) {
  return String(company.packageCodes || "")
    .split(",")
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean);
}

function ensureDefaultPackages() {
  const packages = readTable("packages");
  const defaults = [
    { name: "Web", code: "web", description: "Kich hoat tinh nang web" },
    { name: "Addin", code: "addin", description: "Kich hoat tinh nang addin" }
  ];

  defaults.forEach((item) => {
    if (!packages.some((pack) => pack.code === item.code)) {
      appendRecord("packages", {
        id: Utilities.getUuid(),
        name: item.name,
        code: item.code,
        description: item.description,
        createdAt: new Date().toISOString()
      });
    }
  });
}

function ensureSingleSuperRootAdmin() {
  const users = readTable("users");
  users.forEach((user, index) => {
    const expectedRole = normalizeRoleForEmail(user.role || "user", user.email);
    if (user.role !== expectedRole) {
      user.role = expectedRole;
      writeRecord("users", index, user);
    }
  });
}

function normalizeRoleForEmail(role, email) {
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail === SUPER_ROOT_ADMIN_EMAIL) {
    return "superRootAdmin";
  }

  return String(role || "user").toLowerCase() === "superrootadmin" ? "user" : String(role || "user");
}

function getSheet(key) {
  const config = SHEETS[key];
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(config.name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(config.name);
    sheet.appendRow(config.headers);
    sheet.setFrozenRows(1);
  }

  const firstRow = sheet.getRange(1, 1, 1, config.headers.length).getValues()[0];
  const hasHeaders = config.headers.every((header, index) => firstRow[index] === header);
  if (!hasHeaders) {
    sheet.clear();
    sheet.appendRow(config.headers);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function readTable(key) {
  const sheet = getSheet(key);
  const headers = SHEETS[key].headers;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  return sheet
    .getRange(2, 1, lastRow - 1, headers.length)
    .getValues()
    .map((row) => {
      return headers.reduce((record, header, index) => {
        record[header] = row[index];
        return record;
      }, {});
    });
}

function appendRecord(key, record) {
  const sheet = getSheet(key);
  sheet.appendRow(SHEETS[key].headers.map((header) => record[header] || ""));
}

function writeRecord(key, index, record) {
  const sheet = getSheet(key);
  sheet
    .getRange(index + 2, 1, 1, SHEETS[key].headers.length)
    .setValues([SHEETS[key].headers.map((header) => record[header] || "")]);
}

function deleteById(key, id) {
  const rows = readTable(key);
  const index = rows.findIndex((row) => row.id === id);
  if (index >= 0) {
    getSheet(key).deleteRow(index + 2);
  }
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
    email: user.email,
    role: user.role || "user",
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
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
