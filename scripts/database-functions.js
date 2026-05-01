import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	updateDoc,
	writeBatch,
	where,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import "./firebase-setup.js";

function getDb() {
	if (!window.db) {
		throw new Error("Firestore is not initialized. Load firebase-setup.js first.");
	}
	return window.db;
}

function withCreatedAndUpdated(data) {
	return {
		...data,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	};
}

function withUpdated(data) {
	return {
		...data,
		updatedAt: serverTimestamp(),
	};
}

function toCategoryPayload(input) {
	return {
		name: input.name || "",
		isActive: input.isActive ?? true,
	};
}

function toProductPayload(input) {
	return {
		name: input.name || "",
		description: input.description || "",
		categoryId: input.categoryId || "",
		price: Number(input.price ?? 0),
		currency: input.currency || "PKR",
		images: Array.isArray(input.images) ? input.images : [],
		isActive: input.isActive ?? true,
		isFeatured: input.isFeatured ?? false,
		tag: input.tag || "",
		ratingAvg: Number(input.ratingAvg ?? 0),
		ratingCount: Number(input.ratingCount ?? 0),
	};
}

function toUserPayload(input) {
	return {
		fullName: input.fullName || "",
		email: input.email || "",
		role: input.role || "customer",
		phone: input.phone || "",
		address: input.address || "",
		isActive: input.isActive ?? true,
		lastLoginAt: input.lastLoginAt ?? null,
	};
}

function toAdminPayload(input) {
	return {
		username: input.username || "",
		displayName: input.displayName || input.username || "",
		email: input.email || "",
		role: input.role || "admin",
		isActive: input.isActive ?? true,
	};
}

function toReviewPayload(input) {
	return {
		productId: input.productId || "",
		userId: input.userId || "",
		rating: Number(input.rating ?? 0),
		title: input.title || "",
		comment: input.comment || "",
		type: input.type || (input.productId ? "product" : "testimonial"),
		customerName: input.customerName || "",
		location: input.location || "",
		avatar: input.avatar || "",
		isApproved: input.isApproved ?? true,
	};
}

function toInventoryPayload(input) {
	return {
		productId: input.productId || "",
		type: input.type || "adjustment",
		qty: Number(input.qty ?? 0),
	};
}

async function createDocument(collectionName, data, id, withUpdatedAt = false) {
	const db = getDb();
	if (id) {
		const ref = doc(db, collectionName, id);
		const payload = withUpdatedAt ? withCreatedAndUpdated(data) : { ...data, createdAt: serverTimestamp() };
		await setDoc(ref, payload, { merge: true });
		return { id: ref.id, ...payload };
	}

	const payload = withUpdatedAt ? withCreatedAndUpdated(data) : { ...data, createdAt: serverTimestamp() };
	const ref = await addDoc(collection(db, collectionName), payload);
	return { id: ref.id, ...payload };
}

async function readDocument(collectionName, id) {
	const db = getDb();
	const ref = doc(db, collectionName, id);
	const snap = await getDoc(ref);
	if (!snap.exists()) return null;
	return { id: snap.id, ...snap.data() };
}

