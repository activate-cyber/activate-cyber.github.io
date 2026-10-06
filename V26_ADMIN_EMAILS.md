# Activate V26 — Emails administrateurs

Ajout de l'onglet « Emails administrateurs ».

Fonctionnement souhaité :
- ajouter une adresse email autorisée ;
- afficher les emails autorisés ;
- supprimer une adresse ;
- l'accès au panel admin doit être refusé aux autres comptes.

Important : la liste d'autorisation doit être stockée et vérifiée côté API/backend (Firebase Admin ou base de données), pas uniquement dans localStorage. Le code frontend sert d'interface ; il ne doit pas être considéré comme une protection de sécurité.
