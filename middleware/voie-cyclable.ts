const { getVoieCyclableRegex } = useUrl();
export default defineNuxtRouteMiddleware((to) => {
  const voieCyclableRegex = getVoieCyclableRegex();
  const isVoieCyclableValid = voieCyclableRegex.test(to.fullPath);
  if (!isVoieCyclableValid) {
    return navigateTo('/404');
  }
});
