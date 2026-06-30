// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 20 ? '0 4px 24px rgba(0,0,0,.25)' : '';
});

// Mobile burger
const burger = document.getElementById('burger');
const navMobile = document.getElementById('navMobile');
burger.addEventListener('click', () => {
  navMobile.classList.toggle('open');
});
navMobile.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navMobile.classList.remove('open'));
});

// FAQ accordion
function toggleFaq(btn) {
  const item = btn.closest('.faq__item');
  const answer = item.querySelector('.faq__a');
  const isOpen = btn.classList.contains('open');

  document.querySelectorAll('.faq__q.open').forEach(q => {
    q.classList.remove('open');
    q.closest('.faq__item').querySelector('.faq__a').classList.remove('open');
  });

  if (!isOpen) {
    btn.classList.add('open');
    answer.classList.add('open');
  }
}

// Smooth scroll pour les liens internes
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 68;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// Animation à l'apparition (Intersection Observer)
const observerOptions = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.service-card, .point, .temoignage-card, .faq__item, .about__card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// Netlify form success message
const form = document.querySelector('.contact__form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const params = new URLSearchParams(data).toString();
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      form.innerHTML = `
        <div style="text-align:center;padding:40px 0">
          <div style="font-size:48px;margin-bottom:16px">✓</div>
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:24px;color:#1B3A2D;margin-bottom:8px">Message envoyé !</h3>
          <p style="font-size:15px;color:#5A5A5A">Nous vous recontacterons dans les 24h.</p>
        </div>
      `;
    } catch {
      alert('Une erreur est survenue. Appelez-nous directement au 06 11 52 14 92.');
    }
  });
}
