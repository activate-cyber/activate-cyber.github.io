import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const config = window.ACTIVATE_FIREBASE_CONFIG;

// API Activate
window.ACTIVATE_API_URL = "https://salon-railroad-third-conferencing.trycloudflare.com";

if (!config) throw new Error("Configuration Firebase Activate introuvable.");

const app = getApps().length ? getApps()[0] : initializeApp(config);
const auth = getAuth(app);
const CART_KEY = "activate_cart_v1";

const waitForApp = (fn) => {
  if (document.querySelector(".cyber-navbar nav")) fn();
  else {
    const obs = new MutationObserver(() => {
      if (document.querySelector(".cyber-navbar nav")) {
        obs.disconnect();
        fn();
      }
    });
    obs.observe(document.getElementById("root") || document.body, {
      childList: true,
      subtree: true
    });
  }
};

function cart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
}

function updateCartBadge() {
  const b = document.getElementById("activate-cart-count");
  if (b) b.textContent = String(cart().length);
}

function addToCart(name, price) {
  const items = cart();
  if (!items.some(x => x.name === name)) items.push({ name, price });
  saveCart(items);
  openCart();
}

function openCart() {
  const box = document.getElementById("activate-cart-modal");
  if (!box) return;

  const items = cart();
  const total = items.reduce((sum, x) => sum + Number(x.price || 0), 0);

  box.innerHTML = `
    <div class="activate-modal-card activate-cart-card">
      <button class="activate-close" data-close-cart type="button">×</button>
      <h2>🛒 Panier</h2>
      ${
        items.length
          ? `<div class="activate-cart-items">
              ${items.map((x, i) => `
                <div class="activate-cart-item">
                  <span>${escapeHtml(x.name)}${x.period ? ` <small>(${escapeHtml(x.period)})</small>` : ""}</span>
                  <strong>${formatEUR(x.price)}</strong>
                  <button type="button" data-remove="${i}" aria-label="Supprimer">×</button>
                </div>
              `).join("")}
            </div>
            <div class="activate-cart-total">
              <span>Total</span>
              <strong>${formatEUR(total)}</strong>
            </div>
            <a class="activate-paypal-button" href="${paypalLink(total)}" target="_blank" rel="noopener noreferrer">
              Payer ${formatEUR(total)} avec PayPal
            </a>
            <p class="activate-cart-note">Le paiement s’ouvre sur PayPal avec le montant affiché.</p>`
          : `<p>Ton panier est vide.</p>`
      }
      <a class="activate-dashboard-back" href="https://activate-cyber.github.io/#dashboard">Ouvrir le Dashboard</a>
    </div>
  `;

  box.hidden = false;

  box.querySelector("[data-close-cart]")?.addEventListener("click", () => {
    box.hidden = true;
  });

  box.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const itemsNow = cart();
      itemsNow.splice(Number(btn.dataset.remove), 1);
      saveCart(itemsNow);
      openCart();
    });
  });
}

function escapeHtml(v) {
  return String(v).replace(/[&<>"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[c]));
}

function formatEUR(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function paypalLink(amount) {
  const value = Number(amount) || 0;
  return value > 0
    ? `https://paypal.me/echorouge20/${value.toFixed(2)}`
    : "https://paypal.me/echorouge20";
}

function parseEuro(text) {
  const m = String(text || "").match(/(\d+(?:[.,]\d+)?)\s*€/);
  return m ? Number(m[1].replace(",", ".")) : 0;
}

async function getActivateApiUrl() {
  return String(window.ACTIVATE_API_URL || "").replace(/\/$/, "");
}

async function apiJson(path, options = {}) {
  const base = await getActivateApiUrl();

  if (!base) throw new Error("API Activate non configurée.");

  const headers = { ...(options.headers || {}) };
  const user = auth.currentUser;

  if (user) {
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }

  const response = await fetch(`${base}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `API HTTP ${response.status}`);
  }

  return data;
}

/* --------------------------------------------------
   Le reste de ton code reste exactement comme avant
-------------------------------------------------- */
