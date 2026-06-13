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
  vi: {
    "Dang ky, dang nhap, chon cong ty va hien thi tinh nang theo goi da kich hoat.": "Đăng ký, đăng nhập, chọn công ty và hiển thị tính năng theo gói đã kích hoạt.",
    "Dang nhap": "Đăng nhập",
    "Dang ky": "Đăng ký",
    "Chao mung quay lai": "Chào mừng quay lại",
    "Dang nhap bang email va mat khau da luu trong Cloudflare D1.": "Đăng nhập bằng email và mật khẩu đã lưu trong Cloudflare D1.",
    "Mat khau": "Mật khẩu",
    "Nhap mat khau": "Nhập mật khẩu",
    "Quen mat khau?": "Quên mật khẩu?",
    "Quen mat khau": "Quên mật khẩu",
    "Nhap email tai khoan. He thong se tao yeu cau de SuperRootAdmin dat lai mat khau.": "Nhập email tài khoản. Hệ thống sẽ tạo yêu cầu để SuperRootAdmin đặt lại mật khẩu.",
    "Gui yeu cau": "Gửi yêu cầu",
    "Quay lai": "Quay lại",
    "Tao tai khoan": "Tạo tài khoản",
    "Tai khoan se duoc luu trong Cloudflare D1 va dung duoc tren moi thiet bi.": "Tài khoản sẽ được lưu trong Cloudflare D1 và dùng được trên mọi thiết bị.",
    "Ho ten": "Họ tên",
    "Nguyen Van A": "Nguyễn Văn A",
    "Toi thieu 8 ky tu": "Tối thiểu 8 ký tự",
    "Da dang nhap": "Đã đăng nhập",
    "Xin chao": "Xin chào",
    "Dang xuat": "Đăng xuất",
    "Chon cong ty": "Chọn công ty",
    "Tai lai": "Tải lại",
    "Dang tai": "Đang tải",
    "Doi cong ty": "Đổi công ty",
    "Nhan su": "Nhân sự",
    "Ghi chu cong ty": "Ghi chú công ty",
    "Tieu de": "Tiêu đề",
    "Cong viec can nho": "Công việc cần nhớ",
    "Mau nen": "Màu nền",
    "Quyen xem": "Quyền xem",
    "Noi dung": "Nội dung",
    "Luu note": "Lưu note",
    "Moi": "Mới",
    "Quan ly nhan su": "Quản lý nhân sự",
    "Email thanh vien": "Email thành viên",
    "Vai tro": "Vai trò",
    "Them thanh vien": "Thêm thành viên",
    "Ten": "Tên",
    "Da them thanh vien.": "Đã thêm thành viên.",
    "Da cap nhat vai tro.": "Đã cập nhật vai trò.",
    "Da xoa thanh vien khoi cong ty.": "Đã xóa thành viên khỏi công ty.",
    "Thanh vien cong ty": "Thành viên công ty",
    "Goi dang kich hoat": "Gói đang kích hoạt",
    "Chua co nhan su trong cong ty.": "Chưa có nhân sự trong công ty.",
    "Chua co nhan su khac trong cong ty.": "Chưa có nhân sự khác trong công ty.",
    "Chua co sticky note.": "Chưa có sticky note.",
    "Chi owner": "Chỉ owner",
    "Ca cong ty": "Cả công ty",
    "Duoc xem": "Được xem",
    "Sua": "Sửa",
    "Xoa": "Xóa",
    "Dang nhap quan tri": "Đăng nhập quản trị",
    "Dang nhap bang Google. Chi duy nhat tai khoan": "Đăng nhập bằng Google. Chỉ duy nhất tài khoản",
    "moi duoc vao trang nay.": "mới được vào trang này.",
    "Tai nut dang nhap Google": "Tải nút đăng nhập Google",
    "Quan tri he thong": "Quản trị hệ thống",
    "User da dang ky": "User đã đăng ký",
    "Nhap khi tao hoac doi mat khau": "Nhập khi tạo hoặc đổi mật khẩu",
    "Luu user": "Lưu user",
    "Goi kich hoat": "Gói kích hoạt",
    "Ten goi": "Tên gói",
    "Mo ta": "Mô tả",
    "Kich hoat tinh nang web": "Kích hoạt tính năng web",
    "Luu goi": "Lưu gói",
    "Yeu cau quen mat khau": "Yêu cầu quên mật khẩu",
    "Cong ty": "Công ty",
    "Ten cong ty": "Tên công ty",
    "Goi duoc kich hoat": "Gói được kích hoạt",
    "Luu cong ty": "Lưu công ty",
    "Ngon ngu": "Ngôn ngữ",
    "Giao dien": "Giao diện",
    "Sang": "Sáng",
    "Toi": "Tối",
    "Chua cau hinh Cloudflare Worker API URL trong config.js.": "Chưa cấu hình Cloudflare Worker API URL trong config.js.",
    "API loi HTTP": "API lỗi HTTP",
    "API tra ve loi.": "API trả về lỗi.",
    "Phien dang nhap da duoc khoi phuc.": "Phiên đăng nhập đã được khôi phục.",
    "Dang tai danh sach cong ty...": "Đang tải danh sách công ty...",
    "Chua co cong ty": "Chưa có công ty",
    "Tai khoan nay chua duoc gan vao cong ty nao. Hay vao trang Admin de tao cong ty va bo nhiem user lam rootadmin.": "Tài khoản này chưa được gán vào công ty nào. Hãy vào trang Admin để tạo công ty và bổ nhiệm user làm rootadmin.",
    "Chua gan": "Chưa gán",
    "Dang chon": "Đang chọn",
    "Dang mo workspace...": "Đang mở workspace...",
    "Mat khau can toi thieu 8 ky tu.": "Mật khẩu cần tối thiểu 8 ký tự.",
    "Dang tao tai khoan...": "Đang tạo tài khoản...",
    "Tai khoan da duoc tao.": "Tài khoản đã được tạo.",
    "Dang dang nhap...": "Đang đăng nhập...",
    "Dang nhap thanh cong.": "Đăng nhập thành công.",
    "Dang gui yeu cau...": "Đang gửi yêu cầu...",
    "Da gui yeu cau dat lai mat khau.": "Đã gửi yêu cầu đặt lại mật khẩu.",
    "Ban da dang xuat.": "Bạn đã đăng xuất.",
    "Dang tai workspace...": "Đang tải workspace...",
    "Cong ty nay chua duoc kich hoat goi Web. Day la trang gioi thieu chung cho den khi admin them package": "Công ty này chưa được kích hoạt gói Web. Đây là trang giới thiệu chung cho đến khi admin thêm package",
    "Sticky Note dang bi khoa": "Sticky Note đang bị khóa",
    "Cong ty nay can duoc gan package": "Công ty này cần được gán package",
    "trong trang Admin de su dung tinh nang Sticky Note.": "trong trang Admin để sử dụng tính năng Sticky Note.",
    "Cong ty can co package web de dung Sticky Note.": "Công ty cần có package web để dùng Sticky Note.",
    "Chua cau hinh googleClientId trong config.js.": "Chưa cấu hình googleClientId trong config.js.",
    "Google Sign-In dang tai. Bam nut tai lai neu nut Google chua hien.": "Google Sign-In đang tải. Bấm nút tải lại nếu nút Google chưa hiện.",
    "Dang xac thuc Google...": "Đang xác thực Google...",
    "Chi SuperRootAdmin hongocquocsang2721@gmail.com moi co quyen vao trang Admin.": "Chỉ SuperRootAdmin hongocquocsang2721@gmail.com mới có quyền vào trang Admin.",
    "Dang tai du lieu...": "Đang tải dữ liệu...",
    "Da tai du lieu.": "Đã tải dữ liệu.",
    "Chua co user.": "Chưa có user.",
    "Chua co goi.": "Chưa có gói.",
    "Chua co goi de gan.": "Chưa có gói để gán.",
    "Khong tim thay user": "Không tìm thấy user",
    "Chua co yeu cau.": "Chưa có yêu cầu.",
    "Mat khau bat buoc khi tao user.": "Mật khẩu bắt buộc khi tạo user.",
    "Da luu user.": "Đã lưu user.",
    "Da luu goi.": "Đã lưu gói.",
    "Da luu cong ty.": "Đã lưu công ty.",
    "Ban da dang xuat Admin.": "Bạn đã đăng xuất Admin.",
    "Da xoa user.": "Đã xóa user.",
    "Da xoa goi.": "Đã xóa gói.",
    "Da xoa cong ty.": "Đã xóa công ty.",
    "Da danh dau yeu cau da xu ly.": "Đã đánh dấu yêu cầu đã xử lý."
  }
};

Object.entries(translations.vi).forEach(([plain, accented]) => {
  if (translations.en[plain]) translations.en[accented] = translations.en[plain];
});

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
  if (getLanguage() === "vi") return translations.vi[text] || reverseTranslations[text] || text;
  return translations.en[text] || translations.en[translations.vi[text]] || text;
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
      <span data-i18n="Ngon ngu">Ngôn ngữ</span>
      <select id="languageSelect" aria-label="Language">
        <option value="vi">VI</option>
        <option value="en">EN</option>
      </select>
    </label>
    <label>
      <span data-i18n="Giao dien">Giao diện</span>
      <select id="themeSelect" aria-label="Theme">
        <option value="light" data-i18n="Sang">Sáng</option>
        <option value="dark" data-i18n="Toi">Tối</option>
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
