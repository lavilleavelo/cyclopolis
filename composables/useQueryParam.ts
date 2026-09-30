import type { Ref } from 'vue';
import type { LocationQuery, Router } from 'vue-router';

export type QueryParamCodec<T> = {
  parse: (value: string) => T | undefined;
  serialize: (value: T) => string;
};

type UrlState = { query: LocationQuery; hash: string };

let pendingUpdate: Promise<unknown> = Promise.resolve();

function queueUrlUpdate(router: Router, update: (current: UrlState) => UrlState | undefined) {
  pendingUpdate = pendingUpdate
    .then(() => {
      const next = update({ query: router.currentRoute.value.query, hash: window.location.hash });
      return next ? router.replace(next) : undefined;
    })
    .catch(() => undefined);
}

export function useUrlHash() {
  const router = useRouter();
  return (hash: string) => queueUrlUpdate(router, ({ query }) => ({ query, hash }));
}

export function useQueryParam<T>(key: string, state: Ref<T>, codec: QueryParamCodec<T>) {
  const route = useRoute();
  const router = useRouter();
  const defaultValue = codec.serialize(state.value);

  onMounted(() => {
    const raw = route.query[key];
    const parsed = typeof raw === 'string' ? codec.parse(raw) : undefined;
    if (parsed !== undefined) {
      state.value = parsed;
    }

    watch(
      state,
      (value) => {
        const serialized = codec.serialize(value);
        const next = serialized === defaultValue ? undefined : serialized;
        queueUrlUpdate(router, ({ query, hash }) =>
          (query[key] ?? undefined) === next ? undefined : { query: { ...query, [key]: next }, hash },
        );
      },
      { deep: true },
    );
  });
}

export function valuesQueryParam<T>(values: Record<string, T>): QueryParamCodec<T> {
  return {
    parse: (value) => (Object.hasOwn(values, value) ? values[value] : undefined),
    serialize: (value) => Object.keys(values).find((key) => values[key] === value) ?? '',
  };
}

export function integerQueryParam(min: number, max: number, offset = 0): QueryParamCodec<number> {
  return {
    parse: (value) => {
      const number = Number(value) - offset;
      return Number.isInteger(number) && number >= min && number <= max ? number : undefined;
    },
    serialize: (value) => String(value + offset),
  };
}

export function dayQueryParam(): QueryParamCodec<string | null> {
  return {
    parse: (value) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined),
    serialize: (value) => value ?? '',
  };
}
