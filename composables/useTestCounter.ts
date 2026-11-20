import type { InjectionKey, MaybeRefOrGetter } from 'vue';

export const TEST_COUNTER_KEY: InjectionKey<MaybeRefOrGetter<boolean>> = Symbol('test-counter');

export function provideTestCounter(isTest: MaybeRefOrGetter<boolean>) {
  provide(TEST_COUNTER_KEY, isTest);
}
