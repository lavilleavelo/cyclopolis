import { defineAsyncComponent } from 'vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component(
    'highcharts',
    defineAsyncComponent(async () => {
      const [{ default: Highcharts }, HighchartsVue] = await Promise.all([
        import('highcharts'),
        import('highcharts-vue'),
      ]);
      Highcharts.setOptions({ palette: { colorScheme: 'light' } });
      return HighchartsVue.Chart ?? HighchartsVue.default.Chart;
    }),
  );
});
