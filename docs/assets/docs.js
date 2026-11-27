// UTAC QA Calendar documentation: print, copy buttons, and chapter tracking.
(() => {
  document.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));

  document.querySelectorAll('.code .copy').forEach((btn) => {
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      const code = btn.parentElement.querySelector('code');
      try {
        await navigator.clipboard.writeText(code.innerText);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(code);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
      }
      btn.textContent = btn.dataset.copied;
      btn.classList.add('done');
      setTimeout(() => { btn.textContent = label; btn.classList.remove('done'); }, 1600);
    });
  });

  // Wide tables and diagrams scroll sideways on small screens: fade the cut edge and say so.
  const hintText = document.documentElement.lang === 'th' ? 'เลื่อนไปทางขวาเพื่อดูเพิ่ม →' : 'Scroll sideways for more →';
  document.querySelectorAll('.table, figure.diagram .shot').forEach((box) => {
    const hint = document.createElement('p');
    hint.className = 'scroll-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = hintText;
    (box.classList.contains('shot') ? box.parentElement : box.parentElement).insertBefore(hint, box.nextSibling);
    const update = () => {
      const overflow = box.scrollWidth - box.clientWidth > 2;
      box.classList.toggle('scrolls', overflow);
      box.classList.toggle('at-end', overflow && box.scrollLeft + box.clientWidth >= box.scrollWidth - 2);
    };
    box.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    if (document.fonts) document.fonts.ready.then(update);
    update();
  });

  // Close the contents menu after choosing a chapter.
  document.querySelectorAll('.toc-menu a').forEach((a) => a.addEventListener('click', () => a.closest('details').removeAttribute('open')));

  // Track the chapter in view: mark it in the rail and keep it when switching language.
  const sheets = [...document.querySelectorAll('.sheet[data-ch]')];
  const rail = [...document.querySelectorAll('.rail a[data-ch]')];
  const keep = [...document.querySelectorAll('[data-keep-chapter]')];
  let current = -1;
  const set = (n) => {
    if (n === current) return;
    current = n;
    rail.forEach((a) => (Number(a.dataset.ch) === n ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    keep.forEach((a) => {
      const base = a.getAttribute('href').split('#')[0];
      a.setAttribute('href', n > 0 ? `${base}#ch-${n}` : base);
    });
  };
  if (sheets.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) set(Number(e.target.dataset.ch)); });
    }, { rootMargin: '-30% 0px -69% 0px' });
    sheets.forEach((s) => io.observe(s));
  }
})();
