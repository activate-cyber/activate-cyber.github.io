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
  const box=document.getElementById("activate-cart-modal"); if(!box) return;
  const items=cart();
  box.innerHTML=`<div class="activate-modal-card"><button class="activate-close" data-close-cart>×</button><h2>🛒 Panier</h2>${items.length?`<div class="activate-cart-items">${items.map((x,i)=>`<div class="activate-cart-item"><span>${escapeHtml(x.name)}</span><strong>${Number(x.price).toFixed(2)} €</strong><button data-remove="${i}">×</button></div>`).join("")}</div><div class="activate-cart-total">Total <strong>${items.reduce((a,x)=>a+Number(x.price||0),0).toFixed(2)} €</strong></div><p class="activate-cart-note">Le paiement sera activé avec le système de paiement sécurisé du serveur.</p>`:`<p>Ton panier est vide.</p>`}</div>`;
  box.hidden=false;
  box.querySelector("[data-close-cart]")?.addEventListener("click",()=>box.hidden=true);
  box.querySelectorAll("[data-remove]").forEach(btn=>btn.addEventListener("click",()=>{const a=cart();a.splice(Number(btn.dataset.remove),1);saveCart(a);openCart();}));
}
function escapeHtml(v){return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function setupUI() {
  const nav = document.querySelector(".cyber-navbar nav");
  if (!nav) return;

  // Nettoyage d'anciens boutons éventuels pour éviter les doublons.
  document.querySelectorAll("#activate-login-btn").forEach((el, i) => {
    if (i > 0) el.remove();
  });
  document.querySelectorAll("#activate-cart-btn").forEach((el, i) => {
    if (i > 0) el.remove();
  });

  // Encadre uniquement les liens de navigation existants.
  let linkShell = nav.querySelector(".activate-nav-links");
  if (!linkShell) {
    linkShell = document.createElement("div");
    linkShell.className = "activate-nav-links";

    Array.from(nav.children).forEach((child) => {
      if (!child.id?.startsWith("activate-")) linkShell.appendChild(child);
    });

    nav.prepend(linkShell);
  }

  let authBtn = document.getElementById("activate-login-btn");
  if (!authBtn) {
    authBtn = document.createElement("button");
    authBtn.id = "activate-login-btn";
    authBtn.className = "activate-nav-btn activate-auth-btn";
    authBtn.type = "button";
    authBtn.textContent = "Connexion";
  }

  let cartBtn = document.getElementById("activate-cart-btn");
  if (!cartBtn) {
    cartBtn = document.createElement("button");
    cartBtn.id = "activate-cart-btn";
    cartBtn.className = "activate-nav-btn activate-cart-btn";
    cartBtn.type = "button";
    cartBtn.innerHTML = '🛒 Panier <span id="activate-cart-count">0</span>';
  }

  // Toujours dans cet ordre : navigation encadrée, panier, connexion tout à droite.
  nav.append(linkShell, cartBtn, authBtn);

  if (!document.getElementById("activate-auth-modal")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="activate-auth-modal" class="activate-overlay" hidden>
        <div class="activate-modal-card">
          <button class="activate-close" data-close-auth>×</button>
          <h2 id="activate-auth-title">Connexion</h2>
          <input id="activate-email" type="email" placeholder="Adresse e-mail">
          <input id="activate-password" type="password" placeholder="Mot de passe">
          <button id="activate-auth-submit" class="activate-main-btn">Se connecter</button>
          <button id="activate-auth-switch" class="activate-link-btn">Créer un compte</button>
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

  function openAuth() {
    modal.hidden = false;
    msg.textContent = "";
  }

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
  };

  submit.onclick = async () => {
    msg.textContent = "";
    try {
      if (signup) {
        await createUserWithEmailAndPassword(auth, email.value, password.value);
      } else {
        await signInWithEmailAndPassword(auth, email.value, password.value);
      }
      modal.hidden = true;
    } catch (e) {
      msg.textContent =
        e.code?.replace("auth/", "") || "Une erreur est survenue.";
    }
  };

  onAuthStateChanged(auth, (user) => {
    authBtn.textContent = user
      ? (user.email?.split("@")[0] || "Compte")
      : "Connexion";

    if (user) {
      authBtn.onclick = async () => {
        if (confirm("Se déconnecter ?")) await signOut(auth);
      };
    } else {
      authBtn.onclick = openAuth;
    }
  });

  document.querySelectorAll(".cyber-plan").forEach((card) => {
    const name = card.querySelector(".cyber-plan-name")?.textContent?.trim();
    const price = card
      .querySelector(".cyber-plan-price strong")
      ?.textContent?.replace("€", "")
      .replace(",", ".")
      .trim();

    if (!name || card.querySelector("[data-add-cart]")) return;

    const b = document.createElement("button");
    b.className = "activate-add-cart";
    b.dataset.addCart = "1";
    b.type = "button";
    b.textContent = "Ajouter au panier";
    b.onclick = () => addToCart(name, price);
    card.querySelector(".cyber-plan-action")?.insertAdjacentElement("afterend", b);
  });

  updateCartBadge();
}
waitForApp(setupUI);
