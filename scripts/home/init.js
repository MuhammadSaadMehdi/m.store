import { loadStoreFromFirestore } from "./core.js";
import {
  renderFilters,
  renderProducts,
  renderTestimonials,
  bindSearchInput,
  setCategory,
  openQuickView,
  closeModal,
  openWhatsAppById,
} from "./catalog.js";
import {
  initParticles,
  initHeroVideo,
  initNavbarScroll,
  initMobileNav,
  closeMobileNav,
  setVideo,
} from "./ui-effects.js";
import {
  submitCustomerReview,
  closeCustomerReviewForm,
  submitCustomerAccountForm,
  cancelCustomerAccountForm,
  closeCustomerAccountForm,
} from "./account.js";

export async function initHomePage() {
  try {
    await loadStoreFromFirestore();
  } catch (error) {
    console.error("Firestore load failed, using local hardcoded fallback.", error);
  }

  initParticles();
  initHeroVideo();
  initNavbarScroll();
  initMobileNav();

  bindSearchInput();
  renderFilters();
  renderProducts();
  renderTestimonials();

  window.setCategory = setCategory;
  window.openQuickView = openQuickView;
  window.closeModal = closeModal;
  window.openWhatsAppById = openWhatsAppById;
  window.closeMobileNav = closeMobileNav;
  window.setVideo = setVideo;

  window.closeCustomerReviewForm = closeCustomerReviewForm;
  window.submitCustomerReview = submitCustomerReview;
  window.submitCustomerAccountForm = submitCustomerAccountForm;
  window.cancelCustomerAccountForm = cancelCustomerAccountForm;
  window.closeCustomerAccountForm = closeCustomerAccountForm;

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}
