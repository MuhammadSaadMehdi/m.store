import {
  state,
  escapeHtml,
  waitForDbApi,
  getCategoryIdFromName,
} from "./core.js";

let eventsBound = false;

export function renderProducts() {
  return `
    <div class="a-section">
      <div class="a-section-title">
        <span>🛍️ Products Management</span>
        <button class="a-btn a-btn-primary a-btn-sm" id="addProductBtn">+ Naya Product</button>
      </div>

      <div style="overflow-x:auto">
        <table class="a-table">
          <thead>
            <tr>
              <th>Image</th><th>Name</th><th>Category</th>
              <th>Price</th><th>Tag</th><th>Rating</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="productsTbody">${renderProductRows()}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderProductRows() {
  return state.PRODUCTS.map((p) => {
    if (state.editingId === p.id) {
      return `
        <tr style="background:#fef4f0">
          <td>
            <input class="a-input sm product-input" data-key="image" value="${escapeHtml(state.editProductForm.image || "")}" />
            ${state.editProductForm.image ? `<img src="${state.editProductForm.image}" class="img-preview">` : ""}
          </td>
          <td><input class="a-input sm product-input" data-key="name" value="${escapeHtml(state.editProductForm.name || "")}" /></td>
          <td>
            <select class="a-input sm product-input" data-key="category">
              ${state.CATEGORIES.filter((c) => c !== "All")
                .map((c) => `<option ${c === state.editProductForm.category ? "selected" : ""}>${c}</option>`)
                .join("")}
            </select>
          </td>
          <td><input type="number" class="a-input sm product-input" data-key="price" value="${state.editProductForm.price || 0}" /></td>
          <td><input class="a-input sm product-input" data-key="tag" value="${escapeHtml(state.editProductForm.tag || "")}" /></td>
          <td><input type="number" step="0.1" class="a-input sm product-input" data-key="rating" value="${state.editProductForm.rating || 4.5}" /></td>
          <td>
            <button class="save-btn a-btn a-btn-primary a-btn-sm">✔ Save</button>
            <button class="cancel-btn a-btn a-btn-secondary a-btn-sm">Cancel</button>
          </td>
        </tr>
        <tr>
          <td colspan="7">
            <textarea class="a-input sm product-input" data-key="description">${state.editProductForm.description || ""}</textarea>
            <input type="number" class="a-input sm product-input" data-key="reviews" value="${state.editProductForm.reviews || 0}" />
          </td>
        </tr>
      `;
    }

    return `
      <tr>
        <td><img src="${p.image}" style="width:44px;height:38px"></td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>Rs.${p.price}</td>
        <td>${p.tag || "-"}</td>
        <td>${p.rating}⭐</td>
        <td>
          <button class="edit-btn a-btn a-btn-secondary a-btn-sm" data-id="${p.id}">✏️</button>
          <button class="delete-btn a-btn a-btn-danger a-btn-sm" data-id="${p.id}">🗑️</button>
        </td>
      </tr>
    `;
  }).join("");
}

export function initProductEvents() {
  if (eventsBound) return;
  eventsBound = true;

  document.addEventListener("input", (e) => {
    if (e.target.matches(".product-input")) {
      const key = e.target.dataset.key;
      let value = e.target.value;
      if (["price", "rating", "reviews"].includes(key)) value = Number(value);
      state.editProductForm[key] = value;
    }
  });

  document.addEventListener("click", async (e) => {
    if (e.target.id === "addProductBtn") addNewProduct();
    if (e.target.matches(".edit-btn")) startEdit(e.target.dataset.id);
    if (e.target.matches(".delete-btn")) deleteProduct(e.target.dataset.id);
    if (e.target.matches(".cancel-btn")) cancelEdit();
    if (e.target.matches(".save-btn")) await saveEdit();
  });
}

export function startEdit(id) {
  const p = state.PRODUCTS.find((x) => x.id === id);
  state.editingId = id;
  state.editProductForm = { ...p };
  refreshProductTable();
}

export function cancelEdit() {
  state.editingId = null;
  state.editProductForm = {};
  refreshProductTable();
}

export function refreshProductTable() {
  const tbody = document.getElementById("productsTbody");
  if (tbody) tbody.innerHTML = renderProductRows();
}

export async function saveEdit() {
  const api = await waitForDbApi();

  const payload = {
    name: state.editProductForm.name,
    description: state.editProductForm.description,
    categoryId: getCategoryIdFromName(state.editProductForm.category),
    price: state.editProductForm.price,
    images: state.editProductForm.image ? [state.editProductForm.image] : [],
    tag: state.editProductForm.tag,
    ratingAvg: Number(state.editProductForm.rating || 0),
    ratingCount: Number(state.editProductForm.reviews || 0),
  };

  let updated;

  if (state.editingId.startsWith("temp-")) {
    const created = await api.products.create(payload);
    updated = { ...state.editProductForm, id: created.id };
  } else {
    await api.products.update(state.editingId, payload);
    updated = { ...state.editProductForm, id: state.editingId };
  }

  state.PRODUCTS = state.PRODUCTS.map((p) => (p.id === state.editingId ? updated : p));
  cancelEdit();
}

export async function deleteProduct(id) {
  const api = await waitForDbApi();
  if (!id.startsWith("temp-")) {
    await api.products.delete(id);
  }

  state.PRODUCTS = state.PRODUCTS.filter((p) => p.id !== id);
  state.CUSTOMER_REVIEWS = state.CUSTOMER_REVIEWS.filter((review) => review.productId !== id);
  state.INVENTORY = state.INVENTORY.filter((item) => item.productId !== id);
  refreshProductTable();
}

export function addNewProduct() {
  const id = `temp-${Date.now()}`;

  state.PRODUCTS.push({
    id,
    name: "",
    price: 0,
    category: state.CATEGORIES[1] || "",
    image: "",
    tag: "",
    rating: 4.5,
    reviews: 0,
    description: "",
  });

  startEdit(id);
}
