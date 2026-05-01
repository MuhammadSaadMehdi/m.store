import { state, escapeHtml } from "./core.js";
import { renderAuthScreen } from "./auth.js";
import { renderCategories } from "./categories.js";
import { renderProducts } from "./products.js";
import { renderInventory } from "./inventory.js";
import { renderTestimonials } from "./testimonials.js";
import { renderUsers } from "./users.js";
import {
  renderWebsite,
  renderSocial,
  renderHero,
  renderSecurity,
} from "./settings.js";

export function render() {
  const app = document.getElementById("app");
  if (!state.authInitialized || !state.adminAuthed) {
    renderAuthScreen();
    return;
  }

  app.innerHTML = `
    <div class="admin-panel">
      <div class="admin-hdr">
        <h2>🛠️ Maha Collection Admin</h2>
        <div style="display:flex;gap:10px">
          <button class="a-btn" style="background:rgba(255,255,255,0.2);color:#fff" onclick="logout()">🚪 Logout</button>
          <button class="a-btn" style="background:rgba(255,255,255,0.2);color:#fff" onclick="window.close()">✕ Close</button>
        </div>
      </div>
      <div class="admin-body">
        <div class="admin-sidebar">
          <button class="admin-nav-btn ${state.currentTab === "dashboard" ? "active" : ""}" onclick="switchTab('dashboard')">📊 Dashboard</button>
          <button class="admin-nav-btn ${state.currentTab === "categories" ? "active" : ""}" onclick="switchTab('categories')">🏷️ Categories</button>
          <button class="admin-nav-btn ${state.currentTab === "products" ? "active" : ""}" onclick="switchTab('products')">🛍️ Products</button>
          <button class="admin-nav-btn ${state.currentTab === "inventory" ? "active" : ""}" onclick="switchTab('inventory')">📦 Inventory</button>
          <button class="admin-nav-btn ${state.currentTab === "testimonials" ? "active" : ""}" onclick="switchTab('testimonials')">💬 Reviews</button>
          <button class="admin-nav-btn ${state.currentTab === "users" ? "active" : ""}" onclick="switchTab('users')">👤 Users</button>
          <button class="admin-nav-btn ${state.currentTab === "website" ? "active" : ""}" onclick="switchTab('website')">🌐 Website Info</button>
          <button class="admin-nav-btn ${state.currentTab === "social" ? "active" : ""}" onclick="switchTab('social')">📱 Social Links</button>
          <button class="admin-nav-btn ${state.currentTab === "hero" ? "active" : ""}" onclick="switchTab('hero')">🎥 Hero & Stats</button>
          <button class="admin-nav-btn ${state.currentTab === "security" ? "active" : ""}" onclick="switchTab('security')">🔐 Security</button>
        </div>
        <div class="admin-content" id="adminContent">${renderTabContent()}</div>
      </div>
    </div>
  `;
}

export function renderTabContent() {
  if (state.currentTab === "dashboard") return renderDashboard();
  if (state.currentTab === "categories") return renderCategories();
  if (state.currentTab === "products") return renderProducts();
  if (state.currentTab === "inventory") return renderInventory();
  if (state.currentTab === "testimonials") return renderTestimonials();
  if (state.currentTab === "users") return renderUsers();
  if (state.currentTab === "website") return renderWebsite();
  if (state.currentTab === "social") return renderSocial();
  if (state.currentTab === "hero") return renderHero();
  if (state.currentTab === "security") return renderSecurity();
  return "";
}

export function renderDashboard() {
  const totalProducts = state.PRODUCTS.length;
  const totalRevenue = state.PRODUCTS.reduce((s, p) => s + Number(p.price), 0);
  const avgPrice = totalProducts ? Math.round(totalRevenue / totalProducts) : 0;

  return `
    <div class="admin-stats-row">
      <div class="admin-stat-box"><div class="asn">${totalProducts}</div><div class="asl">Total Products</div></div>
      <div class="admin-stat-box"><div class="asn">${state.CATEGORY_ITEMS.length || [...new Set(state.PRODUCTS.map((p) => p.category))].length}</div><div class="asl">Categories</div></div>
      <div class="admin-stat-box"><div class="asn">${state.CUSTOMER_REVIEWS.length}</div><div class="asl">Reviews</div></div>
      <div class="admin-stat-box"><div class="asn">${state.USERS.length}</div><div class="asl">Users</div></div>
      <div class="admin-stat-box"><div class="asn">Rs.${avgPrice.toLocaleString("en-PK")}</div><div class="asl">Avg Price</div></div>
    </div>
    <div class="a-section">
      <div class="a-section-title"><span>📦 Recent Products</span><button class="a-btn a-btn-primary a-btn-sm" onclick="switchTab('products')">Manage All</button></div>
      <table class="a-table">
        <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th></tr></thead>
        <tbody>${state.PRODUCTS.slice(0, 5)
          .map(
            (p) =>
              `<tr><td><img src="${p.image}" style="width:44px;height:38px;object-fit:cover;border-radius:6px" onerror="this.src='https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=300'"></td><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.category)}</td><td>Rs.${Number(p.price || 0).toLocaleString()}</td></tr>`,
          )
          .join("")}</tbody>
      </table>
    </div>
  `;
}
