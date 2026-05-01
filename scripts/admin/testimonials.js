import { state, escapeHtml } from "./core.js";

export function renderTestimonials() {
  return `
    <div class="testimonials-section">
      <h2 class="section-title">💬 Customer Reviews</h2>

      <div style="overflow-x:auto;margin-bottom:16px">
        <table class="a-table">
          <thead><tr><th>Customer</th><th>Product</th><th>Rating</th><th>Comment</th><th>Location</th></tr></thead>
          <tbody>
            ${state.CUSTOMER_REVIEWS.length
              ? state.CUSTOMER_REVIEWS.map((r) => `<tr><td>${escapeHtml(r.customerName || "-")}</td><td>${escapeHtml(r.productName || "-")}</td><td>${r.rating || 0}★</td><td>${escapeHtml(r.comment || "")}</td><td>${escapeHtml(r.location || "-")}</td></tr>`).join("")
              : '<tr><td colspan="5">No customer product reviews yet.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="testimonials-grid">
        ${state.CUSTOMER_REVIEWS.map((t) => `
          <div class="testimonial-card">
            <div class="testimonial-header">
              <div class="avatar">${getAvatar(t.name)}</div>
              <div>
                <div class="name">${escapeHtml(t.name)}</div>
                <div class="location">${escapeHtml(t.location || "")}</div>
              </div>
            </div>
            <div class="rating">${renderStars(t.rating)}</div>
            <p class="review-text">${escapeHtml(t.text)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function getAvatar(name = "") {
  return name.slice(0, 2).toUpperCase();
}

function renderStars(rating = 5) {
  const full = "⭐".repeat(Math.round(rating));
  const empty = "☆".repeat(5 - Math.round(rating));
  return `<span>${full}${empty}</span>`;
}
