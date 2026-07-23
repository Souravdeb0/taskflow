const STATUSES = ["Todo", "In Progress", "Review", "Done"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const API_BASE = "http://localhost:5001/api";
const DEV_USER_NAME = "Sourav Deb";

const state = {
  apiBase: API_BASE,
  mockName: DEV_USER_NAME,
  tickets: [],
  users: [],
  activeTicket: null,
  mode: "create",
};

const els = {
  connectionStatus: document.querySelector("#connectionStatus"),
  refreshButton: document.querySelector("#refreshButton"),
  newTicketButton: document.querySelector("#newTicketButton"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  modal: document.querySelector("#ticketModal"),
  ticketForm: document.querySelector("#ticketForm"),
  modalMode: document.querySelector("#modalMode"),
  modalTitle: document.querySelector("#modalTitle"),
  ticketTitle: document.querySelector("#ticketTitle"),
  ticketDescription: document.querySelector("#ticketDescription"),
  ticketStatus: document.querySelector("#ticketStatus"),
  ticketPriority: document.querySelector("#ticketPriority"),
  detailGrid: document.querySelector("#detailGrid"),
  assigneeSelect: document.querySelector("#assigneeSelect"),
  assignButton: document.querySelector("#assignButton"),
  assigneeList: document.querySelector("#assigneeList"),
  commentList: document.querySelector("#commentList"),
  commentInput: document.querySelector("#commentInput"),
  commentButton: document.querySelector("#commentButton"),
  deleteTicketButton: document.querySelector("#deleteTicketButton"),
  toast: document.querySelector("#toast"),
  totalCount: document.querySelector("#totalCount"),
  doneCount: document.querySelector("#doneCount"),
  highCount: document.querySelector("#highCount"),
  unassignedCount: document.querySelector("#unassignedCount"),
};

function start() {
  bindEvents();
  loadEverything();
}

function bindEvents() {
  els.refreshButton.addEventListener("click", loadEverything);
  els.newTicketButton.addEventListener("click", openCreateModal);
  els.searchInput.addEventListener("input", renderBoard);
  els.statusFilter.addEventListener("change", renderBoard);
  els.ticketForm.addEventListener("submit", saveTicket);
  els.assignButton.addEventListener("click", assignUser);
  els.commentButton.addEventListener("click", createComment);
  els.deleteTicketButton.addEventListener("click", deleteActiveTicket);

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => els.modal.close());
  });

  document.addEventListener("click", (event) => {
    const card = event.target.closest("[data-ticket-id]");
    if (card) {
      openEditModal(card.dataset.ticketId);
    }

    const unassign = event.target.closest("[data-unassign-user]");
    if (unassign) {
      unassignUser(unassign.dataset.unassignUser);
    }
  });
}

async function loadEverything() {
  setConnection("Checking API", "");
  try {
    await api("/");
    setConnection("API online", "online");
    await Promise.all([loadUsers(), loadTickets()]);
  } catch (error) {
    setConnection("API offline", "offline");
    state.tickets = [];
    renderBoard();
    showToast(error.message);
  }
}

async function loadUsers() {
  try {
    const payload = await api("/users");
    state.users = Array.isArray(payload.users) ? payload.users : [];
    renderAssigneeOptions();
  } catch {
    state.users = [];
    renderAssigneeOptions();
  }
}

async function loadTickets() {
  const payload = await api("/tickets");
  state.tickets = Array.isArray(payload.tickets) ? payload.tickets : [];
  renderBoard();
}

