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
  peopleView: document.querySelector("#peopleView"),
  notesView: document.querySelector("#notesView"),
  dashboardContent: document.querySelector("#dashboardContent"),
  stickyForm: document.querySelector("#stickyForm"),
  resetStickyButton: document.querySelector("#resetStickyButton"),
  stickyList: document.querySelector("#stickyList"),
  noteViewerList: document.querySelector("#noteViewerList"),
  memberForm: document.querySelector("#memberForm"),
  memberList: document.querySelector("#memberList")
};

let currentUser = null;
let workspace = null;
let companyMembers = [];

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
    els.tabs.classList.remove("hidden");
    await loadCompanyMembers();
    renderDashboard();
    if (workspace.hasWeb) {
      await loadStickyNotes();
    } else {
      renderLockedStickyNotes();
    }
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function loadCompanyMembers() {
  const data = await callApi("listCompanyMembers", { companyId, userId: currentUser.id });
  companyMembers = data.members || [];
  renderMembers();
  renderViewerChoices();
}

function isCompanyAdmin() {
  return companyMembers.some((member) => member.userId === currentUser.id && member.role === "rootadmin");
}

function renderDashboard() {
  const packagePills = workspace.packages.length
    ? workspace.packages.map((pack) => `<span class="pill">${escapeHtml(pack.code)}</span>`).join("")
    : "<span class=\"pill muted-pill\">no package</span>";

  if (!workspace.hasWeb) {
    els.dashboardContent.innerHTML = `
      <article class="intro-panel">
        <h3>DPUnity Platform</h3>
        <p>Cong ty nay chua duoc kich hoat goi Web. Day la trang gioi thieu chung cho den khi admin them package <strong>web</strong>.</p>
      </article>
      <div class="item-grid">
        <article class="data-card"><h3>${workspace.stats.users}</h3><p class="muted">Thanh vien cong ty</p></article>
        <article class="data-card"><h3>${workspace.stats.stickyNotes}</h3><p class="muted">Sticky notes</p></article>
        <article class="data-card"><h3>${workspace.packages.length}</h3><p class="muted">Goi dang kich hoat</p><p class="pill-row">${packagePills}</p></article>
      </div>
    `;
    return;
  }

  els.dashboardContent.innerHTML = `
    <div class="item-grid">
      <article class="data-card"><h3>${workspace.stats.users}</h3><p class="muted">Thanh vien cong ty</p></article>
      <article class="data-card"><h3>${workspace.stats.stickyNotes}</h3><p class="muted">Sticky notes</p></article>
      <article class="data-card"><h3>${workspace.packages.length}</h3><p class="muted">Goi dang kich hoat</p><p class="pill-row">${packagePills}</p></article>
    </div>
  `;
}

function renderLockedStickyNotes() {
  els.stickyForm.classList.add("hidden");
  els.stickyList.innerHTML = `
    <article class="intro-panel">
      <h3>Sticky Note dang bi khoa</h3>
      <p>Cong ty nay can duoc gan package <strong>web</strong> trong trang Admin de su dung tinh nang Sticky Note.</p>
    </article>
  `;
}

async function loadStickyNotes() {
  els.stickyForm.classList.remove("hidden");
  renderViewerChoices();
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
        <small>${escapeHtml(formatNoteViewers(note))} - ${escapeHtml(note.ownerName || "Unknown")}</small>
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
  els.stickyForm.elements.content.value = note.content || "";
  renderViewerChoices((note.viewers || []).map((viewer) => viewer.userId));
}

async function submitStickyNote(event) {
  event.preventDefault();
  if (!workspace?.hasWeb) {
    setMessage("Cong ty can co package web de dung Sticky Note.", "error");
    return;
  }

  const formData = new FormData(els.stickyForm);
  const payload = Object.fromEntries(formData.entries());
  payload.viewerUserIds = getSelectedViewerIds();
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
  renderViewerChoices();
}

