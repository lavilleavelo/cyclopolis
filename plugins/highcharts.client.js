import Highcharts from 'highcharts';
import HighchartsVue from 'highcharts-vue';

export default defineNuxtPlugin((nuxtApp) => {
  Highcharts.setOptions({ palette: { colorScheme: 'light' } });
  nuxtApp.vueApp.use(HighchartsVue, { highcharts: Highcharts });
});
