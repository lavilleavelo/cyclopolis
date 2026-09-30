import type { RouterConfig } from '@nuxt/schema';

const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
const SETTLE_TIMEOUT_MS = 10_000;

let stopSettling: (() => void) | null = null;

function scrollWhileSettling(getTop: () => number | null, behavior: ScrollBehavior) {
  stopSettling?.();

  const observer = new ResizeObserver(() => {
    const top = getTop();
    if (top !== null) {
      window.scrollTo({ top, behavior });
    }
  });
  const stop = () => {
    observer.disconnect();
    clearTimeout(timeout);
    for (const event of USER_SCROLL_EVENTS) {
      window.removeEventListener(event, stop);
    }
    stopSettling = null;
  };
  const timeout = setTimeout(stop, SETTLE_TIMEOUT_MS);
  for (const event of USER_SCROLL_EVENTS) {
    window.addEventListener(event, stop, { passive: true });
  }
  observer.observe(document.body);
  stopSettling = stop;
}

function anchorTop(hash: string, offset: number): number | null {
  const element = document.getElementById(hash.slice(1));
  return element ? element.getBoundingClientRect().top + window.scrollY - offset : null;
}

// https://router.vuejs.org/api/interfaces/routeroptions.html
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    const navbarOffset = 120; // size of the fixed navbar

    const counterListPaths = ['/compteurs/velo', '/compteurs/voiture', '/compteurs/comparaison'];
    if (counterListPaths.some((p) => to.path === p || to.path === `${p}/`)) {
      if (to.path !== from.path) {
        return { top: 0, behavior: 'instant' };
      }
      return;
    }

    if (savedPosition) {
      scrollWhileSettling(() => savedPosition.top, 'instant');
      return;
    }

    if (from.matched.length > 0 && to.path === from.path && to.hash === from.hash) {
      return;
    }

    if (to.hash) {
      const samePage = from.matched.length > 0 && to.path === from.path;
      scrollWhileSettling(() => anchorTop(to.hash, navbarOffset), samePage ? 'smooth' : 'instant');
      return;
    }

    if (to.path !== from.path) {
      return { top: 0, behavior: 'instant' };
    }

    if (to.path === from.path) {
      return;
    }

    return { top: 0, behavior: 'smooth' };
  },
};
