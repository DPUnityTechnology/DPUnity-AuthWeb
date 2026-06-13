const sessionKey = "dpunity.api.session";
const config = window.DPUNITY_API_CONFIG || {};
const apiUrl = config.apiUrl || "";
const isConfigured = Boolean(apiUrl && !apiUrl.includes("YOUR_"));
const params = new URLSearchParams(window.location.search);
const companyId = params.get("companyId") || sessionStorage.getItem("dpunity.selected.company");

const els = {
  companyName: document.querySelector("#workspaceCompanyName"),
  user: document.querySelector("#workspaceUser"),
  message: document.querySelector("#workspaceMessage"),
  tabs: document.querySelector("#workspaceTabs"),
  dashboardView: document.querySelector("#dashboardView"),
  notesView: document.querySelector("#notesView"),
  dashboardContent: document.querySelector("#dashboardContent"),
  stickyForm: document.querySelector("#stickyForm"),
  resetStickyButton: document.querySelector("#resetStickyButton"),
  stickyList: document.querySelector("#stickyList")
};

let currentUser = null;
let workspace = null;

function setMessage(text, type = "") {
  els.message.textContent = text;
  els.message.className = `message ${type}`.trim();
}

async function callApi(action, payload = {}) {
  if (!isConfigured) throw new Error("Chua cau hinh Cloudflare Worker API URL trong config.js.");
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload })
  });
  if (!response.ok) throw new Error(`API loi HTTP ${response.status}`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || "API tra ve loi.");
  return result.data;
}

function restoreUser() {
  const raw = sessionStorage.getItem(sessionKey);
  if (!raw) {
    window.location.href = "./index.html";
    return null;
  }
  return JSON.parse(raw);
}

async function loadWorkspace() {
  currentUser = restoreUser();
  if (!currentUser || !companyId) {
    window.location.href = "./index.html";
    return;
  }

  try {
    setMessage("Dang tai workspace...", "");
    workspace = await callApi("getCompanyWorkspace", { companyId, userId: currentUser.id });
    els.companyName.textContent = workspace.company.name;
    els.user.textContent = `${currentUser.name || currentUser.email} - ${currentUser.email}`;
    renderDashboard();
    if (workspace.hasWeb) {
      els.tabs.classList.remove("hidden");
      await loadStickyNotes();
    }
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function renderDashboard() {
  if (!workspace.hasWeb) {
    els.dashboardContent.innerHTML = `
      <article class="intro-panel">
        <h3>DPUnity Platform</h3>
        <p>Cong ty nay chua duoc kich hoat goi Web. Day la trang gioi thieu chung cho den khi admin them package <strong>web</strong>.</p>
      </article>
    `;
    return;
  }

  els.dashboardContent.innerHTML = `
    <div class="item-grid">
      <article class="data-card"><h3>${workspace.stats.users}</h3><p class="muted">Thanh vien cong ty</p></article>
      <article class="data-card"><h3>${workspace.stats.stickyNotes}</h3><p class="muted">Sticky notes</p></article>
      <article class="data-card"><h3>${workspace.packages.length}</h3><p class="muted">Goi dang kich hoat</p><p class="pill-row">${workspace.packages.map((pack) => `<span class="pill">${escapeHtml(pack.code)}</span>`).join("")}</p></article>
    </div>
  `;
}

async function loadStickyNotes() {
  const data = await callApi("listStickyNotes", { companyId, userId: currentUser.id });
  renderStickyNotes(data.notes || []);
}

function renderStickyNotes(notes) {
  if (!notes.length) {
    els.stickyList.innerHTML = "<p class=\"muted\">Chua co sticky note.</p>";
    return;
  }

  els.stickyList.innerHTML = notes.map((note) => {
    const isOwner = note.ownerUserId === currentUser.id;
    return `
      <article class="sticky-note" style="background:${escapeHtml(note.color)}">
        <div>
          <h3>${escapeHtml(note.title || "Untitled")}</h3>
          <p>${escapeHtml(note.content)}</p>
        </div>
        <small>${escapeHtml(note.visibility)} - ${escapeHtml(note.ownerName || "Unknown")}</small>
        ${isOwner ? `<div class="button-row"><button class="secondary small" data-edit-note="${escapeHtml(note.id)}" type="button">Sua</button><button class="danger small" data-delete-note="${escapeHtml(note.id)}" type="button">Xoa</button></div>` : ""}
      </article>
    `;
  }).join("");

  notes.forEach((note) => {
    const edit = els.stickyList.querySelector(`[data-edit-note="${CSS.escape(note.id)}"]`);
    if (edit) edit.addEventListener("click", () => editStickyNote(note));
  });
}

function editStickyNote(note) {
  els.stickyForm.elements.id.value = note.id;
  els.stickyForm.elements.title.value = note.title || "";
  els.stickyForm.elements.color.value = note.color || "#fff7ad";
  els.stickyForm.elements.visibility.value = note.visibility || "private";
  els.stickyForm.elements.content.value = note.content || "";
}

async function submitStickyNote(event) {
  event.preventDefault();
  const formData = new FormData(els.stickyForm);
  const payload = Object.fromEntries(formData.entries());
  payload.companyId = companyId;
  payload.userId = currentUser.id;
  const action = payload.id ? "updateStickyNote" : "addStickyNote";

  try {
    await callApi(action, payload);
    resetStickyForm();
    await loadWorkspace();
    showView("notes");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function deleteStickyNote(id) {
  try {
    await callApi("deleteStickyNote", { id, userId: currentUser.id });
    await loadWorkspace();
    showView("notes");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function resetStickyForm() {
  els.stickyForm.reset();
  els.stickyForm.elements.id.value = "";
  els.stickyForm.elements.color.value = "#fff7ad";
}

function showView(view) {
  document.querySelectorAll(".workspace-tabs .tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  els.dashboardView.classList.toggle("hidden", view !== "dashboard");
  els.notesView.classList.toggle("hidden", view !== "notes");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.querySelectorAll(".workspace-tabs .tab").forEach((tab) => {
  tab.addEventListener("click", () => showView(tab.dataset.view));
});
els.stickyForm.addEventListener("submit", submitStickyNote);
els.resetStickyButton.addEventListener("click", resetStickyForm);
els.stickyList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-note]");
  if (deleteButton) deleteStickyNote(deleteButton.dataset.deleteNote);
});

loadWorkspace();
