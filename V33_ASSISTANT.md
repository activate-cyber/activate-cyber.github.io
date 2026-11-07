# V33 — Assistant du site (questions fréquentes)

- Bouton rond rouge en bas à droite (au-dessus du sélecteur de langue) qui ouvre une fenêtre de chat.
- **Pas d'IA, pas de clé, pas de serveur, pas de coût** : l'assistant repère les mots de la question dans une base de réponses écrites à la main, en français, anglais et turc.
- Les réponses sont **courtes** : juste le minimum, une phrase. « Est-ce que je peux payer avec PayPal ? » → « Oui, avec PayPal. » ; « C'est quoi les options ? » → « Standard (20,99 € / mois) et Accès anticipé (42,99 € / mois). »
- Un bouton **Plus de détails** affiche la réponse complète quand elle existe.
- Il comprend les questions écrites sans accents, en minuscules ou avec des fautes de ponctuation, et dans une autre langue que celle du site. Il répond dans la langue du site.
- Sujets : formules et prix, mensuel/annuel, abonnement, paiement PayPal, codes promo, compte, mot de passe, e-mail, langue, Extension CDI (fonctionnement, installation, sites bloqués, ordinateurs, navigateurs), offres écoles, services, démo, contact.
- Suggestions cliquables au départ et après chaque réponse ; si la question n'est pas comprise, il propose des questions et l'adresse de contact.
- Les prix des formules sont lus sur le site (GET /api/site/settings, public) ; en cas d'échec, les prix par défaut sont utilisés. Les prix CDI (19 € et 39 €) sont écrits dans le code.

Ajouter ou corriger une réponse : liste `KB` dans `activate-chat.js` (`kw` = mots-clés sans accents, `*` = fin de mot libre, `a` = réponse détaillée, `y` = détaillée oui/non, `q` = question suggérée, `next` = suggestions suivantes) et liste `SHORT` pour les réponses courtes (`s` = courte, `sy` = courte oui/non).
L'ordre de la liste départage les égalités : mets les sujets précis avant les sujets généraux.

Fichiers : `activate-chat.js` (nouveau), `activate-addons.css` (styles en fin de fichier), `index.html` et `dashboard.html` (1 balise script chacun).
