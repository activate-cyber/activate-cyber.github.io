# Activate V28 — langue du compte

Fonctionnement :
1. Lors de la création du compte, le sélecteur de langue peut être présenté avec Français / English / Türkçe.
2. La langue est enregistrée pour le compte (UID Firebase si disponible, sinon email).
3. Après connexion, la langue enregistrée est restaurée.
4. Dans Compte, l'utilisateur peut changer la langue à tout moment.
5. Le choix est également conservé localement pour garder la préférence entre les sessions.

Pour une vraie synchronisation multi-appareils, le champ `language` doit aussi être enregistré côté backend/base de données avec l'UID Firebase. Le frontend ne doit pas être la seule source de vérité.
