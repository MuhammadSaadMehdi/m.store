import { state, waitForDbApi } from "./core.js";

let eventsBound = false;

export function renderInventory() {
  return `
    <div class="a-section">
      <div class="a-section-title">
        <span>📦 Inventory</span>
        <button class="a-btn a-btn-primary a-btn-sm" id="addInventoryBtn">+ New Entry</button>
      </div>

      <div style="overflow-x:auto">
        <table class="a-table">
          <thead>
            <tr>
              <th>Product</th><th>Type</th><th>Qty</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="inventoryTbody">${renderInventoryRows()}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderInventoryRows() {
  return state.INVENTORY.map((item) => {
    if (state.editingInventoryId === item.id) {
      return `
        <tr style="background:#fef4f0">
          <td>
            <select class="a-input sm inventory-input" data-key="productId">
              ${state.PRODUCTS.map((p) =>
                `<option value="${p.id}" ${(state.editInventoryForm.productId || item.productId) === p.id ? "selected" : ""}>${p.name}</option>`,
              ).join("")}
            </select>
          </td>
          <td>
            <select class="a-input sm inventory-input" data-key="type">
              ${["in", "out", "adjustment"].map((t) =>
                `<option value="${t}" ${(state.editInventoryForm.type || item.type) === t ? "selected" : ""}>${t}</option>`,
              ).join("")}
            </select>
          </td>
          <td>
            <input class="a-input sm inventory-input" type="number" data-key="qty" value="${state.editInventoryForm.qty ?? item.qty ?? 0}" />
          </td>
          <td>
            <button class="save-inv-btn a-btn a-btn-primary a-btn-sm">✔ Save</button>
            <button class="cancel-inv-btn a-btn a-btn-secondary a-btn-sm">Cancel</button>
          </td>
        </tr>
      `;
    }

    const productName = state.PRODUCTS.find((p) => p.id === item.productId)?.name || item.productId || "Unknown";

    return `
      <tr>
        <td>${productName}</td>
        <td>${item.type}</td>
        <td>${item.qty}</td>
        <td>
          <button class="edit-inv-btn a-btn a-btn-secondary a-btn-sm" data-id="${item.id}">✏️</button>
          <button class="delete-inv-btn a-btn a-btn-danger a-btn-sm" data-id="${item.id}">🗑️</button>
        </td>
      </tr>
    `;
  }).join("");
}

export function initInventoryEvents() {
  if (eventsBound) return;
  eventsBound = true;

  document.addEventListener("input", (e) => {
    if (e.target.matches(".inventory-input")) {
      const key = e.target.dataset.key;
      let value = e.target.value;
      if (key === "qty") value = Number(value);
      state.editInventoryForm[key] = value;
    }
  });

  document.addEventListener("click", async (e) => {
    if (e.target.id === "addInventoryBtn") addNewInventory();
    if (e.target.matches(".edit-inv-btn")) startInventoryEdit(e.target.dataset.id);
    if (e.target.matches(".delete-inv-btn")) deleteInventory(e.target.dataset.id);
    if (e.target.matches(".cancel-inv-btn")) cancelInventoryEdit();
    if (e.target.matches(".save-inv-btn")) await saveInventory();
  });
}

export function addNewInventory() {
  const id = `temp-inv-${Date.now()}`;
  state.INVENTORY.push({
    id,
    productId: state.PRODUCTS[0]?.id || "",
    type: "adjustment",
    qty: 0,
  });
  startInventoryEdit(id);
}

export function startInventoryEdit(id) {
  const item = state.INVENTORY.find((x) => x.id === id);
  state.editingInventoryId = id;
  state.editInventoryForm = { ...item };
  refreshInventoryTable();
}

export function cancelInventoryEdit() {
  state.editingInventoryId = null;
  state.editInventoryForm = {};
  refreshInventoryTable();
}

export function refreshInventoryTable() {
  const tbody = document.getElementById("inventoryTbody");
  if (tbody) tbody.innerHTML = renderInventoryRows();
}

export async function saveInventory() {
  const api = await waitForDbApi();
  const payload = {
    productId: state.editInventoryForm.productId,
    type: state.editInventoryForm.type || "adjustment",
    qty: Number(state.editInventoryForm.qty || 0),
  };

  let updated;

  if (state.editingInventoryId.startsWith("temp-inv-")) {
    const created = await api.inventory.create(payload);
    updated = { id: created.id, ...payload };
  } else {
    await api.inventory.update(state.editingInventoryId, payload);
    updated = { id: state.editingInventoryId, ...payload };
  }

  state.INVENTORY = state.INVENTORY.map((item) =>
    item.id === state.editingInventoryId ? updated : item,
  );

  cancelInventoryEdit();
}

export async function deleteInventory(id) {
  if (!confirm("Delete this inventory entry?")) return;

  const api = await waitForDbApi();
  if (!id.startsWith("temp-inv-")) {
    await api.inventory.delete(id);
  }

  state.INVENTORY = state.INVENTORY.filter((item) => item.id !== id);
  refreshInventoryTable();
}
