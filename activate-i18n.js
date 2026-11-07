/* Activate V32 — traduction complète du site (FR / EN / TR)
   Le site est écrit en français : ce script traduit à la volée tous les textes visibles (texte, placeholder,
   title, aria-label, alt, titre de la page, alert/confirm/prompt) selon la langue choisie, sans recharger la page.
   Pour ajouter ou corriger un texte : modifie DICT (clé = texte français) ou PATTERNS (textes avec une partie variable). */
(function () {
  "use strict";
  var root = typeof window !== "undefined" ? window : globalThis;
  var L = { en: 0, tr: 1 };

  // "Texte français": ["English", "Türkçe"]
  var DICT = {
    // ---- Page d'accueil ----
    "Activate — accueil": ["Activate — home", "Activate — ana sayfa"],
    "Navigation principale": ["Main navigation", "Ana gezinme"],
    "Services": ["Services", "Hizmetler"],
    "À propos": ["About", "Hakkında"],
    "Abonnements": ["Subscriptions", "Abonelikler"],
    "Tarifs écoles": ["School pricing", "Okul fiyatları"],
    "Nous contacter": ["Contact us", "Bize ulaşın"],
    "CYBERSÉCURITÉ LOGICIELLE": ["SOFTWARE CYBERSECURITY", "YAZILIM SİBER GÜVENLİĞİ"],
    "Protégez votre": ["Protect your", "Dijital dünyanızı"],
    "monde numérique.": ["digital world.", "koruyun."],
    "Activate est une organisation spécialisée dans les logiciels de cybersécurité, avec une mission : vous simplifier la vie. Prévention, surveillance et protection contre les menaces, dans des outils pensés pour le quotidien.": ["Activate is an organization specialized in cybersecurity software, with one mission: to make your life easier. Prevention, monitoring and protection against threats, in tools designed for everyday use.", "Activate, siber güvenlik yazılımlarında uzmanlaşmış bir kuruluştur ve tek bir misyonu vardır: hayatınızı kolaylaştırmak. Tehditlere karşı önleme, izleme ve koruma, günlük kullanım için tasarlanmış araçlarla."],
    "Voir les abonnements": ["View subscriptions", "Abonelikleri gör"],
    "Découvrir nos services": ["Discover our services", "Hizmetlerimizi keşfedin"],
    "Maquette illustrative, aucun scan réel n’est exécuté": ["Illustrative mockup, no real scan is run", "Gösterim amaçlı maket, gerçek tarama yapılmaz"],
    "activate_security.exe · démo": ["activate_security.exe · demo", "activate_security.exe · demo"],
    "APERÇU": ["PREVIEW", "ÖNİZLEME"],
    "Initialisation de la maquette...": ["Initializing the mockup...", "Maket başlatılıyor..."],
    "Aucune analyse réelle n’est lancée.": ["No real analysis is running.", "Gerçek bir analiz başlatılmadı."],
    "STATUT :": ["STATUS:", "DURUM:"],
    "DÉMONSTRATION": ["DEMONSTRATION", "GÖSTERİM"],
    "Principes Activate": ["Activate principles", "Activate ilkeleri"],
    "Vigilance": ["Vigilance", "Uyanıklık"],
    "Disponibilité cible": ["Target availability", "Hedef erişilebilirlik"],
    "Confiance aveugle": ["Blind trust", "Kör güven"],
    "Priorité à la sécurité": ["Security first", "Öncelik güvenlik"],
    "NOS SERVICES": ["OUR SERVICES", "HİZMETLERİMİZ"],
    "Une protection sur plusieurs niveaux.": ["Protection on multiple levels.", "Birden çok katmanda koruma."],
    "Protection réseau": ["Network protection", "Ağ koruması"],
    "Surveillance du trafic, pare-feu et détection des comportements suspects.": ["Traffic monitoring, firewall and detection of suspicious behavior.", "Trafik izleme, güvenlik duvarı ve şüpheli davranışların tespiti."],
    "Détection des menaces": ["Threat detection", "Tehdit tespiti"],
    "Repérez les activités anormales et les risques de sécurité plus rapidement.": ["Spot abnormal activity and security risks faster.", "Anormal etkinlikleri ve güvenlik risklerini daha hızlı fark edin."],
    "Audit et sécurité": ["Audit and security", "Denetim ve güvenlik"],
    "Analysez votre infrastructure et renforcez ses points faibles avant qu’ils ne deviennent critiques.": ["Analyze your infrastructure and strengthen its weak points before they become critical.", "Altyapınızı analiz edin ve zayıf noktalarını kritik hale gelmeden önce güçlendirin."],
    "NOS ABONNEMENTS": ["OUR SUBSCRIPTIONS", "ABONELİKLERİMİZ"],
    "Choisissez votre formule.": ["Choose your plan.", "Planınızı seçin."],
    "Deux formules simples, avec la possibilité de choisir l’accès anticipé aux mises à jour.": ["Two simple plans, with the option to choose early access to updates.", "İki basit plan; güncellemelere erken erişimi seçme imkânıyla."],
    "Périodicité de l’abonnement": ["Billing period", "Abonelik süresi"],
    "Mensuel": ["Monthly", "Aylık"],
    "Annuel": ["Annual", "Yıllık"],
    "Standard": ["Standard", "Standart"],
    "Recevez les mises à jour dès leur publication.": ["Get updates as soon as they are released.", "Güncellemeleri yayınlandığı anda alın."],
    "Mises à jour à leur sortie": ["Updates at release", "Çıkışta güncellemeler"],
    "Accès anticipé": ["Early access", "Erken erişim"],
    "Accédez à toutes les mises à jour en avance.": ["Get all updates ahead of time.", "Tüm güncellemelere önceden erişin."],
    "Toutes les mises à jour en avant-première": ["All updates in advance", "Tüm güncellemeler önceden"],
    "MISES À JOUR EN AVANCE": ["EARLY UPDATES", "ERKEN GÜNCELLEMELER"],
    "/ mois": ["/ month", "/ ay"],
    "/ an": ["/ year", "/ yıl"],
    "Facturé mensuellement": ["Billed monthly", "Aylık faturalandırılır"],
    "Facturé en une fois": ["Billed at once", "Tek seferde faturalandırılır"],
    "Économisez": ["Save", "Tasarruf edin"],
    "par an": ["per year", "yıllık"],
    "Abonnement mensuel ou annuel": ["Monthly or annual subscription", "Aylık veya yıllık abonelik"],
    "Choisir cette formule": ["Choose this plan", "Bu planı seç"],
    "L’équivalent mensuel de l’offre annuelle est affiché pour comparaison; le montant annuel indiqué est facturé en une fois. La souscription et le paiement ne sont pas activés sur cette page de présentation.": ["The monthly equivalent of the annual plan is shown for comparison; the annual amount shown is billed at once. Subscription and payment are not enabled on this presentation page.", "Karşılaştırma için yıllık planın aylık karşılığı gösterilir; belirtilen yıllık tutar tek seferde faturalandırılır. Abonelik ve ödeme bu tanıtım sayfasında etkin değildir."],
    "POUR LES ÉCOLES ET CDI": ["FOR SCHOOLS AND SCHOOL LIBRARIES (CDI)", "OKULLAR VE OKUL KÜTÜPHANELERİ (CDI) İÇİN"],
    "Tarifs Activate CDI": ["Activate CDI pricing", "Activate CDI fiyatları"],
    "Des offres mensuelles pour un CDI ou plusieurs établissements scolaires.": ["Monthly plans for one school library or several schools.", "Bir CDI veya birden çok okul için aylık planlar."],
    "POUR UN ÉTABLISSEMENT": ["FOR ONE SCHOOL", "TEK BİR OKUL İÇİN"],
    "CDI": ["CDI", "CDI"],
    "Les outils essentiels pour gérer un CDI au quotidien.": ["The essential tools to run a school library day to day.", "Bir CDI’yi günlük yönetmek için temel araçlar."],
    "Extension Chrome": ["Chrome extension", "Chrome uzantısı"],
    "Règles personnalisées": ["Custom rules", "Özel kurallar"],
    "Statistiques et journaux": ["Statistics and logs", "İstatistikler ve günlükler"],
    "Demander cette formule": ["Request this plan", "Bu planı talep et"],
    "POUR PLUSIEURS ÉTABLISSEMENTS": ["FOR SEVERAL SCHOOLS", "BİRDEN ÇOK OKUL İÇİN"],
    "Multi-CDI": ["Multi-CDI", "Çoklu CDI"],
    "Une administration centralisée, avec un tarif par établissement.": ["Centralized administration, with one price per school.", "Okul başına fiyatla merkezi yönetim."],
    "/ établissement / mois": ["/ school / month", "/ okul / ay"],
    "Tout le périmètre CDI": ["Everything in CDI", "Tüm CDI kapsamı"],
    "Pilotage multi-établissements": ["Multi-school management", "Çok okullu yönetim"],
    "Comptes administrateur": ["Administrator accounts", "Yönetici hesapları"],
    "Tarifs CDI affichés au mois. Contactez Activate pour connaître les modalités de souscription.": ["CDI prices are shown per month. Contact Activate to learn the subscription terms.", "CDI fiyatları aylık gösterilir. Abonelik koşulları için Activate ile iletişime geçin."],
    "POURQUOI ACTIVATE ?": ["WHY ACTIVATE?", "NEDEN ACTIVATE?"],
    "La sécurité commence par la visibilité.": ["Security starts with visibility.", "Güvenlik görünürlükle başlar."],
    "Activate est une organisation de cybersécurité logicielle qui conçoit des outils pour vous simplifier la vie.": ["Activate is a software cybersecurity organization that builds tools to make your life easier.", "Activate, hayatınızı kolaylaştıran araçlar tasarlayan bir yazılım siber güvenliği kuruluşudur."],
    "Notre approche met l’accent sur la prévention, la surveillance et la réponse afin d’aider à réduire la surface d’attaque de vos systèmes.": ["Our approach focuses on prevention, monitoring and response to help reduce the attack surface of your systems.", "Yaklaşımımız, sistemlerinizin saldırı yüzeyini azaltmaya yardımcı olmak için önleme, izleme ve müdahaleye odaklanır."],
    "CONTACT": ["CONTACT", "İLETİŞİM"],
    "Prêt à renforcer": ["Ready to strengthen", "Güvenliğinizi"],
    "votre sécurité ?": ["your security?", "güçlendirmeye hazır mısınız?"],
    "Activate — Abonnements de cybersécurité logicielle": ["Activate — Software cybersecurity subscriptions", "Activate — Yazılım siber güvenliği abonelikleri"],
    "Activate — Dashboard": ["Activate — Dashboard", "Activate — Panel"],

    // ---- Compte, connexion, panier ----
    "Dashboard": ["Dashboard", "Panel"],
    "Dashboard Activate": ["Activate Dashboard", "Activate Paneli"],
    "Compte": ["Account", "Hesap"],
    "Connexion": ["Sign in", "Giriş"],
    "Se connecter": ["Sign in", "Giriş yap"],
    "Créer un compte": ["Create an account", "Hesap oluştur"],
    "Créer le compte": ["Create account", "Hesabı oluştur"],
    "J’ai déjà un compte": ["I already have an account", "Zaten hesabım var"],
    "Continuer avec Google": ["Continue with Google", "Google ile devam et"],
    "Adresse e-mail": ["Email address", "E-posta adresi"],
    "Mot de passe": ["Password", "Şifre"],
    "Fermer": ["Close", "Kapat"],
    "Une erreur est survenue.": ["An error occurred.", "Bir hata oluştu."],
    "Connexion Google impossible.": ["Google sign-in failed.", "Google ile giriş yapılamadı."],
    "Un e-mail de vérification a été envoyé à la nouvelle adresse.": ["A verification email has been sent to the new address.", "Yeni adrese bir doğrulama e-postası gönderildi."],
    "Reconnecte-toi puis réessaie pour changer l’e-mail.": ["Sign in again and retry to change the email.", "E-postayı değiştirmek için yeniden giriş yapıp tekrar dene."],
    "Impossible de changer l’e-mail.": ["Unable to change the email.", "E-posta değiştirilemedi."],
    "Nouvelle adresse e-mail :": ["New email address:", "Yeni e-posta adresi:"],
    "Nouveau mot de passe (6 caractères minimum) :": ["New password (6 characters minimum):", "Yeni şifre (en az 6 karakter):"],
    "Le mot de passe doit contenir au moins 6 caractères.": ["The password must contain at least 6 characters.", "Şifre en az 6 karakter içermelidir."],
    "Mot de passe modifié avec succès.": ["Password changed successfully.", "Şifre başarıyla değiştirildi."],
    "La session doit être récente. Envoyer un e-mail de réinitialisation ?": ["Your session must be recent. Send a reset email?", "Oturum yeni olmalıdır. Sıfırlama e-postası gönderilsin mi?"],
    "E-mail de réinitialisation envoyé.": ["Reset email sent.", "Sıfırlama e-postası gönderildi."],
    "Ce compte n’utilise pas un mot de passe (ex. connexion Google).": ["This account does not use a password (e.g. Google sign-in).", "Bu hesap şifre kullanmıyor (ör. Google ile giriş)."],
    "Impossible de changer le mot de passe.": ["Unable to change the password.", "Şifre değiştirilemedi."],
    "Langue (fr / en / tr) :": ["Language (fr / en / tr):", "Dil (fr / en / tr):"],
    "Langue invalide. Utilise fr, en ou tr.": ["Invalid language. Use fr, en or tr.", "Geçersiz dil. fr, en veya tr kullan."],
    "Langue enregistrée. Recharge la page pour appliquer toutes les traductions.": ["Language saved.", "Dil kaydedildi."],
    "Ton adresse e-mail est déjà vérifiée.": ["Your email address is already verified.", "E-posta adresin zaten doğrulanmış."],
    "E-mail de vérification envoyé.": ["Verification email sent.", "Doğrulama e-postası gönderildi."],
    "Impossible d’envoyer l’e-mail.": ["Unable to send the email.", "E-posta gönderilemedi."],
    "📧 Changer l’email": ["📧 Change email", "📧 E-postayı değiştir"],
    "🔑 Changer le mot de passe": ["🔑 Change password", "🔑 Şifreyi değiştir"],
    "🌐 Langue": ["🌐 Language", "🌐 Dil"],
    "✓ Vérification du compte": ["✓ Account verification", "✓ Hesap doğrulama"],
    "↪ Se déconnecter": ["↪ Log out", "↪ Çıkış yap"],
    "ESPACE CLIENT": ["CLIENT AREA", "MÜŞTERİ ALANI"],
    "Retrouve ton compte, ton panier et le montant à payer.": ["Find your account, your cart and the amount to pay.", "Hesabını, sepetini ve ödenecek tutarı bul."],
    "COMPTE": ["ACCOUNT", "HESAP"],
    "PANIER": ["CART", "SEPET"],
    "🛒 Panier": ["🛒 Cart", "🛒 Sepet"],
    "Code promo": ["Promo code", "Promosyon kodu"],
    "Appliquer": ["Apply", "Uygula"],
    "Sous-total": ["Subtotal", "Ara toplam"],
    "Total": ["Total", "Toplam"],
    "Réduction": ["Discount", "İndirim"],
    "Code promo invalide ou inactif.": ["Invalid or inactive promo code.", "Geçersiz veya etkin olmayan promosyon kodu."],
    "Ce code promo ne peut pas être appliqué à ce panier.": ["This promo code cannot be applied to this cart.", "Bu promosyon kodu bu sepete uygulanamaz."],
    "API Activate non configurée.": ["Activate API not configured.", "Activate API yapılandırılmadı."],
    "Le montant affiché est recalculé à partir des prix et codes promo actuellement configurés.": ["The amount shown is recalculated from the currently configured prices and promo codes.", "Gösterilen tutar, şu anda yapılandırılmış fiyatlar ve promosyon kodlarından yeniden hesaplanır."],
    "Ton panier est vide.": ["Your cart is empty.", "Sepetin boş."],
    "Ton panier est vide. Retourne aux abonnements pour choisir une formule.": ["Your cart is empty. Go back to the subscriptions to choose a plan.", "Sepetin boş. Plan seçmek için aboneliklere dön."],
    "Connecte-toi ou crée un compte pour ajouter une formule au panier.": ["Sign in or create an account to add a plan to the cart.", "Sepete plan eklemek için giriş yap veya hesap oluştur."],
    "Connecte-toi ou crée un compte avant d'ajouter une formule au panier.": ["Sign in or create an account before adding a plan to the cart.", "Sepete plan eklemeden önce giriş yap veya hesap oluştur."],
    "Ouvrir le Dashboard": ["Open the Dashboard", "Paneli aç"],
    "Le lien PayPal ouvre le paiement correspondant au total affiché.": ["The PayPal link opens the payment matching the total shown.", "PayPal bağlantısı, gösterilen toplama karşılık gelen ödemeyi açar."],

    // ---- Produits, extension CDI ----
    "MES PRODUITS": ["MY PRODUCTS", "ÜRÜNLERİM"],
    "Produits achetés": ["Purchased products", "Satın alınan ürünler"],
    "Les fonctionnalités disponibles dépendent de tes achats confirmés.": ["Available features depend on your confirmed purchases.", "Kullanılabilir özellikler onaylanmış satın alımlarına bağlıdır."],
    "Chargement des achats…": ["Loading purchases…", "Satın alımlar yükleniyor…"],
    "Chargement…": ["Loading…", "Yükleniyor…"],
    "Connecte-toi pour voir tes produits.": ["Sign in to see your products.", "Ürünlerini görmek için giriş yap."],
    "✓ ACHETÉ": ["✓ PURCHASED", "✓ SATIN ALINDI"],
    "✓ DISPONIBLE": ["✓ AVAILABLE", "✓ MEVCUT"],
    "Gérer": ["Manage", "Yönet"],
    "Extension CDI": ["CDI extension", "CDI uzantısı"],
    "Aucun produit acheté pour le moment.": ["No products purchased yet.", "Henüz satın alınmış ürün yok."],
    "PRODUIT": ["PRODUCT", "ÜRÜN"],
    "Gère les fonctionnalités liées à ton produit, notamment l’Extension CDI.": ["Manage the features tied to your product, including the CDI extension.", "Ürününe bağlı özellikleri, özellikle CDI uzantısını yönet."],
    "Gérer l’Extension CDI": ["Manage the CDI extension", "CDI uzantısını yönet"],
    "La gestion détaillée de ce produit sera disponible ici.": ["Detailed management of this product will be available here.", "Bu ürünün ayrıntılı yönetimi burada olacak."],
    "Extension CDI verrouillée": ["CDI extension locked", "CDI uzantısı kilitli"],
    "Ce produit n’est pas disponible sur ton compte.": ["This product is not available on your account.", "Bu ürün hesabında mevcut değil."],
    "EXTENSION CDI": ["CDI EXTENSION", "CDI UZANTISI"],
    "Sites bloqués": ["Blocked sites", "Engellenen siteler"],
    "Ajoute, désactive ou supprime les sites bloqués. Les règles sont enregistrées par l’API.": ["Add, disable or delete blocked sites. Rules are saved by the API.", "Engellenen siteleri ekle, devre dışı bırak veya sil. Kurallar API tarafından kaydedilir."],
    "Installation": ["Installation", "Kurulum"],
    "Génère un code pour un ordinateur CDI.": ["Generate a code for a CDI computer.", "Bir CDI bilgisayarı için kod oluştur."],
    "Générer un code": ["Generate a code", "Kod oluştur"],
    "Génération…": ["Generating…", "Oluşturuluyor…"],
    "+ Ajouter": ["+ Add", "+ Ekle"],
    "Aucun site bloqué.": ["No blocked sites.", "Engellenen site yok."],
    "Site ajouté.": ["Site added.", "Site eklendi."],
    "Impossible d’ajouter le site.": ["Unable to add the site.", "Site eklenemedi."],
    "Bloqué": ["Blocked", "Engelli"],
    "Désactivé": ["Disabled", "Devre dışı"],
    "Activer": ["Enable", "Etkinleştir"],
    "Désactiver": ["Disable", "Devre dışı bırak"],
    "Supprimer": ["Delete", "Sil"],
    "Erreur": ["Error", "Hata"],

    // ---- Panel d'administration ----
    "Panel d’administration": ["Administration panel", "Yönetim paneli"],
    "Gère les prix, les codes promo et le contenu du site.": ["Manage prices, promo codes and site content.", "Fiyatları, promosyon kodlarını ve site içeriğini yönet."],
    "Enregistrer les modifications": ["Save changes", "Değişiklikleri kaydet"],
    "Enregistrement…": ["Saving…", "Kaydediliyor…"],
    "✓ Prix et codes promo enregistrés.": ["✓ Prices and promo codes saved.", "✓ Fiyatlar ve promosyon kodları kaydedildi."],
    "Produits et prix": ["Products and prices", "Ürünler ve fiyatlar"],
    "Les nouveaux prix sont appliqués au site et aux articles déjà présents dans le panier.": ["New prices apply to the site and to items already in the cart.", "Yeni fiyatlar siteye ve sepetteki ürünlere uygulanır."],
    "Codes promo": ["Promo codes", "Promosyon kodları"],
    "Codes créés": ["Created codes", "Oluşturulan kodlar"],
    "Créer un code": ["Create a code", "Kod oluştur"],
    "Les codes déjà créés peuvent uniquement être supprimés.": ["Codes already created can only be deleted.", "Oluşturulan kodlar yalnızca silinebilir."],
    "Aucun code promo configuré.": ["No promo code configured.", "Yapılandırılmış promosyon kodu yok."],
    "Crée un nouveau code. Après création, il apparaîtra dans « Codes créés ».": ["Create a new code. Once created, it will appear in “Created codes”.", "Yeni bir kod oluştur. Oluşturulduktan sonra “Oluşturulan kodlar” içinde görünür."],
    "Nom": ["Name", "Ad"], "Sans nom": ["Unnamed", "Adsız"], "Aucune": ["None", "Yok"],
    "Nom :": ["Name:", "Ad:"], "Code :": ["Code:", "Kod:"], "Fin :": ["End:", "Bitiş:"], "Coupon :": ["Coupon:", "Kupon:"],
    "Code": ["Code", "Kod"], "Type": ["Type", "Tür"], "Pourcentage": ["Percentage", "Yüzde"], "Montant fixe": ["Fixed amount", "Sabit tutar"],
    "Fin": ["End", "Bitiş"], "Créer le code": ["Create code", "Kodu oluştur"],
    "Titre": ["Title", "Başlık"], "Texte 1": ["Text 1", "Metin 1"], "Texte 2": ["Text 2", "Metin 2"],
    "Aucun email administrateur ajouté.": ["No administrator email added.", "Yönetici e-postası eklenmedi."]
  };

  // Textes avec une partie variable ($1, $2 = parties capturées)
  var TERM = { "Pare-feu": ["Firewall", "Güvenlik duvarı"], "Détection des menaces": ["Threat detection", "Tehdit tespiti"], "Surveillance réseau": ["Network monitoring", "Ağ izleme"], "Protection des données": ["Data protection", "Veri koruması"] };
  var PATTERNS = [
    [/^\[✓\] (.+?) \.{3,} APERÇU$/, function (m, l) { var t = TERM[m[1]]; if (!t) return null; var w = t[l]; return "[✓] " + w + " " + ".".repeat(Math.max(3, 25 - w.length)) + " " + ["PREVIEW", "ÖNİZLEME"][l]; }],
    [/^(.+) facturés par an$/, ["$1 billed per year", "Yılda $1 faturalandırılır"]],
    [/^Ajouter au panier — (.+)$/, ["Add to cart — $1", "Sepete ekle — $1"]],
    [/^Le code (.+) dépasse 100 %\.$/, ["Code $1 exceeds 100%.", "$1 kodu %100’ü aşıyor."]],
    [/^Erreur : (.+)$/, ["Error: $1", "Hata: $1"]],
    [/^Supprimer (.+) \?$/, ["Delete $1?", "$1 silinsin mi?"]],
    [/^(\d+)\/(\d+) ordinateurs actifs$/, ["$1/$2 active computers", "$1/$2 aktif bilgisayar"]],
    [/^Expire le (.+)$/, ["Expires on $1", "Son geçerlilik: $1"]]
  ];
  // Quand le texte français d'origine ne convient plus (cas particulier)
  var FR_OVERRIDE = { "Langue enregistrée. Recharge la page pour appliquer toutes les traductions.": "Langue enregistrée." };

  var norm = function (s) { return s.replace(/\s+/g, " ").trim(); };
  function lookup(key, lang) {
    if (lang === "fr") return FR_OVERRIDE[key] != null ? FR_OVERRIDE[key] : null;
    var i = L[lang]; if (i == null) return null;
    var e = DICT[key]; if (e) return e[i];
    for (var p = 0; p < PATTERNS.length; p++) {
      var m = PATTERNS[p][0].exec(key); if (!m) continue;
      var r = PATTERNS[p][1];
      if (typeof r === "function") { var out = r(m, i); if (out != null) return out; continue; }
      return r[i].replace(/\$(\d)/g, function (_, n) { return m[n]; });
    }
    return null;
  }
  function translate(text, lang) {
    if (typeof text !== "string") return text;
    var key = norm(text); if (!key) return text;
    var out = lookup(key, lang); if (out == null) return text;
    return text.match(/^\s*/)[0] + out + text.match(/\s*$/)[0];
  }
  root.ActivateI18N = { translate: translate, DICT: DICT, PATTERNS: PATTERNS };

  if (typeof document === "undefined" || !document.addEventListener) return; // tests hors navigateur

  /* ---------- Application au DOM ---------- */
  var ATTRS = ["placeholder", "title", "aria-label", "alt"];
  var SKIP = "SCRIPT,STYLE,NOSCRIPT,TEXTAREA";
  var texts = new WeakMap(), attrs = new WeakMap();
  var lang = function () { var l = root.ACTIVATE_LANG || localStorage.getItem("activate_language") || document.documentElement.lang || "fr"; return l === "en" || l === "tr" ? l : "fr"; };
  var skipped = function (el) { return !el || (el.closest && el.closest(SKIP.toLowerCase() + ",[data-no-i18n]")); };

  function doText(node) {
    var cur = node.nodeValue; if (!cur || !cur.trim() || skipped(node.parentElement)) return;
    var rec = texts.get(node), orig = rec && cur === rec.applied ? rec.orig : cur; // React a pu réécrire le texte
    var target = translate(orig, lang());
    if (target !== cur) node.nodeValue = target;
    texts.set(node, { orig: orig, applied: target });
  }
  function doAttr(el, name) {
    var cur = el.getAttribute(name); if (cur == null || !cur.trim() || skipped(el)) return;
    var rec = attrs.get(el) || {}, r = rec[name], orig = r && cur === r.applied ? r.orig : cur;
    var target = translate(orig, lang());
    if (target !== cur) el.setAttribute(name, target);
    rec[name] = { orig: orig, applied: target }; attrs.set(el, rec);
  }
  function walk(node) {
    if (node.nodeType === 3) return doText(node);
    if (node.nodeType !== 1 || skipped(node)) return;
    ATTRS.forEach(function (a) { doAttr(node, a); });
    var tw = document.createTreeWalker(node, 1 | 4, { acceptNode: function (n) { return n.nodeType === 1 && skipped(n) ? 2 : 1; } });
    for (var n = tw.nextNode(); n; n = tw.nextNode()) { if (n.nodeType === 3) doText(n); else ATTRS.forEach(function (a) { doAttr(n, a); }); }
  }
  var applyAll = function () { walk(document.documentElement); };

  function start() {
    applyAll();
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === "childList") m.addedNodes.forEach(walk);
        else if (m.type === "characterData") doText(m.target);
        else if (m.attributeName === "lang" && m.target === document.documentElement) applyAll(); // le sélecteur du site change <html lang>
        else if (ATTRS.indexOf(m.attributeName) >= 0) doAttr(m.target, m.attributeName);
      });
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat("lang") });

    window.addEventListener("activate-language-changed", applyAll);
    window.addEventListener("storage", function (e) { if (e.key === "activate_language") applyAll(); });
    var orig = root.activateSetLanguage; // le sélecteur de langue du site passe par cette fonction
    if (typeof orig === "function") root.activateSetLanguage = function () { var r = orig.apply(this, arguments); applyAll(); return r; };

    ["alert", "confirm", "prompt"].forEach(function (name) { // boîtes de dialogue du navigateur
      var o = root[name]; root[name] = function (msg) { var a = [].slice.call(arguments); a[0] = translate(String(a[0]), lang()); return o.apply(root, a); };
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
