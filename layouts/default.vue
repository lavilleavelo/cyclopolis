<template>
  <div>
    <NewsBanner v-if="!isNewsBannerClosed" @close="closeNewsBanner" />
    <AppHeader class="sticky top-0" />
    <slot />
    <AppFooter />
  </div>
</template>

<script setup>
const isNewsBannerClosed = ref(false);

onMounted(() => {
  // if the banner was closed more than 7 days ago, show it again
  const newsBannerClosedAt = localStorage.getItem('newsBannerClosedAt');
  if (newsBannerClosedAt) {
    const newsBannerClosedAtDate = new Date(newsBannerClosedAt);
    const now = new Date();
    const diffInMilliseconds = now - newsBannerClosedAtDate;
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
    if (diffInHours > 24 * 7) {
      localStorage.removeItem('isNewsBannerClosed');
      localStorage.removeItem('newsBannerClosedAt');
    }
  }
  isNewsBannerClosed.value = localStorage.getItem('isNewsBannerClosed') === 'true';
});

function closeNewsBanner() {
  isNewsBannerClosed.value = true;
  localStorage.setItem('isNewsBannerClosed', 'true');
  localStorage.setItem('newsBannerClosedAt', new Date().toISOString());
}

onBeforeMount(() => {
  const navbar = document.getElementById('navigation-header');
  const navbarHeight = navbar ? navbar.offsetHeight : 0;
  document.documentElement.style.setProperty('--navbar-height', navbarHeight + 'px');
});
</script>

<style>
html {
  scroll-behavior: smooth;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  scroll-margin-top: calc(var(--navbar-height));
}
</style>
