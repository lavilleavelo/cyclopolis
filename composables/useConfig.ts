import config from '~/config.json';
import {
  getLineCategory,
  getMainLineNumbers,
  getOtherNetwork,
  getSecondaryLine,
  getSecondaryLineNumbers,
  type LineCategory,
} from '~/helpers/lines';

export const useConfig = () => {
  function getRevName(gram: 'plural' | 'singular' = 'plural'): string {
    return config.revName[gram];
  }

  function getAssoName(): string {
    return config.assoName;
  }

  function getAssoLink(): string {
    return config.assoLink;
  }

  /** nombre de voies cyclables du réseau structurant (hors voies secondaires) */
  function getNbVoiesCyclables(): number {
    return config.nbVoiesCyclables;
  }

  function getSecondaryRevName(gram: 'plural' | 'singular' = 'plural'): string {
    return config.secondaryLines.name[gram];
  }

  function isSecondaryLine(line: number): boolean {
    return getLineCategory(line) === 'secondary';
  }

  function isOtherNetworkLine(line: number): boolean {
    return getLineCategory(line) === 'other';
  }

  function getOtherNetworks() {
    return config.otherNetworks;
  }

  /** tous les numéros des lignes disposant d'une page : les voies cyclables puis les voies secondaires */
  function getAllLineNumbers(): number[] {
    return [...getMainLineNumbers(), ...getSecondaryLineNumbers()];
  }

  function getLineGroups(): { category: LineCategory; title: string; lines: number[] }[] {
    return [
      { category: 'main' as const, title: getRevName(), lines: getMainLineNumbers() },
      { category: 'secondary' as const, title: getSecondaryRevName(), lines: getSecondaryLineNumbers() },
    ].filter((group) => group.lines.length > 0);
  }

  /** libellé court affiché dans les pastilles rondes : le numéro de la voie cyclable, ou la lettre de la voie secondaire */
  function getLineLabel(line: number): string {
    const secondaryLine = getSecondaryLine(line);
    if (secondaryLine) {
      return secondaryLine.letter;
    }
    if (getOtherNetwork(line)) {
      return '';
    }
    return String(line);
  }

  /** nom complet d'une ligne : « Voie Lyonnaise 3 », « Voie secondaire A » ou « Desserte locale » */
  function getLineName(line: number): string {
    const otherNetwork = getOtherNetwork(line);
    if (otherNetwork) {
      return otherNetwork.name;
    }
    if (isSecondaryLine(line)) {
      return `${getSecondaryRevName('singular')} ${getLineLabel(line)}`;
    }
    return `${getRevName('singular')} ${line}`;
  }

  /** nom d'un groupe de lignes (tooltip) : « Voie Lyonnaise », « Voies secondaires », « Desserte locale », ... */
  function getLinesName(lines: number[]): string {
    const gram = lines.length > 1 ? 'plural' : 'singular';
    const categories = new Set(lines.map(getLineCategory));
    if (categories.size > 1) {
      return 'Voies cyclables';
    }
    if (categories.has('secondary')) {
      return getSecondaryRevName(gram);
    }
    if (categories.has('other')) {
      return [...new Set(lines.map(getLineName))].join(' / ');
    }
    return getRevName(gram);
  }

  /** nom abrégé d'une ligne : « VL 3 », « Voie secondaire A » ou « Desserte locale » */
  function getLineShortName(line: number, separator = ' '): string {
    if (getLineCategory(line) !== 'main') {
      return getLineName(line);
    }
    return `${config.revName.abbreviated}${separator}${line}`;
  }

  function getLinesListLabel(lines: number[]): string {
    const sorted = [...lines].sort((a, b) => a - b);
    const secondary = sorted.filter(isSecondaryLine);
    const parts = [
      ...sorted.filter((line) => getLineCategory(line) === 'main').map((line) => getLineShortName(line, '')),
      ...(secondary.length > 0
        ? [
            `${getSecondaryRevName(secondary.length > 1 ? 'plural' : 'singular')} ${secondary.map(getLineLabel).join(', ')}`,
          ]
        : []),
      ...sorted.filter(isOtherNetworkLine).map(getLineName),
    ];
    return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts.at(-1)}` : (parts[0] ?? '');
  }

  function displayQuality(): boolean {
    return config.qualityDisplay;
  }

  function displayQualityOnHomePage(): boolean {
    return config.qualityDisplayOnHomePage;
  }

  function displayCounters(): boolean {
    return config.countersDisplay ?? false;
  }

  return {
    getRevName,
    getSecondaryRevName,
    getAssoName,
    getAssoLink,
    getNbVoiesCyclables,
    getLineCategory,
    isSecondaryLine,
    isOtherNetworkLine,
    getOtherNetworks,
    getAllLineNumbers,
    getLineGroups,
    getLineLabel,
    getLineName,
    getLinesName,
    getLineShortName,
    getLinesListLabel,
    displayQuality,
    displayQualityOnHomePage,
    displayCounters,
  };
};
