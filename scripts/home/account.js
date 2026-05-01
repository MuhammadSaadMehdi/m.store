import {
  state,
  waitForDbApi,
  slugify,
  escapeAttr,
  getCachedCustomerProfile,
  setCachedCustomerProfile,
  buildWhatsAppURL,
} from "./core.js";

export function showAccountFormError(message) {
  const err = document.getElementById("accountFormErr");
  if (err) {
    err.textContent = message || "";
    err.style.display = message ? "block" : "none";
  }
}

export function showAccountFormInfo(message) {
  const info = document.getElementById("accountFormInfo");
  if (info) {
    info.textContent = message || "";
    info.style.display = message ? "block" : "none";
  }
}

export function closeCustomerAccountForm() {
  const root = document.getElementById("modalRoot");
  if (root) root.innerHTML = "";
  document.body.style.overflow = "";
}

export function cancelCustomerAccountForm() {
  if (state.pendingAccountResolver) {
    state.pendingAccountResolver(null);
    state.pendingAccountResolver = null;
  }
  closeCustomerAccountForm();
}

export function showCustomerAccountForm(prefill = {}) {
  const root = document.getElementById("modalRoot");
  root.innerHTML = `
    <div class="modal-bd" id="accountModal" onclick="cancelCustomerAccountForm()">
      <div class="modal-box auth-modal-box" onclick="event.stopPropagation()">
        <button class="modal-x" onclick="cancelCustomerAccountForm()">✕</button>
        <div class="auth-sheet">
          <div class="auth-logo">Maha <span>Collection</span></div>
          <p class="auth-sub">CUSTOMER ACCOUNT</p>
          <h3 class="auth-title">Login / Register</h3>
          <p class="auth-copy">Buy Now se pehle details save kar lein. Next time direct order hoga.</p>

          <form id="accountAuthForm" onsubmit="submitCustomerAccountForm(event)">
            <div id="accountFormErr" class="err-msg"></div>
            <div id="accountFormInfo" class="info-msg"></div>

            <div class="a-field">
              <label class="a-label" for="accountName">Full Name</label>
              <input id="accountName" class="a-input" value="${escapeAttr(prefill.customerName)}" placeholder="Your full name" />
            </div>

            <div class="a-field">
              <label class="a-label" for="accountPhone">WhatsApp Number</label>
              <input id="accountPhone" class="a-input" value="${escapeAttr(prefill.phone)}" placeholder="923001234567" />
            </div>

            <div class="a-field">
              <label class="a-label" for="accountLocation">City / Location</label>
              <input id="accountLocation" class="a-input" value="${escapeAttr(prefill.location)}" placeholder="Lahore" />
            </div>

            <div class="auth-actions">
              <button type="submit" class="a-btn a-btn-primary">Continue</button>
              <button type="button" class="a-btn a-btn-secondary" onclick="cancelCustomerAccountForm()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;

  document.body.style.overflow = "hidden";
}

function collectCustomerAccountFromForm() {
  const customerName = (document.getElementById("accountName")?.value || "").trim();
  const phone = (document.getElementById("accountPhone")?.value || "").trim();
  const location = (document.getElementById("accountLocation")?.value || "").trim();
  return { customerName, phone, location };
}

function normalizePhone(raw) {
  return String(raw || "").replace(/[^\d+]/g, "");
}

async function upsertCustomerUser(dbApi, customerId, userPayload) {
  try {
    await dbApi.users.create(customerId, userPayload);
    return { saved: true, mode: "create" };
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    const code = String(error?.code || "").toLowerCase();
    const duplicate = code.includes("already-exists") || message.includes("already exists");

    if (!duplicate) throw error;

    await dbApi.users.update(customerId, userPayload);
    return { saved: true, mode: "update" };
  }
}

export async function submitCustomerAccountForm(event) {
  event?.preventDefault?.();
  const dbApi = await waitForDbApi();
  const { customerName, phone: rawPhone, location } = collectCustomerAccountFromForm();
  const phone = normalizePhone(rawPhone);

  showAccountFormError("");
  showAccountFormInfo("");

  if (!customerName || !phone) {
    showAccountFormError("Name aur WhatsApp number required hain.");
    return;
  }

  if (phone.length < 10) {
    showAccountFormError("WhatsApp number sahi format me likhein.");
    return;
  }

  const customerId = `customer-${slugify(phone || customerName) || Date.now()}`;
  const profile = { customerId, customerName, phone, location };
  setCachedCustomerProfile(profile);

  const userPayload = {
    fullName: customerName,
    email: "",
    role: "customer",
    phone,
    address: location,
    isActive: true,
    lastLoginAt: new Date().toISOString(),
  };

  try {
    await upsertCustomerUser(dbApi, customerId, userPayload);
  } catch (error) {
    console.error("User create/update failed.", error);
    showAccountFormError("Account save nahi hua. Dobara try karein.");
    return;
  }

  if (state.pendingAccountResolver) {
    state.pendingAccountResolver(profile);
    state.pendingAccountResolver = null;
  }

  closeCustomerAccountForm();
}

export async function ensureCustomerAccount() {
  const cached = getCachedCustomerProfile();
  if (cached && cached.customerId && cached.customerName && cached.phone) return cached;

  return new Promise((resolve) => {
    state.pendingAccountResolver = resolve;
    showCustomerAccountForm(cached);
  });
}

export function showCustomerReviewForm(product, profile) {
  state.pendingReviewProduct = product;
  const root = document.getElementById("modalRoot");
  root.innerHTML = `
    <div class="modal-bd" id="reviewModal" onclick="closeCustomerReviewForm()">
      <div class="modal-box review-modal-box" onclick="event.stopPropagation()">
        <button class="modal-x" onclick="closeCustomerReviewForm()">✕</button>
        <div class="review-sheet">
          <div class="review-head">
            <h3 class="review-title">Customer Review</h3>
            <span class="review-chip">${escapeAttr(product.category || "Product")}</span>
          </div>
          <p class="review-sub">${escapeAttr(product.name)} ke liye review share karein.</p>
          <form id="reviewForm" onsubmit="submitCustomerReview(event)">
            <div id="reviewFormErr" class="err-msg"></div>
            <div id="reviewFormInfo" class="info-msg"></div>
            <div class="a-field">
              <label class="a-label" for="reviewName">Your Name</label>
              <input id="reviewName" class="a-input" value="${escapeAttr(profile.customerName || "")}" placeholder="Your name" />
            </div>
            <div class="a-field">
              <label class="a-label" for="reviewLocation">City / Location</label>
              <input id="reviewLocation" class="a-input" value="${escapeAttr(profile.location || "")}" placeholder="City / Location" />
            </div>
            <div class="a-field">
              <label class="a-label" for="reviewRating">Rating</label>
              <select id="reviewRating" class="a-input review-select">
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Very Good</option>
                <option value="3">3 - Good</option>
                <option value="2">2 - Fair</option>
                <option value="1">1 - Poor</option>
              </select>
            </div>
            <div class="a-field">
              <label class="a-label" for="reviewComment">Your Feedback</label>
              <textarea id="reviewComment" class="a-input review-textarea" rows="4" placeholder="Apna experience likhein..."></textarea>
            </div>
            <div class="auth-actions">
              <button type="submit" class="a-btn a-btn-primary">Submit Review</button>
              <button type="button" class="a-btn a-btn-secondary" onclick="closeCustomerReviewForm()">Later</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;

  document.body.style.overflow = "hidden";
}

