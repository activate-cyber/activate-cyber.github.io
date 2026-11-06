/* Activate V31 — Portfolio en superposition (bouton en bas à gauche) */
(function () {
  "use strict";

  // Modifie ces trois blocs pour mettre à jour le portfolio du site.
  var UI = {
    fr: { btn: "Portfolio", title: "Portfolio", lead: "L’équipe et ce que nous avons construit.", team: "L’équipe", work: "Réalisations", close: "Fermer" },
    en: { btn: "Portfolio", title: "Portfolio", lead: "The team and what we have built.", team: "Team", work: "Projects", close: "Close" },
    tr: { btn: "Portfolyo", title: "Portfolyo", lead: "Ekip ve oluşturduklarımız.", team: "Ekip", work: "Projeler", close: "Kapat" }
  };
  var PEOPLE = [
    { name: "echo_rouge", role: { fr: "Fondateur", en: "Founder", tr: "Kurucu" } },
    { name: "ActivateTeam", role: { fr: "Développement", en: "Development", tr: "Geliştirme" } },
    { name: "ActivateDesign", role: { fr: "Design", en: "Design", tr: "Tasarım" } }
  ];
  var PROJECTS = [
    { name: "Activate Basic", text: { fr: "L’offre d’entrée du site Activate.", en: "The entry plan of the Activate site.", tr: "Activate sitesinin başlangıç planı." } },
    { name: "Activate Pro", text: { fr: "L’offre avancée d’Activate.", en: "Activate’s advanced plan.", tr: "Activate’in gelişmiş planı." } },
    { name: "Extension CDI", text: { fr: "Bloque les sites choisis sur les ordinateurs du CDI, installée avec un code.", en: "Blocks the chosen sites on library computers, installed with a code.", tr: "Seçilen siteleri kütüphane bilgisayarlarında engeller, kodla kurulur." } },
    { name: "Application Activate", text: { fr: "Application pour Windows et Mac : compte, produits et sites bloqués.", en: "Windows and Mac app: account, products and blocked sites.", tr: "Windows ve Mac uygulaması: hesap, ürünler ve engellenen siteler." } },
    { name: "Site Activate", text: { fr: "Boutique, espace client et administration, en trois langues.", en: "Shop, customer area and administration, in three languages.", tr: "Mağaza, müşteri alanı ve yönetim, üç dilde." } }
  ];

  var btn = null, overlay = null, lastFocus = null;
  function lang() { var l = window.ACTIVATE_LANG || localStorage.getItem("activate_language") || "fr"; return UI[l] ? l : "fr"; }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function labelButton() { if (btn) btn.textContent = UI[lang()].btn; }

  function onKey(e) { if (e.key === "Escape") close(); }
  function close() {
    if (!overlay) return;
    overlay.remove(); overlay = null;
    document.removeEventListener("keydown", onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function row(left, right) { var r = el("div", "activate-portfolio-row"); r.appendChild(el("strong", "", left)); r.appendChild(el("span", "", right)); return r; }

  function open() {
    if (overlay) return;
    var l = lang(), t = UI[l];
    lastFocus = document.activeElement;
    overlay = el("div", "activate-overlay");
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    var card = el("div", "activate-portfolio-card");
    card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-label", t.title);
    var x = el("button", "activate-close", "×"); x.type = "button"; x.setAttribute("aria-label", t.close); x.addEventListener("click", close);
    card.appendChild(x);
    card.appendChild(el("h2", "", t.title));
    card.appendChild(el("p", "activate-portfolio-lead", t.lead));
    card.appendChild(el("h3", "", t.team));
    PEOPLE.forEach(function (p) { card.appendChild(row(p.name, p.role[l])); });
    card.appendChild(el("h3", "", t.work));
    PROJECTS.forEach(function (p) { card.appendChild(row(p.name, p.text[l])); });
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    document.addEventListener("keydown", onKey);
    x.focus();
  }

  function init() {
    btn = el("button", "", ""); btn.id = "activate-portfolio-btn"; btn.type = "button";
    btn.addEventListener("click", open);
    document.body.appendChild(btn);
    labelButton();
    window.addEventListener("activate-language-changed", labelButton);
    var orig = window.activateSetLanguage; // le sélecteur de langue du site passe par cette fonction
    if (typeof orig === "function") window.activateSetLanguage = function () { var r = orig.apply(this, arguments); labelButton(); return r; };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
