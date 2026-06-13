const adminSessionKey = "dpunity.admin.session";
const adminTokenKey = "dpunity.admin.google_id_token";
const superRootAdminEmail = "hongocquocsang2721@gmail.com";

const state = {
  users: [],
  packages: [],
  companies: [],
  adminUser: null
};

const els = {
  loginPanel: document.querySelector("#adminLoginPanel"),
  loginForm: document.querySelector("#adminLoginForm"),
  loginMessage: document.querySelector("#adminLoginMessage"),
  googleSignInButton: document.querySelector("#googleSignInButton"),
  googleFallbackButton: document.querySelector("#googleFallbackButton"),
  adminHeader: document.querySelector("#adminHeader"),
  adminContent: document.querySelector("#adminContent"),
  adminIdentity: document.querySelector("#adminIdentity"),
  logoutButton: document.querySelector("#adminLogoutButton"),
  message: document.querySelector("#adminMessage"),
  refreshButton: document.querySelector("#refreshButton"),
  userForm: document.querySelector("#userForm"),
  packageForm: document.querySelector("#packageForm"),
  companyForm: document.querySelector("#companyForm"),
  usersTable: document.querySelector("#usersTable"),
  packagesTable: document.querySelector("#packagesTable"),
  companiesTable: document.querySelector("#companiesTable"),
  rootAdminSelect: document.querySelector("#rootAdminSelect"),
  companyPackageChecks: document.querySelector("#companyPackageChecks")
};

const config = window.DPUNITY_API_CONFIG || {};
const apiUrl = config.apiUrl || "";
const googleClientId = config.googleClientId || "";
const isConfigured = Boolean(apiUrl && !apiUrl.includes("YOUR_"));

function setMessage(text, type = "") {
  els.message.textContent = text;
  els.message.className = `message ${type}`.trim();
}

function setLoginMessage(text, type = "") {
  els.loginMessage.textContent = text;
  els.loginMessage.className = `message ${type}`.trim();
}

async function callApi(action, payload = {}) {
  if (!isConfigured) {
    throw new Error("Chua cau hinh Cloudflare Worker API URL trong config.js.");
  }

  const requestPayload = {
    ...payload,
    idToken: sessionStorage.getItem(adminTokenKey) || payload.idToken
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload: requestPayload })
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

function isAdminUser(user) {
  return String(user?.email || "").toLowerCase() === superRootAdminEmail
    && String(user?.role || "").toLowerCase() === "superrootadmin";
}

function showAdminShell(user) {
  state.adminUser = user;
  sessionStorage.setItem(adminSessionKey, JSON.stringify(user));
  els.loginPanel.classList.add("hidden");
  els.adminHeader.classList.remove("hidden");
  els.adminContent.classList.remove("hidden");
  els.adminIdentity.textContent = `${user.name || user.email} - ${user.role}`;
  loadAdminData();
}

function showLoginShell(message = "") {
  state.adminUser = null;
  sessionStorage.removeItem(adminSessionKey);
  sessionStorage.removeItem(adminTokenKey);
  els.loginPanel.classList.remove("hidden");
  els.adminHeader.classList.add("hidden");
  els.adminContent.classList.add("hidden");
  if (message) {
    setLoginMessage(message, "success");
  }
}

function restoreAdminSession() {
  const rawSession = sessionStorage.getItem(adminSessionKey);
  if (!rawSession) {
    showLoginShell();
    return;
  }

  try {
    const user = JSON.parse(rawSession);
    if (isAdminUser(user)) {
      showAdminShell(user);
      return;
    }
  } catch {
    sessionStorage.removeItem(adminSessionKey);
  }

  showLoginShell();
}

async function submitGoogleAdminLogin(idToken) {
  try {
    setLoginMessage("Dang xac thuc Google...", "");
    const data = await callApi("googleAdminLogin", { idToken });
    if (!isAdminUser(data.user)) {
      setLoginMessage("Chi SuperRootAdmin hongocquocsang2721@gmail.com moi co quyen vao trang Admin.", "error");
      return;
    }

    setLoginMessage("");
    sessionStorage.setItem(adminTokenKey, idToken);
    showAdminShell(data.user);
  } catch (error) {
    setLoginMessage(error.message, "error");
  }
}

