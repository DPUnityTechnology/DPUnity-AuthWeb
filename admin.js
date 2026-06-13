const adminSessionKey = "dpunity.admin.session";
const adminTokenKey = "dpunity.admin.google_id_token";
const superRootAdminEmail = "hongocquocsang2721@gmail.com";

const state = {
  users: [],
  packages: [],
  companies: [],
  passwordResetRequests: [],
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
  passwordResetTable: document.querySelector("#passwordResetTable"),
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
    throw new Error("Chưa cấu hình Cloudflare Worker API URL trong config.js.");
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
    throw new Error(`API lỗi HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error || "API trả về lỗi.");
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
    setLoginMessage("Đang xác thực Google...", "");
    const data = await callApi("googleAdminLogin", { idToken });
    if (!isAdminUser(data.user)) {
      setLoginMessage("Chỉ SuperRootAdmin hongocquocsang2721@gmail.com mới có quyền vào trang Admin.", "error");
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
    setLoginMessage("Chưa cấu hình googleClientId trong config.js.", "error");
    return;
  }

  if (!window.google?.accounts?.id) {
    setLoginMessage("Google Sign-In đang tải. Bấm nút tải lại nếu nút Google chưa hiện.", "");
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
  setMessage("Đang tải dữ liệu...", "");
  try {
    const data = await callApi("adminList");
    state.users = data.users || [];
    state.packages = data.packages || [];
    state.companies = data.companies || [];
    state.passwordResetRequests = data.passwordResetRequests || [];
    renderAll();
    setMessage("Đã tải dữ liệu.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function renderAll() {
  renderUsers();
  renderPackages();
  renderCompanyControls();
  renderCompanies();
  renderPasswordResetRequests();
}

function renderUsers() {
  els.usersTable.innerHTML = state.users.map((user) => `
    <tr>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.role || "user")}</td>
      <td class="actions">
        <button class="secondary small" data-edit-user="${escapeHtml(user.id)}" type="button">Sửa</button>
        <button class="danger small" data-delete-user="${escapeHtml(user.id)}" type="button">Xóa</button>
      </td>
    </tr>
  `).join("") || "<tr><td colspan=\"4\">Chưa có user.</td></tr>";
}

function renderPackages() {
  els.packagesTable.innerHTML = state.packages.map((pack) => `
    <tr>
      <td>${escapeHtml(pack.name)}</td>
      <td>${escapeHtml(pack.code)}</td>
      <td>${escapeHtml(pack.description)}</td>
      <td class="actions">
        <button class="secondary small" data-edit-package="${escapeHtml(pack.id)}" type="button">Sửa</button>
        <button class="danger small" data-delete-package="${escapeHtml(pack.id)}" type="button">Xóa</button>
      </td>
    </tr>
  `).join("") || "<tr><td colspan=\"4\">Chưa có gói.</td></tr>";
}

function renderCompanyControls() {
  els.rootAdminSelect.innerHTML = "<option value=\"\">Chưa gán</option>" + state.users.map((user) => `
    <option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} (${escapeHtml(user.email)})</option>
  `).join("");

  els.companyPackageChecks.innerHTML = state.packages.map((pack) => `
    <label class="check-item">
      <input type="checkbox" name="packageCodes" value="${escapeHtml(pack.code)}">
      ${escapeHtml(pack.name)} <span>${escapeHtml(pack.code)}</span>
    </label>
  `).join("") || "<p class=\"muted\">Chưa có gói để gán.</p>";
}

function renderCompanies() {
  els.companiesTable.innerHTML = state.companies.map((company) => `
    <tr>
      <td>${escapeHtml(company.name)}</td>
      <td>${escapeHtml(company.rootAdminName || "Chưa gán")}</td>
      <td>${(company.packageCodes || []).map((code) => `<span class="pill">${escapeHtml(code)}</span>`).join("")}</td>
      <td class="actions">
        <button class="secondary small" data-edit-company="${escapeHtml(company.id)}" type="button">Sửa</button>
        <button class="danger small" data-delete-company="${escapeHtml(company.id)}" type="button">Xóa</button>
      </td>
    </tr>
  `).join("") || "<tr><td colspan=\"4\">Chưa có công ty.</td></tr>";
}

function renderPasswordResetRequests() {
  els.passwordResetTable.innerHTML = state.passwordResetRequests.map((request) => `
    <tr>
      <td>${escapeHtml(request.email)}</td>
      <td>${escapeHtml(request.userName || request.userId || "Không tìm thấy user")}</td>
      <td><span class="pill ${request.status === "resolved" ? "muted-pill" : ""}">${escapeHtml(request.status)}</span></td>
      <td class="actions">
        ${request.status === "resolved" ? "" : `<button class="secondary small" data-edit-reset-user="${escapeHtml(request.userId || "")}" type="button">Sửa user</button>`}
        ${request.status === "resolved" ? "" : `<button class="danger small" data-resolve-reset="${escapeHtml(request.id)}" type="button">Đã xử lý</button>`}
      </td>
    </tr>
  `).join("") || "<tr><td colspan=\"4\">Chưa có yêu cầu.</td></tr>";
}

async function submitUser(event) {
  event.preventDefault();
  const formData = new FormData(els.userForm);
  const payload = Object.fromEntries(formData.entries());
  const action = payload.id ? "updateUser" : "addUser";

  if (!payload.id && !payload.password) {
    setMessage("Mật khẩu bắt buộc khi tạo user.", "error");
    return;
  }

  try {
    await callApi(action, payload);
    els.userForm.reset();
    els.userForm.elements.role.value = "user";
    await loadAdminData();
    setMessage("Đã lưu user.", "success");
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
    setMessage("Đã lưu gói.", "success");
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
    setMessage("Đã lưu công ty.", "success");
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
els.logoutButton.addEventListener("click", () => showLoginShell("Bạn đã đăng xuất Admin."));
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
  if (deleteUserButton) deleteRecord("deleteUser", deleteUserButton.dataset.deleteUser, "Đã xóa user.");

  const editPackageButton = target.closest("[data-edit-package]");
  if (editPackageButton) editPackage(editPackageButton.dataset.editPackage);

  const deletePackageButton = target.closest("[data-delete-package]");
  if (deletePackageButton) deleteRecord("deletePackage", deletePackageButton.dataset.deletePackage, "Đã xóa gói.");

  const editCompanyButton = target.closest("[data-edit-company]");
  if (editCompanyButton) editCompany(editCompanyButton.dataset.editCompany);

  const deleteCompanyButton = target.closest("[data-delete-company]");
  if (deleteCompanyButton) deleteRecord("deleteCompany", deleteCompanyButton.dataset.deleteCompany, "Đã xóa công ty.");

  const editResetUserButton = target.closest("[data-edit-reset-user]");
  if (editResetUserButton && editResetUserButton.dataset.editResetUser) editUser(editResetUserButton.dataset.editResetUser);

  const resolveResetButton = target.closest("[data-resolve-reset]");
  if (resolveResetButton) deleteRecord("resolvePasswordReset", resolveResetButton.dataset.resolveReset, "Đã đánh dấu yêu cầu đã xử lý.");
});

window.addEventListener("load", initializeGoogleSignIn);
restoreAdminSession();
