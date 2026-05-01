import {
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  state,
  auth,
  dbApi,
  escapeHtml,
  normalizeUsername,
  usernameToEmail,
  readAuthForm,
  setAuthMessage,
  triggerRender,
} from "./core.js";
import { loadAdminData } from "./firestore.js";

export function renderAuthScreen() {
  const app = document.getElementById("app");
  const isRegister = state.authMode === "register";
  app.innerHTML = `
      <div class="admin-login">
        <div class="admin-login-logo">🌸 Maha Admin</div>
        <div class="admin-login-sub">${isRegister ? "Create your admin account" : "Sign in to the dashboard"}</div>
        ${state.authStatus ? `<div class="a-success-msg show" style="display:block;margin-bottom:12px">${escapeHtml(state.authStatus)}</div>` : ""}
        ${state.authError ? `<div id="loginErr" class="err-msg" style="display:block">❌ ${escapeHtml(state.authError)}</div>` : `<div id="loginErr" class="err-msg" style="display:none">❌ Authentication error</div>`}
        <div class="a-field">
          <label class="a-label">Username</label>
          <input type="text" id="authUsername" class="a-input" placeholder="admin" value="${escapeHtml(state.pendingUsername)}" autofocus onkeypress="if(event.key==='Enter') ${isRegister ? "register()" : "login()"}"/>
        </div>
        <div class="a-field">
          <label class="a-label">Password</label>
          <input type="password" id="authPassword" class="a-input" placeholder="••••••••" onkeypress="if(event.key==='Enter') ${isRegister ? "register()" : "login()"}"/>
        </div>
        ${
          isRegister
            ? `
        <div class="a-field">
          <label class="a-label">Confirm Password</label>
          <input type="password" id="authConfirmPassword" class="a-input" placeholder="••••••••" onkeypress="if(event.key==='Enter') register()"/>
        </div>`
            : ""
        }
        <button class="a-btn a-btn-primary" onclick="${isRegister ? "register()" : "login()"}">${isRegister ? "Create Account" : "Login to Dashboard"}</button>
        <button class="a-btn a-btn-secondary" style="margin-top:10px" onclick="toggleAuthMode()">${isRegister ? "Already registered? Login" : "New here? Register"}</button>
      </div>
    `;
}



export async function ensureAdminRecord(user, usernameHint = "") {
  if (!user) return null;
  const existing = await dbApi.admins.getById(user.uid).catch(() => null);
  const username = normalizeUsername(
    usernameHint || user.displayName || user.email || user.uid,
  );
  const payload = {
    username,
    displayName: user.displayName || username,
    email: user.email || usernameToEmail(username),
    role: "admin",
    isActive: true,
  };

  if (existing) {
    if (!existing.username || !existing.displayName || !existing.email) {
      await dbApi.admins.update(user.uid, payload).catch(() => {});
    }
    return { id: user.uid, ...existing, ...payload };
  }

  await dbApi.admins.create(user.uid, payload);
  return { id: user.uid, ...payload };
}

export async function finalizeSignIn(user, usernameHint) {
  await ensureAdminRecord(user, usernameHint);
  state.adminAuthed = true;
  state.authStatus = "";
  state.authError = "";
  await loadAdminData();
  triggerRender();
}

export async function login() {
  const { username, password } = readAuthForm();
  state.pendingUsername = username;
  state.authError = "";

  if (!username || !password) {
    setAuthMessage("Username and password are required.", true);
    triggerRender();
    return;
  }

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      usernameToEmail(username),
      password,
    );
    await finalizeSignIn(credential.user, username);
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      setAuthMessage(
        "Username not found. Please contact administrator.",
        true,
      );
      triggerRender();
      return;
    }

    if (
      error?.code === "auth/wrong-password" ||
      error?.code === "auth/invalid-credential"
    ) {
      setAuthMessage(
        "Invalid username or password.",
        true,
      );
      triggerRender();
      return;
    }

    console.error(error);
    setAuthMessage(error?.message || "Login failed.", true);
    triggerRender();
  }
}



export async function logout() {
  await signOut(auth).catch(() => {});
  state.adminAuthed = false;
  state.authInitialized = true;
  state.authStatus = "";
  state.authError = "";
  triggerRender();
}
