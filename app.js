const sessionKey = "dpunity.sheets.session";

const elements = {
  loginTab: document.querySelector("#loginTab"),
  registerTab: document.querySelector("#registerTab"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  dashboard: document.querySelector("#dashboard"),
  logoutButton: document.querySelector("#logoutButton"),
  message: document.querySelector("#message"),
  welcomeName: document.querySelector("#welcomeName"),
  welcomeEmail: document.querySelector("#welcomeEmail")
};

const config = window.DPUNITY_SHEETS_CONFIG || {};
const apiUrl = config.apiUrl || "";
const isConfigured = Boolean(apiUrl && !apiUrl.includes("YOUR_"));

function setMessage(text, type = "") {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`.trim();
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function switchMode(mode) {
  const isLogin = mode === "login";
  elements.loginTab.classList.toggle("active", isLogin);
  elements.registerTab.classList.toggle("active", !isLogin);
  elements.loginTab.setAttribute("aria-selected", String(isLogin));
  elements.registerTab.setAttribute("aria-selected", String(!isLogin));
  elements.loginForm.classList.toggle("active", isLogin);
  elements.registerForm.classList.toggle("active", !isLogin);
  elements.dashboard.classList.remove("active");
  setMessage("");
}

function showDashboard(user) {
  elements.loginForm.classList.remove("active");
  elements.registerForm.classList.remove("active");
  elements.dashboard.classList.add("active");
  elements.welcomeName.textContent = `Xin chao, ${user.name || user.email}`;
  elements.welcomeEmail.textContent = user.email || "";
  elements.loginTab.classList.remove("active");
  elements.registerTab.classList.remove("active");
  elements.loginTab.setAttribute("aria-selected", "false");
  elements.registerTab.setAttribute("aria-selected", "false");
}

function requireSheetsApi() {
  if (isConfigured) {
    return true;
  }

  setMessage("Chua cau hinh Google Apps Script Web App URL trong config.js.", "error");
  return false;
}

async function callSheetsApi(action, payload = {}) {
  if (!requireSheetsApi()) {
    return null;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action,
      payload
    })
  });

  if (!response.ok) {
    throw new Error(`Google Sheets API loi HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error || "Google Sheets API tra ve loi.");
  }

  return result.data;
}

function saveSession(user) {
  sessionStorage.setItem(sessionKey, JSON.stringify(user));
}

function restoreSession() {
  const rawSession = sessionStorage.getItem(sessionKey);
  if (!rawSession) {
    return;
  }

  try {
    showDashboard(JSON.parse(rawSession));
    setMessage("Phien dang nhap da duoc khoi phuc.", "success");
  } catch {
    sessionStorage.removeItem(sessionKey);
  }
}

elements.loginTab.addEventListener("click", () => switchMode("login"));
elements.registerTab.addEventListener("click", () => switchMode("register"));

elements.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireSheetsApi()) {
    return;
  }

  const formData = new FormData(elements.registerForm);
  const name = String(formData.get("name")).trim();
  const email = normalizeEmail(String(formData.get("email")));
  const password = String(formData.get("password"));

  if (password.length < 8) {
    setMessage("Mat khau can toi thieu 8 ky tu.", "error");
    return;
  }

  try {
    setMessage("Dang tao tai khoan...", "");
    const data = await callSheetsApi("register", { name, email, password });
    elements.registerForm.reset();
    saveSession(data.user);
    showDashboard(data.user);
    setMessage("Tai khoan da duoc tao trong Google Sheet.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
});

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireSheetsApi()) {
    return;
  }

  const formData = new FormData(elements.loginForm);
  const email = normalizeEmail(String(formData.get("email")));
  const password = String(formData.get("password"));

  try {
    setMessage("Dang dang nhap...", "");
    const data = await callSheetsApi("login", { email, password });
    elements.loginForm.reset();
    saveSession(data.user);
    showDashboard(data.user);
    setMessage("Dang nhap thanh cong.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
});

elements.logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(sessionKey);
  switchMode("login");
  setMessage("Ban da dang xuat.", "success");
});

restoreSession();
