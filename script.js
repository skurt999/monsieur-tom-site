// ===== TOPBAR + NAV offset =====
const topbar = document.querySelector('.topbar');
const nav = document.getElementById('nav');
function updateNavTop() {
  const h = topbar ? topbar.offsetHeight : 40;
  nav.style.top = h + 'px';
}
updateNavTop();
window.addEventListener('resize', updateNavTop);

window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 20 ? '0 4px 24px rgba(0,0,0,.3)' : '';
});

// ===== BURGER MENU =====
const burger = document.getElementById('burger');
const navMobile = document.getElementById('navMobile');
burger.addEventListener('click', () => {
  navMobile.classList.toggle('open');
  burger.classList.toggle('open');
});
navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navMobile.classList.remove('open');
  burger.classList.remove('open');
}));

// ===== FAQ ACCORDION =====
function toggleFaq(btn) {
  const item = btn.closest('.faq__item');
  const answer = item.querySelector('.faq__a');
  const isOpen = btn.classList.contains('open');
  document.querySelectorAll('.faq__q.open').forEach(q => {
    q.classList.remove('open');
    q.closest('.faq__item').querySelector('.faq__a').classList.remove('open');
  });
  if (!isOpen) { btn.classList.add('open'); answer.classList.add('open'); }
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = nav.offsetHeight + (topbar ? topbar.offsetHeight : 40) + 16;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    }
  });
});

// ===== COMPTEURS ANIMÉS =====
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1500;
  const start = performance.now();
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { animateCounter(entry.target); counterObserver.unobserve(entry.target); }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// ===== ANIMATIONS AU SCROLL =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.service-card, .point, .temoignage-card, .faq__item, .step-card, .visual-card, .contact__form-wrap').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ===== FORMULAIRE → HUBSPOT =====
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Envoi en cours...';
    btn.disabled = true;

    const data = {
      prenom:    form.querySelector('#prenom').value,
      societe:   form.querySelector('#societe').value,
      email:     form.querySelector('#email').value,
      telephone: form.querySelector('#telephone').value,
      type:      form.querySelector('#type').value,
      message:   form.querySelector('#message').value,
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        form.innerHTML = `
          <div style="text-align:center;padding:48px 0">
            <div style="font-size:52px;margin-bottom:16px;color:#1B3A2D">✓</div>
            <h3 style="font-family:'Cormorant Garamond',serif;font-size:26px;color:#1B3A2D;margin-bottom:10px">Message envoyé !</h3>
            <p style="font-size:15px;color:#5A5A5A;line-height:1.6">Nous vous recontacterons dans les 24h.<br/>Ou appelez-nous directement au <strong>06 11 52 14 92</strong>.</p>
          </div>
        `;
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback mailto si l'API ne répond pas
      const subject = encodeURIComponent(`Demande de devis — ${data.societe}`);
      const body = encodeURIComponent(`Bonjour,\n\nNom : ${data.prenom}\nÉtablissement : ${data.societe}\nEmail : ${data.email}\nTéléphone : ${data.telephone}\nType : ${data.type}\n\nMessage :\n${data.message}`);
      window.location.href = `mailto:stcommerce45@gmail.com?subject=${subject}&body=${body}`;
      btn.textContent = 'Envoyer ma demande';
      btn.disabled = false;
    }
  });
}

// ===== EXIT INTENT =====
const exitOverlay = document.getElementById('exitOverlay');
let exitShown = false;

function showExit() {
  if (exitShown || sessionStorage.getItem('exitSeen')) return;
  exitShown = true;
  sessionStorage.setItem('exitSeen', '1');
  exitOverlay.classList.add('show');
}

function closeExit() {
  exitOverlay.classList.remove('show');
}

// Desktop — souris qui quitte la fenêtre par le haut
document.addEventListener('mouseleave', (e) => {
  if (e.clientY < 10) showExit();
});

// Mobile — scroll rapide vers le haut (intention de quitter)
let lastScrollY = 0;
let scrollUpCount = 0;
window.addEventListener('scroll', () => {
  const currentY = window.scrollY;
  if (currentY < lastScrollY - 50 && currentY > 300) {
    scrollUpCount++;
    if (scrollUpCount >= 3) showExit();
  } else {
    scrollUpCount = 0;
  }
  lastScrollY = currentY;
}, { passive: true });

// Fermer en cliquant sur l'overlay
exitOverlay.addEventListener('click', (e) => {
  if (e.target === exitOverlay) closeExit();
});

// ===== RGPD =====
function acceptRgpd() {
  localStorage.setItem('rgpd', 'accepted');
  document.getElementById('rgpd').classList.add('hidden');
}
function refuseRgpd() {
  localStorage.setItem('rgpd', 'refused');
  document.getElementById('rgpd').classList.add('hidden');
}
if (localStorage.getItem('rgpd')) {
  document.getElementById('rgpd').classList.add('hidden');
}
