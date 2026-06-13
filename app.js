const sessionKey = "dpunity.api.session";

const elements = {
  loginTab: document.querySelector("#loginTab"),
  registerTab: document.querySelector("#registerTab"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  forgotPasswordForm: document.querySelector("#forgotPasswordForm"),
  forgotPasswordButton: document.querySelector("#forgotPasswordButton"),
  backToLoginButton: document.querySelector("#backToLoginButton"),
  dashboard: document.querySelector("#dashboard"),
  logoutButton: document.querySelector("#logoutButton"),
  message: document.querySelector("#message"),
  welcomeName: document.querySelector("#welcomeName"),
  welcomeEmail: document.querySelector("#welcomeEmail"),
  companySection: document.querySelector("#companySection"),
  companyList: document.querySelector("#companyList"),
  refreshCompaniesButton: document.querySelector("#refreshCompaniesButton"),
  featureSection: document.querySelector("#featureSection"),
  featureContent: document.querySelector("#featureContent"),
  selectedCompanyName: document.querySelector("#selectedCompanyName")
};

const config = window.DPUNITY_API_CONFIG || {};
const apiUrl = config.apiUrl || "";
const isConfigured = Boolean(apiUrl && !apiUrl.includes("YOUR_"));
let currentUser = null;

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
  elements.forgotPasswordForm.classList.remove("active");
  elements.dashboard.classList.remove("active");
  elements.companySection.classList.add("hidden");
  elements.featureSection.classList.add("hidden");
  setMessage("");
}

function showDashboard(user) {
  currentUser = user;
  elements.loginForm.classList.remove("active");
  elements.registerForm.classList.remove("active");
  elements.dashboard.classList.add("active");
  elements.companySection.classList.remove("hidden");
  elements.welcomeName.textContent = `Xin chao, ${user.name || user.email}`;
  elements.welcomeEmail.textContent = user.email || "";
  elements.loginTab.classList.remove("active");
  elements.registerTab.classList.remove("active");
  elements.loginTab.setAttribute("aria-selected", "false");
  elements.registerTab.setAttribute("aria-selected", "false");
  loadCompanies();
}

function requireApi() {
  if (isConfigured) {
    return true;
  }

  setMessage("Chua cau hinh Cloudflare Worker API URL trong config.js.", "error");
  return false;
}

async function callApi(action, payload = {}) {
  if (!requireApi()) {
    return null;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload })
  });

  if (!response.ok) {
    throw new Error(`API loi HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error || "API tra ve loi.");
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

async function loadCompanies() {
  if (!currentUser) {
    return;
  }

  elements.companyList.innerHTML = "<p class=\"muted\">Dang tai danh sach cong ty...</p>";
  elements.featureSection.classList.add("hidden");

  try {
    const data = await callApi("listCompaniesForUser", { userId: currentUser.id });
    renderCompanies(data.companies || []);
  } catch (error) {
    elements.companyList.innerHTML = `<p class="message error">${escapeHtml(error.message)}</p>`;
  }
}

function renderCompanies(companies) {
  if (!companies.length) {
    elements.companyList.innerHTML = `
      <article class="data-card">
        <h3>Chua co cong ty</h3>
        <p class="muted">Tai khoan nay chua duoc gan vao cong ty nao. Hay vao trang Admin de tao cong ty va bo nhiem user lam rootadmin.</p>
      </article>
    `;
    return;
  }

  elements.companyList.innerHTML = companies.map((company) => `
    <article class="data-card">
      <h3>${escapeHtml(company.name)}</h3>
      <p class="muted">Root admin: ${escapeHtml(company.rootAdminName || "Chua gan")}</p>
      <p class="pill-row">${company.packageCodes.map((code) => `<span class="pill">${escapeHtml(code)}</span>`).join("") || "<span class=\"pill muted-pill\">no package</span>"}</p>
      <button class="primary choose-company" type="button" data-company-id="${escapeHtml(company.id)}">Chon cong ty</button>
    </article>
  `).join("");
}

async function chooseCompany(companyId) {
  elements.featureSection.classList.remove("hidden");
  elements.featureContent.innerHTML = "<p class=\"muted\">Dang tai workspace...</p>";

  try {
    const data = await callApi("getCompanyWorkspace", { companyId, userId: currentUser.id });
    elements.selectedCompanyName.textContent = data.company.name;
    renderWorkspace(data);
  } catch (error) {
    elements.featureContent.innerHTML = `<p class="message error">${escapeHtml(error.message)}</p>`;
  }
}

function renderWorkspace(data) {
  if (!data.hasWeb) {
    elements.featureContent.innerHTML = `
      <article class="intro-panel">
        <h3>DPUnity Platform</h3>
        <p>Cong ty nay chua duoc kich hoat goi Web. Day la trang gioi thieu chung cho den khi admin them package <strong>web</strong>.</p>
      </article>
    `;
    return;
  }

  elements.featureContent.innerHTML = `
    <div class="item-grid">
      <article class="data-card">
        <h3>Web Dashboard</h3>
        <p class="muted">Goi Web da duoc kich hoat cho cong ty nay.</p>
      </article>
      <article class="data-card">
        <h3>User Workspace</h3>
        <p class="muted">Khu vuc tinh nang se duoc mo rong theo package trong database.</p>
      </article>
      <article class="data-card">
        <h3>Enabled Packages</h3>
        <p class="pill-row">${data.packages.map((pack) => `<span class="pill">${escapeHtml(pack.code)}</span>`).join("")}</p>
      </article>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

elements.loginTab.addEventListener("click", () => switchMode("login"));
elements.registerTab.addEventListener("click", () => switchMode("register"));
elements.refreshCompaniesButton.addEventListener("click", loadCompanies);
elements.forgotPasswordButton.addEventListener("click", () => {
  elements.loginForm.classList.remove("active");
  elements.registerForm.classList.remove("active");
  elements.forgotPasswordForm.classList.add("active");
  setMessage("");
});
elements.backToLoginButton.addEventListener("click", () => switchMode("login"));

elements.companyList.addEventListener("click", (event) => {
  const button = event.target.closest(".choose-company");
  if (button) {
    chooseCompany(button.dataset.companyId);
  }
});

elements.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
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
    const data = await callApi("register", { name, email, password });
    elements.registerForm.reset();
    saveSession(data.user);
    showDashboard(data.user);
    setMessage("Tai khoan da duoc tao.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
});

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.loginForm);
  const email = normalizeEmail(String(formData.get("email")));
  const password = String(formData.get("password"));

  try {
    setMessage("Dang dang nhap...", "");
    const data = await callApi("login", { email, password });
    elements.loginForm.reset();
    saveSession(data.user);
    showDashboard(data.user);
    setMessage("Dang nhap thanh cong.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
});

elements.forgotPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.forgotPasswordForm);
  const email = normalizeEmail(String(formData.get("email")));

  try {
    setMessage("Dang gui yeu cau...", "");
    const data = await callApi("requestPasswordReset", { email });
    elements.forgotPasswordForm.reset();
    switchMode("login");
    setMessage(data.message || "Da gui yeu cau dat lai mat khau.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
});

elements.logoutButton.addEventListener("click", () => {
  currentUser = null;
  sessionStorage.removeItem(sessionKey);
  switchMode("login");
  setMessage("Ban da dang xuat.", "success");
});

restoreSession();
