import config from '~/config.json';
import { getSecondaryLine, getSecondaryLineByLetter } from '~/helpers/lines';
import type { LineStringFeature } from '~/types';

export const useUrl = () => {
  function withoutTrailingSlash(path: string): string {
    return path.endsWith('/') ? path.slice(0, -1) : path;
  }

  function getVoieCyclablePath(line: number) {
    const secondaryLine = getSecondaryLine(line);
    if (secondaryLine) {
      return `/${config.secondaryLines.slug}-${secondaryLine.letter.toLowerCase()}`;
    }
    return `/${config.slug}-${line}`;
  }

  function getLineFromPath(path: string): number | undefined {
    const mainMatch = path.match(new RegExp(`${config.slug}-(\\d+)\\b`));
    if (mainMatch) {
      const line = Number(mainMatch[1]);
      return line >= 1 && line <= config.nbVoiesCyclables ? line : undefined;
    }

    const secondaryMatch = path.match(new RegExp(`${config.secondaryLines.slug}-([a-z]+)\\b`, 'i'));
    if (secondaryMatch) {
      return getSecondaryLineByLetter(secondaryMatch[1]!)?.line;
    }

    return undefined;
  }

  function extractLineAndAnchorFromPath(path: string) {
    // Example path: /voie-lyonnaise-11#section-2
    const [pathNoAnchor, anchor] = path.split('#');
    const line = getLineFromPath(pathNoAnchor ?? '');
    if (line !== undefined) {
      return { line: String(line), anchor };
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
    getLineFromPath,
    extractLineAndAnchorFromPath,
  };
};
