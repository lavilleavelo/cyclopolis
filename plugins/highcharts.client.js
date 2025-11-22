import HighchartsVue from 'highcharts-vue';

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(HighchartsVue);
});
