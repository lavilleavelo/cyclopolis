import type { MapCounters } from '~~/types';

export default defineEventHandler(async (event) => {
  const fields = ['path', 'name', 'coordinates', 'cyclopolisId', 'counts', 'test'] as const;

  const [velo, voiture] = await Promise.all([
    queryCollection(event, 'compteurs')
      .where('path', 'LIKE', '/compteurs/velo%')
      .select(...fields)
      .all(),
    queryCollection(event, 'compteurs')
      .where('path', 'LIKE', '/compteurs/voiture%')
      .select(...fields)
      .all(),
  ]);

  const counters: MapCounters = { velo: velo.filter((counter) => !counter.test), voiture };

  setResponseHeader(event, 'content-type', 'application/json');
  return JSON.stringify(counters);
});
