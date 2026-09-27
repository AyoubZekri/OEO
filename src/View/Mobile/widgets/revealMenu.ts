// Ref callback for dropdown menus: once the menu mounts, scroll just enough to show all of it
export const revealMenu = (menu: HTMLElement | null) => {
  menu?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
};

/**
 * Position (inside the button's positioned card) for a menu of `width` px that opens just under
 * the button, its edge lined up with the button, and moved sideways only as far as needed to stay on screen.
 */
export const menuPositionUnder = (button: HTMLElement, width: number, gap = 6): { top: number; left: number } => {
  const card = (button.offsetParent as HTMLElement | null) ?? document.body;
  const cardLeft = card.getBoundingClientRect().left;
  const margin = 8;
  const top = button.offsetTop + button.offsetHeight + gap;
  // RTL: the ⋮ button sits on the left, so the menu starts at its left edge and grows to the right
  let left = button.offsetLeft;
  const maxLeft = window.innerWidth - margin - width - cardLeft;
  const minLeft = margin - cardLeft;
  left = Math.max(minLeft, Math.min(left, maxLeft));
  return { top, left };
};
