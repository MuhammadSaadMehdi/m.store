import { auth, state, escapeHtml, showMsg } from "./core.js";
import { saveSiteSettings } from "./firestore.js";

export function renderWebsite() {
    return `<div class="a-section"><div class="a-section-title">🌐 Basic Info</div><div class="a-grid-2"><div><label class="a-label">Brand Name</label><input class="a-input" id="cfg_brandName" value="${state.CONFIG.brandName}"></div><div><label class="a-label">Tagline</label><input class="a-input" id="cfg_tagline" value="${state.CONFIG.tagline}"></div><div><label class="a-label">WhatsApp Number</label><input class="a-input" id="cfg_wa" value="${state.CONFIG.whatsappNumber}"></div></div><div class="a-save-bar"><button class="a-btn a-btn-primary" onclick="saveWebsiteBasic()">Save</button><span id="webMsg" class="a-success-msg">Saved!</span></div></div>
  <div class="a-section"><div class="a-section-title">🏷️ Trust Pills</div><div id="pillsContainer">${(state.CONFIG.trustPills || []).map((p, i) => `<div style="display:flex;gap:8px;margin-bottom:8px"><input class="a-input" id="pill_${i}" value="${p.replace(/\"/g, "&quot;")}" style="flex:1"><button class="a-btn a-btn-danger a-btn-sm" onclick="removeTrustPill(${i})">🗑️</button></div>`).join("")}</div><button class="a-btn a-btn-secondary a-btn-sm" onclick="addTrustPill()">+ Add Pill</button><div class="a-save-bar"><button class="a-btn a-btn-primary" onclick="saveTrustPills()">Save Pills</button><span id="pillMsg" class="a-success-msg">Saved!</span></div></div>`;
}

export async function saveWebsiteBasic() {
    state.CONFIG.brandName = document.getElementById("cfg_brandName").value;
    state.CONFIG.tagline = document.getElementById("cfg_tagline").value;
    state.CONFIG.whatsappNumber = document.getElementById("cfg_wa").value;
    await saveSiteSettings();
    showMsg("webMsg");
}

export function addTrustPill() {
    if (!state.CONFIG.trustPills) state.CONFIG.trustPills = [];
    state.CONFIG.trustPills.push("New Pill");
    window.switchTab("website");
}

export function removeTrustPill(i) {
    state.CONFIG.trustPills.splice(i, 1);
    window.switchTab("website");
}

export async function saveTrustPills() {
    state.CONFIG.trustPills = [];
    document.querySelectorAll('[id^="pill_"]').forEach((inp) => {
        state.CONFIG.trustPills.push(inp.value);
    });
    await saveSiteSettings();
    showMsg("pillMsg");
}

export function renderSocial() {
    return `<div class="a-section"><div class="a-section-title">📱 Social Links</div><div class="a-grid-2"><div><label class="a-label">Instagram URL</label><input class="a-input" id="cfg_ig" value="${state.CONFIG.instagram}"></div><div><label class="a-label">Facebook URL</label><input class="a-input" id="cfg_fb" value="${state.CONFIG.facebook}"></div><div><label class="a-label">TikTok URL</label><input class="a-input" id="cfg_tt" value="${state.CONFIG.tiktok}"></div></div><div class="a-save-bar"><button class="a-btn a-btn-primary" onclick="saveSocial()">Save Social Links</button><span id="socialMsg" class="a-success-msg">Saved!</span></div></div>`;
}

export async function saveSocial() {
    state.CONFIG.instagram = document.getElementById("cfg_ig").value;
    state.CONFIG.facebook = document.getElementById("cfg_fb").value;
    state.CONFIG.tiktok = document.getElementById("cfg_tt").value;
    await saveSiteSettings();
    showMsg("socialMsg");
}

export function renderHero() {
    return `<div class="a-section"><div class="a-section-title">🎥 Hero Text & Banner</div><div class="a-grid-2"><div><label class="a-label">Hero Title Line 1</label><input class="a-input" id="hero1" value="${state.CONFIG.heroTitle1 || "Maha"}"></div><div><label class="a-label">Hero Title Line 2</label><input class="a-input" id="hero2" value="${state.CONFIG.heroTitle2 || "Collection"}"></div><div><label class="a-label">Sub Text</label><textarea class="a-input" id="heroSub">${state.CONFIG.heroSub || ""}</textarea></div><div><label class="a-label">Banner Image URL / Upload</label><div class="img-upload-row"><input class="a-input" id="heroBanner" value="${state.CONFIG.heroBanner || ""}"><button class="img-upload-btn" onclick="document.getElementById('bannerFile').click()">📷 Gallery</button><input type="file" id="bannerFile" accept="image/*" style="display:none" onchange="handleBannerFile(this)"/></div></div></div><div class="a-save-bar"><button class="a-btn a-btn-primary" onclick="saveHeroText()">Save Hero</button><span id="heroMsg" class="a-success-msg">Saved!</span></div></div>
  <div class="a-section"><div class="a-section-title">📊 Stats Numbers</div><div class="a-grid-2">
    ${[
            ["stat1n", "stat1l"],
            ["stat2n", "stat2l"],
            ["stat3n", "stat3l"],
            ["stat4n", "stat4l"]
        ]
            .map(([nk, nl]) =>
                `<div>
          <label class="a-label">${nk}</label>
          <input class="a-input" id="${nk}" value="${state.CONFIG[nk] || ""}">
          <label class="a-label">${nl}</label>
          <input class="a-input" id="${nl}" value="${state.CONFIG[nl] || ""}">
        </div>`
            )
            .join("")}</div><div class="a-save-bar"><button class="a-btn a-btn-primary" onclick="saveStats()">Save Stats</button><span id="statsMsg" class="a-success-msg">Saved!</span></div></div>`;
}

export function handleBannerFile(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        state.CONFIG.heroBanner = ev.target.result;
        const inp = document.getElementById("heroBanner");
        if (inp) inp.value = ev.target.result;
    };
    reader.readAsDataURL(file);
}

export async function saveHeroText() {
    state.CONFIG.heroTitle1 = document.getElementById("hero1").value;
    state.CONFIG.heroTitle2 = document.getElementById("hero2").value;
    state.CONFIG.heroSub = document.getElementById("heroSub").value;
    state.CONFIG.heroBanner = document.getElementById("heroBanner").value;
    await saveSiteSettings();
    showMsg("heroMsg");
}

export async function saveStats() {
    const stats = [
        "stat1n",
        "stat1l",
        "stat2n",
        "stat2l",
        "stat3n",
        "stat3l",
        "stat4n",
        "stat4l",
    ];
    stats.forEach((s) => {
        state.CONFIG[s] = document.getElementById(s).value;
    });
    await saveSiteSettings();
    showMsg("statsMsg");
}

export function renderSecurity() {
    const currentUsername = auth.currentUser?.displayName || state.pendingUsername || "admin";
    const currentEmail = auth.currentUser?.email || `${currentUsername}@maha-admin.local`;
    return `<div class="a-section"><div class="a-section-title">🔐 Admin Account</div><div class="a-grid-2"><div><label class="a-label">Signed In As</label><input class="a-input" value="${escapeHtml(currentUsername)}" disabled></div><div><label class="a-label">Email</label><input class="a-input" value="${escapeHtml(currentEmail)}" disabled></div></div><div class="a-save-bar"><button class="a-btn a-btn-secondary" onclick="logout()">Sign Out</button><span id="pwMsg" class="a-success-msg" style="margin-left:12px">Ready</span></div></div>`;
}
