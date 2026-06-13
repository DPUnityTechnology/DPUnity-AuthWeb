const preferenceKeys = {
  language: "dpunity.ui.language",
  theme: "dpunity.ui.theme"
};

const translations = {
  en: {
    "Portal": "Portal",
    "Admin": "Admin",
    "User Portal": "User Portal",
    "Company Workspace": "Company Workspace",
    "Dang ky, dang nhap, chon cong ty va hien thi tinh nang theo goi da kich hoat.": "Register, sign in, choose a company, and see features based on activated packages.",
    "Dang nhap": "Sign in",
    "Dang ky": "Register",
    "Chao mung quay lai": "Welcome back",
    "Dang nhap bang email va mat khau da luu trong Cloudflare D1.": "Sign in with the email and password stored in Cloudflare D1.",
    "Mat khau": "Password",
    "Nhap mat khau": "Enter password",
    "Quen mat khau?": "Forgot password?",
    "Quen mat khau": "Forgot password",
    "Nhap email tai khoan. He thong se tao yeu cau de SuperRootAdmin dat lai mat khau.": "Enter your account email. The system will create a request for the SuperRootAdmin to reset the password.",
    "Gui yeu cau": "Send request",
    "Quay lai": "Back",
    "Tao tai khoan": "Create account",
    "Tai khoan se duoc luu trong Cloudflare D1 va dung duoc tren moi thiet bi.": "The account will be stored in Cloudflare D1 and can be used from any device.",
    "Ho ten": "Full name",
    "Nguyen Van A": "John Smith",
    "Toi thieu 8 ky tu": "At least 8 characters",
    "Da dang nhap": "Signed in",
    "Xin chao": "Hello",
    "Dang xuat": "Sign out",
    "Company": "Company",
    "Chon cong ty": "Choose company",
    "Tai lai": "Refresh",
    "Dang tai": "Loading",
    "Doi cong ty": "Change company",
    "Nhan su": "People",
    "Sticky Note": "Sticky Note",
    "Sticky Notes": "Sticky Notes",
    "Ghi chu cong ty": "Company notes",
    "Tieu de": "Title",
    "Cong viec can nho": "Task to remember",
    "Mau nen": "Background color",
    "Quyen xem": "View permission",
    "Noi dung": "Content",
    "Luu note": "Save note",
    "Moi": "New",
    "People": "People",
    "Quan ly nhan su": "People management",
    "Email thanh vien": "Member email",
    "Vai tro": "Role",
    "Them thanh vien": "Add member",
    "Ten": "Name",
    "Da them thanh vien.": "Member added.",
    "Da cap nhat vai tro.": "Role updated.",
    "Da xoa thanh vien khoi cong ty.": "Member removed from company.",
    "Thanh vien cong ty": "Company members",
    "Goi dang kich hoat": "Activated packages",
    "Chua co nhan su trong cong ty.": "There are no people in this company.",
    "Chua co nhan su khac trong cong ty.": "There are no other people in this company.",
    "Chua co sticky note.": "No sticky notes yet.",
    "Chi owner": "Owner only",
    "Ca cong ty": "Whole company",
    "Duoc xem": "Visible to",
    "Sua": "Edit",
    "Xoa": "Delete",
    "Secure Admin": "Secure Admin",
    "Dang nhap quan tri": "Admin sign in",
    "Dang nhap bang Google. Chi duy nhat tai khoan": "Sign in with Google. Only the account",
    "moi duoc vao trang nay.": "can access this page.",
    "Tai nut dang nhap Google": "Load Google sign-in button",
    "Control Center": "Control Center",
    "Quan tri he thong": "System administration",
    "User da dang ky": "Registered users",
    "Mat khau": "Password",
    "Nhap khi tao hoac doi mat khau": "Enter when creating or changing password",
    "Luu user": "Save user",
    "Goi kich hoat": "Activation packages",
    "Ten goi": "Package name",
    "Mo ta": "Description",
    "Kich hoat tinh nang web": "Activate web features",
    "Luu goi": "Save package",
    "Yeu cau quen mat khau": "Password reset requests",
    "Cong ty": "Company",
    "Ten cong ty": "Company name",
    "Goi duoc kich hoat": "Activated packages",
    "Luu cong ty": "Save company",
    "Root admin": "Root admin",
    "Packages": "Packages",
    "Status": "Status",
    "Ngon ngu": "Language",
    "Giao dien": "Theme",
    "Sang": "Light",
    "Toi": "Dark"
  },
  vi: {}
};

const reverseTranslations = Object.fromEntries(
  Object.entries(translations.en).map(([vi, en]) => [en, vi])
);

let isApplyingI18n = false;
let observerStarted = false;

function getLanguage() {
  return localStorage.getItem(preferenceKeys.language) || "vi";
}

function getTheme() {
  return localStorage.getItem(preferenceKeys.theme) || "light";
}

function translate(value) {
  const text = String(value || "").trim();
  if (!text) return text;
  if (getLanguage() === "vi") return reverseTranslations[text] || text;
  return translations.en[text] || text;
}

function applyTheme() {
  document.documentElement.dataset.theme = getTheme();
}

function applyI18n(root = document.body) {
  if (!root || isApplyingI18n) return;
  isApplyingI18n = true;
  document.documentElement.lang = getLanguage();

  root.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = translate(key);
  });

  root.querySelectorAll("[placeholder]").forEach((node) => {
    node.placeholder = translate(node.getAttribute("placeholder"));
  });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const original = node.nodeValue.trim();
    const translated = translate(original);
    if (translated !== original) {
      node.nodeValue = node.nodeValue.replace(original, translated);
    }
  });

  isApplyingI18n = false;
}

function injectPreferenceControls() {
  const topbar = document.querySelector(".topbar");
  if (!topbar || topbar.querySelector(".preference-controls")) return;

  const controls = document.createElement("div");
  controls.className = "preference-controls";
  controls.innerHTML = `
    <label>
      <span data-i18n="Ngon ngu">Ngon ngu</span>
      <select id="languageSelect" aria-label="Language">
        <option value="vi">VI</option>
        <option value="en">EN</option>
      </select>
    </label>
    <label>
      <span data-i18n="Giao dien">Giao dien</span>
      <select id="themeSelect" aria-label="Theme">
        <option value="light" data-i18n="Sang">Sang</option>
        <option value="dark" data-i18n="Toi">Toi</option>
      </select>
    </label>
  `;
  topbar.appendChild(controls);

  const languageSelect = controls.querySelector("#languageSelect");
  const themeSelect = controls.querySelector("#themeSelect");
  languageSelect.value = getLanguage();
  themeSelect.value = getTheme();

  languageSelect.addEventListener("change", () => {
    localStorage.setItem(preferenceKeys.language, languageSelect.value);
    applyI18n(document.body);
  });
  themeSelect.addEventListener("change", () => {
    localStorage.setItem(preferenceKeys.theme, themeSelect.value);
    applyTheme();
  });
}

function startI18nObserver() {
  if (observerStarted || !document.body) return;
  observerStarted = true;
  const observer = new MutationObserver((mutations) => {
    if (isApplyingI18n) return;
    const shouldApply = mutations.some((mutation) => mutation.addedNodes.length > 0);
    if (shouldApply) window.requestAnimationFrame(() => applyI18n(document.body));
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function initUiPreferences() {
  applyTheme();
  injectPreferenceControls();
  applyI18n(document.body);
  startI18nObserver();
}

window.DPUnityUI = {
  t: translate,
  applyI18n,
  applyTheme,
  getLanguage,
  getTheme
};

document.addEventListener("DOMContentLoaded", initUiPreferences);
