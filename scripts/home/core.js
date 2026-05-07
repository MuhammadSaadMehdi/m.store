export const state = {
  CONFIG: {
    whatsappNumber: "923700429801",
    brandName: "Maqbool Collection",
    tagline: "Where Every Piece Tells a Story",
    instagram: "https://www.instagram.com/maqboolcollection",
    facebook: "https://www.facebook.com/maqboolcollection",
    tiktok: "https://www.tiktok.com/@maqboolcollection",
    adminPassword: "admin1234",
  },
  HERO_VIDEOS: [
    "https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4",
    "https://videos.pexels.com/video-files/6585726/6585726-uhd_2560_1440_30fps.mp4",
    "https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_25fps.mp4",
  ],
  CATEGORY_MAP: {},
  CUSTOMER_ORDER_CACHE_KEY: "maqbool_customer_profile",
  pendingReviewProduct: null,
  pendingAccountResolver: null,
  activeCategory: "All",
  searchQuery: "",
  videoIdx: 0,
};

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForDbApi(maxWaitMs = 10000) {
  const start = Date.now();
  while (!window.dbApi) {
    if (Date.now() - start > maxWaitMs) throw new Error("dbApi not available");
    await wait(50);
  }
  return window.dbApi;
}

export function toUiPrice(dbPrice) {
  const n = Number(dbPrice || 0);
  return n > 99999 ? Math.round(n / 100) : n;
}

export function categoryLabel(id) {
  return state.CATEGORY_MAP[id] || id || "Uncategorized";
}

export async function loadStoreFromFirestore() {
  const dbApi = await waitForDbApi();
  const [categories, products, reviews] = await Promise.all([
    dbApi.categories.getAll({ orderByField: "name", orderDirection: "asc" }),
    dbApi.products.getAll({ orderByField: "createdAt", orderDirection: "desc" }),
    dbApi.reviews.getAll({ orderByField: "createdAt", orderDirection: "desc" }),
  ]);

  state.CATEGORY_MAP = {};
  categories.forEach((c) => {
    state.CATEGORY_MAP[c.id] = c.name;
  });

  const categoryNames = categories.map((c) => c.name);
  const derived = [...new Set(products.map((p) => categoryLabel(p.categoryId)))].filter(Boolean);
  const mergedCategories = [...new Set([...categoryNames, ...derived])];
  state.CATEGORIES = ["All", ...mergedCategories];

  state.PRODUCTS = products.map((p) => ({
    id: p.id,
    name: p.name || "",
    price: toUiPrice(p.price),
    category: categoryLabel(p.categoryId),
    image: Array.isArray(p.images) && p.images.length ? p.images[0] : "",
    badge: Array.isArray(p.tags) && p.tags.length ? p.tags[0] : "",
    rating: Number(p.ratingAvg || 0),
    reviews: Number(p.ratingCount || 0),
    description: p.description || "",
  }));

  console.log("Loaded products:", reviews);

  state.TESTIMONIALS = reviews
    .filter((r) => !r.productId || r.type === "product")
    .map((r) => ({
      name: r.customerName || "",
      location: r.location || "",
      text: r.comment || "",
      avatar: r.avatar || (r.customerName || "").slice(0, 2).toUpperCase(),
      rating: Number(r.rating || 0),
    }));

  const navLogo = document.querySelector(".nav-logo");
  if (navLogo) {
    const [first = "Maqbool", second = "Collection"] = state.CONFIG.brandName.split(" ");
    navLogo.innerHTML = `${first} <span>${second}</span>`;
  }
}

export function stars(rating, size = 13) {
  return [1, 2, 3, 4, 5]
    .map(
      (i) =>
        `<span style="color:${i <= Math.round(rating) ? "#f59e0b" : "#ddd"};font-size:${size}px">★</span>`,
    )
    .join("");
}

export function buildWhatsAppURL(product) {
  const msg = encodeURIComponent(
    `Assalam o Alaikum!\n\nMujhe yeh order karna hai:\n\n` +
      `*${product.name}*\n` +
      `Price: Rs. ${product.price.toLocaleString("en-PK")}\n` +
      `Image: ${product.image}\n\n` +
      `Please availability aur delivery details bata dein. Shukriya!`,
  );
  return `https://wa.me/${state.CONFIG.whatsappNumber}?text=${msg}`;
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function escapeAttr(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/\"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getCachedCustomerProfile() {
  try {
    const raw = localStorage.getItem(state.CUSTOMER_ORDER_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setCachedCustomerProfile(profile) {
  try {
    localStorage.setItem(state.CUSTOMER_ORDER_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage failures
  }
}
