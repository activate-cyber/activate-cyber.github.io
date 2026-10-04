import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const config = window.ACTIVATE_FIREBASE_CONFIG;
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

function cart() { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } }
function saveCart(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); updateCartBadge(); }
function updateCartBadge() {
  const b=document.getElementById("activate-cart-count"); if (b) b.textContent=String(cart().length);
}
function addToCart(name, price) {
  const items=cart();
  if (!items.some(x=>x.name===name)) items.push({name,price});
  saveCart(items); openCart();
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

function setupUI() {
  const nav = document.querySelector(".cyber-navbar nav");
  if (!nav) return;

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
    const total = items.reduce((sum, x) => sum + Number(x.price || 0), 0);
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

  onAuthStateChanged(auth, (user) => {
    authBtn.textContent = user
      ? (user.email?.split("@")[0] || "Compte")
      : "Connexion";

    authBtn.onclick = user
      ? async () => {
          if (confirm("Se déconnecter ?")) await signOut(auth);
        }
      : openAuth;

    window.ACTIVATE_CURRENT_USER = user || null;
    window.dispatchEvent(new CustomEvent("activate-auth-changed"));
  });

  // Synchronise l'affichage des prix avec le bouton Mensuel / Annuel de la page.
  // En annuel, le gros prix est le montant réellement facturé en une fois.
  function syncActivatePricing() {
    const annualToggle = document.querySelector('.cyber-billing-switch button[aria-pressed="true"]');
    const isAnnual = !!document.querySelector('.cyber-billing-switch button.is-active') && document.querySelector('.cyber-billing-switch button.is-active')?.textContent?.trim().toLowerCase() === "annuel";
    const plans = Array.from(document.querySelectorAll(".cyber-plan"));
    const annualPrices = [228, 428];

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
      const annualPrice = annualPrices[index];

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
  const pricingObserver = new MutationObserver(() => syncActivatePricing());
  pricingObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-pressed", "class"] });
  setInterval(syncActivatePricing, 250);

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
      const annual = document.querySelector(".cyber-billing-switch button.is-active")?.textContent?.trim().toLowerCase() === "annuel";
      const planIndex = Array.from(document.querySelectorAll(".cyber-plan")).indexOf(card);
      const price = annual && [228,428][planIndex] ? [228,428][planIndex] : parseEuro(button.textContent) || parseEuro(card.querySelector(".cyber-plan-price strong")?.textContent);
      const period = annual ? "annuel" : "mensuel";
      if (!price) return;
      const items = cart();
      if (!items.some(x => x.name === name && x.period === period)) items.push({name, price, period});
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
      const annualPrices = [228, 428];
      const planIndex = Array.from(document.querySelectorAll(".cyber-plan")).indexOf(card);

      let price;
      let period;

      if (isAnnual && annualPrices[planIndex]) {
        price = annualPrices[planIndex];
        period = "annuel";
      } else {
        price = parseEuro(card.querySelector(".cyber-plan-price strong")?.textContent);
        period = "mensuel";
      }

      if (!price) return;

      button.textContent = `Ajouter au panier — ${formatEUR(price)}`;

      const items = cart();
      if (!items.some(x => x.name === name && x.period === period)) {
        items.push({ name, price: Number(price), period });
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
  const total = items.reduce((sum, x) => sum + Number(x.price || 0), 0);

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
waitForApp(setupUI);