async function saveTicket(event) {
  event.preventDefault();
  const body = ticketFormBody();

  try {
    if (state.mode === "edit" && state.activeTicket) {
      await api(`/tickets/${routeId(state.activeTicket.id)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      showToast("Ticket updated");
    } else {
      await api("/tickets", {
        method: "POST",
        body: JSON.stringify(body),
      });
      showToast("Ticket created");
    }

    els.modal.close();
    await loadTickets();
  } catch (error) {
    showToast(error.message);
  }
}

async function openEditModal(id) {
  state.mode = "edit";
  try {
    const payload = await api(`/tickets/${routeId(id)}`);
    state.activeTicket = payload.ticket || state.tickets.find((ticket) => sameId(ticket.id, id));
  } catch {
    state.activeTicket = state.tickets.find((ticket) => sameId(ticket.id, id));
  }

  if (!state.activeTicket) {
    showToast("Could not find that ticket");
    return;
  }

  els.modalMode.textContent = readableId(state.activeTicket.id);
  els.modalTitle.textContent = "Edit ticket";
  els.ticketTitle.value = state.activeTicket.title || "";
  els.ticketDescription.value = state.activeTicket.description || "";
  els.ticketStatus.value = validOption(state.activeTicket.status, STATUSES, "Todo");
  els.ticketPriority.value = validOption(state.activeTicket.priority, PRIORITIES, "Medium");
  els.detailGrid.hidden = false;
  els.deleteTicketButton.hidden = false;
  renderAssigneeOptions();
  renderAssignees();
  await loadComments();
  els.modal.showModal();
}

function openCreateModal() {
  state.mode = "create";
  state.activeTicket = null;
  els.modalMode.textContent = "Create ticket";
  els.modalTitle.textContent = "New ticket";
  els.ticketForm.reset();
  els.ticketStatus.value = "Todo";
  els.ticketPriority.value = "Medium";
  els.detailGrid.hidden = true;
  els.deleteTicketButton.hidden = true;
  els.modal.showModal();
}

async function deleteActiveTicket() {
  if (!state.activeTicket) return;

  try {
    await api(`/tickets/${routeId(state.activeTicket.id)}`, { method: "DELETE" });
    showToast("Ticket deleted");
    els.modal.close();
    await loadTickets();
  } catch (error) {
    showToast(error.message);
  }
}

async function assignUser() {
  if (!state.activeTicket || !els.assigneeSelect.value) return;

  try {
    await api(`/tickets/${routeId(state.activeTicket.id)}/assign`, {
      method: "POST",
      body: JSON.stringify({ userId: els.assigneeSelect.value }),
    });
    await refreshActiveTicket();
    showToast("User assigned");
  } catch (error) {
    showToast(error.message);
  }
}

async function unassignUser(userId) {
  if (!state.activeTicket) return;

  try {
    await api(`/tickets/${routeId(state.activeTicket.id)}/assign/${routeId(userId)}`, {
      method: "DELETE",
    });
    await refreshActiveTicket();
    showToast("User removed");
  } catch (error) {
    showToast(error.message);
  }
}

async function createComment() {
  const content = els.commentInput.value.trim();
  if (!state.activeTicket || !content) return;

  try {
    await api(`/tickets/${routeId(state.activeTicket.id)}/comments`, {
      method: "POST",
      body: JSON.stringify({ comment: content }),
    });
    els.commentInput.value = "";
    await loadComments();
    showToast("Comment added");
  } catch (error) {
    showToast(error.message);
  }
}

async function loadComments() {
  if (!state.activeTicket) return;

  try {
    const payload = await api(`/tickets/${routeId(state.activeTicket.id)}/comments`);
    renderComments(Array.isArray(payload.comments) ? payload.comments : []);
  } catch {
    renderComments([]);
  }
}

async function refreshActiveTicket() {
  if (!state.activeTicket) return;
  const payload = await api(`/tickets/${routeId(state.activeTicket.id)}`);
  state.activeTicket = payload.ticket || state.activeTicket;
  await loadTickets();
  renderAssignees();
  renderAssigneeOptions();
}

function renderBoard() {
  const query = els.searchInput.value.trim().toLowerCase();
  const selectedStatus = els.statusFilter.value;
  const tickets = state.tickets.filter((ticket) => {
    const matchesStatus = selectedStatus === "All" || ticket.status === selectedStatus;
    const searchable = `${ticket.title || ""} ${ticket.description || ""}`.toLowerCase();
    return matchesStatus && searchable.includes(query);
  });

  STATUSES.forEach((status) => {
    const list = document.querySelector(`#list${domSuffix(status)}`);
    const statusTickets = tickets.filter((ticket) => ticket.status === status);
    list.innerHTML = statusTickets.length
      ? statusTickets.map(ticketCard).join("")
      : `<div class="empty-state">No ${escapeHtml(status.toLowerCase())} tickets</div>`;
    document.querySelector(`#count${domSuffix(status)}`).textContent = String(statusTickets.length);
  });

  renderMetrics();
}

function renderMetrics() {
  els.totalCount.textContent = String(state.tickets.length);
  els.doneCount.textContent = String(state.tickets.filter((ticket) => ticket.status === "Done").length);
  els.highCount.textContent = String(
    state.tickets.filter((ticket) => ["High", "Critical"].includes(ticket.priority)).length,
  );
  els.unassignedCount.textContent = String(
    state.tickets.filter((ticket) => getAssignees(ticket).length === 0).length,
  );
}

function renderAssigneeOptions() {
  const activeAssignees = new Set(getAssignees(state.activeTicket).map((user) => normalizeId(user.id || user)));
  const options = state.users
    .filter((user) => !activeAssignees.has(normalizeId(user.id)))
    .map((user) => `<option value="${escapeHtml(normalizeId(user.id))}">${escapeHtml(displayUser(user))}</option>`);

  els.assigneeSelect.innerHTML = options.length ? options.join("") : '<option value="">No users available</option>';
}

function renderAssignees() {
  const assignees = getAssignees(state.activeTicket);
  els.assigneeList.innerHTML = assignees.length
    ? assignees.map((user) => {
        const id = normalizeId(user.id || user);
        return `<span class="chip">${escapeHtml(displayUser(user))}<button type="button" data-unassign-user="${escapeHtml(id)}" title="Remove">×</button></span>`;
      }).join("")
    : '<span class="pill">Unassigned</span>';
}

function renderComments(comments) {
  els.commentList.innerHTML = comments.length
    ? comments.map((comment) => `
      <article class="comment">
        <strong>${escapeHtml(displayUser(comment.author || comment.createdBy || state.mockName))}</strong>
        <p>${escapeHtml(comment.comment || comment.content || comment.body || "")}</p>
      </article>
    `).join("")
    : '<div class="empty-state">No comments yet</div>';
}

function ticketCard(ticket) {
  const priority = validOption(ticket.priority, PRIORITIES, "Medium");
  return `
    <button class="ticket-card" type="button" data-ticket-id="${escapeHtml(normalizeId(ticket.id))}">
      <div class="card-meta">
        <span class="pill priority-${priority.toLowerCase()}">${escapeHtml(priority)}</span>
        <span class="pill">${escapeHtml(readableId(ticket.id))}</span>
      </div>
      <h4>${escapeHtml(ticket.title || "Untitled ticket")}</h4>
      <p>${escapeHtml(ticket.description || "No description")}</p>
      <div class="card-meta">
        ${getAssignees(ticket).slice(0, 3).map((user) => `<span class="pill">${escapeHtml(displayUser(user))}</span>`).join("") || '<span class="pill">Unassigned</span>'}
      </div>
    </button>
  `;
}

async function api(path, options = {}) {
  const response = await fetch(`${state.apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-mock-user-uid": "taskflow_dev_user",
      "x-mock-user-email": "dev@taskflow.local",
      "x-mock-user-name": state.mockName,
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : {};

  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Request failed with ${response.status}`);
  }

  return payload;
}

