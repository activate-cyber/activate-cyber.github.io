# V32 — Traduction complète (FR / EN / TR)

Avant : le sélecteur ne traduisait que 8 textes d'administration (voir V27). Le reste du site restait en français.

Maintenant : `activate-i18n.js` traduit tout le site à chaque changement de langue, sans recharger la page :
- accueil (menus, services, abonnements, tarifs CDI, À propos, contact, pied de page, démo du terminal) ;
- compte, connexion, panier, codes promo, produits, Extension CDI, panel d'administration ;
- textes, placeholders, title, aria-label, alt, titre de l'onglet et boîtes alert/confirm/prompt ;
- textes réécrits plus tard par React (changement Mensuel/Annuel, listes chargées par l'API…).

Utilisation : le script écoute le sélecteur de langue existant, la langue du compte (V28) et l'attribut `<html lang>`.

Ajouter ou corriger un texte : `DICT` (clé = texte français exact, valeur = [anglais, turc]) ou `PATTERNS` (texte avec une partie variable).
Exclure une zone : attribut `data-no-i18n` (déjà utilisé pour la fenêtre Portfolio, qui a ses propres traductions).

Non traduits : les textes saisis dans le panel admin (noms de formules, texte « À propos » venant de l'API) et le format des dates.

Fichiers : `activate-i18n.js` (nouveau), `index.html` et `dashboard.html` (1 balise script chacun).
