/* ============================================================
   NAVIA — site interactions
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- mobile nav ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
    });
  });

  /* ---------- portfolio lightbox (video + source photo) ---------- */
  const lightbox = document.querySelector('#lightbox');
  if (lightbox) {
    const inner = lightbox.querySelector('.lightbox-inner');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.classList.remove('no-scroll');
      inner.innerHTML = '';
    };

    const openLightbox = (type, src, alt, ratio) => {
      inner.innerHTML = '';
      let el;
      if (type === 'youtube') {
        /* l'iframe n'est créée qu'ici, au clic : aucune requête vers Google
           tant que le visiteur n'a pas demandé à voir la vidéo */
        el = document.createElement('div');
        el.className = 'yt-wrap' + (ratio === 'h' ? ' ratio-h' : '');
        const frame = document.createElement('iframe');
        frame.src = 'https://www.youtube-nocookie.com/embed/' + src +
                    '?autoplay=1&rel=0&playsinline=1&modestbranding=1';
        frame.title = alt || '';
        frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        frame.allowFullscreen = true;
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        el.appendChild(frame);
        inner.appendChild(el);
        lightbox.classList.add('open');
        document.body.classList.add('no-scroll');
        closeBtn.focus();
        return;
      }
      if (type === 'video') {
        el = document.createElement('video');
        el.controls = true;
        el.autoplay = true;
        el.playsInline = true;
        el.preload = 'auto';
      } else {
        el = document.createElement('img');
        el.alt = alt || '';
      }
      el.src = src;
      inner.appendChild(el);
      lightbox.classList.add('open');
      document.body.classList.add('no-scroll');
      closeBtn.focus();
    };

    document.querySelectorAll('[data-lightbox]').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const type = trigger.dataset.lightbox;
        const src = type === 'youtube' ? trigger.dataset.yt : trigger.dataset.src;
        const ratio = trigger.classList.contains('ratio-h') ? 'h' : 'v';
        openLightbox(type, src, trigger.getAttribute('aria-label'), ratio);
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
  }

  /* ---------- multi-step order form ---------- */
  const form = document.querySelector('#order-form');
  if (form) {
    const steps = Array.from(form.querySelectorAll('.step'));
    const progressFill = document.querySelector('.progress-fill');
    const progressLabel = document.querySelector('[data-progress-label]');
    let current = 0;

    function showStep(i) {
      steps.forEach((s, idx) => s.classList.toggle('active', idx === i));
      const pct = ((i + 1) / steps.length) * 100;
      if (progressFill) progressFill.style.width = pct + '%';
      if (progressLabel) progressLabel.textContent = (i + 1) + ' / ' + steps.length;
      form.querySelectorAll('.form-nav').forEach((nav, idx) => {
        nav.style.display = idx === i ? 'flex' : 'none';
      });
    }

    form.querySelectorAll('[data-next]').forEach(btn => {
      btn.addEventListener('click', () => {
        const stepEl = steps[current];
        const inputs = stepEl.querySelectorAll('input, textarea, select');
        let valid = true;
        inputs.forEach(inp => { if (!inp.checkValidity()) { inp.reportValidity(); valid = false; } });
        if (!valid) return;
        if (current < steps.length - 1) { current++; showStep(current); window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }
      });
    });
    form.querySelectorAll('[data-prev]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (current > 0) { current--; showStep(current); }
      });
    });

    showStep(0);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('[data-submit]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = form.dataset.sending || 'Sending...'; }

      const data = new FormData(form);
      fetch('/', { method: 'POST', body: new URLSearchParams(data).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
        .then(() => {
          if (window.naviaTrack) window.naviaTrack('order-sent');
          /* short delay so the Umami request leaves before the page unloads */
          const successUrl = form.dataset.successUrl || '/merci';
          setTimeout(() => { window.location.href = successUrl; }, 400);
        })
        .catch(() => {
          if (window.naviaTrack) window.naviaTrack('order-error');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = form.dataset.submitLabel || 'Envoyer'; }
          alert(form.dataset.errorMsg || 'Une erreur est survenue, merci de réessayer ou de nous écrire directement.');
        });
    });
  }
});