async function readAllDocuments(collectionName, options = {}) {
	const db = getDb();
	let q = collection(db, collectionName);

	if (options.whereField && options.whereOp && options.whereValue !== undefined) {
		q = query(q, where(options.whereField, options.whereOp, options.whereValue));
	}

	if (options.orderByField) {
		q = query(q, orderBy(options.orderByField, options.orderDirection || "desc"));
	}

	if (options.limitCount) {
		q = query(q, limit(options.limitCount));
	}

	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function updateDocument(collectionName, id, data, withUpdatedAt = false) {
	const db = getDb();
	const ref = doc(db, collectionName, id);
	await updateDoc(ref, withUpdatedAt ? withUpdated(data) : data);
	return readDocument(collectionName, id);
}

async function deleteDocument(collectionName, id) {
	const db = getDb();
	const ref = doc(db, collectionName, id);
	await deleteDoc(ref);
	return { id, deleted: true };
}

async function deleteDocumentsByField(collectionName, field, value) {
	const db = getDb();
	const q = query(collection(db, collectionName), where(field, "==", value));
	const snap = await getDocs(q);

	if (snap.empty) return 0;

	const batch = writeBatch(db);
	snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
	await batch.commit();

	return snap.size;
}

const categoriesApi = {
	create: async (data, id) => createDocument("categories", toCategoryPayload(data), id, true),
	getById: async (id) => readDocument("categories", id),
	getAll: async (options = {}) => readAllDocuments("categories", { orderByField: "createdAt", ...options }),
	update: async (id, data) => updateDocument("categories", id, toCategoryPayload(data), true),
	delete: async (id) => {
		const products = await productsApi.getByCategoryId(id);
		await Promise.all(products.map((product) => productsApi.delete(product.id)));
		return deleteDocument("categories", id);
	},
};

const productsApi = {
	create: async (data, id) => createDocument("products", toProductPayload(data), id, true),
	getById: async (id) => readDocument("products", id),
	getAll: async (options = {}) => readAllDocuments("products", { orderByField: "createdAt", ...options }),
	getByCategoryId: async (categoryId) =>
		readAllDocuments("products", {
			whereField: "categoryId",
			whereOp: "==",
			whereValue: categoryId,
			orderByField: "createdAt",
		}),
	update: async (id, data) => updateDocument("products", id, toProductPayload(data), true),
	delete: async (id) => {
		await Promise.all([
			deleteDocumentsByField("reviews", "productId", id),
			deleteDocumentsByField("inventory", "productId", id),
		]);
		return deleteDocument("products", id);
	},
};

const usersApi = {
	create: async (uid, data) => {
		if (!uid) throw new Error("uid is required for users.create");
		return createDocument("users", toUserPayload(data), uid, true);
	},
	getById: async (uid) => readDocument("users", uid),
	getAll: async (options = {}) => readAllDocuments("users", { orderByField: "createdAt", ...options }),
	update: async (uid, data) => {
		if (!uid) throw new Error("uid is required for users.update");
		return updateDocument("users", uid, toUserPayload(data), true);
	},
	delete: async (uid) => {
		await deleteDocumentsByField("reviews", "userId", uid);
		return deleteDocument("users", uid);
	},
};

const adminsApi = {
	create: async (uid, data) => {
		if (!uid) throw new Error("uid is required for admins.create");
		return createDocument("admins", toAdminPayload(data), uid, true);
	},
	getById: async (uid) => readDocument("admins", uid),
	getAll: async (options = {}) => readAllDocuments("admins", { orderByField: "createdAt", ...options }),
	update: async (uid, data) => {
		if (!uid) throw new Error("uid is required for admins.update");
		return updateDocument("admins", uid, toAdminPayload(data), true);
	},
	delete: async (uid) => deleteDocument("admins", uid),
};

const reviewsApi = {
	create: async (data, id) => createDocument("reviews", toReviewPayload(data), id, false),
	getById: async (id) => readDocument("reviews", id),
	getAll: async (options = {}) => readAllDocuments("reviews", { orderByField: "createdAt", ...options }),
	getByProductId: async (productId) =>
		readAllDocuments("reviews", {
			whereField: "productId",
			whereOp: "==",
			whereValue: productId,
			orderByField: "createdAt",
		}),
	update: async (id, data) => updateDocument("reviews", id, toReviewPayload(data), false),
	delete: async (id) => deleteDocument("reviews", id),
};

const inventoryApi = {
	create: async (data, id) => createDocument("inventory", toInventoryPayload(data), id, false),
	getById: async (id) => readDocument("inventory", id),
	getAll: async (options = {}) => readAllDocuments("inventory", { orderByField: "createdAt", ...options }),
	getByProductId: async (productId) =>
		readAllDocuments("inventory", {
			whereField: "productId",
			whereOp: "==",
			whereValue: productId,
			orderByField: "createdAt",
		}),
	update: async (id, data) => updateDocument("inventory", id, toInventoryPayload(data), false),
	delete: async (id) => deleteDocument("inventory", id),
};

export const dbApi = {
	admins: adminsApi,
	categories: categoriesApi,
	products: productsApi,
	users: usersApi,
	reviews: reviewsApi,
	inventory: inventoryApi,
};

window.dbApi = dbApi;
