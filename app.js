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

const config = window.DPUNITY_SUPABASE_CONFIG || {};
const isConfigured = Boolean(config.url && config.anonKey && !config.url.includes("YOUR_"));
const supabaseClient = isConfigured
  ? window.supabase.createClient(config.url, config.anonKey)
  : null;

function setMessage(text, type = "") {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`.trim();
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getDisplayName(user) {
  return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
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
  elements.welcomeName.textContent = `Xin chao, ${getDisplayName(user)}`;
  elements.welcomeEmail.textContent = user.email || "";
  elements.loginTab.classList.remove("active");
  elements.registerTab.classList.remove("active");
  elements.loginTab.setAttribute("aria-selected", "false");
  elements.registerTab.setAttribute("aria-selected", "false");
}

function requireSupabase() {
  if (supabaseClient) {
    return true;
  }

  setMessage("Chua cau hinh Supabase. Hay dien url va anonKey trong config.js.", "error");
  return false;
}

async function restoreSession() {
  if (!requireSupabase()) {
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setMessage(error.message, "error");
    return;
  }

  if (data.session?.user) {
    showDashboard(data.session.user);
    setMessage("Phien dang nhap da duoc khoi phuc.", "success");
  }
}

elements.loginTab.addEventListener("click", () => switchMode("login"));
elements.registerTab.addEventListener("click", () => switchMode("register"));

elements.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireSupabase()) {
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

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name
      }
    }
  });

  if (error) {
    setMessage(error.message, "error");
    return;
  }

  elements.registerForm.reset();
  if (data.session?.user) {
    showDashboard(data.session.user);
    setMessage("Tai khoan da duoc tao va dang nhap.", "success");
    return;
  }

  switchMode("login");
  setMessage("Tai khoan da duoc tao. Kiem tra email neu Supabase yeu cau xac thuc.", "success");
});

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireSupabase()) {
    return;
  }

  const formData = new FormData(elements.loginForm);
  const email = normalizeEmail(String(formData.get("email")));
  const password = String(formData.get("password"));

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setMessage(error.message, "error");
    return;
  }

  elements.loginForm.reset();
  showDashboard(data.user);
  setMessage("Dang nhap thanh cong.", "success");
});

elements.logoutButton.addEventListener("click", async () => {
  if (!requireSupabase()) {
    return;
  }

  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    setMessage(error.message, "error");
    return;
  }

  switchMode("login");
  setMessage("Ban da dang xuat.", "success");
});

restoreSession();
