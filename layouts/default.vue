<template>
  <div>
    <NewsBanner />
    <AppHeader class="sticky top-0" />
    <slot />
    <AppFooter />
  </div>
</template>

<script setup>
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
