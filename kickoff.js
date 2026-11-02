document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- image fallback for files you haven't uploaded yet ---------- */
  document.querySelectorAll('img').forEach((img) => {
    const onError = () => {
      const div = document.createElement('div');
      div.className = 'kickoff-imgfallback';
      div.textContent = img.alt || 'Image coming soon';
      div.style.aspectRatio = getComputedStyle(img).aspectRatio || 'auto';
      img.replaceWith(div);
    };
    if (img.complete && img.naturalWidth === 0) onError();
    else img.addEventListener('error', onError, { once: true });
  });

  /* ---------- scroll reveal ---------- */
  const revealTargets = document.querySelectorAll('[data-reveal]');
  if (prefersReducedMotion) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.getAttribute('data-delay') || 0;
          entry.target.style.setProperty('--reveal-delay', delay);
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    revealTargets.forEach((el) => io.observe(el));

    // in case something is already in view on load (e.g. the hero)
    revealTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add('is-visible');
    });
  }

  /* ---------- swatches: click-to-copy ---------- */
  document.querySelectorAll('.kickoff-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      const hex = swatch.getAttribute('data-hex');
      if (!hex) return;
      const copyLabel = swatch.querySelector('.kickoff-swatch__copy');
      const restore = copyLabel ? copyLabel.textContent : '';
      const done = () => {
        swatch.classList.add('is-copied');
        if (copyLabel) copyLabel.textContent = 'Copied ✓';
        setTimeout(() => {
          swatch.classList.remove('is-copied');
          if (copyLabel) copyLabel.textContent = restore;
        }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(hex).then(done).catch(done);
      } else {
        done();
      }
    });
  });

  /* ---------- brand story: word-by-word reveal on scroll ---------- */
  const storyText = document.getElementById('kickoff-story-text');
  if (storyText) {
    const words = storyText.textContent.trim().split(/\s+/);
    storyText.innerHTML = words.map((w) => `<span class="kw">${w}</span>`).join(' ');
    const wordEls = storyText.querySelectorAll('.kw');

    if (prefersReducedMotion) {
      wordEls.forEach((w) => w.classList.add('is-lit'));
    } else {
      const storyIo = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            wordEls.forEach((w, i) => setTimeout(() => w.classList.add('is-lit'), i * 35));
            storyIo.disconnect();
          }
        });
      }, { threshold: 0.4 });
      storyIo.observe(storyText);
    }
  }

  /* ---------- logo cycle: auto-loops through the real flavor-color logo files, like a gif ---------- */
  const logoCycle = document.querySelector('.kickoff-logo-cycle');
  if (logoCycle) {
    const frames = Array.from(logoCycle.querySelectorAll('.kickoff-logo-frame'));
    let frameIndex = 0;

    const showFrame = (i) => {
      frames.forEach((f, idx) => f.classList.toggle('is-active', idx === i));
    };

    if (prefersReducedMotion) {
      showFrame(0);
    } else {
      setInterval(() => {
        frameIndex = (frameIndex + 1) % frames.length;
        showFrame(frameIndex);
      }, 900);
    }
  }

  /* ---------- logo story: one line at a time, fades out then the next fades in, looping ---------- */
  const logoStory = document.getElementById('kickoff-logo-story');
  if (logoStory) {
    const lines = Array.from(logoStory.querySelectorAll('.kickoff-logo-story__line'));
    if (prefersReducedMotion) {
      lines.forEach((l) => l.classList.add('is-active'));
    } else {
      let lineIndex = 0;
      lines.forEach((l, i) => l.classList.toggle('is-active', i === 0));
      setInterval(() => {
        lines[lineIndex].classList.remove('is-active');
        lineIndex = (lineIndex + 1) % lines.length;
        lines[lineIndex].classList.add('is-active');
      }, 3200);
    }
  }
});