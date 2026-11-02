/* =========================================================
   Page transition — screen fades to a solid black overlay
   while three outline shapes (circle, triangle, square) draw
   themselves in sequence, like a loading mark. Once drawn,
   navigation happens. On arrival the black overlay quickly
   fades away to reveal the new page (no replay of the
   drawing, so navigation still feels snappy).

   Self-contained: injects its own markup + styles so it can
   be dropped into any page with a single <script> tag.
========================================================= */
(function () {
  const MASK_COLOR = '#000000';   // black background during the transition
  const SHAPE_COLOR = '#ffffff';
  const FADE_IN = 260;             // ms — overlay fading to solid black
  const DRAW_DURATION = 520;       // ms — each shape drawing itself
  const STAGGER = 220;             // ms between each shape starting to draw
  const HOLD = 150;                // ms pause once the last shape is drawn
  const SHAPE_COUNT = 3;
  const COVER_DURATION = FADE_IN + STAGGER * (SHAPE_COUNT - 1) + DRAW_DURATION + HOLD;
  const REVEAL_DURATION = 420;     // ms — quick fade-out on the destination page
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // ---- styles ----
  const style = document.createElement('style');
  style.textContent = `
    .page-transition-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      visibility: hidden;
      overflow: hidden;
      background-color: ${MASK_COLOR};
      opacity: 0;
    }
    .page-transition-overlay.is-covering,
    .page-transition-overlay.is-revealing {
      visibility: visible;
    }
    .page-transition-overlay.is-covering {
      transition: opacity ${FADE_IN}ms ease-out;
      opacity: 1;
    }
    .page-transition-overlay.is-revealing {
      opacity: 1;
      transition: opacity ${REVEAL_DURATION}ms ease-out;
    }
    .page-transition-overlay.is-revealing.pt-reveal-start {
      opacity: 0;
    }

    .pt-shapes {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      gap: clamp(1rem, 4vw, 2.5rem);
    }

    .pt-shape {
      width: clamp(36px, 6vw, 56px);
      height: clamp(36px, 6vw, 56px);
      overflow: visible;
    }

    .pt-shape path,
    .pt-shape circle,
    .pt-shape polygon,
    .pt-shape rect {
      fill: none;
      stroke: ${SHAPE_COLOR};
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: stroke-dashoffset ${DRAW_DURATION}ms cubic-bezier(0.65, 0, 0.35, 1);
    }
  `;
  document.head.appendChild(style);

  // ---- markup ----
  const overlay = document.createElement('div');
  overlay.className = 'page-transition-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const shapesWrap = document.createElement('div');
  shapesWrap.className = 'pt-shapes';

  function makeSvg(viewBox) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', viewBox);
    svg.classList.add('pt-shape');
    return svg;
  }

  // circle
  const circleSvg = makeSvg('0 0 80 80');
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('r', '32');
  circle.setAttribute('cy', '40');
  circle.setAttribute('cx', '40');
  circleSvg.appendChild(circle);

  // triangle
  const triangleSvg = makeSvg('0 0 86 80');
  const triangle = document.createElementNS(SVG_NS, 'polygon');
  triangle.setAttribute('points', '43 8 79 72 7 72');
  triangleSvg.appendChild(triangle);

  // square
  const rectSvg = makeSvg('0 0 80 80');
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('height', '64');
  rect.setAttribute('width', '64');
  rect.setAttribute('y', '8');
  rect.setAttribute('x', '8');
  rectSvg.appendChild(rect);

  const shapes = [circle, triangle, rect];
  [circleSvg, triangleSvg, rectSvg].forEach((svg) => shapesWrap.appendChild(svg));

  overlay.appendChild(shapesWrap);
  document.documentElement.appendChild(overlay);

  // Set up each shape's dash length once it has real geometry.
  function primeShapes() {
    shapes.forEach((shape) => {
      const length = Math.ceil(shape.getTotalLength());
      shape.style.strokeDasharray = String(length);
      shape.style.strokeDashoffset = String(length);
    });
  }
  primeShapes();

  function drawShapes() {
    shapes.forEach((shape, i) => {
      window.setTimeout(() => {
        shape.style.strokeDashoffset = '0';
      }, STAGGER * i);
    });
  }

  function resetShapesUndrawn() {
    shapes.forEach((shape) => {
      const length = shape.style.strokeDasharray || String(Math.ceil(shape.getTotalLength()));
      shape.style.transition = 'none';
      shape.style.strokeDashoffset = length;
      void shape.getBoundingClientRect();
      shape.style.transition = '';
    });
  }

  const FLAG = 'pageTransitionIncoming';

  function revealOnLoad() {
    const incoming = sessionStorage.getItem(FLAG);
    if (!incoming) return;
    sessionStorage.removeItem(FLAG);

    // Arrive already covered in black with shapes fully drawn, then fade away.
    shapes.forEach((shape) => { shape.style.strokeDashoffset = '0'; });
    overlay.classList.add('is-revealing');
    void overlay.offsetHeight;
    requestAnimationFrame(() => {
      overlay.classList.add('pt-reveal-start');
    });
    window.setTimeout(() => {
      overlay.classList.remove('is-revealing', 'pt-reveal-start');
      resetShapesUndrawn();
    }, REVEAL_DURATION + 50);
  }

  revealOnLoad();

  function isSameOrigin(url) {
    try {
      return new URL(url, window.location.href).origin === window.location.origin;
    } catch (e) {
      return false;
    }
  }

  function navigateWithTransition(href) {
    if (prefersReducedMotion) {
      window.location.href = href;
      return;
    }
    sessionStorage.setItem(FLAG, '1');
    overlay.classList.add('is-covering');
    drawShapes();
    window.setTimeout(() => {
      window.location.href = href;
    }, COVER_DURATION);
  }

  document.addEventListener('click', (e) => {
    if (prefersReducedMotion) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const link = e.target.closest('a[href]');
    if (!link) return;
    if (link.target && link.target !== '_self') return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (!isSameOrigin(href)) return;

    const dest = new URL(href, window.location.href);
    if (dest.pathname === window.location.pathname && dest.search === window.location.search) return;

    e.preventDefault();
    navigateWithTransition(href);
  });
})();