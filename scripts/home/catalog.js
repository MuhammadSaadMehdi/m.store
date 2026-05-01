import { state, stars } from "./core.js";
import { openWhatsAppById } from "./account.js";

export function setCategory(cat) {
  state.activeCategory = cat;
  renderFilters();
  renderProducts();
}

export function setSearchQuery(query) {
  state.searchQuery = String(query || "").toLowerCase();
  renderProducts();
}

export function renderFilters() {
  document.getElementById("filterWrap").innerHTML = state.CATEGORIES.map(
    (cat) =>
      `<button class="fcat${cat === state.activeCategory ? " active" : ""}" onclick="setCategory('${cat}')">${cat}</button>`,
  ).join("");
}

function getFiltered() {
  return state.PRODUCTS.filter((p) => {
    const catOk = state.activeCategory === "All" || p.category === state.activeCategory;
    const searchOk =
      !state.searchQuery ||
      p.name.toLowerCase().includes(state.searchQuery) ||
      p.category.toLowerCase().includes(state.searchQuery);
    return catOk && searchOk;
  });
}

export function renderProducts() {
  const filtered = getFiltered();
  const grid = document.getElementById("productGrid");
  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#aaa;font-size:15px">No products found</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (p) => `
      <div class="pcard" onmouseenter="this.classList.add('hov')" onmouseleave="this.classList.remove('hov')">
        ${p.badge ? `<span class="pbadge">${p.badge}</span>` : ""}
        <div class="pimg-wrap">
          <img src="${p.image}" alt="${p.name}" class="pimg" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=700&q=85'" />
          <div class="pimg-ov">
            <button class="qv-btn" onclick="openQuickView('${p.id}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              Quick View
            </button>
          </div>
          <div class="pimg-shine"></div>
        </div>
        <div class="pinfo">
          <span class="pcat">${p.category}</span>
          <h3 class="pname">${p.name}</h3>
          <div class="pmeta">${stars(p.rating)}<span class="prev">(${p.reviews})</span></div>
          <div class="pfooter">
            <span class="pprice">Rs. ${p.price.toLocaleString("en-PK")}</span>
            <button class="buy-btn" onclick="openWhatsAppById('${p.id}')">Buy Now</button>
          </div>
        </div>
      </div>
    `,
    )
    .join("");
}

export function openQuickView(id) {
  const p = state.PRODUCTS.find((x) => x.id === id);
  if (!p) return;

  const root = document.getElementById("modalRoot");
  root.innerHTML = `
    <div class="modal-bd" id="qvModal" onclick="closeModal()">
      <div class="modal-box" onclick="event.stopPropagation()">
        <button class="modal-x" onclick="closeModal()">✕</button>
        <div class="modal-in">
          <div class="modal-img">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=700&q=85'" />
            ${p.badge ? `<span class="pbadge">${p.badge}</span>` : ""}
          </div>
          <div class="modal-det">
            <span class="pcat">${p.category}</span>
            <h2 class="modal-title">${p.name}</h2>
            <div class="pmeta" style="margin-bottom:14px">${stars(p.rating, 15)}<span class="prev">${p.reviews} reviews</span></div>
            <p class="modal-desc">${p.description}</p>
            <div class="modal-price">Rs. ${p.price.toLocaleString("en-PK")}</div>
            <button class="buy-btn buy-lg" onclick="openWhatsAppById('${p.id}');closeModal()">Order via WhatsApp</button>
            <p style="font-size:12px;color:#999;margin-top:8px;text-align:center">WhatsApp pe seedha message jayega product details ke saath</p>
          </div>
        </div>
      </div>
    </div>`;

  document.body.style.overflow = "hidden";
}

export function closeModal() {
  document.getElementById("modalRoot").innerHTML = "";
  document.body.style.overflow = "";
}

export function renderTestimonials() {
  document.getElementById("testiGrid").innerHTML = state.TESTIMONIALS.map(
    (t) => `
      <div class="tcard">
        <div class="tcard-top">
          <div class="tavatar">${t.avatar}</div>
          <div>
            <div class="tname">${t.name}</div>
            <div class="tloc">📍 ${t.location}</div>
          </div>
          <div style="margin-left:auto">${stars(t.rating)}</div>
        </div>
        <p class="ttext">${t.text}</p>
      </div>
    `,
  ).join("");
}

export function bindSearchInput() {
  document.getElementById("searchInp").addEventListener("input", (e) => {
    setSearchQuery(e.target.value);
  });
}

export { openWhatsAppById };
