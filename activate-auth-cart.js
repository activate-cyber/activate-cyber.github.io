import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

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
    getLink("#services", "Services"),
    getLink("#about", "À propos"),
    getLink("#subscriptions", "Abonnements"),
    getLink("#school-subscriptions", "Tarifs écoles")
  ];

  const dashboardData = {
    href: "https://activate-cyber.github.io/#dashboard",
    text: "Dashboard"
  };
  const contactData =
    linkData.find(x => x.href.startsWith("mailto:")) ||
    {href:"mailto:activate.cyber@gmail.com", text:"Nous contacter"};

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

  // Contact reste volontairement hors du cadre.
  const contact = document.createElement("a");
  contact.href = contactData.href;
  contact.textContent = contactData.text;
  contact.className = "activate-contact-link";

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

  nav.append(linkShell, contact, cartBtn, authBtn);

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
  const msg = document.getElementById("activate-auth-message");

  let signup = false;

  const openAuth = () => {
    modal.hidden = false;
    msg.textContent = "";
  };

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

  // Les boutons de chaque formule deviennent des ajouts au panier avec le prix réel.
  document.querySelectorAll(".cyber-plan-action").forEach((button) => {
    if (button.dataset.activatePaymentBound === "1") return;
    button.dataset.activatePaymentBound = "1";

    const card = button.closest(".cyber-plan, .cyber-school-plan");
    if (!card) return;

    const name =
      card.querySelector(".cyber-plan-name, .cyber-school-plan h4")?.textContent?.trim() ||
      "Abonnement Activate";

    const billing = card.querySelector(".cyber-plan-billing")?.textContent || "";
    let price = parseEuro(billing);

    if (!price) {
      const priceNode =
        card.querySelector(".cyber-plan-price strong, .cyber-school-price strong");
      price = parseEuro(priceNode?.textContent);
    }

    const period =
      billing.includes("an") && !billing.includes("mois")
        ? "annuel"
        : "mensuel";

    button.href = "#";
    button.removeAttribute("target");
    button.textContent = `Ajouter au panier — ${formatEUR(price)}`;
    button.addEventListener("click", (event) => {
      event.preventDefault();

      const items = cart();
      if (!items.some(x => x.name === name && Number(x.price) === Number(price))) {
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


(function activateRequestedNavigation(){
  function apply(){
    const nav=document.querySelector(".cyber-navbar nav");
    if(!nav || nav.dataset.activateNavFixed==="1") return;
    nav.dataset.activateNavFixed="1";

    nav.querySelectorAll(".activate-nav-links,#activate-login-btn,#activate-cart-btn").forEach(e=>e.remove());

    const shell=document.createElement("div");
    shell.className="activate-nav-links";
    [
      ["Services","https://activate-cyber.github.io/#services"],
      ["À propos","https://activate-cyber.github.io/#about"],
      ["Abonnements","https://activate-cyber.github.io/#subscriptions"],
      ["Tarifs écoles","https://activate-cyber.github.io/#school-subscriptions"],
      ["Dashboard","https://activate-cyber.github.io/#dashboard"]
    ].forEach(([t,h])=>{
      const a=document.createElement("a");
      a.href=h; a.textContent=t; shell.appendChild(a);
    });

    const contact=document.createElement("a");
    contact.href="mailto:activate.cyber@gmail.com";
    contact.textContent="Contact";
    contact.className="activate-contact-link";

    const cart=document.createElement("button");
    cart.id="activate-cart-btn";
    cart.className="activate-nav-btn activate-cart-btn";
    cart.type="button";
    cart.innerHTML='🛒 Panier <span id="activate-cart-count">0</span>';

    const login=document.createElement("button");
    login.id="activate-login-btn";
    login.className="activate-nav-btn activate-auth-btn";
    login.type="button";
    login.textContent="Connexion";

    nav.append(shell,contact,cart,login);

    // Reconnecte les fonctions déjà présentes dans le fichier.
    if(typeof openCart==="function") cart.onclick=openCart;
    if(typeof updateCartBadge==="function") updateCartBadge();
    if(typeof setupAuthButton==="function") setupAuthButton(login);
  }
  const obs=new MutationObserver(apply);
  obs.observe(document.body,{childList:true,subtree:true});
  setTimeout(apply,500);
  setTimeout(apply,1500);
})();
