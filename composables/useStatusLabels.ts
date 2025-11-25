import type { LaneStatus, LaneType, LaneQuality } from '~/types';

export const statusLabels: Record<LaneStatus, string> = {
  done: 'Terminé',
  wip: 'En travaux',
  planned: 'Planifié',
  tested: 'Test',
  postponed: 'Reporté',
  unknown: 'Inconnu',
  variante: 'Variante',
  'variante-postponed': 'Variante reportée',
};

export const typeLabels: Record<LaneType, string> = {
  bidirectionnelle: 'Piste bidirectionnelle',
  bilaterale: 'Piste bilatérale',
  'voie-bus': 'Voie bus',
  'voie-bus-elargie': 'Voie bus élargie',
  velorue: 'Vélorue',
  'voie-verte': 'Voie verte',
  'bandes-cyclables': 'Bandes cyclables',
  'zone-de-rencontre': 'Zone de rencontre',
  aucun: 'Aucun',
  inconnu: 'Inconnu',
};

export const qualityLabels: Record<LaneQuality, string> = {
  unsatisfactory: 'Non satisfaisant',
  satisfactory: 'Satisfaisant',
};

export function useStatusLabels() {
  function formatDateLong(dateString: string, status?: LaneStatus): string {
    try {
      const parts = dateString.split('/');
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);

        if (status === 'postponed' && year > 2026) {
          return 'après 2026';
        }

        if (status === 'done' && date.getTime() < new Date(2021, 0, 1).getTime()) {
          return 'avant 2021';
        }

        return date.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
        });
      }
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
      });
    } catch {
      return dateString;
    }
  }

  function getStatusLabel(status: LaneStatus): string {
    return statusLabels[status] || status;
  }

  function getTypeLabel(type: LaneType): string {
    return typeLabels[type] || type;
  }

  function getQualityLabel(quality: LaneQuality): string {
    return quality === 'satisfactory' ? 'Qualité satisfaisante' : 'Qualité non satisfaisante';
  }

  return {
    formatDateLong,
    getStatusLabel,
    getTypeLabel,
    getQualityLabel,
  };
}
