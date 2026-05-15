/* ============================================================
ConfigurAI - script.js
Shared JavaScript for all pages
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initCookieBanner();
  initFadeUp();
  initCounters();
  initPanelSliders();
  initFaqAccordion();
  initPageTransitions();
  initHeroParallax();
  initHeroInlineCounters();
});

/* ============================================================
NAVIGATION
============================================================ */
function initNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileClose = document.getElementById('mobile-close');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

  function openMenu() {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', openMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMenu);

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on backdrop click
  if (mobileMenu) {
    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) closeMenu();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });
}

/* ============================================================
COOKIE CONSENT
============================================================ */
function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;

  const accepted = localStorage.getItem('configurai_cookies');
  if (accepted) {
    banner.classList.add('hidden');
    return;
  }

  const acceptBtn = document.getElementById('cookie-accept');
  const declineBtn = document.getElementById('cookie-decline');

  function dismiss(choice) {
    localStorage.setItem('configurai_cookies', choice);
    banner.classList.add('hidden');
  }

  if (acceptBtn) acceptBtn.addEventListener('click', () => dismiss('accepted'));
  if (declineBtn) declineBtn.addEventListener('click', () => dismiss('declined'));
}

/* ============================================================
SCROLL FADE-UP (Intersection Observer)
============================================================ */
function initFadeUp() {
  const elements = document.querySelectorAll('.fade-up');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ============================================================
ANIMATED COUNTERS
============================================================ */
function initCounters() {
  const counters = document.querySelectorAll('.stats__number[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 2500;
  const start = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const current = Math.floor(target * eased);
    el.textContent = prefix + current + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = prefix + target + suffix;
    }
  }

  requestAnimationFrame(update);
}

/* ============================================================
SLIDING PANELS
============================================================ */
function initPanelSliders() {
  document.querySelectorAll('.panel-stack').forEach(stack => {
    const stackId = stack.dataset.stackId;
    const slides = Array.from(stack.querySelectorAll(':scope > .panel-slide'));
    const tabsContainer = document.querySelector('[data-stack="' + stackId + '"]');
    const tabs = tabsContainer ? Array.from(tabsContainer.querySelectorAll('.panel-tab')) : [];
    const swapCta = stack.querySelector('[data-stack-cta="' + stackId + '"]');
    if (slides.length < 2) return;

    // Pull the destination labels for the swap CTA from the panel toggle tabs.
    // Strip the "For " prefix so it reads naturally with an arrow.
    const labels = slides.map((s, i) => {
      const tab = tabs[i];
      if (!tab) return '';
      return tab.textContent.replace(/^\s*For\s+/i, '').trim();
    });

    function activate(index) {
      slides.forEach((slide, i) => {
        const isActive = i === index;
        slide.classList.toggle('is-active', isActive);
        slide.classList.toggle('is-back', !isActive);
        slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
      tabs.forEach((tab, i) => {
        const isActive = i === index;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      if (swapCta) {
        const otherIndex = (index + 1) % slides.length;
        const otherLabel = labels[otherIndex] || '';
        // Slide 1 back means CTA points right; slide 0 back means CTA points left.
        const ctaPointsLeft = otherIndex === 0;
        swapCta.classList.toggle('panel-stack__swap-cta--right', !ctaPointsLeft);
        swapCta.classList.toggle('panel-stack__swap-cta--left', ctaPointsLeft);
        swapCta.innerHTML = ctaPointsLeft
          ? '← For ' + otherLabel
          : 'For ' + otherLabel + ' →';
        swapCta.dataset.targetIndex = String(otherIndex);
      }
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        activate(i);
      });
    });

    // Click anywhere on the back panel to bring it forward.
    slides.forEach((slide, i) => {
      slide.addEventListener('click', () => {
        if (slide.classList.contains('is-back')) {
          activate(i);
        }
      });
    });

    // Click the swap CTA to flip to the other panel.
    if (swapCta) {
      swapCta.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = parseInt(swapCta.dataset.targetIndex || '1', 10);
        activate(target);
      });
    }

    // Initial state: first slide active, others back.
    let initial = 0;
    slides.forEach((s, i) => { if (s.classList.contains('is-active')) initial = i; });
    activate(initial);
  });
}

/* ============================================================
FAQ ACCORDION
============================================================ */
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      items.forEach(i => i.classList.remove('open'));

      // Open clicked (if wasn't open)
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}

/* ============================================================
PAGE TRANSITIONS
============================================================ */
function initPageTransitions() {
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // Only intercept same-site page links (not anchors, mailto, external, or JS)
    if (
    !href ||
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('http') ||
    href.startsWith('//') ||
    link.target === '_blank'
  ) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.style.transition = 'opacity 0.3s ease';
      document.body.style.opacity = '0';
      setTimeout(() => {
        window.location.href = href;
      }, 300);
    });
  });
}

/* ============================================================
NEWSLETTER FORM (prevent default, show confirmation)
============================================================ */
document.querySelectorAll('form[data-newsletter]').forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;

    btn.textContent = 'Thank you';
    btn.disabled = true;
    if (input) input.value = '';

    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 3000);
  });
});

/* ============================================================
HERO PHOTO CURSOR PARALLAX
Desktop only. Lerp-damped translate up to 8px in any direction.
============================================================ */
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  const wrap = document.querySelector('.hero__image');
  if (!hero || !wrap) return;

  // Skip on touch / coarse-pointer devices and when the user prefers reduced motion
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (coarse || reduce) return;

  const MAX = 8;        // max translate in px
  const DAMP = 0.08;    // lerp factor; lower = smoother / heavier
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let raf = null;
  let active = false;

  function loop() {
    currentX += (targetX - currentX) * DAMP;
    currentY += (targetY - currentY) * DAMP;
    wrap.style.transform = 'translate(' + currentX.toFixed(2) + 'px, ' + currentY.toFixed(2) + 'px)';

    // Stop the rAF loop once we've settled within sub-pixel range
    const settled = Math.abs(targetX - currentX) < 0.05 && Math.abs(targetY - currentY) < 0.05;
    if (settled && targetX === 0 && targetY === 0) {
      raf = null;
      active = false;
      wrap.style.transform = '';
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (active) return;
    active = true;
    raf = requestAnimationFrame(loop);
  }

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    targetX = Math.max(-1, Math.min(1, dx)) * MAX;
    targetY = Math.max(-1, Math.min(1, dy)) * MAX;
    start();
  });

  hero.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
    start();
  });
}

/* ============================================================
HERO INLINE NUMBER COUNTERS
Counts up the data-target values inside .hero__supporting once
the line scrolls into view. 1.5s ease-out cubic.
============================================================ */
function initHeroInlineCounters() {
  const supporting = document.querySelector('.hero__supporting');
  if (!supporting) return;
  const nums = supporting.querySelectorAll('.hero__num');
  if (!nums.length) return;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animate(el) {
    const target = parseInt(el.dataset.target, 10) || 0;
    const duration = 1500;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.floor(target * easeOutCubic(progress));
      el.textContent = value;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(tick);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        nums.forEach(animate);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  obs.observe(supporting);
}

