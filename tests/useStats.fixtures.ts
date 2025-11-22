export const vl2StRambertCommun = {
  type: 'Feature',
  properties: {
    id: 'StRambert-commun',
    line: 2,
    name: 'Variante - Quai Raoul Carrié',
    status: 'variante' as const,
    type: 'inconnu' as const,
    link: '/voie-lyonnaise-2#fontaines-sur-saône-à-lîle-barbe',
  },
  geometry: {
    type: 'LineString',
    coordinates: [
      [4.8304759395564645, 45.797975559948014],
      [4.831059727875555, 45.798218640954275],
      [4.831870776912041, 45.79855785412218],
    ],
  },
};

// même geometry que vl2StRambertCommun pour scénario de test
export const vl5PierreBeniteNordCommun = {
  type: 'Feature',
  properties: {
    id: 'PierreBeniteN-commun',
    line: 5,
    name: 'Pierre Bénite Nord',
    status: 'planned' as const,
    type: 'bilaterale' as const,
    link: '/voie-lyonnaise-5#gare-doullins-à-pierre-bénite-barrage',
  },
  geometry: {
    type: 'LineString',
    coordinates: [
      [4.8304759395564645, 45.797975559948014],
      [4.831059727875555, 45.798218640954275],
      [4.831870776912041, 45.79855785412218],
    ],
  },
};

// même geometry que vl2StRambertCommun pour scénario de test
export const vl6CoursHerbouville = {
  type: 'Feature',
  properties: {
    line: 6,
    name: "Cours d'Herbouville",
    status: 'planned' as const,
    type: 'bilaterale' as const,
    link: '/voie-lyonnaise-6#cours-dherbouville',
  },
  geometry: {
    type: 'LineString',
    coordinates: [
      [4.8304759395564645, 45.797975559948014],
      [4.831059727875555, 45.798218640954275],
      [4.831870776912041, 45.79855785412218],
    ],
  },
};

export const vl3StRambertCommun = {
  type: 'Feature',
  properties: {
    id: 'StRambert-commun',
    line: 3,
    name: 'Variante - Quai Raoul Carrié',
    status: 'variante' as const,
    type: 'inconnu' as const,
    link: '/voie-lyonnaise-3#saint-rambert-à-pont-de-lîle-barbe',
  },
  geometry: {
    type: 'LineString',
    coordinates: [
      [4.8304759395564645, 45.797975559948014],
      [4.831059727875555, 45.798218640954275],
      [4.831870776912041, 45.79855785412218],
    ],
  },
};
