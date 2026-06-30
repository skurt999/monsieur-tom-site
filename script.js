// ===== TOPBAR + NAV offset =====
const topbar = document.querySelector('.topbar');
const nav = document.getElementById('nav');
function updateNavTop() {
  const h = topbar ? topbar.offsetHeight : 40;
  nav.style.top = h + 'px';
}
updateNavTop();
window.addEventListener('resize', updateNavTop);

// Nav shadow on scroll
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 20 ? '0 4px 24px rgba(0,0,0,.3)' : '';
});

// ===== BURGER MENU =====
const burger = document.getElementById('burger');
const navMobile = document.getElementById('navMobile');
burger.addEventListener('click', () => navMobile.classList.toggle('open'));
navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navMobile.classList.remove('open')));

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
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
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

document.querySelectorAll('.service-card, .point, .temoignage-card, .faq__item, .step-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ===== FORMULAIRE CONTACT =====
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const prenom = form.querySelector('#prenom').value;
    const societe = form.querySelector('#societe').value;
    const email = form.querySelector('#email').value;
    const tel = form.querySelector('#telephone').value;
    const type = form.querySelector('#type').value;
    const message = form.querySelector('#message').value;

    const subject = encodeURIComponent(`Demande de devis — ${societe}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nNom : ${prenom}\nÉtablissement : ${societe}\nEmail : ${email}\nTéléphone : ${tel}\nType : ${type}\n\nMessage :\n${message}\n\nCordialement,\n${prenom}`
    );
    window.location.href = `mailto:stcommerce.pro@gmail.com?subject=${subject}&body=${body}`;

    setTimeout(() => {
      form.innerHTML = `
        <div style="text-align:center;padding:48px 0">
          <div style="font-size:52px;margin-bottom:16px;color:#1B3A2D">✓</div>
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:26px;color:#1B3A2D;margin-bottom:10px">Message envoyé !</h3>
          <p style="font-size:15px;color:#5A5A5A">Nous vous recontacterons dans les 24h.<br/>Vous pouvez aussi nous joindre directement au <strong>06 11 52 14 92</strong>.</p>
        </div>
      `;
    }, 500);
  });
}

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
