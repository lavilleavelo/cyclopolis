import type { RouterConfig } from '@nuxt/schema'

// https://router.vuejs.org/api/interfaces/routeroptions.html
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    const navbarOffset = 120 // size of the fixed navbar

    if (savedPosition) {
      return savedPosition; // When using browser's back/forward buttons
    }

    if (to.hash) {
      return {
        el: to.hash,
        top: navbarOffset,
        behavior: 'smooth'
      }
    }

    return { top: 0, behavior: 'instant' }
  }
}

