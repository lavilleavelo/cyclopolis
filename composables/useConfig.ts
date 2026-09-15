import config from '~/config.json';

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

  /** nombre de voies cyclables du réseau structurant (hors réseau complémentaire) */
  function getNbVoiesCyclables(): number {
    return config.nbVoiesCyclables;
  }

  /**
   * le réseau complémentaire (reste du réseau sécurisé interconnecté aux voies cyclables)
   * est géré comme une ligne supplémentaire, avec un affichage spécifique.
   */
  function getComplementaryNetwork() {
    return config.complementaryNetwork;
  }

  function isComplementaryLine(line: number): boolean {
    return line === config.complementaryNetwork.line;
  }

  /** tous les numéros de ligne affichés : les voies cyclables puis le réseau complémentaire */
  function getAllLineNumbers(): number[] {
    const lines = Array.from({ length: config.nbVoiesCyclables }, (_, index) => index + 1);
    return [...lines, config.complementaryNetwork.line];
  }

  /** libellé court affiché dans les pastilles rondes : le numéro de ligne, ou la lettre du réseau complémentaire */
  function getLineLabel(line: number): string {
    if (isComplementaryLine(line)) {
      return config.complementaryNetwork.letter;
    }
    return String(line);
  }

  /** nom complet d'une ligne : « Voie Lyonnaise 3 » ou « Réseau complémentaire » */
  function getLineName(line: number): string {
    if (isComplementaryLine(line)) {
      return config.complementaryNetwork.name;
    }
    return `${getRevName('singular')} ${line}`;
  }

  /** nom d'un groupe de lignes (tooltip) : « Voie Lyonnaise », « Voies Lyonnaises » ou « Réseau complémentaire » */
  function getLinesName(lines: number[]): string {
    if (lines.length > 0 && lines.every(isComplementaryLine)) {
      return config.complementaryNetwork.name;
    }
    return lines.length > 1 ? getRevName() : getRevName('singular');
  }

  /** nom abrégé d'une ligne : « VL 3 » ou « Autres » */
  function getLineShortName(line: number, separator = ' '): string {
    if (isComplementaryLine(line)) {
      return config.complementaryNetwork.filterLabel;
    }
    return `${config.revName.abbreviated}${separator}${line}`;
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
    getAssoName,
    getAssoLink,
    getNbVoiesCyclables,
    getComplementaryNetwork,
    isComplementaryLine,
    getAllLineNumbers,
    getLineLabel,
    getLineName,
    getLinesName,
    getLineShortName,
    displayQuality,
    displayQualityOnHomePage,
    displayCounters,
  };
};
