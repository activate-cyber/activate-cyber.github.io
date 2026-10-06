import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, verifyBeforeUpdateEmail, updatePassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const config = window.ACTIVATE_FIREBASE_CONFIG;

// API Activate
window.ACTIVATE_API_URL = "https://activate-cyber.websr.gg";
if (!config) throw new Error("Configuration Firebase Activate introuvable.");

const app = getApps().length ? getApps()[0] : initializeApp(config);
const auth = getAuth(app);
const CART_KEY = "activate_cart_v1";

const waitForApp = (fn) => {
  if (document.querySelector(".cyber-navbar nav")) fn();
  else {
    const obs = new MutationObserver(() => {
      if (document.querySelector(".cyber-navbar nav")) { obs.disconnect(); fn(); }
    });
    obs.observe(document.getElementById("root") || document.body, {childList:true, subtree:true});
  }
};

function cart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
}
function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
}
function updateCartBadge() {
  const b=document.getElementById("activate-cart-count");
  if (b) b.textContent=String(cart().length);
}
function getSiteSettings() {
  return window.ACTIVATE_SITE_SETTINGS || {
    plans: [
      { sku: "activate_basic", name: "Standard", monthlyPrice: 20.99, annualPrice: 228 },
      { sku: "activate_pro", name: "Accès anticipé", monthlyPrice: 42.99, annualPrice: 428 }
    ],
    coupons: [{ name: "Réduction", code: "-10%", type: "percent", value: 10, expiresAt: "" }]
  };
}
function getCoupon(code) {
  const value = String(code || "").trim().toUpperCase();
  const coupons = Array.isArray(getSiteSettings().coupons) ? getSiteSettings().coupons : [];
  return coupons.find(c => String(c.code || "").trim().toUpperCase() === value);
}
function couponDiscount(coupon, subtotal) {
  if (!coupon || subtotal <= 0) return 0;
  const now = Date.now();
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) return 0;
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return 0;
  if (coupon.minAmount && subtotal < Number(coupon.minAmount)) return 0;
  if (String(coupon.type).toLowerCase() === "fixed") return Math.min(subtotal, Math.max(0, Number(coupon.value) || 0));
  return Math.min(subtotal, subtotal * (Math.max(0, Number(coupon.value) || 0) / 100));
}
function cartPricing() {
  const items = cart();
  const subtotal = items.reduce((sum, x) => sum + Number(x.price || 0), 0);
  const code = String(localStorage.getItem("activate_coupon_v1") || "").trim().toUpperCase();
  const coupon = getCoupon(code);
  const discount = coupon ? couponDiscount(coupon, subtotal) : 0;
  return { subtotal, coupon, code: coupon ? code : "", discount, total: Math.max(0, subtotal - discount) };
}
function reconcileCartPrices() {
  const settings = getSiteSettings();
  const plans = Array.isArray(settings.plans) ? settings.plans : [];
  let changed = false;
  const items = cart().map(item => {
    const plan = item.sku ? plans.find(p => p.sku === item.sku) :
      plans.find(p => p.name === item.name);
    if (!plan) return item;
    const annual = item.period === "annuel";
    const nextPrice = Number(annual ? plan.annualPrice : plan.monthlyPrice);
    if (nextPrice > 0 && Number(item.price) !== nextPrice) {
      changed = true;
      return {...item, price: nextPrice, sku: plan.sku};
    }
    if (!item.sku) { changed = true; return {...item, sku: plan.sku}; }
    return item;
  });
  if (changed) saveCart(items);
  return items;
}
function addToCart(name, price) {
  const items=cart();
  if (!items.some(x=>x.name===name)) items.push({name,price});
  saveCart(items); openCart();
}
function openCart() {
  const box = document.getElementById("activate-cart-modal");
  if (!box) return;

  reconcileCartPrices();
  const items = cart();
  const pricing = cartPricing();

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
            <div class="activate-cart-promo">
              <label for="activate-promo-code">Code promo</label>
              <div class="activate-cart-promo-row">
                <input id="activate-promo-code" type="text" maxlength="40" placeholder="EXEMPLE20" value="${escapeHtml(pricing.code)}">
                <button id="activate-promo-apply" type="button">Appliquer</button>
              </div>
              <p id="activate-promo-message"></p>
            </div>
            <div class="activate-cart-total"><span>Sous-total</span><strong>${formatEUR(pricing.subtotal)}</strong></div>
            ${pricing.discount > 0 ? `<div class="activate-cart-total"><span>Réduction ${escapeHtml(pricing.coupon.code)}</span><strong>−${formatEUR(pricing.discount)}</strong></div>` : ""}
            <div class="activate-cart-total"><span>Total</span><strong>${formatEUR(pricing.total)}</strong></div>
            <a class="activate-paypal-button" href="${paypalLink(pricing.total)}" target="_blank" rel="noopener noreferrer">
              Payer ${formatEUR(pricing.total)} avec PayPal
            </a>
            <p class="activate-cart-note">Le montant affiché est recalculé à partir des prix et codes promo actuellement configurés.</p>`
          : `<p>Ton panier est vide.</p>`
      }
      <a class="activate-dashboard-back" href="https://activate-cyber.github.io/#dashboard">Ouvrir le Dashboard</a>
    </div>
  `;

  box.hidden = false;
  box.querySelector("[data-close-cart]")?.addEventListener("click", () => { box.hidden = true; });

  box.querySelector("#activate-promo-apply")?.addEventListener("click", () => {
    const input = box.querySelector("#activate-promo-code");
    const message = box.querySelector("#activate-promo-message");
    const code = String(input?.value || "").trim().toUpperCase();
    if (!code) {
      localStorage.removeItem("activate_coupon_v1");
      openCart();
      return;
    }
    const coupon = getCoupon(code);
    const subtotal = cartPricing().subtotal;
    if (!coupon) {
      message.textContent = "Code promo invalide ou inactif.";
      return;
    }
    const discount = couponDiscount(coupon, subtotal);
    if (discount <= 0) {
      message.textContent = "Ce code promo ne peut pas être appliqué à ce panier.";
      return;
    }
    localStorage.setItem("activate_coupon_v1", code);
    openCart();
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
function escapeHtml(v){return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

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
    if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
    const response = await fetch(`${base}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `API HTTP ${response.status}`);
    return data;
  }

  function applySiteSettings(settings) {
    if (!settings) return;
    const plans = Array.isArray(settings.plans) ? settings.plans : [];
    const cards = Array.from(document.querySelectorAll(".cyber-plan"));
    cards.forEach((card, index) => {
      const p = plans[index];
      if (!p) return;
      const name = card.querySelector(".cyber-plan-name");
      const monthly = card.querySelector(".cyber-plan-price strong");
      if (name) name.textContent = p.name;
      if (monthly) {
        card.dataset.activateMonthlyPrice = String(Number(p.monthlyPrice));
      }
      const active = document.querySelector('.cyber-billing-switch button.is-active, .cyber-billing-switch button[aria-pressed="true"]');
      if (active?.textContent?.trim().toLowerCase() === "annuel") {
        if (monthly) monthly.textContent = formatEUR(p.annualPrice);
        const period = card.querySelector(".cyber-plan-price span");
        if (period) period.textContent = "/ an";
      } else if (monthly) {
        monthly.textContent = formatEUR(p.monthlyPrice);
        const period = card.querySelector(".cyber-plan-price span");
        if (period) period.textContent = "/ mois";
      }
      const action = card.querySelector(".cyber-plan-action");
      if (action) action.textContent = `Ajouter au panier — ${formatEUR(active?.textContent?.trim().toLowerCase() === "annuel" ? p.annualPrice : p.monthlyPrice)}`;
    });

    const about = settings.about || {};
    const aboutSection = document.querySelector("#about");
    if (aboutSection) {
      const title = aboutSection.querySelector("h2");
      const texts = aboutSection.querySelectorAll(".cyber-about-text p");
      if (title && about.title) title.textContent = about.title;
      if (texts[0] && about.text1) texts[0].textContent = about.text1;
      if (texts[1] && about.text2) texts[1].textContent = about.text2;
    }
  }

  async function loadPublicSiteSettings() {
    try {
      const data = await apiJson("/api/site/settings");
      applySiteSettings(data.settings);
      window.ACTIVATE_SITE_SETTINGS = data.settings;
    } catch (e) {
      // Le site continue de fonctionner avec ses valeurs intégrées si l'API est indisponible.
      console.warn("[Activate] Paramètres API indisponibles:", e.message);
    }
  }

  function openAdminPanel() {
    let overlay = document.getElementById("activate-admin-overlay");
    if (!overlay) {
      document.body.insertAdjacentHTML("beforeend", `
        <div id="activate-admin-overlay" class="activate-overlay" hidden>
          <div class="activate-admin-card activate-admin-v2-card">
            <button class="activate-close" id="activate-admin-close" type="button">×</button>
            <p class="cyber-eyebrow"><span></span> ADMIN ACTIVATE</p>
            <h2>Panel d’administration</h2>
            <p class="activate-admin-note">Gère les prix, les codes promo et le contenu du site.</p>
            <div id="activate-admin-form"></div>
            <button id="activate-admin-save" class="activate-main-btn" type="button">Enregistrer les modifications</button>
            <p id="activate-admin-message"></p>
          </div>
        </div>`);
      overlay = document.getElementById("activate-admin-overlay");
      document.getElementById("activate-admin-close").onclick = () => { overlay.hidden = true; };
    }

    const settings = window.ACTIVATE_SITE_SETTINGS || {
      plans: [
        { sku: "activate_basic", name: "Standard", monthlyPrice: 20.99, annualPrice: 228 },
        { sku: "activate_pro", name: "Accès anticipé", monthlyPrice: 42.99, annualPrice: 428 }
      ],
      coupons: [{ name: "Réduction", code: "-10%", type: "percent", value: 10, expiresAt: "" }],
      about: { title: "", text1: "", text2: "" }
    };
    if (!Array.isArray(settings.coupons)) settings.coupons = [];

    const form = document.getElementById("activate-admin-form");
    form.innerHTML = `
      <section class="activate-admin-section">
        <h3>Produits et prix</h3>
        <p class="activate-admin-help">Les nouveaux prix sont appliqués au site et aux articles déjà présents dans le panier.</p>
        ${settings.plans.map((p, i) => `
          <div class="activate-admin-plan activate-admin-row">
            <input data-admin-plan-name="${i}" value="${escapeHtml(p.name)}" aria-label="Nom ${i + 1}" placeholder="Nom">
            <input data-admin-plan-sku="${i}" value="${escapeHtml(p.sku || "")}" aria-label="SKU ${i + 1}" placeholder="SKU">
            <label>Mensuel<input data-admin-monthly="${i}" type="number" min="0" step="0.01" value="${Number(p.monthlyPrice)}"></label>
            <label>Annuel<input data-admin-annual="${i}" type="number" min="0" step="0.01" value="${Number(p.annualPrice)}"></label>
          </div>`).join("")}
      </section>

      <section class="activate-admin-section">
        <h3>Codes promo</h3>
        <div class="activate-admin-tabs">
          <button type="button" class="activate-link-btn" id="activate-codes-created-tab">Codes créés</button>
          <button type="button" class="activate-link-btn" id="activate-code-create-tab">Créer un code</button>
        </div>
        <div id="activate-codes-created-view">
          <p class="activate-admin-help">Les codes déjà créés peuvent uniquement être supprimés.</p>
          <div class="activate-admin-coupons">
            ${settings.coupons.length ? settings.coupons.map((c, i) => `
              <div class="activate-admin-coupon" data-coupon-row="${i}">
                <div class="activate-admin-coupon-summary">
                  <div><strong>Nom :</strong> ${escapeHtml(c.name || c.code || "Sans nom")}</div>
                  <div><strong>Code :</strong> ${escapeHtml(c.code || "")}</div>
                  <div><strong>Fin :</strong> ${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("fr-FR") : "Aucune"}</div>
                  <div><strong>Coupon :</strong> ${String(c.type || "percent").toLowerCase() === "fixed" ? formatEUR(c.value) : `${Number(c.value) || 0} %`}</div>
                </div>
                <button type="button" class="activate-admin-delete" data-coupon-delete="${i}">Supprimer</button>
              </div>`).join("") : `<p class="activate-admin-empty">Aucun code promo configuré.</p>`}
          </div>
        </div>
        <div id="activate-code-create-view" hidden>
          <p class="activate-admin-help">Crée un nouveau code. Après création, il apparaîtra dans « Codes créés ».</p>
          <div class="activate-admin-row">
            <label>Nom<input id="activate-new-coupon-name" placeholder="Activate"></label>
            <label>Code<input id="activate-new-coupon-code" placeholder="ACTIVATE10"></label>
            <label>Type<select id="activate-new-coupon-type"><option value="percent">Pourcentage</option><option value="fixed">Montant fixe</option></select></label>
            <label>Réduction<input id="activate-new-coupon-value" type="number" min="0" step="0.01" value="10"></label>
            <label>Fin<input id="activate-new-coupon-expire" type="date"></label>
          </div>
          <button type="button" id="activate-admin-create-coupon" class="activate-main-btn">Créer le code</button>
        </div>
      </section>

      <section class="activate-admin-section">
        <h3>À propos</h3>
        <label>Titre<input id="admin-about-title" value="${escapeHtml(settings.about?.title || "")}"></label>
        <label>Texte 1<textarea id="admin-about-text1">${escapeHtml(settings.about?.text1 || "")}</textarea></label>
        <label>Texte 2<textarea id="admin-about-text2">${escapeHtml(settings.about?.text2 || "")}</textarea></label>
      </section>
    `;

    const createdView = form.querySelector("#activate-codes-created-view");
    const createView = form.querySelector("#activate-code-create-view");
    form.querySelector("#activate-codes-created-tab")?.addEventListener("click", () => { createdView.hidden = false; createView.hidden = true; });
    form.querySelector("#activate-code-create-tab")?.addEventListener("click", () => { createdView.hidden = true; createView.hidden = false; });

    form.querySelectorAll("[data-coupon-delete]").forEach(btn => {
      btn.addEventListener("click", () => {
        settings.coupons.splice(Number(btn.dataset.couponDelete), 1);
        window.ACTIVATE_SITE_SETTINGS = settings;
        openAdminPanel();
      });
    });

    form.querySelector("#activate-admin-create-coupon")?.addEventListener("click", () => {
      const name = form.querySelector("#activate-new-coupon-name")?.value.trim();
      const code = form.querySelector("#activate-new-coupon-code")?.value.trim().toUpperCase();
      const type = form.querySelector("#activate-new-coupon-type")?.value || "percent";
      const value = Number(form.querySelector("#activate-new-coupon-value")?.value) || 0;
      const expiresAt = form.querySelector("#activate-new-coupon-expire")?.value || "";
      if (!name || !code || value <= 0) return;
      if (type === "percent" && value > 100) return;
      if (settings.coupons.some(c => String(c.code || "").toUpperCase() === code)) return;
      settings.coupons.push({ name, code, type, value, expiresAt });
      window.ACTIVATE_SITE_SETTINGS = settings;
      openAdminPanel();
      form.querySelector("#activate-codes-created-tab")?.click();
    });

    const msg = document.getElementById("activate-admin-message");
    msg.textContent = "";
    document.getElementById("activate-admin-save").onclick = async () => {
      const save = document.getElementById("activate-admin-save");
      save.disabled = true;
      msg.textContent = "Enregistrement…";
      try {
        const next = {
          ...settings,
          plans: settings.plans.map((p, i) => ({
            ...p,
            sku: form.querySelector(`[data-admin-plan-sku="${i}"]`).value.trim() || p.sku,
            name: form.querySelector(`[data-admin-plan-name="${i}"]`).value.trim(),
            monthlyPrice: Number(form.querySelector(`[data-admin-monthly="${i}"]`).value),
            annualPrice: Number(form.querySelector(`[data-admin-annual="${i}"]`).value)
          })),
          coupons: settings.coupons.map(c => ({ ...c, code: String(c.code || "").trim().toUpperCase() })).filter(c => c.code),
          about: {
            title: document.getElementById("admin-about-title").value,
            text1: document.getElementById("admin-about-text1").value,
            text2: document.getElementById("admin-about-text2").value
          }
        };

        for (const c of next.coupons) {
          if (c.type === "percent" && c.value > 100) throw new Error(`Le code ${c.code} dépasse 100 %.`);
          if (c.value < 0) throw new Error(`Valeur invalide pour ${c.code}.`);
        }

        const result = await apiJson("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: next })
        });
        window.ACTIVATE_SITE_SETTINGS = result.settings || next;
        applySiteSettings(window.ACTIVATE_SITE_SETTINGS);
        reconcileCartPrices();
        msg.textContent = "✓ Prix et codes promo enregistrés.";
        openCartIfOpen();
      } catch (e) {
        msg.textContent = `Erreur : ${e.message}`;
      } finally { save.disabled = false; }
    };
    overlay.hidden = false;
  }

  function openCartIfOpen() {
    const box = document.getElementById("activate-cart-modal");
    if (box && !box.hidden) openCart();
  }

function setupUI() {
  if (window.ACTIVATE_UI_SETUP_DONE) return;
  const nav = document.querySelector(".cyber-navbar nav");
  if (!nav) return;
  window.ACTIVATE_UI_SETUP_DONE = true;

  // Supprime les contrôles éventuellement injectés par d'anciennes versions.
  document.querySelectorAll(".cyber-account-button, .cyber-cart-button").forEach(el => el.remove());
  document.querySelectorAll('[data-activate-old-control="true"]').forEach(el => el.remove());

  // Recrée la navigation à partir des liens présents, sans conserver d'anciens doublons.
  const linkData = Array.from(nav.querySelectorAll("a")).map(a => ({
    href: a.getAttribute("href") || "",
    text: a.textContent?.trim() || ""
  }));

  const getLink = (href, fallbackText) => {
    const found = linkData.find(x => x.href === href);
    return {
      href,
      text: found?.text || fallbackText
    };
  };

  const wanted = [
    {href:"https://activate-cyber.github.io/#services", text:"Services"},
    {href:"https://activate-cyber.github.io/#about", text:"À propos"},
    {href:"https://activate-cyber.github.io/#subscriptions", text:"Abonnements"},
    {href:"https://activate-cyber.github.io/#school-subscriptions", text:"Tarifs écoles"}
  ];

  const dashboardData = {
    href: "https://activate-cyber.github.io/#dashboard",
    text: "Dashboard"
  };

  // Nettoyage complet de la nav : les contrôles seront recréés juste après.
  nav.innerHTML = "";

  const linkShell = document.createElement("div");
  linkShell.className = "activate-nav-links";

  wanted.forEach(({href, text}) => {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    linkShell.appendChild(a);
  });

  const dashboard = document.createElement("a");
  dashboard.href = dashboardData.href;
  dashboard.textContent = dashboardData.text;
  linkShell.appendChild(dashboard);

  let authBtn = document.getElementById("activate-login-btn");
  if (!authBtn) {
    authBtn = document.createElement("button");
    authBtn.id = "activate-login-btn";
    authBtn.dataset.activateControl = "auth";
    authBtn.className = "activate-nav-btn activate-auth-btn";
    authBtn.type = "button";
  }

  let cartBtn = document.getElementById("activate-cart-btn");
  if (!cartBtn) {
    cartBtn = document.createElement("button");
    cartBtn.id = "activate-cart-btn";
    cartBtn.dataset.activateControl = "cart";
    cartBtn.className = "activate-nav-btn activate-cart-btn";
    cartBtn.type = "button";
  }
  cartBtn.innerHTML = '🛒 Panier <span id="activate-cart-count">0</span>';

  nav.append(linkShell, cartBtn, authBtn);


  // Ouvre les pages Dashboard/sections dans une superposition sur la page actuelle.
  if (!document.getElementById("activate-dashboard-overlay")) {
    document.body.insertAdjacentHTML("beforeend", `
      <div id="activate-dashboard-overlay" class="activate-overlay activate-dashboard-overlay" hidden>
        <div class="activate-dashboard-overlay-card">
          <button class="activate-close" id="activate-dashboard-overlay-close" type="button">×</button>
          <iframe id="activate-dashboard-frame" title="Dashboard Activate"></iframe>
        </div>
      </div>
    `);
  }

  const dashboardOverlay = document.getElementById("activate-dashboard-overlay");
  const dashboardFrame = document.getElementById("activate-dashboard-frame");
  const closeDashboard = document.getElementById("activate-dashboard-overlay-close");

  const openDashboardOverlay = (href) => {
    const url = new URL(href, window.location.origin);
    const hash = url.hash || "#dashboard";

    // L'URL visible reste toujours la page principale.
    history.pushState(null, "", `${window.location.origin}/${hash}`);

    // Pour le Dashboard, on rend directement le vrai contenu sur la page principale.
    // Cela évite un iframe vide et garde exactement le comportement de Connexion.
    if (hash === "#dashboard") {
      dashboardFrame.removeAttribute("src");
      dashboardFrame.src = "about:blank";
      dashboardOverlay.hidden = true;
      document.body.classList.add("activate-dashboard-open");
      renderDashboardOverlay();
      return;
    }

    // Les autres sections utilisent dashboard.html dans la superposition.
    dashboardFrame.src = `${window.location.origin}/dashboard.html${hash}`;
    dashboardOverlay.hidden = false;
    document.body.classList.add("activate-dashboard-open");
  };


  function renderDashboardOverlay() {
    let panel = document.getElementById("activate-dashboard-direct");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "activate-dashboard-direct";
      panel.className = "activate-dashboard-direct";
      panel.innerHTML = `
        <div class="activate-dashboard-direct-card">
          <button class="activate-close" id="activate-dashboard-direct-close" type="button">×</button>
          <div class="activate-dashboard-heading">
            <p class="cyber-eyebrow"><span></span> ESPACE CLIENT</p>
            <h1>Dashboard <strong>Activate.</strong></h1>
            <p>Retrouve ton compte, ton panier et le montant à payer.</p>
          </div>
          <div class="activate-dashboard-content" id="activate-dashboard-direct-content"></div>
        </div>
      `;
      document.body.appendChild(panel);
      document.getElementById("activate-dashboard-direct-close").onclick = () => {
        panel.remove();
        document.body.classList.remove("activate-dashboard-open");
        history.pushState(null, "", `${window.location.origin}/`);
      };
    }

    const user = window.ACTIVATE_CURRENT_USER;
    const items = cart();
    const pricing = cartPricing();
    const total = pricing.total;
    const content = document.getElementById("activate-dashboard-direct-content");

    content.innerHTML = `
      <div class="activate-dashboard-grid">
        <section class="activate-dashboard-card">
          <p class="activate-dashboard-kicker">COMPTE</p>
          <h2>${user ? "Bienvenue" : "Connexion requise"}</h2>
          <p>${user ? escapeHtml(user.email || "") : "Connecte-toi avec le bouton Connexion pour accéder à ton compte."}</p>
        </section>
        <section class="activate-dashboard-card">
          <p class="activate-dashboard-kicker">PANIER</p>
          <h2>${items.length} article${items.length > 1 ? "s" : ""}</h2>
          ${
            items.length
              ? `<div class="activate-dashboard-items">
                  ${items.map((x, i) => `
                    <div class="activate-dashboard-item">
                      <span>${escapeHtml(x.name)}${x.period ? ` <small>(${escapeHtml(x.period)})</small>` : ""}</span>
                      <strong>${formatEUR(x.price)}</strong>
                      <button type="button" data-dashboard-direct-remove="${i}">×</button>
                    </div>
                  `).join("")}
                </div>
                <div class="activate-dashboard-total"><span>Sous-total</span><strong>${formatEUR(pricing.subtotal)}</strong></div>
                ${pricing.discount > 0 ? `<div class="activate-dashboard-total"><span>Réduction ${escapeHtml(pricing.coupon.code)}</span><strong>−${formatEUR(pricing.discount)}</strong></div>` : ""}
                <div class="activate-dashboard-total"><span>Total</span><strong>${formatEUR(total)}</strong></div>
                <a class="activate-paypal-button" href="${paypalLink(total)}" target="_blank" rel="noopener noreferrer">
                  Payer ${formatEUR(total)} avec PayPal
                </a>`
              : `<p class="activate-dashboard-empty">Ton panier est vide.</p>
                 <a class="activate-dashboard-back" href="${window.location.origin}/#subscriptions">Voir les abonnements</a>`
          }
        </section>
      </div>
    `;

    content.querySelectorAll("[data-dashboard-direct-remove]").forEach(btn => {
      btn.onclick = () => {
        const itemsNow = cart();
        itemsNow.splice(Number(btn.dataset.dashboardDirectRemove), 1);
        saveCart(itemsNow);
        renderDashboardOverlay();
      };
    });
  }

  closeDashboard.onclick = () => {
    dashboardOverlay.hidden = true;
    dashboardFrame.src = "about:blank";
    document.getElementById("activate-dashboard-direct")?.remove();
    document.body.classList.remove("activate-dashboard-open");
    history.pushState(null, "", `${window.location.origin}/`);
  };

  dashboardOverlay.addEventListener("click", (event) => {
    if (event.target === dashboardOverlay) closeDashboard.click();
  });

  linkShell.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", (event) => {
      const url = new URL(a.href, window.location.origin);
      const hash = url.hash || "";

      // Seul le Dashboard est une superposition.
      // Les autres liens doivent utiliser les ancres normales de la page principale
      // afin de faire défiler directement jusqu'à leur section.
      if (hash !== "#dashboard") {
        return;
      }

      event.preventDefault();
      openDashboardOverlay(a.href);
    });
  });

  // Auth modal.
  if (!document.getElementById("activate-auth-modal")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="activate-auth-modal" class="activate-overlay" hidden>
        <div class="activate-modal-card">
          <button class="activate-close" data-close-auth type="button">×</button>
          <h2 id="activate-auth-title">Connexion</h2>
          <input id="activate-email" type="email" placeholder="Adresse e-mail" autocomplete="email">
          <input id="activate-password" type="password" placeholder="Mot de passe" autocomplete="current-password">
          <button id="activate-auth-submit" class="activate-main-btn" type="button">Se connecter</button>
          <button id="activate-google-login" class="activate-google-btn" type="button">Continuer avec Google</button>
          <button id="activate-auth-switch" class="activate-link-btn" type="button">Créer un compte</button>
          <p id="activate-auth-message"></p>
        </div>
      </div>`
    );
  }

  if (!document.getElementById("activate-cart-modal")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="activate-cart-modal" class="activate-overlay" hidden></div>`
    );
  }

  const modal = document.getElementById("activate-auth-modal");
  const email = document.getElementById("activate-email");
  const password = document.getElementById("activate-password");
  const submit = document.getElementById("activate-auth-submit");
  const sw = document.getElementById("activate-auth-switch");
  const googleBtn = document.getElementById("activate-google-login");
  const msg = document.getElementById("activate-auth-message");

  let signup = false;

  const openAuth = (message = "") => {
    modal.hidden = false;
    msg.textContent = message;
    email.focus();
  };
  window.ACTIVATE_OPEN_AUTH = openAuth;

  authBtn.onclick = openAuth;
  cartBtn.onclick = openCart;

  modal.querySelector("[data-close-auth]").onclick = () => {
    modal.hidden = true;
  };

  sw.onclick = () => {
    signup = !signup;
    document.getElementById("activate-auth-title").textContent =
      signup ? "Créer un compte" : "Connexion";
    submit.textContent = signup ? "Créer le compte" : "Se connecter";
    sw.textContent = signup ? "J’ai déjà un compte" : "Créer un compte";
    password.autocomplete = signup ? "new-password" : "current-password";
  };

  submit.onclick = async () => {
    msg.textContent = "";
    try {
      if (signup) {
        await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
      } else {
        await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
      }
      modal.hidden = true;
    } catch (e) {
      msg.textContent = e.code?.replace("auth/", "") || "Une erreur est survenue.";
    }
  };

  googleBtn.onclick = async () => {
    msg.textContent = "";
    googleBtn.disabled = true;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      modal.hidden = true;
    } catch (e) {
      msg.textContent = e.code?.replace("auth/", "") || "Connexion Google impossible.";
    } finally {
      googleBtn.disabled = false;
    }
  };

  function closeActivateProfileMenu() {
    document.getElementById("activate-profile-menu")?.remove();
  }

  function openActivateProfileMenu(user) {
    closeActivateProfileMenu();
    if (!user) return openAuth();
    const menu = document.createElement("div");
    menu.id = "activate-profile-menu";
    menu.innerHTML = `
      <div class="activate-profile-menu-backdrop"></div>
      <div class="activate-profile-menu-card" role="dialog" aria-modal="true" aria-label="Compte">
        <button class="activate-profile-close" type="button" aria-label="Fermer">×</button>
        <div class="activate-profile-head">
          <div class="activate-profile-avatar">${escapeHtml((user.email || "?").slice(0,1).toUpperCase())}</div>
          <div><strong>${escapeHtml(user.email?.split("@")[0] || "Compte")}</strong><small>${escapeHtml(user.email || "")}</small></div>
        </div>
        <div class="activate-profile-actions">
          <button type="button" data-profile-action="email">📧 Changer l’email</button>
          <button type="button" data-profile-action="password">🔑 Changer le mot de passe</button>
          <button type="button" data-profile-action="language">🌐 Langue</button>
          <button type="button" data-profile-action="verification">✓ Vérification du compte</button>
          <button type="button" data-profile-action="logout" class="danger">↪ Se déconnecter</button>
        </div>
        <p class="activate-profile-msg" aria-live="polite"></p>
      </div>`;
    const style = document.createElement("style");
    style.id = "activate-profile-menu-style";
    style.textContent = `
      #activate-profile-menu{position:fixed;inset:0;z-index:99999;font-family:Inter,system-ui,sans-serif}
      .activate-profile-menu-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(5px)}
      .activate-profile-menu-card{position:absolute;top:72px;right:22px;width:min(380px,calc(100vw - 30px));padding:22px;border:1px solid rgba(255,52,41,.5);border-radius:16px;background:#0b0b0d;color:#fff;box-shadow:0 20px 70px rgba(0,0,0,.55)}
      .activate-profile-close{position:absolute;right:12px;top:9px;border:0;background:transparent;color:#aaa;font-size:28px;cursor:pointer}
      .activate-profile-head{display:flex;align-items:center;gap:12px;padding:4px 30px 18px 0;border-bottom:1px solid #29292d}
      .activate-profile-avatar{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:#ff3429;color:#fff;font-weight:800}
      .activate-profile-head strong,.activate-profile-head small{display:block}.activate-profile-head small{color:#999;margin-top:3px;font-size:12px;overflow:hidden;text-overflow:ellipsis;max-width:280px}
      .activate-profile-actions{display:grid;gap:8px;margin-top:16px}.activate-profile-actions button{padding:12px 13px;border:1px solid #29292d;border-radius:10px;background:#151519;color:#fff;text-align:left;cursor:pointer}.activate-profile-actions button:hover{border-color:#ff3429}.activate-profile-actions .danger{color:#ff7068}.activate-profile-msg{color:#aaa;font-size:13px;min-height:18px;margin:14px 2px 0}
    `;
    document.head.appendChild(style);
    document.body.appendChild(menu);
    const msg = menu.querySelector(".activate-profile-msg");
    menu.querySelector(".activate-profile-close").onclick = closeActivateProfileMenu;
    menu.querySelector(".activate-profile-menu-backdrop").onclick = closeActivateProfileMenu;
    menu.querySelector('[data-profile-action="email"]').onclick = async () => {
      const next = prompt("Nouvelle adresse e-mail :", user.email || "");
      if (!next || next.trim().toLowerCase() === (user.email || "").toLowerCase()) return;
      try {
        await verifyBeforeUpdateEmail(user, next.trim());
        msg.textContent = "Un e-mail de vérification a été envoyé à la nouvelle adresse.";
      } catch (e) {
        msg.textContent = e.code === "auth/requires-recent-login" ? "Reconnecte-toi puis réessaie pour changer l’e-mail." : (e.code?.replace("auth/", "") || "Impossible de changer l’e-mail.");
      }
    };
    menu.querySelector('[data-profile-action="password"]').onclick = async () => {
      const next = prompt("Nouveau mot de passe (6 caractères minimum) :");
      if (!next) return;
      if (next.length < 6) { msg.textContent = "Le mot de passe doit contenir au moins 6 caractères."; return; }
      try {
        await updatePassword(user, next);
        msg.textContent = "Mot de passe modifié avec succès.";
      } catch (e) {
        if (e.code === "auth/requires-recent-login") {
          if (confirm("La session doit être récente. Envoyer un e-mail de réinitialisation ?")) {
            await sendPasswordResetEmail(auth, user.email);
            msg.textContent = "E-mail de réinitialisation envoyé.";
          }
        } else if (e.code === "auth/operation-not-allowed") {
          msg.textContent = "Ce compte n’utilise pas un mot de passe (ex. connexion Google).";
        } else msg.textContent = e.code?.replace("auth/", "") || "Impossible de changer le mot de passe.";
      }
    };
    menu.querySelector('[data-profile-action="language"]').onclick = () => {
      const choices = ["fr", "en", "tr"];
      const current = localStorage.getItem(`activate_lang_${user.uid}`) || "fr";
      const value = prompt("Langue (fr / en / tr) :", current)?.trim().toLowerCase();
      if (!value || !choices.includes(value)) { if (value) msg.textContent = "Langue invalide. Utilise fr, en ou tr."; return; }
      localStorage.setItem(`activate_lang_${user.uid}`, value);
      msg.textContent = "Langue enregistrée. Recharge la page pour appliquer toutes les traductions.";
    };
    menu.querySelector('[data-profile-action="verification"]').onclick = async () => {
      if (user.emailVerified) msg.textContent = "Ton adresse e-mail est déjà vérifiée.";
      else { try { const { sendEmailVerification } = await import("https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js"); await sendEmailVerification(user); msg.textContent = "E-mail de vérification envoyé."; } catch (e) { msg.textContent = e.code?.replace("auth/", "") || "Impossible d’envoyer l’e-mail."; } }
    };
    menu.querySelector('[data-profile-action="logout"]').onclick = async () => { closeActivateProfileMenu(); await signOut(auth); };
  }

  onAuthStateChanged(auth, async (user) => {
    authBtn.textContent = user
      ? (user.email?.split("@")[0] || "Compte")
      : "Connexion";

    authBtn.onclick = user
      ? () => openActivateProfileMenu(user)
      : openAuth;

    window.ACTIVATE_CURRENT_USER = user || null;
    window.dispatchEvent(new CustomEvent("activate-auth-changed"));

    // Le bouton Admin n'est affiché que si l'API confirme le custom claim admin.
    document.getElementById("activate-admin-btn")?.remove();
    if (user) {
      try {
        const adminResult = await apiJson("/api/admin/me");
        if (adminResult.admin) {
          const adminBtn = document.createElement("button");
          adminBtn.id = "activate-admin-btn";
          adminBtn.className = "activate-nav-btn activate-admin-btn";
          adminBtn.type = "button";
          adminBtn.textContent = "⚙ Admin";
          adminBtn.onclick = openAdminPanel;
          const nav = document.querySelector(".cyber-navbar nav");
          nav?.appendChild(adminBtn);
        }
      } catch (_) {}
    }
  });

  // Synchronise l'affichage des prix avec le bouton Mensuel / Annuel de la page.
  // En annuel, le gros prix est le montant réellement facturé en une fois.
  function syncActivatePricing() {
    const activeBillingButton = document.querySelector('.cyber-billing-switch button.is-active, .cyber-billing-switch button[aria-pressed="true"]');
    const isAnnual = activeBillingButton?.textContent?.trim().toLowerCase() === "annuel";
    const plans = Array.from(document.querySelectorAll(".cyber-plan"));
    const settings = getSiteSettings();
    const configuredPlans = Array.isArray(settings.plans) ? settings.plans : [];

    plans.forEach((card, index) => {
      const priceStrong = card.querySelector(".cyber-plan-price strong");
      const pricePeriod = card.querySelector(".cyber-plan-price span");
      const action = card.querySelector(".cyber-plan-action");
      if (!priceStrong || !pricePeriod) return;

      if (!card.dataset.activateMonthlyPrice) {
        const monthlyButtonPrice = parseEuro(action?.textContent || "");
        card.dataset.activateMonthlyPrice = String(monthlyButtonPrice || parseEuro(priceStrong.textContent || ""));
      }

      const monthlyPrice = Number(card.dataset.activateMonthlyPrice);
      const annualPrice = Number(configuredPlans[index]?.annualPrice || 0);

      if (isAnnual && annualPrice) {
        priceStrong.textContent = formatEUR(annualPrice);
        pricePeriod.textContent = "/ an";
        const billing = card.querySelector(".cyber-plan-billing");
        if (billing) billing.textContent = "Facturé en une fois";
        if (action) action.textContent = `Ajouter au panier — ${formatEUR(annualPrice)}`;
      } else if (monthlyPrice) {
        priceStrong.textContent = formatEUR(monthlyPrice);
        pricePeriod.textContent = "/ mois";
        const billing = card.querySelector(".cyber-plan-billing");
        if (billing) billing.textContent = "Facturé mensuellement";
        if (action) action.textContent = `Ajouter au panier — ${formatEUR(monthlyPrice)}`;
      }
    });
  }

  syncActivatePricing();
  loadPublicSiteSettings();

  // Surveille uniquement le sélecteur Mensuel/Annuel au lieu de tout le document.
  // Cela évite une boucle de mutations qui pouvait faire charger la page en continu.
  const billingSwitch = document.querySelector('.cyber-billing-switch');
  if (billingSwitch && !billingSwitch.dataset.activatePricingObserver) {
    billingSwitch.dataset.activatePricingObserver = "1";
    const pricingObserver = new MutationObserver(() => syncActivatePricing());
    pricingObserver.observe(billingSwitch, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-pressed", "class"] });
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest?.(".cyber-billing-switch")) {
      setTimeout(syncActivatePricing, 0);
    }
  });

  // Interception globale en phase capture : elle bloque aussi le handler React
  // du site original, afin qu'un abonnement ne puisse jamais être ajouté sans compte.
  if (!window.ACTIVATE_PLAN_CAPTURE_BOUND) {
    window.ACTIVATE_PLAN_CAPTURE_BOUND = true;
    document.addEventListener("click", (event) => {
      const button = event.target.closest?.(".cyber-plan-action");
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      if (!auth.currentUser) {
        window.ACTIVATE_OPEN_AUTH?.("Connecte-toi ou crée un compte avant d'ajouter une formule au panier.");
        return;
      }

      const card = button.closest(".cyber-plan, .cyber-school-plan");
      if (!card) return;
      const name = card.querySelector(".cyber-plan-name, .cyber-school-plan h4")?.textContent?.trim() || "Abonnement Activate";
      const activeBillingButton = document.querySelector(".cyber-billing-switch button.is-active, .cyber-billing-switch button[aria-pressed=\"true\"]");
      const annual = activeBillingButton?.textContent?.trim().toLowerCase() === "annuel";
      const planIndex = Array.from(document.querySelectorAll(".cyber-plan")).indexOf(card);
      const configuredPlan = getSiteSettings().plans?.[planIndex];
      const price = annual && Number(configuredPlan?.annualPrice) ? Number(configuredPlan.annualPrice) : Number(configuredPlan?.monthlyPrice) || parseEuro(button.textContent) || parseEuro(card.querySelector(".cyber-plan-price strong")?.textContent);
      const period = annual ? "annuel" : "mensuel";
      if (!price) return;
      const items = cart();
      if (!items.some(x => x.name === name && x.period === period)) items.push({name, price, period, sku: configuredPlan?.sku || ""});
      saveCart(items);
      openCart();
    }, true);
  }

  // Les boutons de chaque formule deviennent des ajouts au panier.
  // Le prix et la période sont lus AU MOMENT du clic afin que le mode
  // Mensuel / Annuel utilise toujours le bon montant.
  document.querySelectorAll(".cyber-plan-action").forEach((button) => {
    if (button.dataset.activatePaymentBound === "1") return;
    button.dataset.activatePaymentBound = "1";

    const card = button.closest(".cyber-plan, .cyber-school-plan");
    if (!card) return;

    const name =
      card.querySelector(".cyber-plan-name, .cyber-school-plan h4")?.textContent?.trim() ||
      "Abonnement Activate";

    button.href = "#";
    button.removeAttribute("target");

    button.addEventListener("click", (event) => {
      event.preventDefault();

      // Un compte est obligatoire avant de pouvoir ajouter un article au panier.
      if (!auth.currentUser) {
        openAuth("Connecte-toi ou crée un compte pour ajouter une formule au panier.");
        return;
      }

      const annualToggle = document.querySelector('.cyber-billing-switch button[aria-pressed="true"]');
      const isAnnual = !!document.querySelector('.cyber-billing-switch button.is-active') && document.querySelector('.cyber-billing-switch button.is-active')?.textContent?.trim().toLowerCase() === "annuel";
      const planIndex = Array.from(document.querySelectorAll(".cyber-plan")).indexOf(card);
      const configuredPlan = getSiteSettings().plans?.[planIndex];

      let price;
      let period;

      if (isAnnual && Number(configuredPlan?.annualPrice)) {
        price = Number(configuredPlan.annualPrice);
        period = "annuel";
      } else {
        price = Number(configuredPlan?.monthlyPrice) || parseEuro(card.querySelector(".cyber-plan-price strong")?.textContent);
        period = "mensuel";
      }

      if (!price) return;

      button.textContent = `Ajouter au panier — ${formatEUR(price)}`;

      const items = cart();
      if (!items.some(x => x.name === name && x.period === period)) {
        items.push({ name, price: Number(price), period, sku: configuredPlan?.sku || "" });
        saveCart(items);
      }
      openCart();
    });
  });

  updateCartBadge();
  renderDashboardIfPresent();
}

function renderDashboardIfPresent() {
  let root = document.getElementById("activate-dashboard");

  // Le Dashboard vit sur la page principale et utilise uniquement #dashboard.
  if (!root && window.location.hash === "#dashboard") {
    root = document.createElement("section");
    root.id = "activate-dashboard";
    root.className = "activate-dashboard-main";
    root.dataset.activateDashboardDynamic = "1";
    root.innerHTML = `
      <div class="activate-dashboard-heading">
        <p class="cyber-eyebrow"><span></span> ESPACE CLIENT</p>
        <h1>Dashboard <strong>Activate.</strong></h1>
        <p>Retrouve ton compte, ton panier et le montant à payer.</p>
      </div>
      <div class="activate-dashboard-content"></div>
    `;
    document.body.appendChild(root);
    root = root.querySelector("#activate-dashboard") || root;
  }

  if (!root) {
    const dynamic = document.querySelector('[data-activate-dashboard-dynamic="1"]');
    if (dynamic && window.location.hash !== "#dashboard") dynamic.remove();
    return;
  }

  if (root.dataset.activateDashboardDynamic === "1" && window.location.hash !== "#dashboard") {
    root.remove();
    return;
  }

  // Si le conteneur a été créé ci-dessus, le contenu réel est rendu dans sa zone dédiée.
  const contentRoot = root.querySelector(".activate-dashboard-content");
  if (contentRoot) {
    contentRoot.id = "activate-dashboard-content";
  }

  const user = window.ACTIVATE_CURRENT_USER;
  const items = cart();
  const pricing = cartPricing();
  const total = pricing.total;

  const dashboardTarget = document.getElementById("activate-dashboard-content") || root;
  dashboardTarget.innerHTML = `
    <div class="activate-dashboard-grid">
      <section class="activate-dashboard-card">
        <p class="activate-dashboard-kicker">COMPTE</p>
        <h2>${user ? "Bienvenue" : "Connexion requise"}</h2>
        <p>${user ? escapeHtml(user.email || "") : "Connecte-toi avec le bouton Connexion pour accéder à ton compte."}</p>
      </section>
      <section class="activate-dashboard-card">
        <p class="activate-dashboard-kicker">PANIER</p>
        <h2>${items.length} article${items.length > 1 ? "s" : ""}</h2>
        ${
          items.length
            ? `<div class="activate-dashboard-items">
                ${items.map((x, i) => `
                  <div class="activate-dashboard-item">
                    <span>${escapeHtml(x.name)}${x.period ? ` <small>(${escapeHtml(x.period)})</small>` : ""}</span>
                    <strong>${formatEUR(x.price)}</strong>
                    <button type="button" data-dashboard-remove="${i}" aria-label="Supprimer">×</button>
                  </div>
                `).join("")}
              </div>
              <div class="activate-dashboard-total"><span>Sous-total</span><strong>${formatEUR(pricing.subtotal)}</strong></div>
                ${pricing.discount > 0 ? `<div class="activate-dashboard-total"><span>Réduction ${escapeHtml(pricing.coupon.code)}</span><strong>−${formatEUR(pricing.discount)}</strong></div>` : ""}
                <div class="activate-dashboard-total"><span>Total</span><strong>${formatEUR(total)}</strong></div>
              <a class="activate-paypal-button" href="${paypalLink(total)}" target="_blank" rel="noopener noreferrer">
                Payer ${formatEUR(total)} avec PayPal
              </a>
              <p class="activate-dashboard-note">Le lien PayPal ouvre le paiement correspondant au total affiché.</p>`
            : `<p class="activate-dashboard-empty">Ton panier est vide. Retourne aux abonnements pour choisir une formule.</p>
               <a class="activate-dashboard-back" href="https://activate-cyber.github.io/#subscriptions">Voir les abonnements</a>`
        }
      </section>
    </div>
  `;

  dashboardTarget.querySelectorAll("[data-dashboard-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const itemsNow = cart();
      itemsNow.splice(Number(btn.dataset.dashboardRemove), 1);
      saveCart(itemsNow);
      renderDashboardIfPresent();
    });
  });
}

window.addEventListener("activate-auth-changed", renderDashboardIfPresent);
window.addEventListener("storage", renderDashboardIfPresent);
window.addEventListener("hashchange", renderDashboardIfPresent);

waitForApp(setupUI);