export function closeCustomerReviewForm() {
  const root = document.getElementById("modalRoot");
  if (root) root.innerHTML = "";
  document.body.style.overflow = "";
}

function showReviewFormError(message) {
  const err = document.getElementById("reviewFormErr");
  if (!err) return;
  err.textContent = message || "";
  err.style.display = message ? "block" : "none";
}

function showReviewFormInfo(message) {
  const info = document.getElementById("reviewFormInfo");
  if (!info) return;
  info.textContent = message || "";
  info.style.display = message ? "block" : "none";
}

export async function submitCustomerReview(event) {
  event?.preventDefault?.();
  if (!state.pendingReviewProduct) return;

  showReviewFormError("");
  showReviewFormInfo("");

  const name = (document.getElementById("reviewName")?.value || "").trim();
  const location = (document.getElementById("reviewLocation")?.value || "").trim();
  const rating = Number(document.getElementById("reviewRating")?.value || 5);
  const comment = (document.getElementById("reviewComment")?.value || "").trim();

  if (!name || !comment) {
    showReviewFormError("Name aur review comment required hain.");
    return;
  }

  const profile = getCachedCustomerProfile();
  const customerId =
    profile.customerId || `customer-${slugify(profile.phone || name) || Date.now()}`;

  try {
    const dbApi = await waitForDbApi();
    await dbApi.reviews.create({
      productId: state.pendingReviewProduct.id,
      userId: customerId,
      rating,
      title: `Review for ${state.pendingReviewProduct.name}`,
      comment,
      customerName: name,
      location,
      avatar: name.slice(0, 2).toUpperCase(),
      type: "product",
      isApproved: true,
    });

    setCachedCustomerProfile({ ...profile, customerId, customerName: name, location });

    showReviewFormInfo("Shukriya! Aapka review save ho gaya.");
    setTimeout(() => {
      closeCustomerReviewForm();
    }, 900);
  } catch (error) {
    console.error("Failed to save review.", error);
    showReviewFormError("Review save nahi ho saka. Please try again.");
  }
}

export async function openWhatsApp(product) {
  try {
    const profile = await ensureCustomerAccount();
    if (!profile) return;
    window.open(buildWhatsAppURL(product), "_blank", "noopener,noreferrer");
    showCustomerReviewForm(product, profile);
  } catch (error) {
    console.error("Customer order flow failed.", error);
  }
}

export function openWhatsAppById(productId) {
  const product = state.PRODUCTS.find((p) => p.id === productId);
  if (!product) return;
  openWhatsApp(product);
}