function initializeGoogleSignIn() {
  if (!googleClientId || googleClientId.includes("YOUR_")) {
    setLoginMessage("Chua cau hinh googleClientId trong config.js.", "error");
    return;
  }

  if (!window.google?.accounts?.id) {
    setLoginMessage("Google Sign-In dang tai. Bam nut tai lai neu nut Google chua hien.", "");
    return;
  }

  window.google.accounts.id.initialize({
    client_id: googleClientId,
    callback: (response) => submitGoogleAdminLogin(response.credential)
  });

  window.google.accounts.id.renderButton(els.googleSignInButton, {
    theme: "outline",
    size: "large",
    width: 320,
    text: "signin_with"
  });

  setLoginMessage("");
}

async function loadAdminData() {
  setMessage("Dang tai du lieu...", "");
  try {
    const data = await callApi("adminList");
    state.users = data.users || [];
    state.packages = data.packages || [];
    state.companies = data.companies || [];
    renderAll();
    setMessage("Da tai du lieu.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function renderAll() {
  renderUsers();
  renderPackages();
  renderCompanyControls();
  renderCompanies();
}

function renderUsers() {
  els.usersTable.innerHTML = state.users.map((user) => `
    <tr>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.role || "user")}</td>
      <td class="actions">
        <button class="secondary small" data-edit-user="${escapeHtml(user.id)}" type="button">Sua</button>
        <button class="danger small" data-delete-user="${escapeHtml(user.id)}" type="button">Xoa</button>
      </td>
    </tr>
  `).join("") || "<tr><td colspan=\"4\">Chua co user.</td></tr>";
}

function renderPackages() {
  els.packagesTable.innerHTML = state.packages.map((pack) => `
    <tr>
      <td>${escapeHtml(pack.name)}</td>
      <td>${escapeHtml(pack.code)}</td>
      <td>${escapeHtml(pack.description)}</td>
      <td class="actions">
        <button class="secondary small" data-edit-package="${escapeHtml(pack.id)}" type="button">Sua</button>
        <button class="danger small" data-delete-package="${escapeHtml(pack.id)}" type="button">Xoa</button>
      </td>
    </tr>
  `).join("") || "<tr><td colspan=\"4\">Chua co goi.</td></tr>";
}

function renderCompanyControls() {
  els.rootAdminSelect.innerHTML = "<option value=\"\">Chua gan</option>" + state.users.map((user) => `
    <option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} (${escapeHtml(user.email)})</option>
  `).join("");

  els.companyPackageChecks.innerHTML = state.packages.map((pack) => `
    <label class="check-item">
      <input type="checkbox" name="packageCodes" value="${escapeHtml(pack.code)}">
      ${escapeHtml(pack.name)} <span>${escapeHtml(pack.code)}</span>
    </label>
  `).join("") || "<p class=\"muted\">Chua co goi de gan.</p>";
}

function renderCompanies() {
  els.companiesTable.innerHTML = state.companies.map((company) => `
    <tr>
      <td>${escapeHtml(company.name)}</td>
      <td>${escapeHtml(company.rootAdminName || "Chua gan")}</td>
      <td>${(company.packageCodes || []).map((code) => `<span class="pill">${escapeHtml(code)}</span>`).join("")}</td>
      <td class="actions">
        <button class="secondary small" data-edit-company="${escapeHtml(company.id)}" type="button">Sua</button>
        <button class="danger small" data-delete-company="${escapeHtml(company.id)}" type="button">Xoa</button>
      </td>
    </tr>
  `).join("") || "<tr><td colspan=\"4\">Chua co cong ty.</td></tr>";
}

async function submitUser(event) {
  event.preventDefault();
  const formData = new FormData(els.userForm);
  const payload = Object.fromEntries(formData.entries());
  const action = payload.id ? "updateUser" : "addUser";

  if (!payload.id && !payload.password) {
    setMessage("Mat khau bat buoc khi tao user.", "error");
    return;
  }

  try {
    await callApi(action, payload);
    els.userForm.reset();
    els.userForm.elements.role.value = "user";
    await loadAdminData();
    setMessage("Da luu user.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function submitPackage(event) {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(els.packageForm).entries());
  const action = payload.id ? "updatePackage" : "addPackage";

  try {
    await callApi(action, payload);
    els.packageForm.reset();
    await loadAdminData();
    setMessage("Da luu goi.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function submitCompany(event) {
  event.preventDefault();
  const formData = new FormData(els.companyForm);
  const payload = Object.fromEntries(formData.entries());
  payload.packageCodes = formData.getAll("packageCodes");
  const action = payload.id ? "updateCompany" : "addCompany";

  try {
    await callApi(action, payload);
    els.companyForm.reset();
    await loadAdminData();
    setMessage("Da luu cong ty.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function editUser(id) {
  const user = state.users.find((item) => item.id === id);
  if (!user) return;
  els.userForm.elements.id.value = user.id;
  els.userForm.elements.name.value = user.name || "";
  els.userForm.elements.email.value = user.email || "";
  els.userForm.elements.password.value = "";
  els.userForm.elements.role.value = user.role || "user";
}

function editPackage(id) {
  const pack = state.packages.find((item) => item.id === id);
  if (!pack) return;
  els.packageForm.elements.id.value = pack.id;
  els.packageForm.elements.name.value = pack.name || "";
  els.packageForm.elements.code.value = pack.code || "";
  els.packageForm.elements.description.value = pack.description || "";
}

function editCompany(id) {
  const company = state.companies.find((item) => item.id === id);
  if (!company) return;
  els.companyForm.elements.id.value = company.id;
  els.companyForm.elements.name.value = company.name || "";
  els.companyForm.elements.rootAdminUserId.value = company.rootAdminUserId || "";
  els.companyForm.querySelectorAll("input[name='packageCodes']").forEach((input) => {
    input.checked = (company.packageCodes || []).includes(input.value);
  });
}

async function deleteRecord(action, id, successMessage) {
  try {
    await callApi(action, { id });
    await loadAdminData();
    setMessage(successMessage, "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function resetForm(id) {
  const form = document.querySelector(`#${id}`);
  if (!form) return;
  form.reset();
  const idInput = form.querySelector("input[name='id']");
  if (idInput) idInput.value = "";
  if (id === "userForm") form.elements.role.value = "user";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

els.loginForm.addEventListener("submit", (event) => event.preventDefault());
els.googleFallbackButton.addEventListener("click", initializeGoogleSignIn);
els.logoutButton.addEventListener("click", () => showLoginShell("Ban da dang xuat Admin."));
els.refreshButton.addEventListener("click", loadAdminData);
els.userForm.addEventListener("submit", submitUser);
els.packageForm.addEventListener("submit", submitPackage);
els.companyForm.addEventListener("submit", submitCompany);

document.addEventListener("click", (event) => {
  const target = event.target;
  const reset = target.closest("[data-reset-form]");
  if (reset) resetForm(reset.dataset.resetForm);

  const editUserButton = target.closest("[data-edit-user]");
  if (editUserButton) editUser(editUserButton.dataset.editUser);

  const deleteUserButton = target.closest("[data-delete-user]");
  if (deleteUserButton) deleteRecord("deleteUser", deleteUserButton.dataset.deleteUser, "Da xoa user.");

  const editPackageButton = target.closest("[data-edit-package]");
  if (editPackageButton) editPackage(editPackageButton.dataset.editPackage);

  const deletePackageButton = target.closest("[data-delete-package]");
  if (deletePackageButton) deleteRecord("deletePackage", deletePackageButton.dataset.deletePackage, "Da xoa goi.");

  const editCompanyButton = target.closest("[data-edit-company]");
  if (editCompanyButton) editCompany(editCompanyButton.dataset.editCompany);

  const deleteCompanyButton = target.closest("[data-delete-company]");
  if (deleteCompanyButton) deleteRecord("deleteCompany", deleteCompanyButton.dataset.deleteCompany, "Da xoa cong ty.");
});

window.addEventListener("load", initializeGoogleSignIn);
restoreAdminSession();
