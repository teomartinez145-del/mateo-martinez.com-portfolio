document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     IMAGE FALLBACKS
  ========================================================= */
  const BRAND_COLORS = {
    'adobe illustrator': { bg: '#FF9A00', label: 'Ai' },
    'adobe indesign': { bg: '#FF3366', label: 'Id' },
    'adobe photoshop': { bg: '#31A8FF', label: 'Ps' },
    'adobe premiere pro': { bg: '#9999FF', label: 'Pr' },
    'adobe after effects': { bg: '#9999FF', label: 'Ae' },
    'adobe lightroom': { bg: '#31A8FF', label: 'Lr' },
    'figma': { bg: '#1E1E1E', label: 'Fg' },
    'microsoft powerpoint': { bg: '#D24726', label: 'Pp' },
    'microsoft word': { bg: '#2B579A', label: 'W' }
  };

  function applyIconFallback(img) {
    const key = (img.alt || '').trim().toLowerCase();
    const brand = BRAND_COLORS[key] || { bg: '#0d0d0d', label: (img.alt || '?').slice(0, 2) };

    const badge = document.createElement('div');
    badge.className = 'icon-fallback';
    badge.style.backgroundColor = brand.bg;
    badge.textContent = brand.label;
    badge.setAttribute('role', 'img');
    badge.setAttribute('aria-label', img.alt || 'icon');

    img.replaceWith(badge);
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

  document.querySelectorAll('.skill-icon').forEach((img) => watchImage(img, () => applyIconFallback(img)));

  const profilePhotoImg = document.querySelector('.profile-photo');
  if (profilePhotoImg) watchImage(profilePhotoImg, () => applyImageFallback(profilePhotoImg, 'Photo coming soon'));

  /* =========================================================
     GSAP-powered effects
  ========================================================= */
  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Skill tag pill-hover (circle reveal) ---------- */
  function initSkillTagPillHover() {
    const ease = 'power3.out';

    const tags = Array.from(document.querySelectorAll('.skill-tag')).filter(
      (tag) => !tag.querySelector('.skill-icon')
    );
    if (!tags.length) return;

    const circles = [];
    const timelines = [];
    const activeTweens = [];

    tags.forEach((tag, i) => {
      const text = tag.textContent.trim();
      tag.textContent = '';
      tag.classList.add('skill-tag--pill-init');

      const circle = document.createElement('span');
      circle.className = 'skill-hover-circle';
      circle.setAttribute('aria-hidden', 'true');

      const stack = document.createElement('span');
      stack.className = 'skill-label-stack';

      const label = document.createElement('span');
      label.className = 'skill-label';
      label.textContent = text;

      const hoverLabel = document.createElement('span');
      hoverLabel.className = 'skill-label-hover';
      hoverLabel.setAttribute('aria-hidden', 'true');
      hoverLabel.textContent = text;

      stack.appendChild(label);
      stack.appendChild(hoverLabel);
      tag.appendChild(circle);
      tag.appendChild(stack);

      circles[i] = circle;
      tag._skillLabel = label;
      tag._skillHoverLabel = hoverLabel;
    });

    function layout() {
      tags.forEach((tag, i) => {
        const circle = circles[i];
        if (!circle) return;

        const rect = tag.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const R = (w * w / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });
        gsap.set(tag._skillLabel, { y: 0 });
        gsap.set(tag._skillHoverLabel, { y: h + 12, opacity: 0 });

        timelines[i]?.kill();
        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);
        tl.to(tag._skillLabel, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
        gsap.set(tag._skillHoverLabel, { y: Math.ceil(h + 100), opacity: 0 });
        tl.to(tag._skillHoverLabel, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
        timelines[i] = tl;
      });
    }

    layout();

    tags.forEach((tag, i) => {
      tag.addEventListener('pointerenter', () => {
        const tl = timelines[i];
        if (!tl) return;
        activeTweens[i]?.kill();
        activeTweens[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease, overwrite: 'auto' });
      });
      tag.addEventListener('pointerleave', () => {
        const tl = timelines[i];
        if (!tl) return;
        activeTweens[i]?.kill();
        activeTweens[i] = tl.tweenTo(0, { duration: 0.2, ease, overwrite: 'auto' });
      });
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 150);
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }
  }

  initSkillTagPillHover();

  if (prefersReducedMotion) return;

  /* ---------- About text — line-by-line block reveal ---------- */
  function initAboutTextBlockReveal() {
    const paragraphs = document.querySelectorAll('.about-intro .about-text');
    if (!paragraphs.length) return;

    const config = {
      blockColor: '#5DA9E9',
      stagger: 0.1,
      duration: 0.6,
      delay: 0
    };

    function splitIntoLines(el) {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';

      const wordSpans = words.map((word, i) => {
        const span = document.createElement('span');
        span.textContent = word + (i < words.length - 1 ? ' ' : '');
        span.style.display = 'inline-block';
        el.appendChild(span);
        return span;
      });

      const lineGroups = [];
      let currentTop = null;
      wordSpans.forEach((span) => {
        const top = span.offsetTop;
        if (currentTop === null || Math.abs(top - currentTop) > 2) {
          lineGroups.push([]);
          currentTop = top;
        }
        lineGroups[lineGroups.length - 1].push(span.textContent);
      });

      el.textContent = '';

      const lineEls = lineGroups.map((words) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'tba-line-wrapper';

        const lineText = document.createElement('span');
        lineText.className = 'tba-line-text';
        lineText.textContent = words.join('');

        const block = document.createElement('div');
        block.className = 'tba-block';
        block.style.backgroundColor = config.blockColor;

        wrapper.appendChild(lineText);
        wrapper.appendChild(block);
        el.appendChild(wrapper);

        return { lineText, block };
      });

      return lineEls;
    }

    function build() {
      paragraphs.forEach((p) => {
        const lines = splitIntoLines(p);
        if (!lines.length) return;

        const blocks = lines.map((l) => l.block);
        const texts = lines.map((l) => l.lineText);

        const tl = gsap.timeline({
          defaults: { ease: 'expo.inOut' },
          delay: config.delay,
          scrollTrigger: {
            trigger: p,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        });

        tl.to(blocks, {
          scaleX: 1,
          duration: config.duration,
          stagger: config.stagger,
          transformOrigin: 'left center'
        })
          .set(texts, { opacity: 1, stagger: config.stagger }, `<${config.duration / 2}`)
          .to(blocks, {
            scaleX: 0,
            duration: config.duration,
            stagger: config.stagger,
            transformOrigin: 'right center'
          }, `<${config.duration / 2}`);
      });
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(build).catch(build);
    } else {
      build();
    }
  }

  initAboutTextBlockReveal();

  /* ---------- About photo parallax ---------- */
  const profilePhoto = document.querySelector('.profile-photo, .image-fallback');
  const aboutImage = document.querySelector('.about-image');

  if (profilePhoto && aboutImage && profilePhoto.tagName === 'IMG') {
    const mask = document.createElement('div');
    mask.className = 'photo-mask';
    aboutImage.insertBefore(mask, profilePhoto);
    mask.appendChild(profilePhoto);

    gsap.fromTo(
      profilePhoto,
      { yPercent: -12 },
      {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: aboutImage,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
  }
});