function ticketFormBody() {
  return {
    title: els.ticketTitle.value.trim(),
    description: els.ticketDescription.value.trim(),
    status: els.ticketStatus.value,
    priority: els.ticketPriority.value,
  };
}

function getAssignees(ticket) {
  if (!ticket) return [];
  if (Array.isArray(ticket.assignees)) return ticket.assignees;
  if (Array.isArray(ticket.assignedUsers)) return ticket.assignedUsers;
  if (Array.isArray(ticket.assignedTo)) return ticket.assignedTo;
  if (ticket.assignee) return [ticket.assignee];
  return [];
}

function displayUser(user) {
  if (!user) return "Unknown user";
  if (typeof user === "string") return readableId(user);
  return user.name || user.displayName || user.email || readableId(user.id) || "Unknown user";
}

function normalizeId(id) {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (id.id) return normalizeId(id.id);
  if (id.tb && id.id) return `${id.tb}:${id.id}`;
  return String(id);
}

function routeId(id) {
  return encodeURIComponent(normalizeId(id));
}

function readableId(id) {
  const value = normalizeId(id);
  return value.includes(":") ? value.split(":").pop() : value;
}

function sameId(left, right) {
  return normalizeId(left) === normalizeId(right);
}

function domSuffix(status) {
  return status.replace(/\s+/g, "");
}

function validOption(value, options, fallback) {
  return options.includes(value) ? value : fallback;
}

function setConnection(text, status) {
  els.connectionStatus.textContent = text;
  els.connectionStatus.classList.remove("online", "offline");
  if (status) els.connectionStatus.classList.add(status);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => els.toast.classList.remove("show"), 3200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

start();
