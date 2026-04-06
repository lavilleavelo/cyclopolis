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

  function getNbVoiesCyclables(): number {
    return config.nbVoiesCyclables;
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
    displayQuality,
    displayQualityOnHomePage,
    displayCounters,
  };
};
