/* Activate V33 — Assistant du site (questions fréquentes)
   Pas d'IA, pas de serveur, pas de clé : il repère les mots de la question dans une base de réponses écrites à la main
   (français, anglais, turc) et répond « Oui… / Non… » quand la question est de type oui/non.
   Pour ajouter ou corriger une réponse : modifie la liste KB plus bas (kw = mots-clés, a = réponse, y = réponse oui/non). */
(function () {
  "use strict";

  var EMAIL = "Activate.cyber@gmail.com";
  var LI = { fr: 0, en: 1, tr: 2 }, LOC = ["fr-FR", "en-GB", "tr-TR"];
  var T = function (fr, en, tr) { return [fr, en, tr]; };
  var DEFAULT_PLANS = [{ name: "Standard", monthlyPrice: 20.99, annualPrice: 228 }, { name: "Accès anticipé", monthlyPrice: 42.99, annualPrice: 428 }];

  var UI = {
    fr: { title: "Assistant Activate", sub: "Réponses automatiques · pose ta question", open: "Ouvrir l’assistant", close: "Fermer", reset: "Nouvelle conversation", placeholder: "Pose ta question…", send: "Envoyer", more: "Plus de détails",
      hello: "Bonjour ! Je réponds aux questions sur Activate : formules, prix, Extension CDI, compte… Pose ta question ou choisis une suggestion." },
    en: { title: "Activate assistant", sub: "Automatic answers · ask your question", open: "Open the assistant", close: "Close", reset: "New conversation", placeholder: "Ask your question…", send: "Send", more: "More details",
      hello: "Hi! I answer questions about Activate: plans, prices, the CDI extension, your account… Ask your question or pick a suggestion." },
    tr: { title: "Activate asistanı", sub: "Otomatik yanıtlar · sorunu sor", open: "Asistanı aç", close: "Kapat", reset: "Yeni sohbet", placeholder: "Sorunu yaz…", send: "Gönder", more: "Daha fazla ayrıntı",
      hello: "Merhaba! Activate hakkındaki soruları yanıtlıyorum: planlar, fiyatlar, CDI uzantısı, hesap… Sorunu yaz veya bir öneri seç." }
  };

  /* ---------- Réponses ---------- */
  // ctx = { plans, money(n) } ; i = 0 (fr) / 1 (en) / 2 (tr) ; q = question normalisée
  var yes = function (i) { return ["Oui, ", "Yes, ", "Evet, "][i]; };
  var no = function (i) { return ["Non, ", "No, ", "Hayır, "][i]; };
  var saving = function (p) { return Math.max(0, Math.round((p.monthlyPrice * 12 - p.annualPrice) * 100) / 100); };

  function plansText(i, c) {
    var p0 = c.plans[0], p1 = c.plans[1], m = c.money;
    return [
      "Activate propose deux formules d’abonnement :\n- " + p0.name + " : " + m(p0.monthlyPrice) + " par mois ou " + m(p0.annualPrice) + " par an, avec les mises à jour dès leur sortie.\n- " + p1.name + " : " + m(p1.monthlyPrice) + " par mois ou " + m(p1.annualPrice) + " par an, avec toutes les mises à jour en avant-première.\nTu peux payer au mois ou à l’année.",
      "Activate offers two subscription plans:\n- " + p0.name + ": " + m(p0.monthlyPrice) + " per month or " + m(p0.annualPrice) + " per year, with updates as soon as they are released.\n- " + p1.name + ": " + m(p1.monthlyPrice) + " per month or " + m(p1.annualPrice) + " per year, with all updates in advance.\nYou can pay monthly or yearly.",
      "Activate iki abonelik planı sunar:\n- " + p0.name + ": ayda " + m(p0.monthlyPrice) + " veya yılda " + m(p0.annualPrice) + ", güncellemeler yayınlandığı anda.\n- " + p1.name + ": ayda " + m(p1.monthlyPrice) + " veya yılda " + m(p1.annualPrice) + ", tüm güncellemeler önceden.\nAylık veya yıllık ödeyebilirsin."][i];
  }
  function schoolsList(i, c) {
    var m = c.money;
    return [
      "\n- CDI (un établissement) : " + m(19) + " / mois — extension Chrome, règles personnalisées, statistiques et journaux.\n- Multi-CDI (plusieurs établissements) : " + m(39) + " / établissement / mois — tout le CDI, pilotage multi-établissements et comptes administrateur.\nPour souscrire, écris à " + EMAIL + " (bouton « Demander cette formule »).",
      "\n- CDI (one school): " + m(19) + " / month — Chrome extension, custom rules, statistics and logs.\n- Multi-CDI (several schools): " + m(39) + " / school / month — everything in CDI, multi-school management and administrator accounts.\nTo subscribe, write to " + EMAIL + " (“Request this plan” button).",
      "\n- CDI (tek okul): ayda " + m(19) + " — Chrome uzantısı, özel kurallar, istatistikler ve günlükler.\n- Multi-CDI (birden çok okul): okul başına ayda " + m(39) + " — tüm CDI kapsamı, çok okullu yönetim ve yönetici hesapları.\nAbone olmak için " + EMAIL + " adresine yaz (“Bu planı talep et” düğmesi)."][i];
  }
  var HEAD = {
    schools: T("Voici les offres pour les écoles et CDI :", "Here are the plans for schools and school libraries (CDI):", "Okullar ve okul kütüphaneleri (CDI) için planlar:"),
    schoolsYes: T("Oui, Activate propose des tarifs pour les écoles et CDI :", "Yes, Activate has pricing for schools and school libraries (CDI):", "Evet, Activate okullar ve okul kütüphaneleri (CDI) için fiyatlar sunar:")
  };

  // Ordre = priorité en cas d'égalité de score. kw : mots-clés (« * » = n'importe quelle fin de mot), sans accents.
  var KB = [
    { id: "hello", kw: { fr: ["bonjour", "salut", "coucou", "bonsoir", "hello"], en: ["hello", "hi", "hey", "good morning", "good evening"], tr: ["merhaba", "selam", "gunaydin", "iyi aksamlar"] },
      a: T("Bonjour ! Je réponds aux questions sur Activate : formules, prix, Extension CDI, compte… Qu’est-ce que tu veux savoir ?", "Hello! I answer questions about Activate: plans, prices, the CDI extension, your account… What would you like to know?", "Merhaba! Activate hakkındaki soruları yanıtlıyorum: planlar, fiyatlar, CDI uzantısı, hesap… Ne öğrenmek istersin?"), next: ["plans", "cdi", "contact"] },
    { id: "thanks", kw: { fr: ["merci", "remercie*"], en: ["thanks", "thank you", "thx"], tr: ["tesekkur*", "sagol", "eyvallah"] },
      a: T("Avec plaisir ! Si tu as une autre question, je suis là.", "You’re welcome! If you have another question, I’m here.", "Rica ederim! Başka bir sorun olursa buradayım."), next: ["plans", "contact"] },
    { id: "what", q: T("C’est quoi Activate ?", "What is Activate?", "Activate nedir?"),
      kw: { fr: ["c est quoi activate", "qu est ce qu activate", "qu est ce que activate", "activate c est quoi", "que fait activate", "qui etes vous", "presentation", "a propos"], en: ["what is activate", "who are you", "what does activate do", "about activate", "about you"], tr: ["activate nedir", "siz kimsiniz", "activate ne yapar", "hakkinda", "hakkinizda"] },
      a: T("Activate est une organisation spécialisée dans les logiciels de cybersécurité. Sa mission : te simplifier la vie, avec de la prévention, de la surveillance et de la protection contre les menaces, dans des outils pensés pour le quotidien.", "Activate is an organization specialized in cybersecurity software. Its mission: to make your life easier, with prevention, monitoring and protection against threats, in tools designed for everyday use.", "Activate, siber güvenlik yazılımlarında uzmanlaşmış bir kuruluştur. Misyonu hayatını kolaylaştırmak: günlük kullanım için tasarlanmış araçlarla önleme, izleme ve tehditlere karşı koruma."), next: ["services", "plans", "cdi"] },
    { id: "diff", q: T("Quelle différence entre les formules ?", "What’s the difference between the plans?", "Planlar arasındaki fark nedir?"),
      kw: { fr: ["difference*", "standard", "acces anticipe", "anticipe", "avant premiere", "mises a jour en avance"], en: ["difference*", "standard", "early access", "ahead of time", "preview", "compare", "comparison"], tr: ["fark*", "standart", "erken erisim", "onceden", "karsilastir*"] },
      a: function (i, c) { var p0 = c.plans[0], p1 = c.plans[1], m = c.money; return [
        p0.name + " te donne les mises à jour dès leur sortie (" + m(p0.monthlyPrice) + " / mois). " + p1.name + " te donne toutes les mises à jour en avant-première, avant tout le monde (" + m(p1.monthlyPrice) + " / mois). Le reste est identique.",
        p0.name + " gives you updates as soon as they are released (" + m(p0.monthlyPrice) + " / month). " + p1.name + " gives you all updates in advance, before everyone else (" + m(p1.monthlyPrice) + " / month). Everything else is the same.",
        p0.name + " güncellemeleri yayınlandığı anda verir (ayda " + m(p0.monthlyPrice) + "). " + p1.name + " tüm güncellemeleri herkesten önce verir (ayda " + m(p1.monthlyPrice) + "). Geri kalan her şey aynıdır."][i]; }, next: ["billing", "buy"] },
    { id: "features", q: T("Qu’est-ce qui est inclus dans l’offre CDI ?", "What’s included in the CDI plan?", "CDI planına neler dahil?"),
      kw: { fr: ["inclus*", "comprend*", "fonctionnalite*", "statistique*", "journaux", "regles personnalisees", "offre cdi"], en: ["included", "includes", "feature*", "statistics", "logs", "custom rules", "cdi plan"], tr: ["dahil*", "ozellik*", "istatistik*", "gunluk*", "ozel kural*", "cdi plan*"] },
      a: T("L’offre CDI comprend l’extension Chrome, des règles personnalisées, ainsi que des statistiques et des journaux. Multi-CDI ajoute le pilotage multi-établissements et des comptes administrateur.", "The CDI plan includes the Chrome extension, custom rules, plus statistics and logs. Multi-CDI adds multi-school management and administrator accounts.", "CDI planı Chrome uzantısını, özel kuralları ve istatistikler ile günlükleri içerir. Multi-CDI, çok okullu yönetim ve yönetici hesapları ekler."), next: ["schools", "install"] },
    { id: "schools", q: T("Avez-vous des tarifs pour les écoles ?", "Do you have pricing for schools?", "Okullar için fiyatlarınız var mı?"),
      kw: { fr: ["ecole*", "etablissement*", "scolaire*", "college*", "lycee*", "tarifs cdi", "prix cdi", "multi cdi", "multicdi"], en: ["school*", "education", "multi cdi", "multicdi", "cdi pricing", "cdi price"], tr: ["okul*", "egitim", "cdi fiyat*", "coklu cdi", "multi cdi"] },
      a: function (i, c) { return HEAD.schools[i] + schoolsList(i, c); }, y: function (i, c) { return HEAD.schoolsYes[i] + schoolsList(i, c); }, next: ["features", "contact"] },
    { id: "services", q: T("Quels services proposez-vous ?", "What services do you offer?", "Hangi hizmetleri sunuyorsunuz?"),
      kw: { fr: ["quels services", "service*", "protection reseau", "detection", "menace*", "audit", "pare feu"], en: ["what services", "service*", "network protection", "threat*", "audit", "firewall"], tr: ["hangi hizmet*", "hizmet*", "ag koruma*", "tehdit*", "denetim", "guvenlik duvari"] },
      a: T("Activate propose trois services :\n- Protection réseau : surveillance du trafic, pare-feu et détection des comportements suspects.\n- Détection des menaces : repérer plus vite les activités anormales et les risques.\n- Audit et sécurité : analyser ton infrastructure et renforcer ses points faibles.", "Activate offers three services:\n- Network protection: traffic monitoring, firewall and detection of suspicious behavior.\n- Threat detection: spot abnormal activity and risks faster.\n- Audit and security: analyze your infrastructure and strengthen its weak points.", "Activate üç hizmet sunar:\n- Ağ koruması: trafik izleme, güvenlik duvarı ve şüpheli davranışların tespiti.\n- Tehdit tespiti: anormal etkinlikleri ve riskleri daha hızlı fark etme.\n- Denetim ve güvenlik: altyapını analiz etme ve zayıf noktalarını güçlendirme."), next: ["plans", "demo"] },
    { id: "demo", q: T("La démo fait-elle un vrai scan ?", "Does the demo run a real scan?", "Demo gerçek bir tarama yapıyor mu?"),
      kw: { fr: ["demo*", "maquette", "scan*", "terminal", "simulation"], en: ["demo*", "mockup", "scan*", "terminal", "simulation"], tr: ["demo*", "maket", "tarama*", "terminal", "simulasyon"] },
      a: T("Le terminal de la page d’accueil est une maquette illustrative : aucune analyse réelle n’est lancée.", "The terminal on the home page is an illustrative mockup: no real analysis is run.", "Ana sayfadaki terminal gösterim amaçlı bir maket: gerçek bir analiz başlatılmaz."),
      y: function (i) { return no(i) + ["le terminal de la page d’accueil est une maquette illustrative : aucune analyse réelle n’est lancée.", "the terminal on the home page is an illustrative mockup: no real analysis is run.", "ana sayfadaki terminal gösterim amaçlı bir maket: gerçek bir analiz başlatılmaz."][i]; }, next: ["services"] },
    { id: "install", q: T("Comment installer l’extension ?", "How do I install the extension?", "Uzantıyı nasıl kurarım?"),
      kw: { fr: ["installer l extension", "installer", "installation", "code d installation", "generer un code", "activer l extension"], en: ["install the extension", "install*", "setup", "set up", "installation code", "generate a code"], tr: ["uzantiyi kur*", "kur*", "kurulum*", "kod olustur*"] },
      a: T("Pour installer l’Extension CDI :\n1. Connecte-toi à ton compte.\n2. Dans le Dashboard, ouvre « Mes produits » puis « Gérer l’Extension CDI ».\n3. Clique sur « Générer un code » pour l’ordinateur du CDI.\n4. Saisis ce code dans l’extension installée sur cet ordinateur.\nLe nombre d’ordinateurs est limité par compte.", "To install the CDI extension:\n1. Sign in to your account.\n2. In the Dashboard, open “My products” then “Manage the CDI extension”.\n3. Click “Generate a code” for the CDI computer.\n4. Enter that code in the extension installed on that computer.\nThe number of computers is limited per account.", "CDI uzantısını kurmak için:\n1. Hesabına giriş yap.\n2. Panelde “Ürünlerim” bölümünü, sonra “CDI uzantısını yönet” seçeneğini aç.\n3. CDI bilgisayarı için “Kod oluştur” düğmesine tıkla.\n4. Bu kodu o bilgisayardaki uzantıya gir.\nBilgisayar sayısı hesap başına sınırlıdır."), next: ["computers", "blocksite"] },
    { id: "blocksite", q: T("Comment bloquer un site ?", "How do I block a site?", "Bir siteyi nasıl engellerim?"),
      kw: { fr: ["bloquer un site", "bloquer*", "site bloque*", "sites bloque*", "ajouter un site", "debloquer", "liste noire"], en: ["block a site", "block*", "blocked site*", "add a site", "unblock", "blacklist"], tr: ["site engelle*", "engelle*", "engellenen site*", "site ekle*", "engeli kaldir*"] },
      a: T("Dans le Dashboard, ouvre « Extension CDI », section « Sites bloqués » : saisis l’adresse du site (par exemple exemple.com), puis clique sur « + Ajouter ». Tu peux ensuite désactiver ou supprimer un site à tout moment.", "In the Dashboard, open “CDI extension”, “Blocked sites” section: type the site address (for example example.com), then click “+ Add”. You can disable or delete a site at any time.", "Panelde “CDI uzantısı”, “Engellenen siteler” bölümünü aç: sitenin adresini yaz (örneğin example.com), sonra “+ Ekle”ye tıkla. Bir siteyi istediğin zaman devre dışı bırakabilir veya silebilirsin."),
      y: function (i) { return yes(i) + ["tu peux bloquer les sites de ton choix. Dans le Dashboard, ouvre « Extension CDI », section « Sites bloqués », saisis l’adresse du site puis clique sur « + Ajouter ». Tu peux ensuite le désactiver ou le supprimer à tout moment.", "you can block the sites of your choice. In the Dashboard, open “CDI extension”, “Blocked sites”, type the site address and click “+ Add”. You can disable or delete it at any time.", "istediğin siteleri engelleyebilirsin. Panelde “CDI uzantısı”, “Engellenen siteler” bölümünde sitenin adresini yazıp “+ Ekle”ye tıkla. Sonra devre dışı bırakabilir veya silebilirsin."][i]; }, next: ["install", "cdi"] },
    { id: "computers", q: T("Combien d’ordinateurs puis-je utiliser ?", "How many computers can I use?", "Kaç bilgisayar kullanabilirim?"),
      kw: { fr: ["combien d ordinateurs", "ordinateur*", "poste*", "machine*", "limite*"], en: ["how many computers", "computer*", "devices", "machines", "limit*"], tr: ["kac bilgisayar", "bilgisayar*", "cihaz*", "sinir*"] },
      a: T("Le nombre d’ordinateurs est limité par compte. Dans la page Extension CDI du Dashboard, tu vois combien sont actifs (par exemple 2/3). Pour un besoin plus important, écris à " + EMAIL + ".", "The number of computers is limited per account. On the CDI extension page of the Dashboard, you can see how many are active (for example 2/3). For larger needs, write to " + EMAIL + ".", "Bilgisayar sayısı hesap başına sınırlıdır. Panelde CDI uzantısı sayfasında kaç tanesinin etkin olduğunu görürsün (örneğin 2/3). Daha fazla ihtiyaç için " + EMAIL + " adresine yaz."), next: ["install", "contact"] },
    { id: "chrome", q: T("Sur quels navigateurs ça marche ?", "Which browsers does it work on?", "Hangi tarayıcılarda çalışır?"),
      kw: { fr: ["chrome", "navigateur*", "firefox", "edge", "safari", "opera"], en: ["chrome", "browser*", "firefox", "edge", "safari", "opera"], tr: ["chrome", "tarayici*", "firefox", "edge", "safari", "opera"] },
      a: T("L’Extension CDI est une extension Chrome. Je n’ai pas d’information sur les autres navigateurs : écris à " + EMAIL + " pour en savoir plus.", "The CDI extension is a Chrome extension. I don’t have information about other browsers: write to " + EMAIL + " to find out more.", "CDI uzantısı bir Chrome uzantısıdır. Diğer tarayıcılar hakkında bilgim yok: daha fazlası için " + EMAIL + " adresine yaz."), next: ["install", "contact"] },
    { id: "cdi", q: T("Comment fonctionne l’Extension CDI ?", "How does the CDI extension work?", "CDI uzantısı nasıl çalışır?"),
      kw: { fr: ["extension*", "extension cdi", "c est quoi l extension"], en: ["extension*", "cdi extension", "what is the extension"], tr: ["uzanti*", "cdi uzantisi", "uzanti nedir"] },
      a: T("L’Extension CDI bloque les sites que tu choisis sur les ordinateurs d’un CDI. Tu l’installes avec un code généré dans ton Dashboard, puis tu gères la liste des sites bloqués depuis ton compte. C’est une extension Chrome, comprise dans les offres CDI.", "The CDI extension blocks the sites you choose on a school library’s computers. You install it with a code generated in your Dashboard, then manage the list of blocked sites from your account. It’s a Chrome extension, included in the CDI plans.", "CDI uzantısı, seçtiğin siteleri bir okul kütüphanesinin bilgisayarlarında engeller. Panelinde oluşturulan bir kodla kurarsın, sonra engellenen siteler listesini hesabından yönetirsin. CDI planlarına dahil bir Chrome uzantısıdır."), next: ["install", "blocksite", "schools"] },
    { id: "paypal", q: T("Comment puis-je payer ?", "How can I pay?", "Nasıl ödeme yapabilirim?"),
      kw: { fr: ["payer", "paiement*", "paypal", "carte bancaire", "moyen* de paiement", "regler"], en: ["pay", "payment*", "paypal", "credit card", "card"], tr: ["ode*", "odeme*", "paypal", "kredi karti", "kart"] },
      a: T("Le paiement se fait avec PayPal. Ajoute une formule au panier, ouvre ton panier dans le Dashboard, puis utilise le lien PayPal : il ouvre le paiement correspondant au total affiché.", "Payment is made with PayPal. Add a plan to your cart, open your cart in the Dashboard, then use the PayPal link: it opens the payment matching the total shown.", "Ödeme PayPal ile yapılır. Sepete bir plan ekle, panelde sepetini aç, sonra PayPal bağlantısını kullan: gösterilen toplama karşılık gelen ödemeyi açar."),
      y: function (i, c, q) { return /paypal/.test(q) ? yes(i) + ["tu peux payer avec PayPal. Ajoute une formule au panier, ouvre ton panier dans le Dashboard, puis utilise le lien PayPal.", "you can pay with PayPal. Add a plan to your cart, open your cart in the Dashboard, then use the PayPal link.", "PayPal ile ödeme yapabilirsin. Sepete bir plan ekle, panelde sepetini aç, sonra PayPal bağlantısını kullan."][i] : this.a[i]; }, next: ["buy", "promo"] },
    { id: "buy", q: T("Comment m’abonner ?", "How do I subscribe?", "Nasıl abone olurum?"),
      kw: { fr: ["acheter", "achat*", "souscrire", "commander", "panier*", "ajouter au panier", "abonner", "s abonner"], en: ["buy", "purchase", "order", "cart", "subscribe", "add to cart", "get a plan"], tr: ["satin al*", "sepet*", "abone ol*", "siparis*", "nasil alirim"] },
      a: T("Pour t’abonner :\n1. Connecte-toi ou crée un compte.\n2. Sur la page Abonnements, choisis mensuel ou annuel, puis clique sur « Ajouter au panier ».\n3. Ouvre ton panier dans le Dashboard et paie avec PayPal.\nPour les offres écoles, écris à " + EMAIL + ".", "To subscribe:\n1. Sign in or create an account.\n2. On the Subscriptions page, choose monthly or annual, then click “Add to cart”.\n3. Open your cart in the Dashboard and pay with PayPal.\nFor school plans, write to " + EMAIL + ".", "Abone olmak için:\n1. Giriş yap veya hesap oluştur.\n2. Abonelikler sayfasında aylık veya yıllık seç, sonra “Sepete ekle”ye tıkla.\n3. Panelde sepetini aç ve PayPal ile öde.\nOkul planları için " + EMAIL + " adresine yaz."), next: ["paypal", "promo", "account"] },
    { id: "promo", q: T("Puis-je utiliser un code promo ?", "Can I use a promo code?", "Promosyon kodu kullanabilir miyim?"),
      kw: { fr: ["code promo", "codes promo", "promo*", "reduction*", "coupon*", "remise*"], en: ["promo*", "coupon*", "discount*", "voucher*"], tr: ["promosyon*", "indirim*", "kupon*"] },
      a: T("Dans ton panier (Dashboard), saisis ton code dans « Code promo » puis clique sur « Appliquer ». La réduction s’affiche dans le total. Je ne connais pas les codes en cours : ils sont gérés par Activate.", "In your cart (Dashboard), type your code in “Promo code” then click “Apply”. The discount shows in the total. I don’t know the current codes: they are managed by Activate.", "Sepetinde (Panel) kodunu “Promosyon kodu” alanına yaz ve “Uygula”ya tıkla. İndirim toplamda görünür. Geçerli kodları bilmiyorum: Activate tarafından yönetilir."),
      y: function (i) { return yes(i) + ["tu peux utiliser un code promo. Dans ton panier (Dashboard), saisis-le dans « Code promo » puis clique sur « Appliquer » : la réduction s’affiche dans le total.", "you can use a promo code. In your cart (Dashboard), type it in “Promo code” then click “Apply”: the discount shows in the total.", "promosyon kodu kullanabilirsin. Sepetinde (Panel) “Promosyon kodu” alanına yazıp “Uygula”ya tıkla: indirim toplamda görünür."][i]; }, next: ["buy", "paypal"] },
    { id: "billing", q: T("Mensuel ou annuel ?", "Monthly or annual?", "Aylık mı yıllık mı?"),
      kw: { fr: ["mensuel*", "annuel*", "par an", "par mois", "facturation", "engagement"], en: ["monthly", "annual*", "yearly", "per year", "per month", "billing", "billed"], tr: ["aylik", "yillik", "faturaland*", "fatura"] },
      a: function (i, c) { var p0 = c.plans[0], p1 = c.plans[1], s0 = c.money(saving(p0)), s1 = c.money(saving(p1)); return [
        "Mensuel : tu es facturé chaque mois. Annuel : tu es facturé une seule fois par an, et tu économises environ " + s0 + " avec " + p0.name + " et " + s1 + " avec " + p1.name + " par rapport à 12 mois.",
        "Monthly: you are billed every month. Annual: you are billed once a year, and you save about " + s0 + " with " + p0.name + " and " + s1 + " with " + p1.name + " compared with 12 months.",
        "Aylık: her ay faturalandırılırsın. Yıllık: yılda bir kez faturalandırılırsın ve 12 aya kıyasla " + p0.name + " ile yaklaşık " + s0 + ", " + p1.name + " ile yaklaşık " + s1 + " tasarruf edersin."][i]; }, next: ["plans", "buy"] },
    { id: "prices", q: T("Combien ça coûte ?", "How much does it cost?", "Fiyatlar ne kadar?"),
      kw: { fr: ["prix", "tarif*", "cout*", "combien", "euro*"], en: ["price*", "cost*", "how much", "pricing", "fee*", "euro*"], tr: ["fiyat*", "ucret*", "kac para", "ne kadar", "kac euro", "maliyet*"] },
      a: function (i, c) { var p0 = c.plans[0], p1 = c.plans[1], m = c.money; return [
        "Voici les prix :\n- " + p0.name + " : " + m(p0.monthlyPrice) + " par mois ou " + m(p0.annualPrice) + " par an.\n- " + p1.name + " : " + m(p1.monthlyPrice) + " par mois ou " + m(p1.annualPrice) + " par an.\n- Écoles : CDI " + m(19) + " / mois, Multi-CDI " + m(39) + " / établissement / mois.",
        "Here are the prices:\n- " + p0.name + ": " + m(p0.monthlyPrice) + " per month or " + m(p0.annualPrice) + " per year.\n- " + p1.name + ": " + m(p1.monthlyPrice) + " per month or " + m(p1.annualPrice) + " per year.\n- Schools: CDI " + m(19) + " / month, Multi-CDI " + m(39) + " / school / month.",
        "Fiyatlar şöyle:\n- " + p0.name + ": ayda " + m(p0.monthlyPrice) + " veya yılda " + m(p0.annualPrice) + ".\n- " + p1.name + ": ayda " + m(p1.monthlyPrice) + " veya yılda " + m(p1.annualPrice) + ".\n- Okullar: CDI ayda " + m(19) + ", Multi-CDI okul başına ayda " + m(39) + "."][i]; }, next: ["billing", "schools", "paypal"] },
    { id: "password", q: T("J’ai oublié mon mot de passe", "I forgot my password", "Şifremi unuttum"),
      kw: { fr: ["mot de passe", "mdp", "oublie*", "reinitialis*"], en: ["password*", "forgot", "reset"], tr: ["sifre*", "unuttum", "sifirla*"] },
      a: T("Pour changer ton mot de passe : connecte-toi, ouvre le menu Compte, puis « Changer le mot de passe ». Si ta session est trop ancienne, le site peut t’envoyer un e-mail de réinitialisation. Si tu te connectes avec Google, ton compte n’a pas de mot de passe. En cas de blocage, écris à " + EMAIL + ".", "To change your password: sign in, open the Account menu, then “Change password”. If your session is too old, the site can send you a reset email. If you sign in with Google, your account has no password. If you’re stuck, write to " + EMAIL + ".", "Şifreni değiştirmek için: giriş yap, Hesap menüsünü aç, sonra “Şifreyi değiştir”e tıkla. Oturumun çok eskiyse site sana bir sıfırlama e-postası gönderebilir. Google ile giriş yapıyorsan hesabının şifresi yoktur. Takılırsan " + EMAIL + " adresine yaz."), next: ["account", "contact"] },
    { id: "emailchg", q: T("Comment changer mon e-mail ?", "How do I change my email?", "E-postamı nasıl değiştiririm?"),
      kw: { fr: ["changer l email", "changer mon email", "changer l e mail", "changer mon e mail", "changer d e mail", "changer d email", "changer l adresse", "modifier mon email", "modifier l email", "modifier mon e mail", "modifier l e mail", "adresse e mail"], en: ["change email", "change my email", "change the email", "email address", "update email"], tr: ["e posta* degis*", "e posta* nasil degis*", "eposta* degis*", "mail* degis*", "e posta adres*"] },
      a: T("Ouvre le menu Compte et clique sur « Changer l’email ». Un e-mail de vérification est envoyé à la nouvelle adresse.", "Open the Account menu and click “Change email”. A verification email is sent to the new address.", "Hesap menüsünü aç ve “E-postayı değiştir”e tıkla. Yeni adrese bir doğrulama e-postası gönderilir."), next: ["account", "password"] },
    { id: "language", q: T("Le site existe en quelles langues ?", "Which languages is the site in?", "Site hangi dillerde?"),
      kw: { fr: ["langue*", "anglais", "turc", "francais", "traduction*", "traduit*", "english", "turkish"], en: ["language*", "english", "turkish", "french", "translate*", "translation*"], tr: ["dil", "diller*", "turkce", "ingilizce", "fransizca", "cevir*"] },
      a: T("Le site est disponible en français, anglais et turc. Choisis ta langue avec le sélecteur en bas à droite : tout le site change tout de suite, et ton choix est conservé.", "The site is available in French, English and Turkish. Pick your language with the selector at the bottom right: the whole site changes right away, and your choice is kept.", "Site Fransızca, İngilizce ve Türkçe olarak mevcut. Sağ alttaki seçiciyle dilini seç: tüm site hemen değişir ve seçimin saklanır."),
      y: function (i) { return yes(i) + ["le site est disponible en français, anglais et turc. Choisis ta langue avec le sélecteur en bas à droite : tout le site change tout de suite.", "the site is available in French, English and Turkish. Pick your language with the selector at the bottom right: the whole site changes right away.", "site Fransızca, İngilizce ve Türkçe olarak mevcut. Sağ alttaki seçiciyle dilini seç: tüm site hemen değişir."][i]; }, next: ["account"] },
    { id: "account", q: T("Comment créer un compte ?", "How do I create an account?", "Nasıl hesap oluştururum?"),
      kw: { fr: ["creer un compte", "inscription", "inscrire", "compte*", "connexion", "connecter", "login", "google"], en: ["create an account", "sign up", "register", "account*", "log in", "login", "sign in", "google"], tr: ["hesap*", "kayit*", "uye*", "giris*", "oturum*", "google"] },
      a: T("Clique sur « Connexion » en haut de la page, puis « Créer un compte ». Tu peux utiliser ton e-mail et un mot de passe, ou continuer avec Google. Ton compte donne accès au Dashboard : panier, produits achetés et Extension CDI.", "Click “Sign in” at the top of the page, then “Create an account”. You can use your email and a password, or continue with Google. Your account gives access to the Dashboard: cart, purchased products and the CDI extension.", "Sayfanın üstündeki “Giriş”e tıkla, sonra “Hesap oluştur”a. E-postan ve bir şifreyle ya da Google ile devam edebilirsin. Hesabın Panele erişim sağlar: sepet, satın alınan ürünler ve CDI uzantısı."),
      y: function (i, c, q) { return /google/.test(q) ? yes(i) + ["tu peux te connecter avec Google, ou avec ton e-mail et un mot de passe.", "you can sign in with Google, or with your email and a password.", "Google ile ya da e-postan ve şifrenle giriş yapabilirsin."][i] : this.a[i]; }, next: ["password", "language", "buy"] },
    { id: "refund", kw: { fr: ["rembours*", "annul*", "resili*", "desabonn*", "arreter l abonnement"], en: ["refund*", "cancel*", "unsubscribe", "terminate"], tr: ["iade*", "iptal*", "abonelikten cik*"] },
      q: T("Puis-je annuler ou être remboursé ?", "Can I cancel or get a refund?", "İptal edebilir veya iade alabilir miyim?"),
      a: T("Je n’ai pas d’information sur les annulations ou les remboursements. Écris à " + EMAIL + " : l’équipe te répondra.", "I don’t have information about cancellations or refunds. Write to " + EMAIL + ": the team will reply.", "İptaller veya iadeler hakkında bilgim yok. " + EMAIL + " adresine yaz: ekip sana yanıt verecek."), next: ["contact"] },
    { id: "privacy", kw: { fr: ["donnees", "confidentialite", "vie privee", "rgpd"], en: ["data", "privacy", "gdpr"], tr: ["veri*", "gizlilik", "kvkk"] },
      a: T("Je n’ai pas de détails sur le traitement des données. Pour toute question sur tes données ou la confidentialité, écris à " + EMAIL + ".", "I don’t have details about data handling. For any question about your data or privacy, write to " + EMAIL + ".", "Verilerin işlenmesi hakkında ayrıntı bilgim yok. Verilerin veya gizlilikle ilgili her soru için " + EMAIL + " adresine yaz."), next: ["contact"] },
    { id: "contact", q: T("Comment contacter Activate ?", "How do I contact Activate?", "Activate ile nasıl iletişime geçerim?"),
      kw: { fr: ["contact*", "joindre", "email", "mail", "ecrire", "support", "telephone"], en: ["contact*", "reach", "email", "mail", "write to", "support", "phone"], tr: ["iletisim*", "ulas*", "e posta", "eposta", "mail", "destek"] },
      a: T("Écris-nous à " + EMAIL + ". Pour les offres écoles, tu peux aussi utiliser le bouton « Demander cette formule » sur la page d’accueil.", "Write to us at " + EMAIL + ". For school plans, you can also use the “Request this plan” button on the home page.", "Bize " + EMAIL + " adresinden yaz. Okul planları için ana sayfadaki “Bu planı talep et” düğmesini de kullanabilirsin."), next: ["schools"] },
    { id: "plans", q: T("Quelles sont vos formules ?", "What plans do you offer?", "Hangi planlarınız var?"),
      kw: { fr: ["quelles sont vos", "formule*", "option*", "offre*", "abonnement*", "propose*"], en: ["what do you offer", "what do you sell", "plan*", "option*", "offer*", "subscription*"], tr: ["ne sunuyorsunuz", "plan*", "secenek*", "paket*", "abonelik*"] },
      a: plansText, y: function (i, c) { return yes(i) + plansText(i, c).replace(/^./, function (ch) { return ch.toLowerCase(); }); }, next: ["diff", "billing", "buy"] },
    { id: "help", q: T("Que peux-tu faire ?", "What can you do?", "Neler yapabilirsin?"),
      kw: { fr: ["aide*", "aider", "que peux tu", "que sais tu", "assistant"], en: ["help*", "what can you do", "what do you know", "assistant"], tr: ["yardim*", "neler yapabilirsin", "ne bilirsin", "asistan*"] },
      a: T("Je peux répondre aux questions sur : les formules et les prix, l’abonnement et le paiement, ton compte, l’Extension CDI (installation, sites bloqués) et les offres écoles. Choisis une suggestion ou écris ta question.", "I can answer questions about: plans and prices, subscribing and paying, your account, the CDI extension (installation, blocked sites) and school plans. Pick a suggestion or type your question.", "Şu konularda soruları yanıtlayabilirim: planlar ve fiyatlar, abonelik ve ödeme, hesabın, CDI uzantısı (kurulum, engellenen siteler) ve okul planları. Bir öneri seç veya sorunu yaz."), next: ["plans", "prices", "cdi", "schools"] }
  ];

  /* Réponses COURTES, affichées par défaut : juste le minimum. Les textes longs de KB (a / y) s'affichent avec « Plus de détails ». */
  var SHORT = {
    hello: { s: T("Bonjour ! Pose ta question.", "Hello! Ask your question.", "Merhaba! Sorunu sor.") },
    thanks: { s: T("Avec plaisir !", "You’re welcome!", "Rica ederim!") },
    what: { s: T("Une organisation de logiciels de cybersécurité.", "A cybersecurity software organization.", "Siber güvenlik yazılımları kuruluşu.") },
    diff: { s: function (i, c) { var a = c.plans[0].name, b = c.plans[1].name; return [a + " : mises à jour à leur sortie. " + b + " : mises à jour en avant-première.", a + ": updates at release. " + b + ": updates in advance.", a + ": çıkışta güncellemeler. " + b + ": önceden güncellemeler."][i]; } },
    features: { s: T("Extension Chrome, règles personnalisées, statistiques et journaux.", "Chrome extension, custom rules, statistics and logs.", "Chrome uzantısı, özel kurallar, istatistikler ve günlükler.") },
    schools: { s: function (i, c) { var m = c.money; return ["CDI : " + m(19) + " / mois. Multi-CDI : " + m(39) + " / établissement / mois.", "CDI: " + m(19) + " / month. Multi-CDI: " + m(39) + " / school / month.", "CDI: ayda " + m(19) + ". Multi-CDI: okul başına ayda " + m(39) + "."][i]; },
      sy: function (i, c) { return ["Oui. ", "Yes. ", "Evet. "][i] + this.s(i, c); } },
    services: { s: T("Protection réseau, détection des menaces, audit et sécurité.", "Network protection, threat detection, audit and security.", "Ağ koruması, tehdit tespiti, denetim ve güvenlik.") },
    demo: { s: T("Une maquette, pas un vrai scan.", "A mockup, not a real scan.", "Bir maket, gerçek tarama değil."), sy: T("Non, c’est une maquette.", "No, it’s a mockup.", "Hayır, bir maket.") },
    install: { s: T("Dashboard → Mes produits → Gérer l’Extension CDI → Générer un code.", "Dashboard → My products → Manage the CDI extension → Generate a code.", "Panel → Ürünlerim → CDI uzantısını yönet → Kod oluştur.") },
    blocksite: { s: T("Dashboard → Extension CDI → Sites bloqués → + Ajouter.", "Dashboard → CDI extension → Blocked sites → + Add.", "Panel → CDI uzantısı → Engellenen siteler → + Ekle."),
      sy: T("Oui : Dashboard → Extension CDI → Sites bloqués.", "Yes: Dashboard → CDI extension → Blocked sites.", "Evet: Panel → CDI uzantısı → Engellenen siteler.") },
    computers: { s: T("Limité par compte (par exemple 2/3).", "Limited per account (for example 2/3).", "Hesap başına sınırlı (örneğin 2/3).") },
    chrome: { s: T("C’est une extension Chrome.", "It’s a Chrome extension.", "Bir Chrome uzantısı.") },
    cdi: { s: T("Elle bloque les sites choisis sur les ordinateurs du CDI.", "It blocks the chosen sites on the CDI computers.", "Seçilen siteleri CDI bilgisayarlarında engeller.") },
    paypal: { s: T("Avec PayPal.", "With PayPal.", "PayPal ile."),
      sy: function (i, c, q) { return /paypal/.test(q) ? ["Oui, avec PayPal.", "Yes, with PayPal.", "Evet, PayPal ile."][i] : this.s[i]; } },
    buy: { s: T("Connecte-toi, ajoute la formule au panier, paie avec PayPal.", "Sign in, add the plan to the cart, pay with PayPal.", "Giriş yap, planı sepete ekle, PayPal ile öde.") },
    promo: { s: T("Panier → Code promo → Appliquer.", "Cart → Promo code → Apply.", "Sepet → Promosyon kodu → Uygula."),
      sy: T("Oui : Panier → Code promo → Appliquer.", "Yes: Cart → Promo code → Apply.", "Evet: Sepet → Promosyon kodu → Uygula.") },
    billing: { s: T("Mensuel : chaque mois. Annuel : une fois par an, moins cher.", "Monthly: every month. Annual: once a year, cheaper.", "Aylık: her ay. Yıllık: yılda bir, daha ucuz.") },
    prices: { s: function (i, c) { var a = c.plans[0], b = c.plans[1], m = c.money; return [a.name + " : " + m(a.monthlyPrice) + " / mois. " + b.name + " : " + m(b.monthlyPrice) + " / mois.", a.name + ": " + m(a.monthlyPrice) + " / month. " + b.name + ": " + m(b.monthlyPrice) + " / month.", a.name + ": ayda " + m(a.monthlyPrice) + ". " + b.name + ": ayda " + m(b.monthlyPrice) + "."][i]; } },
    password: { s: T("Menu Compte → Changer le mot de passe.", "Account menu → Change password.", "Hesap menüsü → Şifreyi değiştir.") },
    emailchg: { s: T("Menu Compte → Changer l’email.", "Account menu → Change email.", "Hesap menüsü → E-postayı değiştir.") },
    language: { s: T("Français, anglais et turc.", "French, English and Turkish.", "Fransızca, İngilizce ve Türkçe."), sy: T("Oui : français, anglais et turc.", "Yes: French, English and Turkish.", "Evet: Fransızca, İngilizce ve Türkçe.") },
    account: { s: T("Connexion → Créer un compte.", "Sign in → Create an account.", "Giriş → Hesap oluştur."),
      sy: function (i, c, q) { return /google/.test(q) ? ["Oui, avec Google.", "Yes, with Google.", "Evet, Google ile."][i] : this.s[i]; } },
    refund: { s: T("Pas d’information. Écris à " + EMAIL + ".", "No information. Write to " + EMAIL + ".", "Bilgi yok. " + EMAIL + " adresine yaz.") },
    privacy: { s: T("Pas d’information. Écris à " + EMAIL + ".", "No information. Write to " + EMAIL + ".", "Bilgi yok. " + EMAIL + " adresine yaz.") },
    contact: { s: T(EMAIL, EMAIL, EMAIL) },
    plans: { s: function (i, c) { var a = c.plans[0], b = c.plans[1], m = c.money; return [a.name + " (" + m(a.monthlyPrice) + " / mois) et " + b.name + " (" + m(b.monthlyPrice) + " / mois).", a.name + " (" + m(a.monthlyPrice) + " / month) and " + b.name + " (" + m(b.monthlyPrice) + " / month).", a.name + " (ayda " + m(a.monthlyPrice) + ") ve " + b.name + " (ayda " + m(b.monthlyPrice) + ")."][i]; },
      sy: function (i, c) { return ["Oui : ", "Yes: ", "Evet: "][i] + this.s(i, c); } },
    help: { s: T("Formules, prix, paiement, compte, Extension CDI, écoles.", "Plans, prices, payment, account, CDI extension, schools.", "Planlar, fiyatlar, ödeme, hesap, CDI uzantısı, okullar.") }
  };
  KB.forEach(function (e) { var sh = SHORT[e.id]; if (sh) { e.s = sh.s; if (sh.sy) e.sy = sh.sy; } });
  var FALLBACK = { id: "fallback", a: T("Je n’ai pas la réponse à cette question. Essaie une de ces questions, ou écris à " + EMAIL + ".", "I don’t have an answer to that question. Try one of these questions, or write to " + EMAIL + ".", "Bu sorunun yanıtını bilmiyorum. Şu sorulardan birini dene veya " + EMAIL + " adresine yaz."), next: ["plans", "prices", "cdi", "contact"],
    s: T("Je ne sais pas. Essaie une suggestion ou écris à " + EMAIL + ".", "I don’t know. Try a suggestion or write to " + EMAIL + ".", "Bilmiyorum. Bir öneri dene veya " + EMAIL + " adresine yaz.") };
  var START = ["plans", "prices", "cdi", "contact"];

  /* ---------- Moteur ---------- */
  function norm(s) { // minuscules, sans accents ni ponctuation (aussi pour le turc : ı, ş, ğ, ç, ö, ü)
    return String(s).replace(/[İI]/g, "i").toLowerCase().replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }
  var reCache = {};
  function kwRe(kw) {
    if (!reCache[kw]) reCache[kw] = new RegExp("(^| )" + kw.split(" ").map(function (w) { var star = w.slice(-1) === "*", b = norm(w); return b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + (star ? "[a-z0-9]*" : ""); }).join(" ") + "( |$)");
    return reCache[kw];
  }
  var YN = /^(est ce|puis je|peut on|peut il|peuvent ils|y a t il|ya t il|faut il|dois je|avez vous|proposez vous|acceptez vous|existe t il|est il|est elle|a t il|sont ils|peux tu|pouvez vous|on peut|is|are|can|could|do|does|did|will|would|should|have|has|am|may|must)( |$)|(^| )(mi|mu|miyim|miyiz|misiniz|musunuz|midir|mudur)( |$)/;
  var ENTRIES = {}; KB.forEach(function (e) { ENTRIES[e.id] = e; });

  function find(text) { // → { entry, yn, q } ou null
    var q = norm(text); if (!q) return null;
    var best = null, bestScore = 0;
    KB.forEach(function (e) {
      var s = 0, seen = {};
      ["fr", "en", "tr"].forEach(function (l) { (e.kw[l] || []).forEach(function (k) { if (seen[k]) return; seen[k] = 1; if (kwRe(k).test(q)) s += k.indexOf(" ") > 0 ? 3 : 2; }); });
      if (s > bestScore) { best = e; bestScore = s; } // en cas d'égalité, la première entrée de la liste gagne
    });
    return bestScore >= 2 ? { entry: best, yn: YN.test(q), q: q } : null;
  }
  function answer(entry, i, ctx, yn, q, detail) { // détail = texte long ; sinon réponse courte
    var src = !detail && entry.s ? (yn && entry.sy ? entry.sy : entry.s) : (yn && entry.y ? entry.y : entry.a);
    return typeof src === "function" ? src.call(entry, i, ctx, q || "") : src[i];
  }
  function makeCtx(plans, i) {
    var f = new Intl.NumberFormat(LOC[i], { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return { plans: plans, money: function (n) { return f.format(n); } };
  }
  function parseMarkdown(text) { // listes « - » et « 1. » + paragraphes ; renvoie une structure, jamais du HTML
    var blocks = [], cur = null;
    String(text).replace(/\r/g, "").split("\n").forEach(function (line) {
      var ul = /^\s*[-*•]\s+(.*)$/.exec(line), ol = /^\s*\d+[.)]\s+(.*)$/.exec(line), kind = ul ? "ul" : ol ? "ol" : line.trim() ? "p" : null;
      if (!kind) { cur = null; return; }
      if (kind === "p") { if (cur && cur.type === "p") cur.lines.push(line.trim()); else { cur = { type: "p", lines: [line.trim()] }; blocks.push(cur); } return; }
      if (cur && cur.type === kind) cur.items.push((ul || ol)[1]); else { cur = { type: kind, items: [(ul || ol)[1]] }; blocks.push(cur); }
    });
    return blocks;
  }
  if (typeof module === "object" && module.exports) { module.exports = { KB: KB, ENTRIES: ENTRIES, FALLBACK: FALLBACK, START: START, find: find, answer: answer, makeCtx: makeCtx, norm: norm, parseMarkdown: parseMarkdown, DEFAULT_PLANS: DEFAULT_PLANS }; return; } // tests hors navigateur

  /* ---------- Interface ---------- */
  var KEY = "activate_chat_faq";
  var messages = [], plans = DEFAULT_PLANS, busy = false, btn, panel, logEl, form, input, sendBtn, titleEl, subEl, resetBtn, closeBtn, lastFocus;

  function lang() { var l = window.ACTIVATE_LANG || localStorage.getItem("activate_language") || document.documentElement.lang || "fr"; return LI[l] != null ? l : "fr"; }
  function li() { return LI[lang()]; }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function load() { try { messages = JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch (e) { messages = []; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-40))); } catch (e) {} }
  function toBottom() { logEl.scrollTop = logEl.scrollHeight; }

  // Les prix viennent du site (GET /api/site/settings, public) ; en cas d'échec on garde les prix par défaut.
  function loadPlans() {
    var base = String(window.ACTIVATE_API_URL || "").replace(/\/$/, ""); if (!base || !window.fetch) return;
    var ctrl = window.AbortController ? new AbortController() : null, timer = ctrl && setTimeout(function () { ctrl.abort(); }, 4000);
    fetch(base + "/api/site/settings", ctrl ? { signal: ctrl.signal } : {}).then(function (r) { return r.json(); }).then(function (j) {
      var p = j && j.settings && j.settings.plans;
      if (Array.isArray(p) && p.length >= 2 && p.slice(0, 2).every(function (x) { return x && x.name && isFinite(x.monthlyPrice) && isFinite(x.annualPrice); }))
        plans = p.slice(0, 2).map(function (x) { return { name: String(x.name), monthlyPrice: Number(x.monthlyPrice), annualPrice: Number(x.annualPrice) }; });
    }).catch(function () {}).then(function () { if (timer) clearTimeout(timer); });
  }

  function renderInto(node, text) {
    node.textContent = "";
    parseMarkdown(text).forEach(function (b) {
      if (b.type === "p") { var p = el("p"); b.lines.forEach(function (l, k) { if (k) p.appendChild(document.createElement("br")); p.appendChild(document.createTextNode(l)); }); node.appendChild(p); }
      else { var list = el(b.type); b.items.forEach(function (it) { list.appendChild(el("li", "", it)); }); node.appendChild(list); }
    });
  }
  function bubble(role, text) { var b = el("div", "activate-chat-msg activate-chat-" + role); renderInto(b, text); logEl.appendChild(b); toBottom(); return b; }
  function chips(ids, more) {
    var box = el("div", "activate-chat-ideas");
    if (more) { var mc = el("button", "activate-chat-chip", UI[lang()].more); mc.type = "button"; mc.addEventListener("click", function () { showMore(more); }); box.appendChild(mc); }
    ids.filter(function (id, k, a) { return ENTRIES[id] && ENTRIES[id].q && a.indexOf(id) === k; }).slice(0, more ? 3 : 4).forEach(function (id) {
      var c = el("button", "activate-chat-chip", ENTRIES[id].q[li()]); c.type = "button"; c.addEventListener("click", function () { askId(id); }); box.appendChild(c);
    });
    if (box.childNodes.length) { logEl.appendChild(box); toBottom(); }
  }
  function botText(m) { var e = ENTRIES[m.id] || FALLBACK; return answer(e, li(), makeCtx(plans, li()), m.yn, m.q, m.d); }
  function canMore(m) { // y a-t-il un texte plus détaillé que la réponse courte ?
    if (m.d) return false; var e = ENTRIES[m.id] || FALLBACK, i = li(), c = makeCtx(plans, i);
    return !!e.s && !!e.a && answer(e, i, c, m.yn, m.q, true) !== answer(e, i, c, m.yn, m.q, false);
  }
  function showMore(m) { reply(null, { r: "b", id: m.id, yn: m.yn, q: m.q, d: 1 }); }
  function nextIds(m) { return (ENTRIES[m.id] || FALLBACK).next || []; }

  function render() {
    var t = UI[lang()];
    btn.setAttribute("aria-label", t.open); btn.title = t.open;
    titleEl.textContent = t.title; subEl.textContent = t.sub;
    resetBtn.title = t.reset; resetBtn.setAttribute("aria-label", t.reset); closeBtn.setAttribute("aria-label", t.close); closeBtn.title = t.close;
    input.placeholder = t.placeholder; sendBtn.setAttribute("aria-label", t.send); sendBtn.title = t.send;
    logEl.textContent = ""; resetBtn.hidden = !messages.length;
    bubble("assistant", t.hello);
    messages.forEach(function (m) { if (m.r === "u") bubble("user", m.id ? ENTRIES[m.id].q[li()] : m.t); else bubble("assistant", botText(m)); });
    var last = messages[messages.length - 1];
    chips(last && last.r === "b" ? nextIds(last) : START, last && last.r === "b" && canMore(last) ? last : null);
  }

  function reveal(node, text, done) { // effet « machine à écrire »
    var parts = text.split(/(\s+)/), i = 0, reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { renderInto(node, text); toBottom(); return done(); }
    (function step() {
      i = Math.min(parts.length, i + 4); renderInto(node, parts.slice(0, i).join("")); toBottom();
      if (i < parts.length) setTimeout(step, 22); else done();
    })();
  }

  function reply(userMsg, botMsg) { // affiche la question, un court temps d'écriture, puis la réponse
    if (busy) return; busy = true; sendBtn.disabled = true;
    var old = logEl.querySelector(".activate-chat-ideas"); if (old) old.remove();
    if (userMsg) { messages.push(userMsg); bubble("user", userMsg.id ? ENTRIES[userMsg.id].q[li()] : userMsg.t); resetBtn.hidden = false; }
    var typing = el("div", "activate-chat-msg activate-chat-assistant activate-chat-typing"); typing.appendChild(el("span")); typing.appendChild(el("span")); typing.appendChild(el("span")); logEl.appendChild(typing); toBottom();
    setTimeout(function () {
      typing.remove(); messages.push(botMsg); save();
      reveal(bubble("assistant", ""), botText(botMsg), function () { chips(nextIds(botMsg), canMore(botMsg) ? botMsg : null); busy = false; sendBtn.disabled = false; });
    }, 450);
  }
  function askText(text) {
    text = String(text || "").trim().slice(0, 300); if (!text || busy) return;
    input.value = ""; autosize();
    var f = find(text);
    reply({ r: "u", t: text }, f ? { r: "b", id: f.entry.id, yn: f.yn, q: f.q } : { r: "b", id: "fallback", yn: false, q: "" });
  }
  function askId(id) { reply({ r: "u", id: id }, { r: "b", id: id, yn: false, q: "" }); }

  function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 96) + "px"; }
  function onKey(e) { if (e.key === "Escape") closePanel(); }
  function openPanel() { lastFocus = document.activeElement; load(); render(); panel.hidden = false; btn.hidden = true; document.addEventListener("keydown", onKey); input.focus(); }
  function closePanel() { if (panel.hidden) return; panel.hidden = true; btn.hidden = false; document.removeEventListener("keydown", onKey); if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  function svg(d) {
    var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg"), p = document.createElementNS(ns, "path");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", "24"); s.setAttribute("height", "24"); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", "2"); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true");
    p.setAttribute("d", d); s.appendChild(p); return s;
  }
  function iconBtn(cls, d) { var b = el("button", cls); b.type = "button"; b.appendChild(svg(d)); return b; }

  function init() {
    btn = iconBtn("", "M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"); btn.id = "activate-chat-btn"; btn.setAttribute("data-no-i18n", "");
    btn.addEventListener("click", openPanel);
    panel = el("section"); panel.id = "activate-chat-panel"; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "false"); panel.setAttribute("data-no-i18n", "");
    var head = el("div", "activate-chat-head"), tx = el("div", "activate-chat-titles");
    titleEl = el("strong"); subEl = el("span"); tx.appendChild(titleEl); tx.appendChild(subEl);
    resetBtn = iconBtn("activate-chat-icon", "M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"); resetBtn.addEventListener("click", function () { if (busy) return; messages = []; save(); render(); });
    closeBtn = iconBtn("activate-chat-icon", "M6 6l12 12M18 6 6 18"); closeBtn.addEventListener("click", closePanel);
    head.appendChild(tx); head.appendChild(resetBtn); head.appendChild(closeBtn);
    logEl = el("div", "activate-chat-log"); logEl.setAttribute("role", "log"); logEl.setAttribute("aria-live", "polite");
    form = el("form", "activate-chat-form"); input = el("textarea"); input.rows = 1; input.maxLength = 300;
    sendBtn = iconBtn("activate-chat-send", "M5 12h14M13 6l6 6-6 6"); sendBtn.type = "submit";
    form.appendChild(input); form.appendChild(sendBtn);
    form.addEventListener("submit", function (e) { e.preventDefault(); askText(input.value); });
    input.addEventListener("input", autosize);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); askText(input.value); } });
    panel.appendChild(head); panel.appendChild(logEl); panel.appendChild(form);
    document.body.appendChild(btn); document.body.appendChild(panel);

    var refresh = function () { btn.setAttribute("aria-label", UI[lang()].open); if (!panel.hidden && !busy) render(); };
    window.addEventListener("activate-language-changed", refresh);
    new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] }); // le sélecteur de langue du site change <html lang>
    btn.setAttribute("aria-label", UI[lang()].open);
    loadPlans();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
