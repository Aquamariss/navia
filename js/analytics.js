/* ============================================================
   NAVIA — audience measurement (Umami, cookieless)
   The Umami script itself records the pageview. This file adds
   the custom events: engaged time, scroll depth, section views,
   CTA clicks and the order-form funnel.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- safe wrapper around the tracker ---------- */
  const queue = [];

  function flush() {
    if (!(window.umami && typeof window.umami.track === 'function')) return;
    while (queue.length) {
      const ev = queue.shift();
      try { window.umami.track(ev[0], ev[1]); } catch (e) { /* tracker blocked */ }
    }
  }

  let tries = 0;
  const waiting = setInterval(() => {
    flush();
    if (!queue.length || ++tries > 20) clearInterval(waiting); // give up after ~10 s
  }, 500);

  function track(name, data) {
    if (queue.length > 30) queue.length = 0; // tracker never loaded, do not grow
    queue.push([name, data]);
    flush();
  }

  const fired = {};
  function once(name, data) {
    if (fired[name]) return;
    fired[name] = true;
    track(name, data);
  }

  /* main.js reports the order submission through this */
  window.naviaTrack = track;

  /* ---------- engaged time (tab visible only) ---------- */
  const MARKS = [15, 30, 60, 120, 300];
  let seconds = 0, next = 0;
  const clock = setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    seconds++;
    while (next < MARKS.length && seconds >= MARKS[next]) {
      once('time-' + MARKS[next] + 's');
      next++;
    }
    if (next >= MARKS.length) clearInterval(clock);
  }, 1000);

  /* ---------- scroll depth ---------- */
  const DEPTHS = [25, 50, 75, 100];
  let pending = false;

  function measureDepth() {
    pending = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const pct = ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100;
    DEPTHS.forEach(d => { if (pct >= d - 0.5) once('scroll-' + d); });
  }

  window.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(measureDepth);
  }, { passive: true });

  /* ---------- section views ---------- */
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        // a section taller than the viewport never reaches a high ratio
        const tall = entry.intersectionRect.height >= window.innerHeight * 0.5;
        if (entry.intersectionRatio < 0.35 && !tall) return;
        once('view-' + entry.target.id);
        obs.unobserve(entry.target);
      });
    }, { threshold: [0, 0.35] });

    document.querySelectorAll('section[id]').forEach(s => observer.observe(s));
  }

  /* ---------- clicks that matter ---------- */
  function zone(el) {
    if (el.closest('.wa-float')) return 'float';
    if (el.closest('header')) return 'header';
    if (el.closest('footer')) return 'footer';
    if (el.closest('#commande')) return 'form';
    if (el.closest('article, .article')) return 'article';
    return 'body';
  }

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href') || '';
      if (href.indexOf('wa.me') > -1) track('click-whatsapp', { zone: zone(link) });
      else if (href.indexOf('mailto:') === 0) track('click-email', { zone: zone(link) });
      else if (href.indexOf('tel:') === 0) track('click-phone', { zone: zone(link) });
      else if (/#commande$/.test(href)) track('cta-order', { zone: zone(link) });
      else if (/#exemples$/.test(href)) track('cta-examples', { zone: zone(link) });
      else if (/\/articles\//.test(href)) track('click-article', { to: href });
      return;
    }

    const faq = e.target.closest('.faq-q');
    if (faq) {
      const item = faq.closest('.faq-item');
      if (item && !item.classList.contains('open')) {
        track('faq-open', { question: faq.textContent.replace('+', '').trim().slice(0, 80) });
      }
      return;
    }

    const media = e.target.closest('[data-lightbox]');
    if (media) {
      track('example-open', {
        type: media.dataset.lightbox,
        item: (media.dataset.src || '').split('/').pop()
      });
    }
  }, true); // capture: runs before main.js toggles the FAQ class

  /* ---------- order form funnel ---------- */
  const form = document.querySelector('#order-form');
  if (form) {
    form.addEventListener('focusin', () => once('form-start'), { once: true });

    if ('MutationObserver' in window) {
      const steps = Array.from(form.querySelectorAll('.step'));
      new MutationObserver(() => {
        const i = steps.findIndex(s => s.classList.contains('active'));
        if (i > 0) once('form-step-' + (i + 1));
      }).observe(form, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }
  }
})();
