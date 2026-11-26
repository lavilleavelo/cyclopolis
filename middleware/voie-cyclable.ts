const { getLineFromPath } = useUrl();
export default defineNuxtRouteMiddleware((to) => {
  const isVoieCyclableValid = getLineFromPath(to.path) !== undefined;
  if (!isVoieCyclableValid) {
    return navigateTo('/404');
  }
});
