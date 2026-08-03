import config from '~/config.json';
import type { LineStringFeature } from '~/types';

export const useUrl = () => {
  function withoutTrailingSlash(path: string): string {
    return path.endsWith('/') ? path.slice(0, -1) : path;
  }

  function getVoieCyclablePath(line: number) {
    return `/${config.slug}-${line}`;
  }

  function getVoieCyclableRegex() {
    const lines = Array.from({ length: config.nbVoiesCyclables }, (_, index) => config.nbVoiesCyclables - index);
    return new RegExp(`${config.slug}-(${lines.join('|')})\\b`);
  }

  function extractLineAndAnchorFromPath(path: string) {
    // Example path: /voie-lyonnaise-11#section-2
    const [pathNoAnchor, anchor] = path.split('#');
    const match = pathNoAnchor?.match(getVoieCyclableRegex());
    if (match) {
      const line = match[1];
      return { line, anchor };
    }
    return { anchor };
  }

  function getSectionDetailsUrl(properties: LineStringFeature['properties']): string {
    if (properties.link) {
      return properties.link;
    }
    return getVoieCyclablePath(properties.line);
  }

  return {
    withoutTrailingSlash,
    getVoieCyclablePath,
    getSectionDetailsUrl,
    getVoieCyclableRegex,
    extractLineAndAnchorFromPath,
  };
};
