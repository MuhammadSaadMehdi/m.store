import { state, escapeHtml } from "./core.js";

export function renderUsers() {
  return `
    <div class="a-section">
      <div class="a-section-title"><span>Users</span></div>
      <div style="overflow-x:auto">
        <table class="a-table">
          <thead><tr><th>UID</th><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th></tr></thead>
          <tbody id="usersTbody">${renderUserRows()}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderUserRows() {
  if (!state.USERS.length) {
    return `<tr><td colspan="6">No users found in users/admins collections yet.</td></tr>`;
  }

  return state.USERS
    .map(
      (user) => `<tr>
        <td>${escapeHtml(user.uid || user.id || "")}</td>
        <td>${escapeHtml(user.fullName || user.username || "")}</td>
        <td>${escapeHtml(user.email || "")}</td>
        <td>${escapeHtml(user.role || "customer")}</td>
        <td>${escapeHtml(user.phone || "")}</td>
        <td>${user.isActive ? "Active" : "Inactive"}</td>
      </tr>`,
    )
    .join("");
}
