import { state, waitForDbApi } from "./core.js";
import { triggerRender } from "./core.js";

export function renderCategories() {
  return `
    <div class="a-section">
      <div class="a-section-title"><span>🏷️ Categories</span><button class="a-btn a-btn-primary a-btn-sm" onclick="addNewCategory()">+ New Category</button></div>
      <div style="overflow-x:auto">
        <table class="a-table">
          <thead><tr><th>Name</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody id="categoriesTbody">${renderCategoryRows()}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function setCategoryFormField(key, value) {
  state.editCategoryForm[key] = key === "isActive" ? value === "true" : value;
}

export function renderCategoryRows() {
  return state.CATEGORY_ITEMS.map((category) => {
    if (state.editingCategoryId === category.id) {
      return `<tr style="background:#fef4f0">
        <td><input class="a-input sm" value="${(state.editCategoryForm.name || "").replace(/\"/g, "&quot;")}" oninput="setCategoryFormField('name', this.value)"/></td>
        <td><select class="a-input sm" onchange="setCategoryFormField('isActive', this.value)"><option value="true"${state.editCategoryForm.isActive !== false ? " selected" : ""}>Active</option><option value="false"${state.editCategoryForm.isActive === false ? " selected" : ""}>Inactive</option></select></td>
        <td><button class="a-btn a-btn-primary a-btn-sm" onclick="saveCategory()">✔ Save</button> <button class="a-btn a-btn-secondary a-btn-sm" onclick="cancelCategoryEdit()">Cancel</button></td>
      </tr>`;
    }
    return `<tr><td>${category.name || ""}</td><td>${category.isActive === false ? "Inactive" : "Active"}</td><td><button class="a-btn a-btn-secondary a-btn-sm" onclick="startCategoryEdit('${category.id}')">✏️ Edit</button> <button class="a-btn a-btn-danger a-btn-sm" onclick="deleteCategory('${category.id}')">🗑️</button></td></tr>`;
  }).join("");
}

export function addNewCategory() {
  const newId = `temp-cat-${Date.now()}`;
  state.CATEGORY_ITEMS.push({ id: newId, name: "", imageUrl: "", isActive: true });
  startCategoryEdit(newId);
}

export function startCategoryEdit(id) {
  const category = state.CATEGORY_ITEMS.find((item) => item.id === id);
  state.editingCategoryId = id;
  state.editCategoryForm = { ...category };
  refreshCategoryTable();
}

export function cancelCategoryEdit() {
  state.editingCategoryId = null;
  state.editCategoryForm = {};
  refreshCategoryTable();
}

export async function saveCategory() {
  const api = await waitForDbApi();

  const payload = {
    name: state.editCategoryForm.name,
    isActive: state.editCategoryForm.isActive !== false,
  };

  const targetId = state.editingCategoryId;

  if (String(targetId).startsWith("temp-cat-")) {
    const created = await api.categories.create(payload);

    state.CATEGORY_ITEMS = state.CATEGORY_ITEMS.map((category) =>
      category.id === targetId ? { ...created } : category,
    );
  } else {
    await api.categories.update(targetId, payload);

    state.CATEGORY_ITEMS = state.CATEGORY_ITEMS.map((category) =>
      category.id === targetId ? { ...category, ...payload } : category,
    );
  }

  state.CATEGORIES = ["All", ...state.CATEGORY_ITEMS.map((c) => c.name).filter(Boolean)];
  state.CATEGORY_MAP = Object.fromEntries(state.CATEGORY_ITEMS.map((c) => [c.id, c.name]));

  cancelCategoryEdit();
  triggerRender();
}

export async function deleteCategory(id) {
  if (!confirm("Delete this category?")) return;
  const api = await waitForDbApi();
  const categoryName = state.CATEGORY_MAP[id];
  if (!String(id).startsWith("temp-cat-")) {
    await api.categories.delete(id);
  }
  state.CATEGORY_ITEMS = state.CATEGORY_ITEMS.filter((category) => category.id !== id);
  state.PRODUCTS = state.PRODUCTS.filter((product) => product.category !== categoryName);
  state.CATEGORIES = ["All", ...state.CATEGORY_ITEMS.map((c) => c.name).filter(Boolean)];
  state.CATEGORY_MAP = Object.fromEntries(state.CATEGORY_ITEMS.map((c) => [c.id, c.name]));
  refreshCategoryTable();
}

export function refreshCategoryTable() {
  const tbody = document.getElementById("categoriesTbody");
  if (tbody) tbody.innerHTML = renderCategoryRows();
}
