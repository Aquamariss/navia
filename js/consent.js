/* ============================================================
   NAVIA — bandeau de consentement + Google Consent Mode v2
   ------------------------------------------------------------
   La valeur par défaut (tout refusé) est posée dans le <head>
   de chaque page, avant le chargement de gtag.js. Ce fichier
   ne fait que recueillir le choix et envoyer la mise à jour.
   ============================================================ */

(function () {
  'use strict';

  var KEY = 'navia-consent';
  var MAX_AGE = 183 * 24 * 60 * 60 * 1000; /* 6 mois — recommandation CNIL */

  var EN = (document.documentElement.lang || 'fr').toLowerCase().indexOf('en') === 0;

  var T = EN ? {
    title: 'Advertising cookies',
    body: 'We set Google Ads cookies only if you accept them. They let us measure how well our ads perform. Site audience measurement is separate: it is cookieless and does not identify you.',
    more: 'Learn more',
    privacy: '/en/privacy-policy.html',
    accept: 'Accept all',
    deny: 'Reject all',
    manage: 'Manage cookies',
    label: 'Cookie consent'
  } : {
    title: 'Cookies publicitaires',
    body: "Nous déposons des cookies Google Ads uniquement si vous les acceptez. Ils servent à mesurer l'efficacité de nos annonces. La mesure d'audience du site est indépendante : elle est sans cookie et ne vous identifie pas.",
    more: 'En savoir plus',
    privacy: '/confidentialite.html',
    accept: 'Tout accepter',
    deny: 'Tout refuser',
    manage: 'Gérer les cookies',
    label: 'Consentement aux cookies'
  };

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && typeof c.ads === 'boolean' && c.expires > Date.now()) return c;
    } catch (e) {}
    return null;
  }

  function write(ads) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        ads: ads,
        date: new Date().toISOString(),
        expires: Date.now() + MAX_AGE
      }));
    } catch (e) {}
  }

  function update(ads) {
    var v = ads ? 'granted' : 'denied';
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: v,
        ad_user_data: v,
        ad_personalization: v
      });
    }
    if (window.naviaTrack) window.naviaTrack(ads ? 'consent-accept' : 'consent-deny');
  }

  var banner = null;
  var opener = null;

  function close() {
    if (!banner) return;
    banner.remove();
    banner = null;
    document.body.classList.remove('cookie-open');
    if (opener && document.contains(opener)) opener.focus();
  }

  function choose(ads) {
    write(ads);
    update(ads);
    close();
    addManageLink();
  }

  function open(trigger) {
    if (banner) return;
    opener = trigger || null;

    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', T.label);
    banner.innerHTML =
      '<div class="cookie-inner">' +
        '<div class="cookie-text">' +
          '<strong>' + T.title + '</strong>' +
          '<p>' + T.body + ' <a href="' + T.privacy + '">' + T.more + '</a></p>' +
        '</div>' +
        '<div class="cookie-actions">' +
          '<button type="button" class="cookie-btn cookie-deny" data-consent="deny">' + T.deny + '</button>' +
          '<button type="button" class="cookie-btn cookie-accept" data-consent="allow">' + T.accept + '</button>' +
        '</div>' +
      '</div>';

    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (b) choose(b.dataset.consent === 'allow');
    });

    document.body.appendChild(banner);
    document.body.classList.add('cookie-open');
    banner.querySelector('.cookie-deny').focus();
  }

  /* lien permanent de retrait, ajouté au pied de page de chaque page */
  function addManageLink() {
    var foot = document.querySelector('footer .footer-bottom');
    if (!foot || foot.querySelector('.cookie-manage')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cookie-manage';
    btn.textContent = T.manage;
    btn.addEventListener('click', function () { open(btn); });
    /* à gauche, et non à droite : le bouton WhatsApp flottant
       recouvre le coin inférieur droit et rendrait le lien incliquable */
    var first = foot.firstElementChild;
    if (first) {
      first.insertAdjacentHTML('beforeend', ' · ');
      first.appendChild(btn);
    } else {
      foot.appendChild(btn);
    }
  }

  function init() {
    var saved = read();
    if (saved) {
      /* le <head> a déjà envoyé la mise à jour pour un choix enregistré :
         ne pas la renvoyer, sinon Umami compterait un « consent-accept »
         à chaque page vue */
      addManageLink();
    } else {
      open(null);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
