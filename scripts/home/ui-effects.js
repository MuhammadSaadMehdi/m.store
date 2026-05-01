import { state } from "./core.js";

let mobileNav;
let heroVideo;
let videoDots;

export function initParticles() {
  const container = document.getElementById("particles");
  for (let i = 0; i < 16; i += 1) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.cssText = `left:${(i * 37 + 13) % 100}%;animation-delay:${(i * 0.7) % 8}s;animation-duration:${6 + ((i * 0.4) % 6)}s;width:${2 + (i % 4)}px;height:${2 + (i % 4)}px;`;
    container.appendChild(p);
  }
}

export function initHeroVideo() {
  heroVideo = document.getElementById("heroVideo");
  videoDots = document.getElementById("videoDots");

  heroVideo.addEventListener("ended", () =>
    setVideo((state.videoIdx + 1) % state.HERO_VIDEOS.length),
  );

  renderDots();
}

function renderDots() {
  videoDots.innerHTML = state.HERO_VIDEOS.map(
    (_, i) => `<button class="vdot${i === state.videoIdx ? " active" : ""}" onclick="setVideo(${i})"></button>`,
  ).join("");
}

export function setVideo(idx) {
  state.videoIdx = idx;
  heroVideo.src = state.HERO_VIDEOS[idx];
  heroVideo.play().catch(() => {});
  renderDots();
}

export function initNavbarScroll() {
  window.addEventListener("scroll", () => {
    document.getElementById("navbar").classList.toggle("scrolled", scrollY > 40);
  });
}

export function initMobileNav() {
  const menuBtn = document.getElementById("menuBtn");
  mobileNav = document.getElementById("mobileNav");
  menuBtn.addEventListener("click", () => mobileNav.classList.toggle("open"));
}

export function closeMobileNav() {
  mobileNav.classList.remove("open");
}
