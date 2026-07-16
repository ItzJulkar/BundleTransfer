/**
 * Motion: logo-first opening (LayerZero/Matter/DataFDN-inspired timing),
 * simultaneous letter scramble (whole word, not L→R).
 */

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789#%*+';

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function randGlyph() {
  return GLYPHS[(Math.random() * GLYPHS.length) | 0];
}

/** All letters scramble together, then whole word snaps clean. */
export function scrambleText(el, finalText, { duration = 480, delay = 0, fps = 34 } = {}) {
  if (!el) return Promise.resolve();
  const final = String(finalText ?? el.dataset.original ?? el.textContent ?? '');
  el.dataset.original = final;

  if (prefersReducedMotion() || !final.trim()) {
    el.textContent = final;
    return Promise.resolve();
  }

  if (el._scrambleRaf) cancelAnimationFrame(el._scrambleRaf);

  return new Promise((resolve) => {
    const startAt = performance.now() + delay;
    const frameMs = 1000 / fps;
    let last = 0;

    const scrambleFrame = () => {
      let out = '';
      for (let i = 0; i < final.length; i++) {
        const ch = final[i];
        if (ch === ' ' || ch === '·' || ch === '—') out += ch;
        else out += randGlyph();
      }
      el.textContent = out;
    };

    const tick = (now) => {
      if (now < startAt) {
        el._scrambleRaf = requestAnimationFrame(tick);
        return;
      }
      if (now - last < frameMs) {
        el._scrambleRaf = requestAnimationFrame(tick);
        return;
      }
      last = now;
      const t = Math.min(1, (now - startAt) / duration);
      if (t < 1) {
        scrambleFrame();
        el._scrambleRaf = requestAnimationFrame(tick);
      } else {
        el.textContent = final;
        el._scrambleRaf = 0;
        resolve();
      }
    };
    el._scrambleRaf = requestAnimationFrame(tick);
  });
}

export function enableHoverScramble(root = document.getElementById('app')) {
  if (!root || prefersReducedMotion()) return () => {};

  const SELECTOR = [
    'h1',
    'h2',
    'h3',
    'strong',
    'label',
    '.label',
    '.sec',
    '.hint',
    '.batch-hint',
    '.pill',
    '.brand-copy span',
    '.brand-copy strong',
    'button.btn',
    'button.seg-btn',
    '.notes li',
    '.panel-intro p',
    'th',
    'summary',
    '.wallet-strip .label',
    '.hist-title',
    '.hist-meta',
  ].join(',');

  const onEnter = (e) => {
    const t = e.target.closest(SELECTOR);
    if (!t || !root.contains(t)) return;
    if (t.closest('#intro')) return;
    if (t.matches('input, textarea, select, code, a')) return;
    const original = t.dataset.original || t.textContent;
    if (!original || !original.trim() || original.length > 90) return;
    if (t.dataset.scrambling === '1') return;
    t.dataset.scrambling = '1';
    t.dataset.original = original.trimEnd();
    scrambleText(t, t.dataset.original, { duration: 400 }).finally(() => {
      t.dataset.scrambling = '0';
    });
  };

  root.addEventListener('pointerenter', onEnter, true);
  return () => root.removeEventListener('pointerenter', onEnter, true);
}

/**
 * Logo-first smooth opening (~3.2s):
 * logo hero → rings → simultaneous scramble title/sub → bar → soft outro
 */
export function runOpeningIntro() {
  const intro = document.getElementById('intro');
  if (!intro) return Promise.resolve();

  if (prefersReducedMotion() || sessionStorage.getItem('multisend.intro') === '1') {
    intro.remove();
    document.body.classList.remove('intro-lock');
    document.body.classList.add('intro-reveal');
    return Promise.resolve();
  }

  document.body.classList.add('intro-lock');
  intro.classList.add('phase-in');

  const title = intro.querySelector('[data-scramble-title]');
  const sub = intro.querySelector('[data-scramble-sub]');
  const skip = intro.querySelector('#introSkip');
  const bar = intro.querySelector('.intro-bar > i');
  const mark = intro.querySelector('.intro-logo');
  const stage = intro.querySelector('.intro-stage');

  let finished = false;
  let autoTimer = 0;
  const timers = [];

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(autoTimer);
    timers.forEach(clearTimeout);
    intro.classList.add('outro');
    stage?.classList.add('is-out');
    document.body.classList.remove('intro-lock');
    document.body.classList.add('intro-reveal');
    sessionStorage.setItem('multisend.intro', '1');
    setTimeout(() => intro.remove(), 700);
  };

  skip?.addEventListener('click', finish);
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        finish();
      }
    },
    { once: true }
  );

  // Logo first (hero)
  timers.push(
    setTimeout(() => {
      intro.classList.add('phase-logo');
      mark?.classList.add('is-on');
    }, 30)
  );
  timers.push(setTimeout(() => intro.classList.add('phase-rings'), 280));
  timers.push(
    setTimeout(() => {
      intro.classList.add('phase-text');
      scrambleText(title, 'BundleTransfer', { duration: 680 });
    }, 720)
  );
  timers.push(
    setTimeout(() => {
      scrambleText(sub, 'one signature · many wallets', { duration: 560 });
    }, 900)
  );
  timers.push(
    setTimeout(() => {
      intro.classList.add('phase-bar');
      if (bar) bar.style.transform = 'scaleX(1)';
    }, 1000)
  );

  autoTimer = setTimeout(finish, 3200);
  return new Promise((resolve) => setTimeout(resolve, 3900));
}

export function startAmbientScramble(el, phrases) {
  if (!el || !phrases?.length || prefersReducedMotion()) return () => {};
  let i = 0;
  let alive = true;
  let timer = 0;
  el.dataset.original = phrases[0];

  const cycle = async () => {
    if (!alive) return;
    i = (i + 1) % phrases.length;
    await scrambleText(el, phrases[i], { duration: 420 });
    if (alive) timer = setTimeout(cycle, 5000);
  };
  timer = setTimeout(cycle, 5600);
  return () => {
    alive = false;
    clearTimeout(timer);
  };
}
