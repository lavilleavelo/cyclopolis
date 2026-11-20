import { defineAsyncComponent, defineComponent, h, inject, toValue } from 'vue';
import CounterTestBanner from '~/components/counter/TestBanner.vue';
import { TEST_COUNTER_KEY } from '~/composables/useTestCounter';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component(
    'highcharts',
    defineAsyncComponent(async () => {
      const [{ default: Highcharts }, HighchartsVue] = await Promise.all([
        import('highcharts'),
        import('highcharts-vue'),
      ]);
      Highcharts.setOptions({ palette: { colorScheme: 'light' } });
      const Chart = HighchartsVue.Chart ?? HighchartsVue.default.Chart;

      return defineComponent({
        inheritAttrs: false,
        setup(_, { attrs }) {
          const isTest = inject(TEST_COUNTER_KEY, false);
          return () => {
            if (!toValue(isTest)) {
              return h(Chart, attrs);
            }

            const { class: className, style, ...chartAttrs } = attrs;
            return h('div', { class: className, style }, [h(Chart, chartAttrs), h(CounterTestBanner)]);
          };
        },
      });
    }),
  );
});
