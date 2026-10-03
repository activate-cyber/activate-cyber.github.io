# Activate — Firebase + API admin + paiements

## 1. Firebase
1. Crée un projet Firebase.
2. Active **Authentication > Sign-in method > Email link**.
3. Ajoute ton domaine dans **Authentication > Settings > Authorized domains**.
4. Crée une base **Firestore**.
5. Copie `firebase-config.example.js` vers `firebase-config.js` et renseigne la configuration Web Firebase.

## 2. API
Dans `api/` :

```bash
npm install
```

Copie `.env.example` vers `.env` et renseigne les identifiants du compte de service Firebase. **Ne publie jamais `.env` ni la clé privée.**

Puis :

```bash
npm start
```

## 3. Compte admin
Crée d'abord le compte dans Firebase Authentication, puis :

```bash
npm run set-admin
```

Le script demande uniquement l'e-mail du compte et lui donne le custom claim `admin: true`. Aucun mot de passe n'est écrit dans le code.

Après changement du claim, le compte doit se reconnecter pour recevoir un nouveau token.

## 4. Paiements
Firebase/Firestore stocke l'état (`pending`, `paid`, `validated`, `failed`, `refunded`). L'API refuse les changements admin sans token Firebase avec le claim `admin: true`.

Pour une validation **automatique**, branche le webhook de ton prestataire de paiement sur `/api/webhooks/payment` et signe les requêtes avec `PAYMENT_WEBHOOK_SECRET`.

Firebase seul ne peut pas confirmer qu'une carte bancaire a réellement été débitée : la confirmation doit venir du prestataire de paiement.
