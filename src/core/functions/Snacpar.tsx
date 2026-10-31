/**
 * A snackbar at the side of the page: a card sliding in from the left edge (top of the screen; full width on phones),
 * its colour on its icon. Several stack under each other (the newest on top, three at most); the
 * same message shown again while it is still up does not repeat. Each closes by its ✕ or after a few seconds.
 */
const STACK_ID = 'app-snackbars';
const STYLE_ID = 'app-snackbars-style';
const MAX_SHOWN = 3;
const SHOW_MS = 5000;

const CSS = `
#${STACK_ID} {
  position: fixed; top: 20px; left: 20px; z-index: 10000;
  width: 360px; max-width: calc(100vw - 32px);
  display: flex; flex-direction: column; gap: 10px;
  pointer-events: none; direction: rtl; font-family: Cairo, var(--sans), sans-serif;
}
.app-snack {
  --snack: #ef4444;
  pointer-events: auto;
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 14px 14px 12px;
  border-radius: 14px;
  border: 1px solid var(--border, #e5e7eb);
  background: var(--card-bg, #fff);
  color: var(--text-h, #111827);
  box-shadow: 0 18px 40px -16px rgba(15, 23, 42, 0.35), 0 2px 8px rgba(15, 23, 42, 0.06);
  animation: app-snack-in 0.25s ease-out;
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.app-snack.out { opacity: 0; transform: translateX(-24px); }
@keyframes app-snack-in { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: none; } }
.app-snack-icon {
  flex: none; width: 34px; height: 34px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--snack) 14%, transparent); color: var(--snack);
}
.app-snack-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.app-snack-text b { font-size: 0.92rem; font-weight: 800; }
.app-snack-text span { font-size: 0.84rem; line-height: 1.6; color: var(--text-muted, #64748b); overflow-wrap: anywhere; max-height: 8.2em; overflow: hidden; unicode-bidi: plaintext; text-align: start; }
.app-snack-close {
  flex: none; width: 26px; height: 26px; border: none; border-radius: 8px; background: transparent;
  color: var(--text-muted, #94a3b8); font-size: 18px; line-height: 1; cursor: pointer;
}
.app-snack-close:hover { background: color-mix(in srgb, var(--snack) 12%, transparent); color: var(--snack); }
@media (max-width: 640px) {
  #${STACK_ID} { top: 12px; left: 12px; right: 12px; width: auto; max-width: none; }
}
`;

// An exclamation in a circle (errors), or a bell (anything else)
const ICON_ERROR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
const ICON_INFO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';

const RED = ['red', '#ef4444', '#dc2626', '#f44336'];

const stack = () => {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  let el = document.getElementById(STACK_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = STACK_ID;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  return el;
};

const close = (snack: HTMLElement) => {
  if (snack.classList.contains('out')) return;
  snack.classList.add('out');
  setTimeout(() => snack.remove(), 250);
};

export function showSnackbar(titleKey: string, messageKey: string, color: string = '#333') {
  const list = stack();
  const key = `${titleKey}|${messageKey}`;
  // Already up: it stays once, its time starting over
  const same = Array.from(list.children).find(c => (c as HTMLElement).dataset.key === key) as HTMLElement | undefined;
  if (same && !same.classList.contains('out')) {
    window.clearTimeout(Number(same.dataset.timer));
    same.dataset.timer = String(window.setTimeout(() => close(same), SHOW_MS));
    return;
  }

  const snack = document.createElement('div');
  snack.className = 'app-snack';
  snack.dataset.key = key;
  snack.style.setProperty('--snack', color === 'red' ? '#ef4444' : color === '#333' ? '#64748b' : color);

  const icon = document.createElement('span');
  icon.className = 'app-snack-icon';
  icon.innerHTML = RED.includes(color.toLowerCase()) ? ICON_ERROR : ICON_INFO;

  const text = document.createElement('div');
  text.className = 'app-snack-text';
  const title = document.createElement('b');
  title.textContent = titleKey;
  const message = document.createElement('span');
  message.textContent = messageKey;
  text.append(title, message);

  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'app-snack-close';
  x.setAttribute('aria-label', 'إغلاق');
  x.textContent = '×';
  x.onclick = () => close(snack);

  snack.append(icon, text, x);
  list.prepend(snack);
  snack.dataset.timer = String(window.setTimeout(() => close(snack), SHOW_MS));

  // Three at most: the oldest goes
  const live = Array.from(list.children).filter(c => !c.classList.contains('out')) as HTMLElement[];
  live.slice(MAX_SHOWN).forEach(close);
}
