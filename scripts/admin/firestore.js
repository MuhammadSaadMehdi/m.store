import {
  state,
  dbApi,
  loadFromLocalStorage,
  saveToLocalStorage,
  toUiPrice,
  getCategoryNameFromId,
  slugify,
} from "./core.js";

export async function hydrateFromFirestore() {
  const [
    categoriesResult,
    productsResult,
    reviewsResult,
    usersResult,
    adminsResult,
    inventoryResult,
  ] = await Promise.allSettled([
    dbApi.categories.getAll({ orderByField: "name", orderDirection: "asc" }),
    dbApi.products.getAll({
      orderByField: "createdAt",
      orderDirection: "desc",
    }),
    dbApi.reviews.getAll({ orderByField: "createdAt", orderDirection: "desc" }),
    dbApi.users.getAll({ orderByField: "createdAt", orderDirection: "desc" }),
    dbApi.admins.getAll({ orderByField: "createdAt", orderDirection: "desc" }),
    dbApi.inventory.getAll({ orderByField: "createdAt", orderDirection: "desc" }),
  ]);

  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const products = productsResult.status === "fulfilled" ? productsResult.value : [];
  const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value : [];
  const users = usersResult.status === "fulfilled" ? usersResult.value : [];
  const admins = adminsResult.status === "fulfilled" ? adminsResult.value : [];
  const inventory = inventoryResult.status === "fulfilled" ? inventoryResult.value : [];

  state.CATEGORY_MAP = {};
  categories.forEach((c) => {
    state.CATEGORY_MAP[c.id] = c.name;
  });

  state.CATEGORY_ITEMS = categories;
  state.CATEGORIES = ["All", ...categories.map((c) => c.name)];

  state.PRODUCTS = products.map((p) => ({
    id: p.id,
    name: p.name || "",
    price: toUiPrice(p.price),
    category: getCategoryNameFromId(p.categoryId),
    image: Array.isArray(p.images) && p.images.length ? p.images[0] : "",
    tag: p.tag || "",
    rating: Number(p.ratingAvg || 0),
    reviews: Number(p.ratingCount || 0),
    description: p.description || "",
  }));

  state.TESTIMONIALS = reviews
    .filter((r) => !r.productId || r.type === "testimonial")
    .map((r) => ({
      id: r.id,
      name: r.customerName || "",
      location: r.location || "",
      text: r.comment || "",
      avatar: r.avatar || (r.customerName || "").slice(0, 2).toUpperCase(),
      rating: Number(r.rating || 0),
    }));

  state.CUSTOMER_REVIEWS = reviews
    .filter((r) => r.productId || r.type === "product")
    .map((r) => ({
      id: r.id,
      productId: r.productId || "",
      customerName: r.customerName || "",
      location: r.location || "",
      rating: Number(r.rating || 0),
      comment: r.comment || "",
      productName:
        state.PRODUCTS.find((p) => p.id === r.productId)?.name || r.productId || "General",
    }));

  const customerUsers = users.map((u) => ({
    id: u.id,
    uid: u.id,
    fullName: u.fullName || "",
    email: u.email || "",
    role: u.role || "customer",
    phone: u.phone || "",
    address: u.address || "",
    isActive: u.isActive ?? true,
    lastLoginAt: u.lastLoginAt || "",
  }));

  const adminUsers = admins.map((a) => ({
    id: a.id,
    uid: a.id,
    fullName: a.displayName || a.username || "",
    email: a.email || "",
    role: "admin",
    phone: "",
    address: "",
    isActive: a.isActive ?? true,
    lastLoginAt: "",
  }));

  const reviewUsers = state.CUSTOMER_REVIEWS.filter((r) => r.customerName).map((r) => {
    const uid = `review-${slugify(`${r.customerName}-${r.location}`)}`;
    return {
      id: uid,
      uid,
      fullName: r.customerName,
      email: "",
      role: "customer",
      phone: "",
      address: r.location || "",
      isActive: true,
      lastLoginAt: "",
    };
  });

  const mergedUsers = [...adminUsers, ...customerUsers, ...reviewUsers];
  const seenUsers = new Set();
  state.USERS = mergedUsers.filter((u) => {
    const key = String(u.uid || u.id || "").toLowerCase();
    if (!key || seenUsers.has(key)) return false;
    seenUsers.add(key);
    return true;
  });

  state.INVENTORY = inventory.map((item) => ({
    id: item.id,
    productId: item.productId || "",
    type: item.type || "adjustment",
    qty: Number(item.qty || 0),
  }));
}

export async function loadAdminData() {
  try {
    await hydrateFromFirestore();
  } catch (error) {
    console.error("Firestore load failed, using localStorage fallback.", error);
    loadFromLocalStorage();
  }
}

export async function saveSiteSettings() {
  saveToLocalStorage();
}
