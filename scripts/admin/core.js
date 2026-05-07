import { auth } from "../firebase-setup.js";
import { dbApi } from "../database-functions.js";

export { auth, dbApi };

export const state = {
  CONFIG: {
    whatsappNumber: "923700429801",
    brandName: "Maqbool Collection",
    tagline: "Where Every Piece Tells a Story",
    instagram: "https://www.instagram.com/maqboolcollection",
    facebook: "https://www.facebook.com/maqboolcollection",
    tiktok: "https://www.tiktok.com/@maqboolcollection",
    heroBanner: "",
    heroTitle1: "Maqbool",
    heroTitle2: "Collection",
    heroSub:
      "Premium Pakistani fashion - lawn suits, bridal wear, jewellery & more.\nOrder instantly on WhatsApp",
    trustPills: [
      "Fast Delivery",
      "100% Authentic",
      "24/7 Support",
      "Easy Returns",
    ],
    stat1n: "10,000+",
    stat1l: "Happy Customers",
    stat2n: "500+",
    stat2l: "Products",
    stat3n: "4.9*",
    stat3l: "Average Rating",
    stat4n: "Same Day",
    stat4l: "WhatsApp Reply",
  },

  CATEGORY_ITEMS: [],
  USERS: [],
  INVENTORY: [],
  CATEGORY_MAP: {},
  CUSTOMER_REVIEWS: [],

  adminAuthed: false,
  editingCategoryId: null,
  editingUserId: null,
  editingInventoryId: null,
  editingId: null,
  editCategoryForm: {},
  editUserForm: {},
  editInventoryForm: {},
  editProductForm: {},

  currentTab: "dashboard",

  authMode: "login",
  authStatus: "",
  authError: "",
  pendingUsername: "",
  authInitialized: false,
};

let renderHandler = () => {};

export function setRenderHandler(fn) {
  renderHandler = typeof fn === "function" ? fn : () => {};
}

export function triggerRender() {
  renderHandler();
}

export function waitForDbApi() {
  return Promise.resolve(dbApi);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function usernameToEmail(username) {
  return username;
}

export function readAuthForm() {
  return {
    username:
      document.getElementById("authUsername")?.value || state.pendingUsername || "",
    password: document.getElementById("authPassword")?.value || "",
    confirmPassword: document.getElementById("authConfirmPassword")?.value || "",
  };
}

export function setAuthMessage(message, isError = false) {
  state.authStatus = isError ? "" : message;
  state.authError = isError ? message : "";
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function toUiPrice(dbPrice) {
  const n = Number(dbPrice || 0);
  return n > 99999 ? Math.round(n / 100) : n;
}

export function getCategoryNameFromId(categoryId) {
  return state.CATEGORY_MAP[categoryId] || categoryId || "Uncategorized";
}

export function getCategoryIdFromName(categoryName) {
  const name = String(categoryName || "").trim();
  const entry = Object.entries(state.CATEGORY_MAP).find(
    ([, label]) => label.toLowerCase() === name.toLowerCase(),
  );
  return entry ? entry[0] : slugify(name || "uncategorized");
}

export function showMsg(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2000);
  }
}

export function saveToLocalStorage() {
  localStorage.setItem("maqbool_products", JSON.stringify(state.PRODUCTS));
  localStorage.setItem("maqbool_testimonials", JSON.stringify(state.TESTIMONIALS));
  localStorage.setItem("maqbool_config", JSON.stringify(state.CONFIG));
}

export function loadFromLocalStorage() {
  try {
    const p = localStorage.getItem("maqbool_products");
    if (p) state.PRODUCTS = JSON.parse(p);
    const t = localStorage.getItem("maqbool_testimonials");
    if (t) state.TESTIMONIALS = JSON.parse(t);
    const c = localStorage.getItem("maqbool_config");
    if (c) Object.assign(state.CONFIG, JSON.parse(c));
  } catch {
    // ignore local fallback parse errors
  }
}
