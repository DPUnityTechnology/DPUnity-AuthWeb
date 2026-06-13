const storageKeys = {
  users: "dpunity.auth.users",
  session: "dpunity.auth.session"
};

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

function getUsers() {
  return JSON.parse(localStorage.getItem(storageKeys.users) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(storageKeys.users, JSON.stringify(users));
}

function setMessage(text, type = "") {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`.trim();
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
  elements.welcomeName.textContent = `Xin chào, ${user.name}`;
  elements.welcomeEmail.textContent = user.email;
  elements.loginTab.classList.remove("active");
  elements.registerTab.classList.remove("active");
  elements.loginTab.setAttribute("aria-selected", "false");
  elements.registerTab.setAttribute("aria-selected", "false");
}

function restoreSession() {
  const sessionEmail = localStorage.getItem(storageKeys.session);
  if (!sessionEmail) {
    return;
  }

  const user = getUsers().find((item) => item.email === sessionEmail);
  if (user) {
    showDashboard(user);
    setMessage("Phiên đăng nhập đã được khôi phục.", "success");
  }
}

elements.loginTab.addEventListener("click", () => switchMode("login"));
elements.registerTab.addEventListener("click", () => switchMode("register"));

elements.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.registerForm);
  const name = String(formData.get("name")).trim();
  const email = normalizeEmail(String(formData.get("email")));
  const password = String(formData.get("password"));

  if (password.length < 8) {
    setMessage("Mật khẩu cần tối thiểu 8 ký tự.", "error");
    return;
  }

  const users = getUsers();
  if (users.some((user) => user.email === email)) {
    setMessage("Email này đã được đăng ký.", "error");
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  saveUsers([...users, user]);
  localStorage.setItem(storageKeys.session, email);
  elements.registerForm.reset();
  showDashboard(user);
  setMessage("Tài khoản đã được tạo và đăng nhập.", "success");
});

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.loginForm);
  const email = normalizeEmail(String(formData.get("email")));
  const password = String(formData.get("password"));
  const passwordHash = await hashPassword(password);
  const user = getUsers().find((item) => item.email === email && item.passwordHash === passwordHash);

  if (!user) {
    setMessage("Email hoặc mật khẩu không đúng.", "error");
    return;
  }

  localStorage.setItem(storageKeys.session, email);
  elements.loginForm.reset();
  showDashboard(user);
  setMessage("Đăng nhập thành công.", "success");
});

elements.logoutButton.addEventListener("click", () => {
  localStorage.removeItem(storageKeys.session);
  switchMode("login");
  setMessage("Bạn đã đăng xuất.", "success");
});

restoreSession();
