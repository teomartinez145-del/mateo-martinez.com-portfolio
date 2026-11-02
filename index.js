document.addEventListener('DOMContentLoaded', () => {
  /* =========================================================
     -1. PROJECTS — leídas directo del HTML (modo tradicional)
     Las tarjetas .gallery-card ya están escritas a mano en
     index.html; aquí solo se les agrega el comportamiento
     (click, lightbox, flechas, fade-in). No depende de GSAP —
     corre siempre, incluso si el CDN falla.
  ========================================================= */
  let PROJECTS = [];
  let currentLightboxIndex = null;

  function readProjectsFromDOM() {
    const cards = Array.from(document.querySelectorAll('#gallery-grid .gallery-card'));
    return cards.map((card, index) => {
      card.dataset.index = String(index);
      const img = card.querySelector('.gallery-card__image');
      const titleEl = card.querySelector('.gallery-card__title');
      return {
        title: titleEl ? titleEl.textContent.trim() : '',
        image: img ? img.getAttribute('src') : '',
        element: card
      };
    });
  }

  function openLightbox(index) {
    currentLightboxIndex = index;
    const item = PROJECTS[index];
    const lightbox = document.getElementById('gallery-lightbox');
    const image = document.getElementById('gallery-lightbox-image');
    const title = document.getElementById('gallery-lightbox-title');
    if (!lightbox || !image || !title) return;

    image.src = item.image;
    image.alt = item.title;
    title.textContent = item.title;

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const lightbox = document.getElementById('gallery-lightbox');
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentLightboxIndex = null;
  }

  function stepLightbox(delta) {
    if (currentLightboxIndex === null) return;
    const next = (currentLightboxIndex + delta + PROJECTS.length) % PROJECTS.length;
    openLightbox(next);
  }

  // Projects that open their own page instead of the lightbox.
  // Add a new entry here any time a project gets its own dedicated page.
  const PROJECT_PAGES = {
    'Kick Off': 'kickoff.html',
    'Greenwave': 'greenwave.html',
    'Eclipse': 'eclipse/index.html',
    'Yale School of Art': 'Yale school of art/index.html',
    'Musical Festival': 'Oak Harbor Musical Festival/index1.html'
  };

  function initGalleryLightbox() {
    PROJECTS = readProjectsFromDOM();

    PROJECTS.forEach((item, index) => {
      const card = item.element;

      const open = () => {
        const page = PROJECT_PAGES[item.title];
        if (page) {
          window.open(page, '_blank');
        } else {
          openLightbox(index);
        }
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });

    const closeBtn = document.getElementById('gallery-lightbox-close');
    const backdrop = document.getElementById('gallery-lightbox-backdrop');
    const prevBtn = document.getElementById('gallery-lightbox-prev');
    const nextBtn = document.getElementById('gallery-lightbox-next');

    closeBtn?.addEventListener('click', closeLightbox);
    backdrop?.addEventListener('click', closeLightbox);
    prevBtn?.addEventListener('click', () => stepLightbox(-1));
    nextBtn?.addEventListener('click', () => stepLightbox(1));

    document.addEventListener('keydown', (e) => {
      if (currentLightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });

    // Fade-in stagger para las tarjetas de la grilla al hacer scroll
    const cards = document.querySelectorAll('.gallery-card');
    if (!cards.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cards.forEach((c) => c.classList.add('in-view'));
      return;
    }

    cards.forEach((card, i) => {
      card.style.transitionDelay = `${Math.min(i * 0.08, 0.4)}s`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    cards.forEach((card) => observer.observe(card));
  }

  initGalleryLightbox();

  /* =========================================================
     0. HERO — kinetic typography (DISABLED — hero now uses the
     logo video instead; left here in case it's needed again).
  ========================================================= */
  function initHeroKinetic_DISABLED() {
    const h1 = document.getElementById('hero-kinetic-text');
    if (!h1) return;

    const text = 'Mateo Martinez';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Tamaño fijo por pantalla (mobile ≤767 / tablet 768–1023 / desktop 1024+)
    // en vez de escalar fluido con clamp().
    const getHeroFontSize = () => {
      const w = window.innerWidth;
      if (w <= 767) return '2.5rem';    // mobile
      if (w <= 1023) return '3.6rem';   // tablet
      return '7.8rem';                  // desktop (1024px+)
    };

    const applyFontSize = () => h1.style.setProperty('--hero-font-size', getHeroFontSize());
    applyFontSize();

    const inner = document.createElement('span');
    inner.className = 'hero-kinetic__inner';
    inner.setAttribute('aria-hidden', 'true');

    const letters = [];
    text.split(' ').forEach((word) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'hero-kinetic__word';
      Array.from(word).forEach((ch) => {
        const letterSpan = document.createElement('span');
        letterSpan.className = 'hero-letter';
        letterSpan.textContent = ch;
        wordSpan.appendChild(letterSpan);
        letters.push(letterSpan);
      });
      inner.appendChild(wordSpan);
    });
    h1.appendChild(inner);

    window.addEventListener('resize', applyFontSize);

    if (reduceMotion) {
      letters.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    // Per-letter scatter seed + idle-float phase, assigned once.
    const state = letters.map(() => ({
      sx: (Math.random() - 0.5) * 2,
      sy: (Math.random() - 0.5) * 2,
      sr: (Math.random() - 0.5) * 2,
      phase: Math.random() * Math.PI * 2,
      freq: 0.6 + Math.random() * 0.5,
      curX: 0,
      curY: 0,
      curR: 0
    }));

    const pointer = { x: -9999, y: -9999, active: false };
    const onPointerMove = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; };
    const onPointerLeave = () => { pointer.active = false; };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    h1.addEventListener('pointerleave', onPointerLeave);

    // How far the page has scrolled into the hero (0 at top, 1 once it has
    // scrolled a full viewport height) — drives the "letters break apart
    // and hand off to the showcase" effect.
    const heroSection = document.getElementById('home');
    let heroProgress = 0;
    const updateHeroProgress = () => {
      const h = heroSection?.offsetHeight || window.innerHeight;
      heroProgress = Math.min(1, Math.max(0, window.scrollY / h));
    };
    window.addEventListener('scroll', updateHeroProgress, { passive: true });
    updateHeroProgress();

    const MAGNET_RADIUS = 130;
    const MAGNET_STRENGTH = 34;
    const ASSEMBLE_MS = 1100;
    const STAGGER_MS = 28;
    const startTime = performance.now();
    let raf = 0;

    const loop = (now) => {
      const elapsed = now - startTime;

      letters.forEach((el, i) => {
        const s = state[i];
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const t = Math.min(1, Math.max(0, (elapsed - i * STAGGER_MS) / ASSEMBLE_MS));
        const eased = 1 - Math.pow(1 - t, 3);

        const idleX = Math.sin(elapsed * 0.0015 * s.freq + s.phase) * 3;
        const idleY = Math.cos(elapsed * 0.0018 * s.freq + s.phase) * 3;

        let magX = 0;
        let magY = 0;
        let underMagnet = false;
        if (pointer.active) {
          const dx = cx - pointer.x;
          const dy = cy - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAGNET_RADIUS) {
            underMagnet = true;
            const force = 1 - dist / MAGNET_RADIUS;
            const ang = Math.atan2(dy, dx);
            magX = Math.cos(ang) * force * MAGNET_STRENGTH;
            magY = Math.sin(ang) * force * MAGNET_STRENGTH;
          }
        }

        const scatterX = s.sx * 160 * heroProgress;
        const scatterY = s.sy * 90 * heroProgress + 40 * heroProgress;
        const scatterR = s.sr * 50 * heroProgress;

        const entranceX = s.sx * 70 * (1 - eased);
        const entranceY = s.sy * 70 * (1 - eased) - 20 * (1 - eased);
        const entranceR = s.sr * 35 * (1 - eased);
        const entranceScale = 0.5 + 0.5 * eased;

        const targetX = entranceX + idleX * eased + magX + scatterX;
        const targetY = entranceY + idleY * eased + magY + scatterY;
        const targetR = entranceR + scatterR;

        s.curX += (targetX - s.curX) * 0.18;
        s.curY += (targetY - s.curY) * 0.18;
        s.curR += (targetR - s.curR) * 0.18;

        const opacity = Math.max(0, eased - heroProgress * 1.1);

        el.style.transform = `translate3d(${s.curX}px, ${s.curY}px, 0) rotate(${s.curR}deg) scale(${entranceScale})`;
        el.style.opacity = String(opacity);
        el.style.textShadow = underMagnet ? '0 0 18px rgba(93, 169, 233, 0.55)' : 'none';
      });

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!document.hidden && !raf) {
        raf = requestAnimationFrame(loop);
      }
    });
  }

  /* =========================================================
     1. IMAGE FALLBACKS
  ========================================================= */
  function applyLogoFallback(img) {
    const span = document.createElement('span');
    span.className = 'logo-fallback';
    span.textContent = document.title.split('|')[0].trim() || 'Logo';
    img.replaceWith(span);
  }

  function applyImageFallback(img, message) {
    const div = document.createElement('div');
    div.className = 'image-fallback';
    div.textContent = message;
    img.replaceWith(div);
  }

  function watchImage(img, onError) {
    if (img.complete && img.naturalWidth === 0) {
      onError();
      return;
    }
    img.addEventListener('error', onError, { once: true });
  }

  const logoImg = document.querySelector('.logo-img');
  if (logoImg) watchImage(logoImg, () => applyLogoFallback(logoImg));

  document.querySelectorAll('.project-image').forEach((img) => {
    watchImage(img, () => applyImageFallback(img, img.alt || 'Project image coming soon'));
  });

  /* =========================================================
     2. Active nav link
  ========================================================= */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (sections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = `#${entry.target.id}`;
          navLinks.forEach((link) => {
            link.classList.toggle('nav-link--active', link.getAttribute('href') === id);
          });
        });
      },
      { threshold: 0.4 }
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  /* =========================================================
     3. Showcase — horizontal scroll-journey through "what I do"
     Desktop/laptop: the section pins and the panel track slides
     sideways as the page scrolls, carrying the viewer further
     into the portfolio until it releases into Projects. This is
     deliberately NOT the layered-depth parallax style — it's a
     single flat track moving forward, like walking a hallway.
     Tablet/celular: a plain vertical stack with a fade-up reveal.
     Pure vanilla JS/CSS, no external library.
  ========================================================= */
  function initShowcaseJourney() {
    const section = document.getElementById('showcase');
    const sticky = section?.querySelector('.showcase-sticky');
    const track = document.getElementById('showcase-track');
    const panels = track ? Array.from(track.children) : [];
    if (!section || !sticky || !track || !panels.length) return;

    const hudCurrent = document.getElementById('showcase-hud-current');
    const hudFill = document.getElementById('showcase-hud-fill');

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
      },
      { threshold: 0.35 }
    );

    let pinned = false;
    let ticking = false;

    const setActivePanel = (index) => {
      panels.forEach((panel, i) => panel.classList.toggle('is-active', i === index));
      if (hudCurrent) hudCurrent.textContent = String(index + 1).padStart(2, '0');
    };

    const updatePinned = () => {
      ticking = false;
      if (!pinned) return;

      const rect = section.getBoundingClientRect();
      const maxScroll = section.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrolled / maxScroll)) : 0;

      track.style.transform = `translate3d(${-progress * (panels.length - 1) * 100}vw, 0, 0)`;
      if (hudFill) hudFill.style.width = `${progress * 100}%`;
      setActivePanel(Math.round(progress * (panels.length - 1)));
    };

    const onScroll = () => {
      if (!pinned || ticking) return;
      ticking = true;
      requestAnimationFrame(updatePinned);
    };

    const enablePinned = () => {
      panels.forEach((p) => revealObserver.unobserve(p));
      section.style.height = `${panels.length * 100}vh`;
      track.style.transform = 'none';
      pinned = true;
      updatePinned();
    };

    const enableStatic = () => {
      pinned = false;
      section.style.height = '';
      track.style.transform = 'none';
      panels.forEach((p) => {
        p.classList.remove('is-active');
        revealObserver.observe(p);
      });
    };

    const setupMode = () => {
      // Pinned horizontal journey now runs on every screen size (mobile
      // included) — only prefers-reduced-motion falls back to the plain
      // vertical stack.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        enableStatic();
      } else {
        enablePinned();
      }
    };

    setupMode();
    window.addEventListener('scroll', onScroll, { passive: true });

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setupMode, 150);
    });
  }

  initShowcaseJourney();
});