  function getCookie(name) {
    return document.cookie
      .split("; ")
      .find(x => x.startsWith(name + "="))
      ?.split("=")
      .slice(1)
      .join("=");
  }

  function showCookieBanner() {
    if (getCookie("activate_cookie_consent")) return;

    const box = document.createElement("div");

    box.id = "activate-cookie-banner";

    box.innerHTML = `
      <div>
        <strong>Cookies Activate</strong>
        <p>
          Nous utilisons uniquement les cookies nécessaires
          au fonctionnement du site et de la connexion.
        </p>
      </div>
      <button>Accepter</button>
    `;

    Object.assign(box.style, {
      position: "fixed",
      left: "16px",
      right: "16px",
      bottom: "16px",
      zIndex: "99999",
      display: "flex",
      gap: "16px",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 18px",
      border: "1px solid rgba(255,255,255,.15)",
      borderRadius: "12px",
      background: "#101010",
      color: "#fff",
      boxShadow: "0 10px 40px rgba(0,0,0,.35)",
      fontFamily: "Inter,Arial,sans-serif"
    });

    box.querySelector("p").style.margin = "6px 0 0";

    box.querySelector("button").style.cssText =
      "border:0;" +
      "border-radius:8px;" +
      "padding:10px 16px;" +
      "background:#ff3429;" +
      "color:#fff;" +
      "cursor:pointer;" +
      "font-weight:700";

    box.querySelector("button").onclick = () => {
      cookie(
        "activate_cookie_consent",
        "accepted",
        180
      );

      box.remove();
    };

    document.body.appendChild(box);
  }

  window.addEventListener(
    "DOMContentLoaded",
    showCookieBanner
  );

  // Firebase non configuré
  if (!cfg) {
    window.activateFirebaseLogin = async () => {
      throw new Error(
        "Firebase n'est pas encore configuré."
      );
    };

    window.activateFirebasePasswordLogin = async () => {
      throw new Error(
        "Firebase n'est pas encore configuré."
      );
    };

    window.activateFirebaseRegister = async () => {
      throw new Error(
        "Firebase n'est pas encore configuré."
      );
    };

    window.activateFirebaseLogout = async () => {};

    window.activateFirebaseIdToken = async () => null;

    return;
  }

  // Initialisation Firebase
  authPromise = import(
    "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js"
  )
    .then(async ({
      initializeApp,
      getApps
    }) => {

      const app =
        getApps().length
          ? getApps()[0]
          : initializeApp(cfg);

      const [
        {
          getAuth,
          sendSignInLinkToEmail,
          isSignInWithEmailLink,
          signInWithEmailLink,
          signInWithEmailAndPassword,
          createUserWithEmailAndPassword,
          signOut
        },
        firestore
      ] = await Promise.all([
        import(
          "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js"
        ),

        import(
          "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js"
        )
      ]);

      const auth = getAuth(app);

      return {
        auth,

        sendSignInLinkToEmail,
        isSignInWithEmailLink,
        signInWithEmailLink,

        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,

        signOut,

        firestore
      };
    });

  /*
   * ==========================================
   * EMAIL LINK
   * ==========================================
   *
   * Ton ancien système est conservé.
   */

  window.activateFirebaseLogin = async email => {
    const f = await authPromise;

    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true
    };

    await f.sendSignInLinkToEmail(
      f.auth,
      email,
      actionCodeSettings
    );

    localStorage.setItem(
      "activate_email_for_signin",
      email
    );
  };

  /*
   * ==========================================
   * EMAIL + PASSWORD
   * ==========================================
   */

  window.activateFirebasePasswordLogin = async (
    email,
    password
  ) => {
    const f = await authPromise;

    if (!email || !password) {
      throw new Error(
        "Email et mot de passe requis."
      );
    }

    const result =
      await f.signInWithEmailAndPassword(
        f.auth,
        email,
        password
      );

    localStorage.setItem(
      "activate_account",
      JSON.stringify({
        email: result.user.email,
        uid: result.user.uid
      })
    );

    return result.user;
  };

  /*
   * ==========================================
   * CREATION DE COMPTE
   * ==========================================
   */

  window.activateFirebaseRegister = async (
    email,
    password
  ) => {
    const f = await authPromise;

    if (!email || !password) {
      throw new Error(
        "Email et mot de passe requis."
      );
    }

    const result =
      await f.createUserWithEmailAndPassword(
        f.auth,
        email,
        password
      );

    localStorage.setItem(
      "activate_account",
      JSON.stringify({
        email: result.user.email,
        uid: result.user.uid
      })
    );

    return result.user;
  };

  /*
   * ==========================================
   * DECONNEXION
   * ==========================================
   */

  window.activateFirebaseLogout = async () => {
    const f = await authPromise;

    await f.signOut(f.auth);

    localStorage.removeItem(
      "activate_account"
    );
  };

  /*
   * ==========================================
   * TOKEN FIREBASE
   * ==========================================
   */

  window.activateFirebaseIdToken = async () => {
    const f = await authPromise;

    return f.auth.currentUser
      ? f.auth.currentUser.getIdToken()
      : null;
  };

  /*
   * ==========================================
   * TRAITEMENT EMAIL LINK
   * ==========================================
   */

  (async () => {
    try {
      const f = await authPromise;

      if (
        f.isSignInWithEmailLink(
          f.auth,
          window.location.href
        )
      ) {
        const email =
          localStorage.getItem(
            "activate_email_for_signin"
          );

        if (email) {
          const result =
            await f.signInWithEmailLink(
              f.auth,
              email,
              window.location.href
            );

          localStorage.removeItem(
            "activate_email_for_signin"
          );

          localStorage.setItem(
            "activate_account",
            JSON.stringify({
              email: result.user.email,
              uid: result.user.uid
            })
          );

          history.replaceState(
            {},
            "",
            window.location.pathname +
              window.location.hash
          );

          location.reload();
        }
      }
    } catch (e) {
      console.error(
        "Activate Firebase sign-in:",
        e
      );
    }
  })();
