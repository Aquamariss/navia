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

  /* ---------- standalone pricing calculator ---------- */
  const calcRoot = document.querySelector('[data-calc]');
  if (calcRoot) {
    const priceMap = { '60': 40, '120': 60 };
    const options = calcRoot.querySelectorAll('input[name="calc-duration"]');
    const priceEl = calcRoot.querySelector('[data-calc-price]');
    const updatePrice = () => {
      const checked = calcRoot.querySelector('input[name="calc-duration"]:checked');
      if (checked && priceEl) priceEl.textContent = priceMap[checked.value] + ' €';
    };
    options.forEach(o => o.addEventListener('change', updatePrice));
    updatePrice();
  }

  /* ---------- multi-step order form ---------- */
  const form = document.querySelector('#order-form');
  if (form) {
    const steps = Array.from(form.querySelectorAll('.step'));
    const progressFill = document.querySelector('.progress-fill');
    const progressLabel = document.querySelector('[data-progress-label]');
    let current = 0;

    const priceMap = { '60': 40, '120': 60 };
    const priceOut = form.querySelector('[data-form-price]');
    form.querySelectorAll('input[name="duree"]').forEach(r => {
      r.addEventListener('change', () => {
        if (priceOut) priceOut.textContent = priceMap[r.value] + ' €';
      });
    });

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
          form.style.display = 'none';
          document.querySelector('.progress-track')?.style.setProperty('display', 'none');
          document.querySelector('.form-success').classList.add('active');
        })
        .catch(() => {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = form.dataset.submitLabel || 'Envoyer'; }
          alert(form.dataset.errorMsg || 'Une erreur est survenue, merci de réessayer ou de nous écrire directement.');
        });
    });
  }
});