function showView(view) {
  document.querySelectorAll(".workspace-tabs .tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  els.dashboardView.classList.toggle("hidden", view !== "dashboard");
  els.peopleView.classList.toggle("hidden", view !== "people");
  els.notesView.classList.toggle("hidden", view !== "notes");
}

function renderViewerChoices(selectedIds = []) {
  const selected = new Set(selectedIds);
  const choices = companyMembers.filter((member) => member.userId !== currentUser.id);
  if (!choices.length) {
    els.noteViewerList.innerHTML = "<p class=\"muted\">Chua co nhan su khac trong cong ty.</p>";
    return;
  }

  els.noteViewerList.innerHTML = choices.map((member) => `
    <label class="check-item">
      <input type="checkbox" name="viewerUserIds" value="${escapeHtml(member.userId)}" ${selected.has(member.userId) ? "checked" : ""}>
      <span>${escapeHtml(member.name || member.email)}<br>${escapeHtml(member.email)}</span>
    </label>
  `).join("");
}

function getSelectedViewerIds() {
  return [...els.noteViewerList.querySelectorAll("input[name='viewerUserIds']:checked")].map((input) => input.value);
}

function formatNoteViewers(note) {
  const viewers = note.viewers || [];
  if (!viewers.length && note.visibility === "company") return "Ca cong ty";
  if (!viewers.length) return "Chi owner";
  return `Duoc xem: ${viewers.map((viewer) => viewer.name || viewer.email).join(", ")}`;
}

function renderMembers() {
  const canManage = isCompanyAdmin();
  els.memberForm.classList.toggle("hidden", !canManage);

  if (!companyMembers.length) {
    els.memberList.innerHTML = "<p class=\"muted\">Chua co nhan su trong cong ty.</p>";
    return;
  }

  els.memberList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Ten</th>
          <th>Email</th>
          <th>Vai tro</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${companyMembers.map((member) => `
          <tr>
            <td>${escapeHtml(member.name || "")}</td>
            <td>${escapeHtml(member.email || "")}</td>
            <td>
              ${canManage && member.userId !== currentUser.id
                ? `<select data-member-role="${escapeHtml(member.userId)}">
                    <option value="member" ${member.role === "member" ? "selected" : ""}>Member</option>
                    <option value="rootadmin" ${member.role === "rootadmin" ? "selected" : ""}>Root admin</option>
                  </select>`
                : `<span class="pill">${escapeHtml(member.role)}</span>`}
            </td>
            <td class="actions">
              ${canManage && member.userId !== currentUser.id && member.role !== "rootadmin"
                ? `<button class="danger small" data-delete-member="${escapeHtml(member.userId)}" type="button">Xoa</button>`
                : ""}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function submitMember(event) {
  event.preventDefault();
  const formData = new FormData(els.memberForm);
  const payload = Object.fromEntries(formData.entries());
  payload.companyId = companyId;
  payload.userId = currentUser.id;

  try {
    const data = await callApi("addCompanyMember", payload);
    companyMembers = data.members || [];
    els.memberForm.reset();
    renderMembers();
    renderViewerChoices();
    setMessage("Da them thanh vien.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function updateMemberRole(memberUserId, role) {
  try {
    const data = await callApi("updateCompanyMember", { companyId, userId: currentUser.id, memberUserId, role });
    companyMembers = data.members || [];
    renderMembers();
    renderViewerChoices();
    setMessage("Da cap nhat vai tro.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function deleteMember(memberUserId) {
  try {
    const data = await callApi("deleteCompanyMember", { companyId, userId: currentUser.id, memberUserId });
    companyMembers = data.members || [];
    renderMembers();
    renderViewerChoices();
    await loadStickyNotes();
    setMessage("Da xoa thanh vien khoi cong ty.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
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
els.memberForm.addEventListener("submit", submitMember);
els.stickyList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-note]");
  if (deleteButton) deleteStickyNote(deleteButton.dataset.deleteNote);
});
els.memberList.addEventListener("change", (event) => {
  const roleInput = event.target.closest("[data-member-role]");
  if (roleInput) updateMemberRole(roleInput.dataset.memberRole, roleInput.value);
});
els.memberList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-member]");
  if (deleteButton) deleteMember(deleteButton.dataset.deleteMember);
});

loadWorkspace();
