import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { state, auth, setRenderHandler } from "./core.js";
import { render } from "./rendering.js";
import {
  login,
  logout,
  ensureAdminRecord,
} from "./auth.js";
import {
  addNewCategory,
  startCategoryEdit,
  cancelCategoryEdit,
  saveCategory,
  deleteCategory,
  setCategoryFormField,
} from "./categories.js";
import {
  // saveUser,
} from "./users.js";
import {
  addNewInventory,
  startInventoryEdit,
  cancelInventoryEdit,
  saveInventory,
  deleteInventory,
  initInventoryEvents,
} from "./inventory.js";
import {
  initProductEvents,
  addNewProduct,
  startEdit,
  cancelEdit,
  saveEdit,
  deleteProduct,
} from "./products.js";
import {
  saveWebsiteBasic,
  saveTrustPills,
  addTrustPill,
  removeTrustPill,
  saveSocial,
  saveHeroText,
  saveStats,
  handleBannerFile,
} from "./settings.js";
import { loadAdminData } from "./firestore.js";

export function switchTab(tab) {
  state.currentTab = tab;
  state.editingId = null;
  state.editingCategoryId = null;
  state.editingUserId = null;
  state.editingInventoryId = null;
  state.editProductForm = {};
  state.editCategoryForm = {};
  state.editUserForm = {};
  state.editInventoryForm = {};
  render();
}

export function initAdmin() {
  setRenderHandler(render);
  initInventoryEvents();
  initProductEvents();
  render();

  onAuthStateChanged(auth, async (user) => {
    state.authInitialized = true;
    state.pendingUsername = user?.displayName || state.pendingUsername || "";

    if (!user) {
      state.adminAuthed = false;
      state.authStatus = "";
      state.authError = "";
      render();
      return;
    }

    try {
      await ensureAdminRecord(
        user,
        state.pendingUsername || user.displayName || user.email || "admin",
      );
      state.adminAuthed = true;
      await loadAdminData();
    } catch (error) {
      console.error("Admin session bootstrap failed.", error);
      state.adminAuthed = false;
      state.authMode = "login";
      state.authError = error?.message || "Unable to start admin session.";
    }

    render();
  });
}

export function bindAdminGlobals() {
  window.__adminState = state;

  window.login = login;
  window.logout = logout;
  window.switchTab = switchTab;

  window.addNewCategory = addNewCategory;
  window.startCategoryEdit = startCategoryEdit;
  window.cancelCategoryEdit = cancelCategoryEdit;
  window.saveCategory = saveCategory;
  window.deleteCategory = deleteCategory;
  window.setCategoryFormField = setCategoryFormField;

  window.addNewInventory = addNewInventory;
  window.startInventoryEdit = startInventoryEdit;
  window.cancelInventoryEdit = cancelInventoryEdit;
  window.saveInventory = saveInventory;
  window.deleteInventory = deleteInventory;

  window.addNewProduct = addNewProduct;
  window.startEdit = startEdit;
  window.cancelEdit = cancelEdit;
  window.saveEdit = saveEdit;
  window.deleteProduct = deleteProduct;

  window.saveWebsiteBasic = saveWebsiteBasic;
  window.saveTrustPills = saveTrustPills;
  window.addTrustPill = addTrustPill;
  window.removeTrustPill = removeTrustPill;
  window.saveSocial = saveSocial;
  window.saveHeroText = saveHeroText;
  window.saveStats = saveStats;
  window.handleBannerFile = handleBannerFile;
}
